import { createConfig } from "ponder";

import { DONATION_TOKEN_ABI } from "./abis/DonationTokenAbi";

export default createConfig({
  chains: {
    ethereumSepolia: {
      id: 11155111,
      rpc: process.env.RPC_URL!,
      ethGetLogsBlockRange: 200,
    },
  },
  contracts: {
    DonationToken: {
      chain: "ethereumSepolia",
      abi: DONATION_TOKEN_ABI,
      address: process.env.DONATION_TOKEN_ADDRESS as `0x${string}`,
      startBlock: Number(process.env.START_BLOCK),
    },
  },
});
