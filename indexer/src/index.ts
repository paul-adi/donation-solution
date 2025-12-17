import { ponder } from "ponder:registry";

import {
  campaign,
  donation,
  donor,
  withdrawal,
  platformFees,
  campaignStats,
} from "../ponder.schema";

ponder.on("DonationToken:CampaignCreated", async ({ event, context }) => {
  const { db } = context;
  const { campaignId, creator, title, image, goal, startDate, endDate } =
    event.args;

  await db.insert(campaign).values({
    id: campaignId.toString(),
    campaignId,
    active: true,
    creator,
    title,
    description: "", // Not in event, but required in schema
    email: "", // Not in event
    goal,
    raised: 0n,
    image,
    startDate,
    endDate,
    isComplete: false,
    withdrawnTotal: 0n,
    withdrawReason: null,
    createdAt: event.block.timestamp,
    updatedAt: event.block.timestamp,
  });

  // Update campaign stats
  const stats = await db.find(campaignStats, { id: "global" });
  if (stats) {
    await db.update(campaignStats, { id: "global" }).set({
      totalCampaigns: stats.totalCampaigns + 1,
      activeCampaigns: stats.activeCampaigns + 1,
      lastUpdated: event.block.timestamp,
    });
  } else {
    await db.insert(campaignStats).values({
      id: "global",
      totalCampaigns: 1,
      activeCampaigns: 1,
      completedCampaigns: 0,
      totalRaised: 0n,
      totalDonations: 0,
      uniqueDonors: 0,
      lastUpdated: event.block.timestamp,
    });
  }
});

ponder.on("DonationToken:Withdrawn", async ({ event, context }) => {
  const { db } = context;
  const { campaignId, creator, amount, reason } = event.args;

  // Insert withdrawal
  await db.insert(withdrawal).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    campaignId,
    creator,
    amount,
    reason,
    timestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  });

  // Update campaign withdrawnTotal
  const camp = await db.find(campaign, { id: campaignId.toString() });
  if (camp) {
    await db.update(campaign, { id: campaignId.toString() }).set({
      withdrawnTotal: camp.withdrawnTotal + amount,
      withdrawReason: reason,
      updatedAt: event.block.timestamp,
    });
  }
});

ponder.on("DonationToken:PlatformFeesWithdrawn", async ({ event, context }) => {
  const { db } = context;
  const { to, amount } = event.args;

  // Update platform fees
  const fees = await db.find(platformFees, { id: "global" });
  if (fees) {
    await db.update(platformFees, { id: "global" }).set({
      totalWithdrawn: fees.totalWithdrawn + amount,
      lastUpdated: event.block.timestamp,
    });
  } else {
    await db.insert(platformFees).values({
      id: "global",
      totalFees: 0n, // Assuming we don't track totalFees from events, maybe need to calculate
      totalWithdrawn: amount,
      lastUpdated: event.block.timestamp,
    });
  }
});

ponder.on("DonationToken:OwnershipTransferred", async ({ event, context }) => {
  // Ownership transferred, perhaps log or ignore for now
  console.log(
    `Ownership transferred from ${event.args.previousOwner} to ${event.args.newOwner}`
  );
});

ponder.on("DonationToken:Paused", async ({ event, context }) => {
  // Contract paused
  console.log(`Contract paused by ${event.args.account}`);
});

ponder.on("DonationToken:Unpaused", async ({ event, context }) => {
  // Contract unpaused
  console.log(`Contract unpaused by ${event.args.account}`);
});

ponder.on("DonationToken:USDCAddressUpdated", async ({ event, context }) => {
  // USDC address updated
  console.log(
    `USDC address updated from ${event.args.oldAddress} to ${event.args.newAddress}`
  );
});

ponder.on("DonationToken:Donated", async ({ event, context }) => {
  const { db } = context;
  const {
    campaignId,
    donor: donorAddress,
    amountGross,
    amountNet,
    donorName,
  } = event.args;

  // Insert donation
  await db.insert(donation).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    campaignId,
    donor: donorAddress,
    amountGross,
    amountNet,
    donorName,
    timestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  });

  // Update or insert donor
  const existingDonor = await db.find(donor, { id: donorAddress });
  if (existingDonor) {
    await db.update(donor, { id: donorAddress }).set({
      name: donorName,
      totalDonated: existingDonor.totalDonated + amountNet,
      donationCount: existingDonor.donationCount + 1,
      lastDonationAt: event.block.timestamp,
    });
  } else {
    await db.insert(donor).values({
      id: donorAddress,
      name: donorName,
      totalDonated: amountNet,
      donationCount: 1,
      firstDonationAt: event.block.timestamp,
      lastDonationAt: event.block.timestamp,
    });
  }

  // Update campaign raised
  const camp = await db.find(campaign, { id: campaignId.toString() });
  if (camp) {
    await db.update(campaign, { id: campaignId.toString() }).set({
      raised: camp.raised + amountNet,
      updatedAt: event.block.timestamp,
    });
  }

  // Update campaign stats
  const stats = await db.find(campaignStats, { id: "global" });
  if (stats) {
    const uniqueDonors = existingDonor
      ? stats.uniqueDonors
      : stats.uniqueDonors + 1;
    await db.update(campaignStats, { id: "global" }).set({
      totalRaised: stats.totalRaised + amountNet,
      totalDonations: stats.totalDonations + 1,
      uniqueDonors,
      lastUpdated: event.block.timestamp,
    });
  }
});

ponder.on("DonationToken:CampaignStatusChanged", async ({ event, context }) => {
  const { db } = context;
  const { campaignId, isActive } = event.args;

  await db.update(campaign, { id: campaignId.toString() }).set({
    active: isActive,
    updatedAt: event.block.timestamp,
  });

  // Update campaign stats
  const stats = await db.find(campaignStats, { id: "global" });
  if (stats) {
    const activeCount = isActive
      ? stats.activeCampaigns + 1
      : stats.activeCampaigns - 1;
    await db.update(campaignStats, { id: "global" }).set({
      activeCampaigns: activeCount,
      lastUpdated: event.block.timestamp,
    });
  }
});
