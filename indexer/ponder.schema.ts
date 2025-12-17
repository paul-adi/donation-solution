import { onchainTable, onchainEnum } from "ponder";

export const campaignStatusEnum = onchainEnum("campaign_status", [
  "active",
  "inactive",
  "completed",
]);

export const campaign = onchainTable("campaign", (t) => ({
  id: t.text().primaryKey(), // campaignId as string
  campaignId: t.bigint().notNull(),
  active: t.boolean().notNull(),
  creator: t.hex().notNull(),
  title: t.text().notNull(),
  description: t.text().notNull(),
  email: t.text().notNull(),
  goal: t.bigint().notNull(),
  raised: t.bigint().notNull(),
  image: t.text(),
  startDate: t.bigint().notNull(),
  endDate: t.bigint().notNull(),
  isComplete: t.boolean().notNull(),
  withdrawnTotal: t.bigint().notNull(),
  withdrawReason: t.text(),
  createdAt: t.bigint().notNull(),
  updatedAt: t.bigint().notNull(),
}));

export const donation = onchainTable("donation", (t) => ({
  id: t.text().primaryKey(), // txHash-logIndex
  campaignId: t.bigint().notNull(),
  donor: t.hex().notNull(),
  amountGross: t.bigint().notNull(),
  amountNet: t.bigint().notNull(),
  donorName: t.text().notNull(),
  timestamp: t.bigint().notNull(),
  transactionHash: t.hex().notNull(),
}));

export const donor = onchainTable("donor", (t) => ({
  id: t.hex().primaryKey(), // donor address
  name: t.text().notNull(),
  totalDonated: t.bigint().notNull(),
  donationCount: t.integer().notNull(),
  firstDonationAt: t.bigint().notNull(),
  lastDonationAt: t.bigint().notNull(),
}));

export const withdrawal = onchainTable("withdrawal", (t) => ({
  id: t.text().primaryKey(), // txHash-logIndex
  campaignId: t.bigint().notNull(),
  creator: t.hex().notNull(),
  amount: t.bigint().notNull(),
  reason: t.text().notNull(),
  timestamp: t.bigint().notNull(),
  transactionHash: t.hex().notNull(),
}));

export const platformFees = onchainTable("platform_fees", (t) => ({
  id: t.text().primaryKey(),
  totalFees: t.bigint().notNull(),
  totalWithdrawn: t.bigint().notNull(),
  lastUpdated: t.bigint().notNull(),
}));

export const campaignStats = onchainTable("campaign_stats", (t) => ({
  id: t.text().primaryKey(),
  totalCampaigns: t.integer().notNull(),
  activeCampaigns: t.integer().notNull(),
  completedCampaigns: t.integer().notNull(),
  totalRaised: t.bigint().notNull(),
  totalDonations: t.integer().notNull(),
  uniqueDonors: t.integer().notNull(),
  lastUpdated: t.bigint().notNull(),
}));
