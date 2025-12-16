"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import donationTokenJson from "@/lib/abi/DonationToken.json";
import { CONTRACT_ADDRESS } from "@/lib/addresses";

interface DonorData {
  address: string;
  name: string;
  total: number;
}

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [topDonors, setTopDonors] = useState<DonorData[]>([]);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    const fetchTopDonors = async () => {
      try {
        const ethereum = (window as any).ethereum;
        if (!ethereum) return;

        const provider = new ethers.BrowserProvider(ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, donationTokenJson.abi, provider);

        const events = await contract.queryFilter(contract.filters.Donated());

        const yearStart = new Date(year, 0, 1).getTime() / 1000;
        const yearEnd = new Date(year + 1, 0, 1).getTime() / 1000;

        const donorTotals: Record<string, { name: string; total: number }> = {};

        for (const ev of events) {
          const block = await provider.getBlock(ev.blockNumber);
          const ts = block.timestamp;
          if (ts < yearStart || ts >= yearEnd) continue;

          const donorAddr = ev.args.donor;
          const donorName = ev.args.donorName;
          const amount = Number(ev.args.amountGross) / 1_000_000;

          if (!donorTotals[donorAddr]) {
            donorTotals[donorAddr] = { name: donorName, total: amount };
          } else {
            donorTotals[donorAddr].total += amount;
          }
        }

        const sortedDonors = Object.entries(donorTotals)
          .map(([address, data]) => ({ address, ...data }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 3); // top 3

        setTopDonors(sortedDonors);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopDonors();
  }, [year]);

  const getCardStyles = (rank: number) => {
    switch (rank) {
      case 0: return "bg-orange-500 text-white";
      case 1: return "bg-sky-300 text-black";
      case 2: return "bg-green-200 text-black";
      default: return "bg-white text-black";
    }
  };

  const getTrophy = (rank: number) => {
    switch (rank) {
      case 0: return "🥇";
      case 1: return "🥈";
      case 2: return "🥉";
      default: return "🏆";
    }
  };

  return (
    <section className="py-16">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-6">Leaderboard {year}</h1>

        {loading ? (
          <p>Loading top donors...</p>
        ) : topDonors.length === 0 ? (
          <p>No donations found for this year.</p>
        ) : (
          <ol className="space-y-4">
            {topDonors.map((donor, idx) => (
              <li
                key={donor.address}
                className={`flex justify-between items-center p-4 rounded-xl shadow-md ${getCardStyles(idx)}`}
              >
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <span className="text-2xl">{getTrophy(idx)}</span>
                    <span>{donor.name}</span>
                  </div>
                  <span className={`text-sm ${idx === 0 ? "text-white" : "text-black"}`}>{donor.address}</span>
                </div>
                <span className="font-bold text-lg">{donor.total.toFixed(2)} USDC</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
