"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import abi from "@/lib/abi/DonationToken.json"; // pastikan file ini ada

const CONTRACT_ADDRESS = "0x1c44C7613AD73E3cDD78930E5d48BA8D0F76FfaB";

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

  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

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

  // Handle Input
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "goalAmount") {
      const onlyNumbers = value.replace(/[^0-9]/g, "");
      setFormData((p) => ({ ...p, [name]: onlyNumbers }));
      return;
    }

    setFormData((p) => ({ ...p, [name]: value }));
  };

  // Handle Submit (Smart Contract)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connectedAddress) {
      setSubmitStatus({
        type: "error",
        message: "Please connect your wallet first.",
      });
      return;
    }

    // Validate date
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setSubmitStatus({
        type: "error",
        message: "End date must be after start date.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitStatus({ type: null, message: "" });
      setTxHash(null);

      const ethereum = (window as any).ethereum;
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      // Convert USDC goal: 1 USDC = 1e6
      const goalInUSDC = Number(formData.goalAmount) * 1_000_000;

      const startTimestamp = Math.floor(
        new Date(formData.startDate).getTime() / 1000
      );
      const endTimestamp = Math.floor(
        new Date(formData.endDate).getTime() / 1000
      );

      const tx = await contract.createCampaign(
        formData.title,
        formData.description,
        formData.email,
        goalInUSDC,
        formData.imageUrl,
        startTimestamp,
        endTimestamp
      );

      setSubmitStatus({
        type: null,
        message: "Waiting for transaction confirmation...",
      });

      const receipt = await tx.wait();

      setSubmitStatus({
        type: "success",
        message: "Campaign created successfully!",
      });

      setTxHash(receipt.hash);

      // Reset form
      setFormData({
        title: "",
        description: "",
        email: "",
        goalAmount: "",
        imageUrl: "",
        startDate: "",
        endDate: "",
      });
    } catch (err: any) {
      console.log(err);
      setSubmitStatus({
        type: "error",
        message: err?.reason || err?.message || "Transaction failed",
      });
    }

    setIsSubmitting(false);
  };

  return (
    <main className="max-w-3xl mx-auto p-8">
      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Create Campaign
        </h1>
        <p className="text-gray-600">
          Launch your fundraising campaign on the blockchain
        </p>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="font-semibold text-sm mb-1 block">
            Campaign Title *
          </label>
          <input
            type="text"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Help Build a School"
            className="w-full p-3 rounded-lg border bg-white shadow-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label className="font-semibold text-sm mb-1 block">
            Description *
          </label>
          <textarea
            name="description"
            required
            value={formData.description}
            onChange={handleChange}
            rows={5}
            placeholder="Tell people about your campaign..."
            className="w-full p-3 rounded-lg border bg-white shadow-sm"
          />
        </div>

        {/* Email */}
        <div>
          <label className="font-semibold text-sm mb-1 block">Email *</label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="email@email.com"
            className="w-full p-3 rounded-lg border bg-white shadow-sm"
          />
        </div>

        {/* Goal Amount */}
        <div>
          <label className="font-semibold text-sm mb-1 block">
            Goal Amount (USDC) *
          </label>
          <input
            type="number"
            name="goalAmount"
            required
            value={formData.goalAmount}
            onChange={handleChange}
            min="0"
            step="1"
            className="w-full p-3 rounded-lg border bg-white shadow-sm"
          />
        </div>

        {/* Image URL */}
        <div>
          <label className="font-semibold text-sm mb-1 block">
            Campaign Image URL
          </label>
          <input
            type="text"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            placeholder="https://your-image-url.com/photo.jpg"
            className="w-full p-3 rounded-lg border bg-white shadow-sm"
          />

          {formData.imageUrl && (
            <img
              src={formData.imageUrl}
              alt="Preview"
              className="w-48 h-32 object-cover rounded-lg mt-2 border"
            />
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-sm mb-1 block">
              Start Date *
            </label>
            <input
              type="date"
              name="startDate"
              required
              min={new Date().toISOString().split("T")[0]}
              value={formData.startDate}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border bg-white shadow-sm"
            />
          </div>

          <div>
            <label className="font-semibold text-sm mb-1 block">
              End Date *
            </label>
            <input
              type="date"
              name="endDate"
              required
              min={formData.startDate || ""}
              value={formData.endDate}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Status */}
        {submitStatus.type && (
          <div
            className={`p-4 rounded-lg border text-sm ${
              submitStatus.type === "success"
                ? "bg-green-100 border-green-300 text-green-700"
                : "bg-red-100 border-red-300 text-red-700"
            }`}
          >
            {submitStatus.message}
          </div>
        )}

        {/* TX Hash */}
        {txHash && (
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            className="block text-blue-600 underline"
          >
            View Transaction on Etherscan
          </a>
        )}

        {/* BUTTON */}
        <button
          type="submit"
          disabled={isSubmitting || !connectedAddress}
          className={`w-full py-3 rounded-lg text-white font-semibold transition ${
            !connectedAddress
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {!connectedAddress
            ? "Please Connect Wallet"
            : isSubmitting
            ? "Creating..."
            : "Create Campaign"}
        </button>
      </form>
    </main>
  );
}
