"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import abi from "@/lib/abi/DonationToken.json";
import { CONTRACT_ADDRESS } from "@/lib/addresses";

/* =========================
   CONFIG
========================= */
const USDC_DECIMALS = 6;
const PER_PAGE = 2;

/* =========================
   EXPLORER MAP
========================= */
const EXPLORER_BY_CHAIN: Record<number, string> = {
  1: "https://etherscan.io/address/",
  11155111: "https://sepolia.etherscan.io/address/",
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
  creator: string;
};

/* =========================
   HELPERS
========================= */
const shortAddress = (addr?: string) =>
  typeof addr === "string" && addr.length > 10
    ? `${addr.slice(0, 6)}...${addr.slice(-4)}`
    : "Unknown";

const explorerAddress = (chainId?: number, address?: string) => {
  if (!chainId || !address) return "#";
  const base = EXPLORER_BY_CHAIN[chainId];
  return base ? `${base}${address}` : "#";
};

/* =========================
   PAGE
========================= */
export default function CampaignListPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [chainId, setChainId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  // copy icon state
  const [copiedId, setCopiedId] = useState<number | null>(null);

  /* WALLET / CHAIN */
  useEffect(() => {
    const eth = (window as any)?.ethereum;
    if (!eth) return;

    const onChain = (c: string) => setChainId(parseInt(c, 16));
    eth.on("chainChanged", onChain);

    (async () => {
      const cid = await eth.request({ method: "eth_chainId" });
      setChainId(parseInt(cid, 16));
    })();

    return () => {
      eth.removeListener("chainChanged", onChain);
    };
  }, []);

  /* FETCH CAMPAIGNS */
  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      if (!window.ethereum) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi.abi, provider);

      const events = await contract.queryFilter(
        contract.filters.CampaignCreated()
      );

      const list = await Promise.all(
        events.map(async (e: any) => {
          const id = Number(e.args.campaignId ?? e.args[0]);
          const creator = e.args.creator ?? e.args[1];
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
            creator,
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

  /* COPY HANDLER */
  const handleCopy = async (
    e: React.MouseEvent,
    campaignId: number,
    address: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    await navigator.clipboard.writeText(address);
    setCopiedId(campaignId);

    setTimeout(() => setCopiedId(null), 1500);
  };

  /* =========================
     SEARCH LOGIC
  ========================= */
  const filteredCampaigns = useMemo(() => {
    if (!search.trim()) return campaigns;

    const q = search.toLowerCase();

    // address search
    if (q.startsWith("0x")) {
      return campaigns.filter((c) =>
        c.creator.toLowerCase().includes(q)
      );
    }

    // title search
    return campaigns.filter((c) =>
      c.title.toLowerCase().includes(q)
    );
  }, [campaigns, search]);

  // reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  if (loading) {
    return <p className="text-center py-12">Loading campaigns...</p>;
  }

  const totalPages = Math.ceil(filteredCampaigns.length / PER_PAGE);
  const pageCampaigns = filteredCampaigns.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE
  );

  return (
    <section className="max-w-5xl mx-auto px-6 py-16">
      {/* SEARCH BAR */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by campaign title or creator address (0x...)"
          className="
            w-full px-4 py-3 rounded-2xl
              border border-gray-200
              bg-white
              text-sm
              placeholder:text-gray-400
              focus:outline-none
              focus:border-gray-300
              transition
          "
        />
        {search && (
          <p className="text-xs text-gray-500 mt-1">
            Found {filteredCampaigns.length} campaign(s)
          </p>
        )}
      </div>

      {/* LIST */}
      {pageCampaigns.length === 0 ? (
        <p className="text-center text-gray-500">
          No campaigns found.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {pageCampaigns.map((c) => {
            const goal = Number(ethers.formatUnits(c.goal, USDC_DECIMALS));
            const raised = Number(ethers.formatUnits(c.raised, USDC_DECIMALS));
            const percent = goal ? Math.min((raised / goal) * 100, 100) : 0;

            return (
              <Link
                key={c.id}
                href={`/donate/${c.id}`}
                className="bg-white border rounded-3xl overflow-hidden hover:shadow-xl transition flex flex-col"
              >
                {c.image && (
                  <img
                    src={c.image}
                    alt={c.title}
                    className="h-60 w-full object-cover"
                  />
                )}

                <div className="p-6 flex flex-col flex-1">
                  <h2 className="font-semibold text-xl mb-1">{c.title}</h2>

                  {/* CREATOR */}
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
                    <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300 font-semibold">
                      ⭐ On-chain Creator
                    </span>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(
                          explorerAddress(chainId ?? undefined, c.creator),
                          "_blank"
                        );
                      }}
                      className="hover:underline"
                    >
                      {shortAddress(c.creator)}
                    </button>

                    <button
                      onClick={(e) => handleCopy(e, c.id, c.creator)}
                      className="text-gray-400 hover:text-gray-700"
                    >
                      {copiedId === c.id ? "✅" : "📋"}
                    </button>
                  </div>

                  {/* PROGRESS */}
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-blue-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-sm mt-2 text-gray-600">
                    <span>{raised.toFixed(2)} USDC</span>
                    <span>{percent.toFixed(1)}%</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-6">
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
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
