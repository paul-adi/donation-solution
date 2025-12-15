// create campaign page
"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import donationTokenJson from "@/lib/abi/DonationToken.json";
import Image from "next/image";

const CONTRACT_ADDRESS = "0xc8d97C1A068C7f1900adeD0bC32240eefa0Fd3E0";

interface CampaignFormData {
  title: string;
  description: string;
  email: string;
  goalAmount: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
}

export default function CreateCampaignPage() {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });

  const [formData, setFormData] = useState<CampaignFormData>({
    title: "",
    description: "",
    email: "",
    goalAmount: "",
    imageUrl: "",
    startDate: "",
    endDate: "",
  });

  // Detect Wallet
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === "goalAmount") {
      const onlyNumbers = value.replace(/[^0-9]/g, "");
      setFormData((p) => ({ ...p, [name]: onlyNumbers }));
      return;
    }

    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connectedAddress) {
      setSubmitStatus({ type: "error", message: "Please connect your wallet first." });
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setSubmitStatus({ type: "error", message: "End date must be after start date." });
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

      const goalInUSDC = Number(formData.goalAmount) * 1_000_000;
      const startTimestamp = Math.floor(new Date(formData.startDate).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(formData.endDate).getTime() / 1000);

      const tx = await contract.createCampaign(
        formData.title,
        formData.description,
        formData.email,
        goalInUSDC,
        formData.imageUrl,
        startTimestamp,
        endTimestamp
      );

      setSubmitStatus({ type: null, message: "Waiting for transaction confirmation..." });
      const receipt = await tx.wait();

      setSubmitStatus({ type: "success", message: "Campaign created successfully!" });
      setTxHash(receipt.hash);

      setFormData({ title: "", description: "", email: "", goalAmount: "", imageUrl: "", startDate: "", endDate: "" });
    } catch (err: any) {
      setSubmitStatus({ type: "error", message: err?.reason || err?.message || "Transaction failed" });
    }

    setIsSubmitting(false);
  };

  const inputClass =
    "w-full p-3 rounded-xl bg-white border border-gray-200 shadow-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200";

  return (
    <section className="py-20">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white/70 backdrop-blur-md px-10 pb-10 pt-6 rounded-3xl shadow-lg border border-white/40">

          {/* HEADER */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Create Campaign</h1>
            <p className="text-gray-600">Launch your fundraising campaign on the blockchain</p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="font-semibold text-sm mb-1 block">Campaign Title *</label>
              <input type="text" name="title" required value={formData.title} onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label className="font-semibold text-sm mb-1 block">Description *</label>
              <textarea name="description" required rows={5} value={formData.description} onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label className="font-semibold text-sm mb-1 block">Email *</label>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label className="font-semibold text-sm mb-1 block">Goal Amount (USDC) *</label>
              <input type="number" name="goalAmount" required value={formData.goalAmount} onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label className="font-semibold text-sm mb-1 block">Campaign Image URL</label>
              <input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleChange} className={inputClass} />

              {formData.imageUrl && (
                <div className="relative w-48 h-32 mt-3 rounded-xl border border-gray-200 overflow-hidden">
                  <Image src={formData.imageUrl} alt="Preview" fill sizes="192px" className="object-cover" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-sm mb-1 block">Start Date & Time *</label>
                <input type="datetime-local" name="startDate" required value={formData.startDate} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className="font-semibold text-sm mb-1 block">End Date & Time *</label>
                <input type="datetime-local" name="endDate" required value={formData.endDate} onChange={handleChange} className={inputClass} />
              </div>
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

            <button type="submit" disabled={isSubmitting || !connectedAddress} className={`w-full py-3 rounded-xl font-semibold transition ${!connectedAddress ? "bg-gray-400 cursor-not-allowed text-white" : "bg-orange-500 hover:bg-orange-600 text-white"}`}>
              {!connectedAddress ? "Please Connect Wallet" : isSubmitting ? "Creating..." : "Create Campaign"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
