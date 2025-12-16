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

  // Detect wallet
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

  // Fetch user's campaigns from contract
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

          // Show campaign if:
          // - already complete
          // - OR raised >= goal
          // - OR endDate passed
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === "withdrawalAmount") {
      const numValue = value.replace(/[^0-9.]/g, "");
      const parts = numValue.split(".");
      const formattedValue = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : numValue;
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
    } else if (name === "campaignId") {
      setFormData(prev => ({ ...prev, [name]: value }));
      const selected = campaigns.find(c => c.id === value);
      if (selected) {
        const maxWithdraw = Math.min(selected.raised * 0.25, selected.raised - selected.withdrawnTotal);
        setMaxWithdrawAllowed(parseFloat(maxWithdraw.toFixed(6)));
      } else {
        setMaxWithdrawAllowed(null);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleMaxClick = () => {
    if (maxWithdrawAllowed !== null) {
      const valueStr = maxWithdrawAllowed.toFixed(6);
      setFormData(prev => ({ ...prev, withdrawalAmount: valueStr }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedAddress) {
      setSubmitStatus({ type: "error", message: "Please connect your wallet first" });
      return;
    }
    if (!formData.campaignId) {
      setSubmitStatus({ type: "error", message: "Please select a campaign" });
      return;
    }
    if (!formData.withdrawalAmount || parseFloat(formData.withdrawalAmount) <= 0) {
      setSubmitStatus({ type: "error", message: "Enter a valid withdrawal amount" });
      return;
    }
    if (!formData.withdrawalReason) {
      setSubmitStatus({ type: "error", message: "Provide a reason for withdrawal" });
      return;
    }
    if (maxWithdrawAllowed !== null && parseFloat(formData.withdrawalAmount) > maxWithdrawAllowed) {
      setSubmitStatus({ type: "error", message: `Amount exceeds max allowed withdrawal: ${maxWithdrawAllowed.toFixed(6)} USDC` });
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

      let amount = parseFloat(formData.withdrawalAmount);
      if (amount < 1e6) amount = amount * 1_000_000;

      const tx = await contract.withdraw(formData.campaignId, Math.floor(amount), formData.withdrawalReason);
      setSubmitStatus({ type: null, message: "Waiting for transaction confirmation..." });
      const receipt = await tx.wait();
      setTxHash(receipt.transactionHash);
      setSubmitStatus({ type: "success", message: "Withdrawal successful!" });

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
    <section className="py-15">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white/70 backdrop-blur-md px-10 pb-10 pt-6 rounded-3xl shadow-lg border border-white/40">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Withdrawal Request</h1>
            <p className="text-gray-600">Request a withdrawal from your completed or ended campaigns</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="font-semibold text-sm mb-1 block">Select Your Campaign *</label>
              <select name="campaignId" value={formData.campaignId} onChange={handleChange} className={inputClass}>
                <option value="">-- Select a campaign --</option>
                {campaigns.map(c => {
                  let statusLabel = "";
                  const now = Math.floor(Date.now() / 1000);

                  if (c.isComplete) statusLabel = "Completed";
                  else if (c.raised >= c.goal) statusLabel = "Goal Reached";
                  else if (c.endDate < now) statusLabel = "Time Over";

                  return (
                    <option key={c.id} value={c.id}>
                      {c.title} (Raised: {c.raised.toFixed(6)} USDC) {statusLabel && `- ${statusLabel}`}
                    </option>
                  );
                })}
              </select>

              {maxWithdrawAllowed !== null && (
                <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
                  <button type="button" onClick={handleMaxClick} className="px-3 py-1 bg-orange-200 text-orange-800 rounded">Max</button>
                  <span>{maxWithdrawAllowed.toFixed(6)} USDC</span>
                </div>
              )}
            </div>

            <div>
              <label className="font-semibold text-sm mb-1 block">Withdrawal Amount (USDC) *</label>
              <input type="text" name="withdrawalAmount" value={formData.withdrawalAmount} onChange={handleChange} placeholder="0.000000" className={inputClass} />
            </div>

            <div>
              <label className="font-semibold text-sm mb-1 block">Withdrawal Reason *</label>
              <textarea
                name="withdrawalReason"
                value={formData.withdrawalReason}
                onChange={handleChange}
                rows={3}                 // lebih pendek
                placeholder="Explain the reason..."
                className="w-full p-3 rounded-xl bg-white border border-gray-200 shadow-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200 h-20" // height tetap bisa di-set
              />
            </div>

            {submitStatus.type && (
              <div className={`p-4 rounded-xl border text-sm ${submitStatus.type === "success" ? "bg-green-100 border-green-300 text-green-700" : "bg-red-100 border-red-300 text-red-700"}`}>
                {submitStatus.message}
              </div>
            )}

            {txHash && (
              <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" className="block text-orange-600 underline text-sm">
                View Transaction on Etherscan
              </a>
            )}

            <button type="submit" disabled={isSubmitting || !connectedAddress || campaigns.length === 0} className={`w-full py-3 rounded-xl font-semibold transition ${!connectedAddress || campaigns.length === 0 ? "bg-gray-400 cursor-not-allowed text-white" : "bg-orange-500 hover:bg-orange-600 text-white"}`}>
              {!connectedAddress ? "Please Connect Wallet" : campaigns.length === 0 ? "No Campaigns Available" : isSubmitting ? "Submitting..." : "Submit Withdrawal"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
