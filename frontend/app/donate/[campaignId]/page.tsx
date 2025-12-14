// donasi per campaign
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ethers } from "ethers";
import abi from "@/lib/abi/DonationToken.json";

const CONTRACT_ADDRESS = "0xc8d97C1A068C7f1900adeD0bC32240eefa0Fd3E0";

export default function DonatePage() {
  const params = useParams();
  const campaignId = Number(params.campaignId);

  const [campaign, setCampaign] = useState<any>(null);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const ethereum = (window as any)?.ethereum;
    if (!ethereum) return;

    ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
      if (accounts.length) setConnectedAddress(accounts[0]);
    });

    ethereum.on?.("accountsChanged", (accounts: string[]) => {
      setConnectedAddress(accounts[0] || null);
    });

    const fetchCampaign = async () => {
      const provider = new ethers.BrowserProvider(ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi.abi, provider);
      try {
        const c = await contract.campaigns(campaignId);
        setCampaign(c);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCampaign();
  }, [campaignId]);

  const handleDonate = async () => {
    if (!connectedAddress) {
      setStatus("Please connect your wallet first.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setStatus("Enter a valid USDC amount.");
      return;
    }

    try {
      const ethereum = (window as any).ethereum;
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi.abi, signer);

      const amountInUSDC = Number(amount) * 1_000_000; // USDC 6 decimals

      const tx = await contract.donate(campaignId, amountInUSDC, donorName || "Anonymous");
      setStatus("Waiting for transaction confirmation...");
      await tx.wait();
      setStatus("Donation successful!");
      setAmount("");
      setDonorName("");
    } catch (err: any) {
      console.error(err);
      setStatus(err?.reason || err?.message || "Transaction failed");
    }
  };

  if (!campaign) return <p className="text-center mt-10">Loading campaign...</p>;

  return (
    <section className="py-20">
      <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-md p-10 rounded-3xl shadow-lg border border-white/40">
        <h1 className="text-3xl font-bold mb-4">{campaign.title}</h1>
        <div className="relative w-full h-64 mb-4 rounded-xl overflow-hidden">
          <img src={campaign.image} alt={campaign.title} className="object-cover w-full h-full" />
        </div>
        <p className="text-gray-700 mb-2">
          Goal: {(Number(campaign.goal) / 1_000_000).toLocaleString()} USDC
        </p>
        <p className="text-gray-500 text-sm mb-4">
          Start: {new Date(Number(campaign.startDate) * 1000).toLocaleDateString()} <br />
          End: {new Date(Number(campaign.endDate) * 1000).toLocaleDateString()}
        </p>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Your Name"
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            className="w-full p-3 border rounded-xl"
          />
          <input
            type="number"
            placeholder="Amount in USDC"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-3 border rounded-xl"
          />
          <button
            onClick={handleDonate}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold"
          >
            Donate with USDC
          </button>
          {status && <p className="text-center mt-2 text-gray-700">{status}</p>}
        </div>
      </div>
    </section>
  );
}
