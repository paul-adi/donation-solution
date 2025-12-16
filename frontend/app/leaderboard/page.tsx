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
          const amountNet = Number(ev.args.amountNet) / 1_000_000;

          if (!donorTotals[donorAddr]) {
            donorTotals[donorAddr] = { name: donorName, total: amountNet };
          } else {
            donorTotals[donorAddr].total += amountNet;
          }
        }

        const sortedDonors = Object.entries(donorTotals)
          .map(([address, data]) => ({ address, ...data }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 3);

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
      case 0:
        return "bg-orange-500 text-white";
      case 1:
        return "bg-sky-300 text-black";
      case 2:
        return "bg-green-200 text-black";
      default:
        return "bg-white text-black";
    }
  };

  const getTrophy = (rank: number) => {
    switch (rank) {
      case 0:
        return "🥇";
      case 1:
        return "🥈";
      case 2:
        return "🥉";
      default:
        return "🏆";
    }
  };

  return (
    <section className="py-16">
      <div className="max-w-5xl mx-auto text-center">
        {/* 3 Bintang */}
        <div className="flex justify-center mb-4 text-yellow-400 text-3xl gap-2">
          <span>⭐</span>
          <span>⭐</span>
          <span>⭐</span>
        </div>

        <h1 className="text-3xl font-bold mb-8">SEED Champions {year}</h1>

        {loading ? (
          <p>Loading top donors...</p>
        ) : topDonors.length === 0 ? (
          <p>No donations found for this year.</p>
        ) : (
          <div className="flex justify-center items-end gap-6 mt-10">
            {topDonors.map((donor, idx) => {
              // podium heights, lebih tinggi untuk top 1
              const heights = [220, 180, 160];
              return (
                <div
                  key={donor.address}
                  className={`flex flex-col justify-between items-center p-4 rounded-xl shadow-md ${getCardStyles(
                    idx
                  )}`}
                  style={{ minWidth: "160px", height: `${heights[idx]}px` }}
                >
                  <div className="text-4xl mb-2">{getTrophy(idx)}</div>
                  <div className="flex items-center gap-2 font-semibold text-lg">
                    <span className="text-xl">{idx + 1}.</span>
                    <span>{donor.name}</span>
                  </div>
                  <div
                    className={`text-xs mt-1 break-words text-center ${
                      idx === 0 ? "text-white" : "text-black"
                    }`}
                    style={{ wordBreak: "break-word" }}
                  >
                    {donor.address}
                  </div>
                  <div className="font-bold text-lg mt-2">{donor.total.toFixed(2)} USDC</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
