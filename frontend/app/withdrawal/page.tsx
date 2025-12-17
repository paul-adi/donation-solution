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
  raised: number;          // USDC (human)
  withdrawnTotal: number; // USDC (human)
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

  const [maxWithdrawAllowed, setMaxWithdrawAllowed] = useState<number | null>(null);
  const [isFinalWithdraw, setIsFinalWithdraw] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });
  const [txHash, setTxHash] = useState<string | null>(null);

  /* =====================
     WALLET
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
     FETCH CAMPAIGNS
  ====================== */
  useEffect(() => {
    if (!connectedAddress) return;

    const fetchCampaigns = async () => {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, donationTokenJson.abi, provider);

      const filter = contract.filters.CampaignCreated(null, connectedAddress);
      const events = await contract.queryFilter(filter, 0, "latest");
      const now = Math.floor(Date.now() / 1000);

      const result: CampaignOption[] = [];

      for (const ev of events) {
        const id = ev.args?.campaignId.toString();
        const title = ev.args?.title;
        const c = await contract.campaigns(id);

        const raised = Number(c.raised) / 1e6;
        const withdrawnTotal = Number(c.withdrawnTotal) / 1e6;
        const goal = Number(c.goal) / 1e6;
        const endDate = Number(c.endDate);

        if (c.isComplete || raised >= goal || endDate <= now) {
          result.push({ id, title, raised, withdrawnTotal, goal, endDate });
        }
      }

      setCampaigns(result);
    };

    fetchCampaigns();
  }, [connectedAddress]);

  /* =====================
     HANDLERS
  ====================== */
  const handleCampaignChange = (id: string) => {
    setFormData({ campaignId: id, withdrawalAmount: "", withdrawalReason: "" });
    setSubmitStatus({ type: null, message: "" });

    const c = campaigns.find(x => x.id === id);
    if (!c) return;

    const remaining = c.raised - c.withdrawnTotal;
    const maxPerWithdraw = c.raised * 0.25;

    let max: number;
    let finalMode = false;

    if (remaining <= maxPerWithdraw || maxPerWithdraw < 1) {
      max = remaining;
      finalMode = true;
    } else {
      max = maxPerWithdraw;
    }

    setMaxWithdrawAllowed(Number(max.toFixed(6)));
    setIsFinalWithdraw(finalMode);

    if (finalMode) {
      setFormData(prev => ({ ...prev, withdrawalAmount: max.toFixed(6) }));
    }
  };

  const handleAmountChange = (v: string) => {
    if (isFinalWithdraw) return;
    const clean = v.replace(/[^0-9.]/g, "");
    setFormData(prev => ({ ...prev, withdrawalAmount: clean }));
  };

  /* =====================
     SUBMIT
  ====================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connectedAddress) return;
    if (!formData.campaignId) return;
    if (!formData.withdrawalReason) {
      setSubmitStatus({ type: "error", message: "Withdrawal reason required" });
      return;
    }

    const amount = Number(formData.withdrawalAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setSubmitStatus({ type: "error", message: "Invalid amount" });
      return;
    }

    if (!isFinalWithdraw && amount < 1) {
      setSubmitStatus({ type: "error", message: "Minimum withdrawal is 1 USDC" });
      return;
    }

    if (maxWithdrawAllowed !== null && amount > maxWithdrawAllowed) {
      setSubmitStatus({ type: "error", message: `Max allowed: ${maxWithdrawAllowed} USDC` });
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitStatus({ type: null, message: "" });
      setTxHash(null);

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, donationTokenJson.abi, signer);

      const tx = await contract.withdraw(
        formData.campaignId,
        ethers.parseUnits(formData.withdrawalAmount, 6), // ✅ CORRECT
        formData.withdrawalReason
      );

      const receipt = await tx.wait();
      setTxHash(receipt.transactionHash);
      setSubmitStatus({ type: "success", message: "Withdrawal successful" });

      setFormData({ campaignId: "", withdrawalAmount: "", withdrawalReason: "" });
      setMaxWithdrawAllowed(null);
      setIsFinalWithdraw(false);
    } catch (err: any) {
      setSubmitStatus({ type: "error", message: err?.reason || err?.message || "Transaction failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full p-3 rounded-xl border border-gray-200";

  return (
    <section className="py-16 max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-3xl shadow">
        <h1 className="text-2xl font-bold text-center">Withdraw Campaign Funds</h1>

        <select className={inputClass} value={formData.campaignId} onChange={e => handleCampaignChange(e.target.value)}>
          <option value="">-- Select Campaign --</option>
          {campaigns.map(c => (
            <option key={c.id} value={c.id}>{c.title} — {c.raised} USDC</option>
          ))}
        </select>

        {maxWithdrawAllowed !== null && (
          <p className="text-sm text-gray-600">
            Max withdraw: <b>{maxWithdrawAllowed}</b> USDC {isFinalWithdraw && "(final)"}
          </p>
        )}

        <input
          className={inputClass}
          placeholder="Amount"
          value={formData.withdrawalAmount}
          disabled={isFinalWithdraw}
          onChange={e => handleAmountChange(e.target.value)}
        />

        <textarea
          className={inputClass}
          rows={3}
          placeholder="Withdrawal reason"
          value={formData.withdrawalReason}
          onChange={e => setFormData(prev => ({ ...prev, withdrawalReason: e.target.value }))}
        />

        {submitStatus.type && (
          <div className={submitStatus.type === "success" ? "text-green-600" : "text-red-600"}>
            {submitStatus.message}
          </div>
        )}

        {txHash && (
          <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" className="underline text-sm">
            View on Etherscan
          </a>
        )}

        <button disabled={isSubmitting} className="w-full py-3 bg-orange-500 text-white rounded-xl">
          {isSubmitting ? "Submitting..." : "Withdraw"}
        </button>
      </form>
    </section>
  );
}
