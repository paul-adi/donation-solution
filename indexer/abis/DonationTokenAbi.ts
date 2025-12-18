export const DONATION_TOKEN_ABI = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_usdc",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "PLATFORM_FEE_BPS",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "campaigns",
    inputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "active",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "creator",
        type: "address",
        internalType: "address payable",
      },
      {
        name: "title",
        type: "string",
        internalType: "string",
      },
      {
        name: "description",
        type: "string",
        internalType: "string",
      },
      {
        name: "email",
        type: "string",
        internalType: "string",
      },
      {
        name: "goal",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "raised",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "image",
        type: "string",
        internalType: "string",
      },
      {
        name: "startDate",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "endDate",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "isComplete",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "withdrawnTotal",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "createCampaign",
    inputs: [
      {
        name: "_title",
        type: "string",
        internalType: "string",
      },
      {
        name: "_description",
        type: "string",
        internalType: "string",
      },
      {
        name: "_email",
        type: "string",
        internalType: "string",
      },
      {
        name: "_goal",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_image",
        type: "string",
        internalType: "string",
      },
      {
        name: "_startDate",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_endDate",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "donate",
    inputs: [
      {
        name: "_campaignId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_amount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_donorName",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "donorList",
    inputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "donors",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "name",
        type: "string",
        internalType: "string",
      },
      {
        name: "totalDonated",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAllCampaigns",
    inputs: [],
    outputs: [],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "leaderBoard",
    inputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "pause",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "paused",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setCampaignStatus",
    inputs: [
      {
        name: "_campaignId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "isActive",
        type: "bool",
        internalType: "bool",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setUSDCAddress",
    inputs: [
      {
        name: "_usdc",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "totalPlatformFees",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [
      {
        name: "newOwner",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "unpause",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "usdc",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IERC20",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [
      {
        name: "_campaignId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_amount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_reason",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawPlatformFees",
    inputs: [
      {
        name: "_to",
        type: "address",
        internalType: "address payable",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "CampaignCreated",
    inputs: [
      {
        name: "campaignId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "creator",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "title",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "description",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "image",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "goal",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "startDate",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "endDate",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "CampaignStatusChanged",
    inputs: [
      {
        name: "campaignId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "isActive",
        type: "bool",
        indexed: false,
        internalType: "bool",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Donated",
    inputs: [
      {
        name: "campaignId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "donor",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amountGross",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "amountNet",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "donorName",
        type: "string",
        indexed: false,
        internalType: "string",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "previousOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Paused",
    inputs: [
      {
        name: "account",
        type: "address",
        indexed: false,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PlatformFeesWithdrawn",
    inputs: [
      {
        name: "to",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "USDCAddressUpdated",
    inputs: [
      {
        name: "oldAddress",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newAddress",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Unpaused",
    inputs: [
      {
        name: "account",
        type: "address",
        indexed: false,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Withdrawn",
    inputs: [
      {
        name: "campaignId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "creator",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "reason",
        type: "string",
        indexed: false,
        internalType: "string",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "CampaignEnded",
    inputs: [],
  },
  {
    type: "error",
    name: "CampaignInactive",
    inputs: [],
  },
  {
    type: "error",
    name: "CampaignNotComplete",
    inputs: [],
  },
  {
    type: "error",
    name: "DescriptionRequired",
    inputs: [],
  },
  {
    type: "error",
    name: "EmailRequired",
    inputs: [],
  },
  {
    type: "error",
    name: "EnforcedPause",
    inputs: [],
  },
  {
    type: "error",
    name: "ExpectedPause",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidAmount",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidDates",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidGoal",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidID",
    inputs: [],
  },
  {
    type: "error",
    name: "MinimumWithdrawIsOneUSDC",
    inputs: [],
  },
  {
    type: "error",
    name: "MustWithdrawAllRemaining",
    inputs: [],
  },
  {
    type: "error",
    name: "NoFees",
    inputs: [],
  },
  {
    type: "error",
    name: "NotCreator",
    inputs: [],
  },
  {
    type: "error",
    name: "NotStarted",
    inputs: [],
  },
  {
    type: "error",
    name: "NothingToWithdraw",
    inputs: [],
  },
  {
    type: "error",
    name: "OwnableInvalidOwner",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "OwnableUnauthorizedAccount",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "ReentrancyGuardReentrantCall",
    inputs: [],
  },
  {
    type: "error",
    name: "SafeERC20FailedOperation",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "StartDateTooEarly",
    inputs: [],
  },
  {
    type: "error",
    name: "TitleRequired",
    inputs: [],
  },
  {
    type: "error",
    name: "WithdrawLimitExceeded",
    inputs: [],
  },
  {
    type: "error",
    name: "ZeroAddress",
    inputs: [],
  },
] as const;
