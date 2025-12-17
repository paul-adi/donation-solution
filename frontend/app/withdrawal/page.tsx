"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import donationTokenJson from "@/lib/abi/DonationToken.json";
import { CONTRACT_ADDRESS } from "@/lib/addresses";

interface WithdrawalFormData {
  campaignId: string;
  withdrawalAmount: string;
  withdrawalReason: string;
}

interface CampaignOption {
  id: string;
  title: string;
  raised: number;
  withdrawnTotal: number;
  isComplete: boolean;
  goal: number;
  endDate: number;
}

export default function WithdrawalPage() {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [formData, setFormData] = useState<WithdrawalFormData>({
    campaignId: "",
    withdrawalAmount: "",
    withdrawalReason: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });
  const [txHash, setTxHash] = useState<string | null>(null);
  const [maxWithdrawAllowed, setMaxWithdrawAllowed] = useState<number | null>(null);

  /* =====================
     WALLET DETECTION
  ====================== */
  useEffect(() => {
    const ethereum = (window as any)?.ethereum;
    if (!ethereum) return;

    ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
      if (accounts?.length) setConnectedAddress(accounts[0]);
    });

    ethereum.on?.("accountsChanged", (accounts: string[]) => {
      setConnectedAddress(accounts?.[0] || null);
    });
  }, []);

  /* =====================
     FETCH USER CAMPAIGNS
  ====================== */
  useEffect(() => {
    if (!connectedAddress) {
      setCampaigns([]);
      return;
    }

    const fetchUserCampaigns = async () => {
      try {
        const ethereum = (window as any)?.ethereum;
        if (!ethereum) return;

        const provider = new ethers.BrowserProvider(ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, donationTokenJson.abi, provider);

        const filter = contract.filters.CampaignCreated(null, connectedAddress);
        const events = await contract.queryFilter(filter, 0, "latest");

        const now = Math.floor(Date.now() / 1000);
        const userCampaigns: CampaignOption[] = [];

        for (const ev of events) {
          const campaignId = ev.args?.campaignId.toString();
          const title = ev.args?.title;

          const c = await contract.campaigns(campaignId);
          const raised = Number(c.raised) / 1_000_000;
          const withdrawnTotal = Number(c.withdrawnTotal) / 1_000_000;
          const goal = Number(c.goal) / 1_000_000;
          const endDate = Number(c.endDate);

          if (c.isComplete || raised >= goal || endDate <= now) {
            userCampaigns.push({
              id: campaignId,
              title,
              raised,
              withdrawnTotal,
              isComplete: c.isComplete,
              goal,
              endDate,
            });
          }
        }

        setCampaigns(userCampaigns);
      } catch (e) {
        console.error(e);
      }
    };

    fetchUserCampaigns();
  }, [connectedAddress]);

  /* =====================
     FORM HANDLERS
  ====================== */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === "withdrawalAmount") {
      const cleaned = value.replace(/[^0-9.]/g, "");
      const parts = cleaned.split(".");
      const formatted = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : cleaned;
      setFormData(prev => ({ ...prev, [name]: formatted }));
      return;
    }

    if (name === "campaignId") {
      setFormData(prev => ({ ...prev, [name]: value }));
      const selected = campaigns.find(c => c.id === value);
      if (selected) {
        const max = Math.min(selected.raised * 0.25, selected.raised - selected.withdrawnTotal);
        setMaxWithdrawAllowed(parseFloat(max.toFixed(6)));
      } else {
        setMaxWithdrawAllowed(null);
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMaxClick = () => {
    if (maxWithdrawAllowed !== null) {
      setFormData(prev => ({ ...prev, withdrawalAmount: maxWithdrawAllowed.toFixed(6) }));
    }
  };

  /* =====================
     SUBMIT
  ====================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connectedAddress) {
      setSubmitStatus({ type: "error", message: "Please connect your wallet" });
      return;
    }

    if (!formData.campaignId) {
      setSubmitStatus({ type: "error", message: "Select a campaign" });
      return;
    }

    const amount = Number(formData.withdrawalAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setSubmitStatus({ type: "error", message: "Withdrawal amount must be greater than 0" });
      return;
    }

    if (amount < 0.000001) {
      setSubmitStatus({ type: "error", message: "Minimum withdrawal is 0.000001 USDC" });
      return;
    }

    if (!formData.withdrawalReason) {
      setSubmitStatus({ type: "error", message: "Provide a withdrawal reason" });
      return;
    }

    if (maxWithdrawAllowed !== null && amount > maxWithdrawAllowed) {
      setSubmitStatus({ type: "error", message: `Amount exceeds max allowed: ${maxWithdrawAllowed.toFixed(6)} USDC` });
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitStatus({ type: null, message: "" });
      setTxHash(null);

      const ethereum = (window as any).ethereum;
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, donationTokenJson.abi, signer);

      const tx = await contract.withdraw(
        formData.campaignId,
        amount, // CONTRACT AUTO-CONVERT
        formData.withdrawalReason
      );

      setSubmitStatus({ type: null, message: "Waiting for confirmation..." });
      const receipt = await tx.wait();
      setTxHash(receipt.transactionHash);
      setSubmitStatus({ type: "success", message: "Withdrawal successful" });

      setFormData({ campaignId: "", withdrawalAmount: "", withdrawalReason: "" });
      setMaxWithdrawAllowed(null);
    } catch (err: any) {
      setSubmitStatus({ type: "error", message: err?.reason || err?.message || "Transaction failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full p-3 rounded-xl bg-white border border-gray-200 shadow-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200";

  return (
    <section className="py-16">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white/70 backdrop-blur-md px-10 pb-10 pt-6 rounded-3xl shadow-lg border border-white/40">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800">Withdrawal Request</h1>
            <p className="text-gray-600">Withdraw funds from completed campaigns</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <select name="campaignId" value={formData.campaignId} onChange={handleChange} className={inputClass}>
              <option value="">-- Select Campaign --</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} — Raised {c.raised.toFixed(6)} USDC
                </option>
              ))}
            </select>

            {maxWithdrawAllowed !== null && (
              <div className="flex items-center space-x-2 text-sm">
                <button type="button" onClick={handleMaxClick} className="px-3 py-1 bg-orange-200 rounded">Max</button>
                <span>{maxWithdrawAllowed.toFixed(6)} USDC</span>
              </div>
            )}

            <input
              type="text"
              name="withdrawalAmount"
              value={formData.withdrawalAmount}
              onChange={handleChange}
              placeholder="0.000000"
              className={inputClass}
            />

            <textarea
              name="withdrawalReason"
              value={formData.withdrawalReason}
              onChange={handleChange}
              rows={3}
              placeholder="Withdrawal reason"
              className={inputClass}
            />

            {submitStatus.type && (
              <div className={`p-4 rounded-xl text-sm ${submitStatus.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {submitStatus.message}
              </div>
            )}

            {txHash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                className="text-orange-600 underline text-sm"
              >
                View on Etherscan
              </a>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !connectedAddress}
              className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            >
              {isSubmitting ? "Submitting..." : "Submit Withdrawal"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
