"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ethers } from "ethers";
import abi from "@/lib/abi/DonationToken.json";
import { CONTRACT_ADDRESS } from "@/lib/addresses";

/* =====================
   CONFIG
===================== */
const USDC_DECIMALS = 6;

const NETWORK_USDC: Record<number, string> = {
  1: "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
};

/* =====================
   HELPERS
===================== */
function shortAddress(addr?: string) {
  if (!addr || addr.length < 10) return "Unknown";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/* =====================
   PAGE
===================== */
export default function DonatePage() {
  const params = useParams();
  const campaignId = Number(params.campaignId);

  const [campaign, setCampaign] = useState<any>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  const [amount, setAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [status, setStatus] = useState("");

  const [allowance, setAllowance] = useState<bigint>(0n);
  const [isApproving, setIsApproving] = useState(false);
  const [isDonating, setIsDonating] = useState(false);
  const [copied, setCopied] = useState(false);

  /* =====================
     WALLET
  ====================== */
  useEffect(() => {
    const eth = (window as any)?.ethereum;
    if (!eth) return;

    const onAccounts = (a: string[]) => setAddress(a[0] || null);
    const onChain = (c: string) => setChainId(parseInt(c, 16));

    eth.on("accountsChanged", onAccounts);
    eth.on("chainChanged", onChain);

    (async () => {
      const acc = await eth.request({ method: "eth_accounts" });
      if (acc?.length) setAddress(acc[0]);
      const cid = await eth.request({ method: "eth_chainId" });
      setChainId(parseInt(cid, 16));
    })();

    return () => {
      eth.removeListener("accountsChanged", onAccounts);
      eth.removeListener("chainChanged", onChain);
    };
  }, []);

  /* =====================
     FETCH CAMPAIGN
  ====================== */
  useEffect(() => {
    if (!chainId || !Number.isInteger(campaignId)) return;

    (async () => {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi.abi, provider);
      const data = await contract.campaigns(campaignId);
      setCampaign(data);
    })();
  }, [chainId, campaignId]);

  /* =====================
     ALLOWANCE
  ====================== */
  useEffect(() => {
    if (!address || !chainId) return;

    (async () => {
      const usdcAddr = NETWORK_USDC[chainId];
      if (!usdcAddr) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const usdc = new ethers.Contract(
        usdcAddr,
        ["function allowance(address,address) view returns (uint256)"],
        provider
      );

      const alw = await usdc.allowance(address, CONTRACT_ADDRESS);
      setAllowance(alw);
    })();
  }, [address, chainId]);

  /* =====================
     ACTIONS
  ====================== */
  const handleCopy = async () => {
    if (!campaign?.creator) return;
    await navigator.clipboard.writeText(campaign.creator);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleApprove = async () => {
    if (!chainId) return;

    try {
      setIsApproving(true);
      setStatus("Approving USDC...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const usdc = new ethers.Contract(
        NETWORK_USDC[chainId],
        ["function approve(address,uint256) returns (bool)"],
        signer
      );

      const tx = await usdc.approve(CONTRACT_ADDRESS, ethers.MaxUint256);
      await tx.wait();

      setAllowance(ethers.MaxUint256);
      setStatus("USDC approved");
    } catch (e: any) {
      setStatus(e?.reason || e?.message || "Approve failed");
    } finally {
      setIsApproving(false);
    }
  };

  const handleDonate = async () => {
    if (!chainId) return;

    let amountBN: bigint;
    try {
      amountBN = ethers.parseUnits(amount, USDC_DECIMALS);
    } catch {
      setStatus("Invalid amount format");
      return;
    }

    if (amountBN < 1_000_000n) {
      setStatus("Minimum donation is 1 USDC");
      return;
    }

    try {
      setIsDonating(true);
      setStatus("Sending donation...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi.abi, signer);

      const tx = await contract.donate(
        campaignId,
        amountBN,
        donorName || "Anonymous"
      );

      await tx.wait();

      setAmount("");
      setDonorName("");
      setStatus("Donation successful 🎉");
    } catch (e: any) {
      setStatus(e?.reason || e?.message || "Donation failed");
    } finally {
      setIsDonating(false);
    }
  };

  if (!campaign) {
    return (
      <section className="py-16">
        <p className="text-center mt-32 text-gray-500">
          Loading campaign...
        </p>
      </section>
    );
  }

  const goal = Number(campaign.goal) / 1_000_000;
  const raised = Number(campaign.raised) / 1_000_000;
  const progress = goal === 0 ? 0 : Math.min((raised / goal) * 100, 100);

  const now = Math.floor(Date.now() / 1000);
  const disabled =
    now < Number(campaign.startDate) ||
    now > Number(campaign.endDate);

  const amountBN = (() => {
    try {
      return ethers.parseUnits(amount || "0", USDC_DECIMALS);
    } catch {
      return 0n;
    }
  })();

  const needsApproval = amountBN > allowance;

  /* =====================
     RENDER
  ====================== */
  return (
    <section className="py-16">
      <div className="max-w-xl mx-auto bg-white/80 backdrop-blur-md p-5 rounded-3xl shadow-lg">
        <h1 className="text-2xl font-bold mb-1">{campaign.title}</h1>

        {/* CREATOR */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          <span>Created by {shortAddress(campaign.creator)}</span>

          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-gray-700"
            title="Copy creator address"
          >
            {copied ? "✅" : "📋"}
          </button>
        </div>

        {/* IMAGE */}
        {campaign.image && (
          <div className="mb-4 h-56 rounded-xl overflow-hidden bg-gray-100">
            <img
              src={campaign.image}
              alt={campaign.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "https://via.placeholder.com/600x400?text=No+Image";
              }}
            />
          </div>
        )}

        {/* PROGRESS */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-semibold">
              Raised: {raised.toFixed(2)} USDC
            </span>
            <span className="text-gray-500">{progress.toFixed(1)}%</span>
          </div>

          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-2 bg-gradient-to-r from-green-400 to-emerald-600"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* INPUTS */}
        <input
          type="text"
          className="w-full p-2 border rounded-xl mb-2 text-sm"
          placeholder="Your Name"
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
          disabled={disabled}
        />

        <input
          type="text"
          className="w-full p-2 border rounded-xl mb-3 text-sm"
          placeholder="Amount (USDC)"
          value={amount}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9.]/g, "");
            if ((v.match(/\./g) || []).length <= 1) setAmount(v);
          }}
          disabled={disabled}
        />

        {/* BUTTON */}
        {needsApproval ? (
          <button
            onClick={handleApprove}
            disabled={isApproving || disabled}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-xl mb-2 text-sm disabled:bg-gray-400"
          >
            {isApproving ? "Approving..." : "Approve USDC"}
          </button>
        ) : (
          <button
            onClick={handleDonate}
            disabled={isDonating || disabled}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-xl mb-2 text-sm disabled:bg-gray-400"
          >
            {isDonating ? "Processing..." : "Donate with USDC"}
          </button>
        )}

        {status && (
          <p className="text-center mt-2 text-gray-700 text-sm">{status}</p>
        )}
      </div>
    </section>
  );
}
