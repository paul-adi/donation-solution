// donate page
"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import abi from "@/lib/abi/DonationToken.json";
import Image from "next/image";

const CONTRACT_ADDRESS = "0xc8d97C1A068C7f1900adeD0bC32240eefa0Fd3E0";

interface Campaign {
  campaignId: number;
  title: string;
  image: string;
  goal: bigint;
  startDate: bigint;
  endDate: bigint;
  creator: string;
}

export default function CampaignList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const ethereum = (window as any)?.ethereum;
        if (!ethereum) return;

        const provider = new ethers.BrowserProvider(ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi.abi, provider);

        // Ambil semua CampaignCreated events
        const filter = contract.filters.CampaignCreated();
        const events = await contract.queryFilter(filter);

        const campaignList: Campaign[] = events.map((evt: any) => {
          const args = evt.args;
          return {
            campaignId: typeof args.campaignId === "bigint" ? Number(args.campaignId) : args.campaignId,
            title: args.title,
            image: args.image,
            goal: args.goal,
            startDate: args.startDate,
            endDate: args.endDate,
            creator: args.creator,
          };
        });

        setCampaigns(campaignList);
      } catch (err) {
        console.error("Failed to fetch campaigns:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading campaigns...</p>;

  if (campaigns.length === 0)
    return <p className="text-center mt-10">No campaigns found.</p>;

  return (
    <section className="py-20">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {campaigns.map((c) => (
          <div
            key={c.campaignId}
            className="bg-white/70 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-white/40"
          >
            <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4">
              <Image
                src={c.image || "/placeholder.png"}
                alt={c.title}
                fill
                className="object-cover"
              />
            </div>
            <h2 className="text-xl font-bold mb-2">{c.title}</h2>
            <p className="text-gray-700 mb-2">
              Goal: {(Number(c.goal) / 1_000_000).toLocaleString()} USDC
            </p>
            <p className="text-gray-500 text-sm mb-4">
              Start: {new Date(Number(c.startDate) * 1000).toLocaleDateString()} <br />
              End: {new Date(Number(c.endDate) * 1000).toLocaleDateString()}
            </p>
            <a
              href={`/donate/${c.campaignId}`}
              className="block text-center bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-xl font-semibold transition"
            >
              Donate
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
