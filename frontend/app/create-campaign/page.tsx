"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import Image from "next/image";
import abi from "@/lib/abi/DonationToken.json";
import { CONTRACT_ADDRESS } from "@/lib/addresses";

/* =====================
   CONFIG
===================== */
const USDC_DECIMALS = 6;

const EXPLORER_BY_CHAIN: Record<number, string> = {
  1: "https://etherscan.io",
  11155111: "https://sepolia.etherscan.io",
};

/* =====================
   TYPES
===================== */
interface CampaignFormData {
  title: string;
  description: string;
  contact: string; // tetap dikirim ke param `email` di smart contract
  goalAmount: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
}

/* =====================
   HELPERS
===================== */
const explorerTx = (chainId?: number, hash?: string) => {
  if (!chainId || !hash) return "#";
  const base = EXPLORER_BY_CHAIN[chainId];
  return base ? `${base}/tx/${hash}` : "#";
};

/* =====================
   PAGE
===================== */
export default function CreateCampaignPage() {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  const [form, setForm] = useState<CampaignFormData>({
    title: "",
    description: "",
    contact: "",
    goalAmount: "",
    imageUrl: "",
    startDate: "",
    endDate: "",
  });

  /* =====================
     WALLET / CHAIN
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
     HANDLERS
  ====================== */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "goalAmount") {
      setForm((p) => ({ ...p, goalAmount: value.replace(/[^0-9]/g, "") }));
      return;
    }

    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      setStatus("Please connect wallet first");
      return;
    }

    const start = new Date(form.startDate).getTime();
    const end = new Date(form.endDate).getTime();

    if (end <= start) {
      setStatus("End date must be after start date");
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus("Submitting transaction...");
      setTxHash(null);

      const provider = new ethers.BrowserProvider(
        (window as any).ethereum
      );
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        abi.abi,
        signer
      );

      const goal = ethers.parseUnits(form.goalAmount, USDC_DECIMALS);
      const startTs = Math.floor(start / 1000);
      const endTs = Math.floor(end / 1000);

      const tx = await contract.createCampaign(
        form.title,
        form.description,
        form.contact, // ⬅ masuk ke param `email` (contact info)
        goal,
        form.imageUrl,
        startTs,
        endTs
      );

      const receipt = await tx.wait();

      setTxHash(receipt.hash);
      setStatus("Campaign created successfully 🎉");

      setForm({
        title: "",
        description: "",
        contact: "",
        goalAmount: "",
        imageUrl: "",
        startDate: "",
        endDate: "",
      });
    } catch (e: any) {
      setStatus(e?.reason || e?.message || "Transaction failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full p-3 rounded-xl bg-white border border-gray-200 shadow-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200";

  /* =====================
     RENDER
  ====================== */
  return (
    <section className="py-16">
      <div className="max-w-3xl mx-auto px-6">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2 text-center">
            Create Campaign
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Launch your fundraising campaign on-chain
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* TITLE */}
            <div>
              <label className="text-sm font-semibold">Campaign Title *</label>
              <input
                name="title"
                required
                value={form.title}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="text-sm font-semibold">Description *</label>
              <textarea
                name="description"
                required
                rows={5}
                value={form.description}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            {/* CONTACT */}
            <div>
              <label className="text-sm font-semibold">
                Contact Info *
              </label>
              <input
                name="contact"
                required
                placeholder="email / instagram / linkedin / x (use | or , for multiple)"
                value={form.contact}
                onChange={handleChange}
                className={inputClass}
              />
              <p className="text-xs text-gray-500 mt-1">
                Example:
                <span className="italic">
                  instagram.com/pantijompo | linkedin.com/in/pantijompo
                </span>
              </p>
            </div>

            {/* GOAL */}
            <div>
              <label className="text-sm font-semibold">Goal Amount (USDC) *</label>
              <input
                name="goalAmount"
                required
                value={form.goalAmount}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            {/* IMAGE */}
            <div>
              <label className="text-sm font-semibold">Image URL</label>
              <input
                name="imageUrl"
                value={form.imageUrl}
                onChange={handleChange}
                className={inputClass}
              />

              {form.imageUrl && (
                <div className="relative w-56 h-36 mt-3 rounded-xl overflow-hidden border">
                  <Image
                    src={form.imageUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>

            {/* DATES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold">Start Date *</label>
                <input
                  type="datetime-local"
                  name="startDate"
                  required
                  value={form.startDate}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-sm font-semibold">End Date *</label>
                <input
                  type="datetime-local"
                  name="endDate"
                  required
                  value={form.endDate}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            {/* STATUS */}
            {status && (
              <p className="text-center text-sm text-gray-700">{status}</p>
            )}

            {/* TX LINK */}
            {txHash && chainId && (
              <a
                href={explorerTx(chainId, txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-orange-600 underline text-sm"
              >
                View Transaction on Explorer
              </a>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={isSubmitting || !address}
              className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold disabled:bg-gray-400"
            >
              {!address
                ? "Connect Wallet"
                : isSubmitting
                ? "Creating..."
                : "Create Campaign"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
