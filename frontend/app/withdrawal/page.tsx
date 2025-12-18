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
  raised: bigint;
  withdrawnTotal: bigint;
  goal: bigint;
  endDate: number;
  isEligible: boolean; // block.timestamp > endDate || raised >= goal
  creator: string;
}

export default function WithdrawalPage() {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [formData, setFormData] = useState<WithdrawalFormData>({
    campaignId: "",
    withdrawalAmount: "",
    withdrawalReason: "",
  });

  const [maxWithdrawAllowed, setMaxWithdrawAllowed] = useState<bigint | null>(null);
  const [isFinalWithdraw, setIsFinalWithdraw] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txSender, setTxSender] = useState<string | null>(null);
  const [txRecipient, setTxRecipient] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignOption | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

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

    ethereum.request({ method: "eth_chainId" }).then((idHex: string) => {
      setChainId(parseInt(idHex, 16));
    });

    ethereum.on?.("chainChanged", (idHex: string) => {
      setChainId(parseInt(idHex, 16));
    });
  }, []);

  /* =====================
     FETCH CAMPAIGNS
  ====================== */
  const fetchCampaigns = async () => {
    if (!connectedAddress) return;
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

      const raised = BigInt(c.raised.toString());
      const withdrawnTotal = BigInt(c.withdrawnTotal.toString());
      const goal = BigInt(c.goal.toString());
      const creator = c.creator;

      const isEligible = c.isComplete || raised >= goal || c.endDate <= now;

      result.push({
        id,
        title,
        raised,
        withdrawnTotal,
        goal,
        endDate: Number(c.endDate),
        isEligible,
        creator,
      });
    }

    setCampaigns(result);
  };

  useEffect(() => {
    fetchCampaigns();
  }, [connectedAddress]);

  /* =====================
     HELPER
  ====================== */
  function remaining(c: CampaignOption) {
    return c.raised - c.withdrawnTotal;
  }

  function getStatus(c: CampaignOption) {
    const rem = remaining(c);
    if (c.isEligible && rem === 0n) return "Closed";
    if (c.isEligible && rem > 0n) return "Eligible";
    return "Not eligible";
  }

  /* =====================
     HANDLERS
  ====================== */
  const handleCampaignChange = (id: string) => {
    setFormData({ campaignId: id, withdrawalAmount: "", withdrawalReason: "" });
    setSubmitStatus({ type: null, message: "" });
    setTxHash(null);
    setTxSender(null);
    setTxRecipient(null);

    const c = campaigns.find(c => c.id === id) || null;
    setSelectedCampaign(c);

    if (!c) {
      setMaxWithdrawAllowed(null);
      setIsFinalWithdraw(false);
      return;
    }

    const rem = remaining(c);

    if (getStatus(c) !== "Eligible") {
      setMaxWithdrawAllowed(null);
      setIsFinalWithdraw(false);
      return;
    }

    const maxPerWithdraw = (c.raised * 25n) / 100n;
    let max: bigint;
    let finalMode = false;

    if (rem <= maxPerWithdraw || maxPerWithdraw < 1_000_000n) {
      max = rem;
      finalMode = true;
    } else {
      max = maxPerWithdraw;
    }

    setMaxWithdrawAllowed(max);
    setIsFinalWithdraw(finalMode);

    if (finalMode) {
      setFormData(prev => ({ ...prev, withdrawalAmount: (Number(max) / 1e6).toFixed(6) }));
    }
  };

  const handleAmountChange = (v: string) => {
    if (!selectedCampaign || getStatus(selectedCampaign) !== "Eligible" || isFinalWithdraw) return;
    const clean = v.replace(/[^0-9.]/g, "");
    setFormData(prev => ({ ...prev, withdrawalAmount: clean }));
  };

  /* =====================
     SUBMIT
  ====================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connectedAddress || !selectedCampaign) return;
    const status = getStatus(selectedCampaign);
    if (status !== "Eligible") {
      setSubmitStatus({ type: "error", message: "Campaign is not eligible for withdrawal" });
      return;
    }

    if (!formData.withdrawalReason) {
      setSubmitStatus({ type: "error", message: "Withdrawal reason required" });
      return;
    }

    if (!maxWithdrawAllowed) return;

    let amount;
    try {
      amount = ethers.parseUnits(formData.withdrawalAmount || "0", 6);
    } catch {
      setSubmitStatus({ type: "error", message: "Invalid withdrawal amount" });
      return;
    }

    if (!isFinalWithdraw && amount < 1_000_000n) {
      setSubmitStatus({ type: "error", message: "Minimum withdrawal is 1 USDC" });
      return;
    }

    if (amount > maxWithdrawAllowed) {
      setSubmitStatus({ type: "error", message: `Max allowed: ${(Number(maxWithdrawAllowed) / 1e6).toFixed(6)} USDC` });
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitStatus({ type: null, message: "" });

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, donationTokenJson.abi, signer);

      const tx = await contract.withdraw(formData.campaignId, amount, formData.withdrawalReason);
      const receipt = await tx.wait();

      setTxHash(receipt.transactionHash);
      setTxSender(receipt.from);
      setTxRecipient(receipt.to);
      setSubmitStatus({ type: "success", message: "Withdrawal successful" });

      // Refresh campaigns untuk update remaining
      await fetchCampaigns();

      // Clear form
      setFormData({ campaignId: "", withdrawalAmount: "", withdrawalReason: "" });
      setMaxWithdrawAllowed(null);
      setIsFinalWithdraw(false);
      setSelectedCampaign(null);

    } catch (err: any) {
      setSubmitStatus({ type: "error", message: err?.reason || err?.message || "Transaction failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full p-3 rounded-xl border border-gray-200";
  const explorerBase = chainId === 11155111 ? "https://sepolia.etherscan.io" : "https://etherscan.io";
  const creatorAddress = selectedCampaign?.creator || connectedAddress;

  const isWithdrawable = selectedCampaign && getStatus(selectedCampaign) === "Eligible";

  return (
    <section className="py-16 max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-3xl shadow">
        <h1 className="text-2xl font-bold text-center mb-4">Withdraw Campaign Funds</h1>

        {/* Campaign */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
          <select
            className={inputClass}
            value={formData.campaignId}
            onChange={e => handleCampaignChange(e.target.value)}
          >
            <option value="">-- Select Campaign --</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>
                {c.title} — {(Number(c.raised) / 1e6).toFixed(6)} USDC {getStatus(c)}
              </option>
            ))}
          </select>
        </div>

        {/* Max + Remaining */}
        {selectedCampaign && isWithdrawable && maxWithdrawAllowed && (
          <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="bg-orange-500 text-white px-2 py-1 rounded text-xs hover:bg-orange-600"
                onClick={() =>
                  setFormData(prev => ({
                    ...prev,
                    withdrawalAmount: (Number(maxWithdrawAllowed) / 1e6).toFixed(6)
                  }))
                }
              >
                Max
              </button>
              <span className="text-gray-700">{(Number(maxWithdrawAllowed) / 1e6).toFixed(6)} USDC</span>
            </div>
            <span>
              Remaining: <b>{(Number(remaining(selectedCampaign)) / 1e6).toFixed(6)}</b> USDC
            </span>
          </div>
        )}

        {/* Status */}
        {selectedCampaign && getStatus(selectedCampaign) === "Closed" && (
          <div className="text-sm text-red-600 mb-2">Status: Closed</div>
        )}
        {selectedCampaign && getStatus(selectedCampaign) === "Not eligible" && (
          <div className="text-sm text-gray-600 mb-2">Status: Not eligible</div>
        )}

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <input
            className={inputClass}
            placeholder="Amount"
            value={formData.withdrawalAmount}
            disabled={!isWithdrawable || isFinalWithdraw}
            onChange={e => handleAmountChange(e.target.value)}
          />
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Receipt Link for Reimbursement</label>
          <textarea
            className={inputClass}
            rows={3}
            placeholder="Withdrawal reason / link of original receipts for reimbursement purposes"
            value={formData.withdrawalReason}
            onChange={e => setFormData(prev => ({ ...prev, withdrawalReason: e.target.value }))}
          />
        </div>

        {/* Status */}
        {submitStatus.type && (
          <div className={submitStatus.type === "success" ? "text-green-600" : "text-red-600"}>
            {submitStatus.message}
          </div>
        )}

        {/* Transaction info */}
        {creatorAddress && chainId && (
          <div className="text-sm text-gray-600 space-y-1">
            {txHash && (
              <a
                href={`${explorerBase}/tx/${txHash}`}
                target="_blank"
                className="underline"
              >
                View last transaction
              </a>
            )}
            <a
              href={`${explorerBase}/address/${creatorAddress}`}
              target="_blank"
              className="underline"
            >
              View all transactions of this wallet
            </a>
            {txSender && <div>From: <span className="font-mono">{txSender}</span></div>}
            {txRecipient && <div>To: <span className="font-mono">{txRecipient}</span></div>}
          </div>
        )}

        {/* Withdraw button */}
        <button
          disabled={!isWithdrawable || isSubmitting}
          className={`w-full py-3 text-white rounded-xl ${
            !isWithdrawable || isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-orange-500"
          }`}
        >
          {isSubmitting ? "Submitting..." : "Withdraw"}
        </button>
      </form>
    </section>
  );
}
