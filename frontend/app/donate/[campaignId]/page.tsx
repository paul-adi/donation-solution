// donasi per campaign page
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ethers } from "ethers";
import abi from "@/lib/abi/DonationToken.json";

const NETWORK_CONTRACTS: Record<number, { donation: string; usdc: string }> = {
  1: {
    donation: "0xc8d97C1A068C7f1900adeD0bC32240eefa0Fd3E0",
    usdc: "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  },
  11155111: {
    donation: "0xc8d97C1A068C7f1900adeD0bC32240eefa0Fd3E0",
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  },
};

const USDC_DECIMALS = 6;

export default function DonatePage() {
  const params = useParams();
  const campaignId = Number(params.campaignId);

  const [campaign, setCampaign] = useState<any>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  const [amount, setAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [status, setStatus] = useState("");

  const [usdcBalance, setUsdcBalance] = useState(0);
  const [allowance, setAllowance] = useState(0);

  const [isApproving, setIsApproving] = useState(false);
  const [isDonating, setIsDonating] = useState(false);

  // WALLET
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

  // FETCH CAMPAIGN
  useEffect(() => {
    if (!chainId || !Number.isFinite(campaignId)) return;

    (async () => {
      const cfg = NETWORK_CONTRACTS[chainId];
      if (!cfg) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(cfg.donation, abi.abi, provider);
      const data = await contract.campaigns(campaignId);
      setCampaign(data);
    })();
  }, [chainId, campaignId]);

  // FETCH USDC
  useEffect(() => {
    if (!address || !chainId) return;

    (async () => {
      const cfg = NETWORK_CONTRACTS[chainId];
      if (!cfg) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const usdc = new ethers.Contract(
        cfg.usdc,
        [
          "function balanceOf(address) view returns (uint256)",
          "function allowance(address,address) view returns (uint256)",
        ],
        provider
      );

      const bal = await usdc.balanceOf(address);
      const alw = await usdc.allowance(address, cfg.donation);

      setUsdcBalance(Number(ethers.formatUnits(bal, USDC_DECIMALS)));
      setAllowance(Number(ethers.formatUnits(alw, USDC_DECIMALS)));
    })();
  }, [address, chainId]);

  // APPROVE
  const handleApprove = async () => {
    if (!chainId) return;

    try {
      setIsApproving(true);
      setStatus("Approving USDC...");

      const cfg = NETWORK_CONTRACTS[chainId];
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const usdc = new ethers.Contract(
        cfg.usdc,
        ["function approve(address,uint256) returns (bool)"],
        signer
      );

      const tx = await usdc.approve(cfg.donation, ethers.MaxUint256);
      await tx.wait();

      setAllowance(Number.MAX_SAFE_INTEGER);
      setStatus("USDC approved");
    } catch (e: any) {
      setStatus(e?.reason || e?.message || "Approval failed");
    } finally {
      setIsApproving(false);
    }
  };

  // DONATE
  const handleDonate = async () => {
    if (!chainId || !amount) return;

    try {
      setIsDonating(true);
      setStatus("Sending donation...");

      const cfg = NETWORK_CONTRACTS[chainId];
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(cfg.donation, abi.abi, signer);
      const value = ethers.parseUnits(amount, USDC_DECIMALS);

      const tx = await contract.donate(
        campaignId,
        value,
        donorName || "Anonymous"
      );
      await tx.wait();

      setCampaign((prev: any) => ({
        ...prev,
        raised:
          BigInt(prev.raised) +
          (ethers.parseUnits(amount, USDC_DECIMALS) * 99n) / 100n,
      }));

      setUsdcBalance(b => b - Number(amount));
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
    return <p className="text-center mt-10">Loading campaign...</p>;
  }

  const goal = Number(ethers.formatUnits(campaign.goal, USDC_DECIMALS));
  const raised = Number(ethers.formatUnits(campaign.raised, USDC_DECIMALS));
  const progress = goal === 0 ? 0 : Math.min((raised / goal) * 100, 100);

  return (
    <section className="py-20">
      <div className="max-w-2xl mx-auto bg-white/70 backdrop-blur-md p-5 rounded-3xl shadow-lg">
        <h1 className="text-2xl font-bold mb-2">{campaign.title}</h1>

        {/* IMAGE */}
        <div className="h-58 mb-3 rounded-xl overflow-hidden bg-gray-100">
          <img
            src={campaign.image}
            alt={campaign.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* PROGRESS */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-semibold">
              Raised: {raised.toLocaleString()} USDC
            </span>
            <span className="text-gray-500">{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-2 bg-gradient-to-r from-green-400 to-emerald-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Goal: {goal.toLocaleString()} USDC</span>
            {campaign.isComplete && (
              <span className="text-green-600 font-semibold">Completed ✔</span>
            )}
          </div>
        </div>

        {/* DONATE FORM */}
        <input
          className="w-full p-2 border rounded-xl mb-2 text-sm"
          placeholder="Your Name"
          value={donorName}
          onChange={e => setDonorName(e.target.value)}
        />

        <input
          className="w-full p-2 border rounded-xl mb-3 text-sm"
          placeholder="Amount (USDC)"
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />

        {Number(amount) > allowance ? (
          <button
            onClick={handleApprove}
            disabled={isApproving}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-xl mb-2 text-sm"
          >
            {isApproving ? "Approving..." : "Approve USDC"}
          </button>
        ) : (
          <button
            onClick={handleDonate}
            disabled={
              isDonating ||
              Number(amount) > usdcBalance ||
              campaign.isComplete
            }
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
