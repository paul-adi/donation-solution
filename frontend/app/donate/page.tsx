// campaign list page
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import abi from "@/lib/abi/DonationToken.json";

/* =========================
   CONFIG
========================= */
const USDC_DECIMALS = 6;
const PER_PAGE = 2;

const NETWORK_CONTRACTS: Record<number, { donation: string }> = {
  11155111: {
    donation: "0xc8d97C1A068C7f1900adeD0bC32240eefa0Fd3E0",
  },
};

/* =========================
   TYPES
========================= */
type Campaign = {
  id: number;
  title: string;
  image: string;
  goal: bigint;
  raised: bigint;
  startDate: bigint;
  endDate: bigint;
  isComplete: boolean;
  active: boolean;
};

/* =========================
   PAGE
========================= */
export default function CampaignListPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      if (!window.ethereum) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      const cfg = NETWORK_CONTRACTS[chainId];
      if (!cfg) return;

      const contract = new ethers.Contract(cfg.donation, abi.abi, provider);

      const events = await contract.queryFilter(
        contract.filters.CampaignCreated()
      );

      const validEvents = events.filter(
        (e: any) => e.args && e.args.campaignId !== undefined
      );

      const list = await Promise.all(
        validEvents.map(async (e: any) => {
          const id = Number(e.args.campaignId);
          const c = await contract.campaigns(id);

          return {
            id,
            title: c.title,
            image: c.image,
            goal: c.goal,
            raised: c.raised,
            startDate: c.startDate,
            endDate: c.endDate,
            isComplete: c.isComplete,
            active: c.active,
          };
        })
      );

      setCampaigns(list.reverse());
    } catch (err) {
      console.error("Fetch campaigns error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <p className="text-center py-12">Loading campaigns...</p>;
  }

  const totalPages = Math.ceil(campaigns.length / PER_PAGE);
  const startIndex = (page - 1) * PER_PAGE;
  const pageCampaigns = campaigns.slice(
    startIndex,
    startIndex + PER_PAGE
  );

  return (
    <section className="max-w-5xl mx-auto px-6 py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {pageCampaigns.map((c) => {
          const goal = Number(
            ethers.formatUnits(c.goal, USDC_DECIMALS)
          );
          const raised = Number(
            ethers.formatUnits(c.raised, USDC_DECIMALS)
          );

          const percent =
            goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

          const now = Date.now() / 1000;
          const end = Number(c.endDate);

          const status =
            c.isComplete || now > end ? "Ended" : "Active";

          return (
            <Link
              key={c.id}
              href={`/donate/${c.id}`}
              className="bg-white border rounded-3xl overflow-hidden hover:shadow-xl transition flex flex-col"
            >
              {/* IMAGE */}
              {c.image && (
                <img
                  src={c.image}
                  alt={c.title}
                  className="h-52 w-full object-cover"
                />
              )}

              <div className="p-6 flex-1 flex flex-col">
                <h2 className="font-semibold text-xl mb-4">
                  {c.title}
                </h2>

                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      c.isComplete
                        ? "bg-green-500"
                        : "bg-blue-500"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="flex justify-between text-sm mt-2 text-gray-600">
                  <span>${raised.toLocaleString()} raised</span>
                  <span>{percent.toFixed(0)}%</span>
                </div>

                <div className="mt-6 flex justify-between items-center text-sm">
                  <span
                    className={`px-4 py-1 rounded-full ${
                      status === "Active"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {status}
                  </span>

                  <span className="text-gray-500">
                    Ends{" "}
                    {new Date(end * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-14">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-5 py-2 rounded-xl border disabled:opacity-40"
          >
            Prev
          </button>

          <span className="px-5 py-2 text-gray-600">
            Page {page} / {totalPages}
          </span>

          <button
            onClick={() =>
              setPage((p) => Math.min(totalPages, p + 1))
            }
            disabled={page === totalPages}
            className="px-5 py-2 rounded-xl border disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
