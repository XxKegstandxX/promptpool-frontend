// src/lib/wagmi-config.ts
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { polygon } from 'wagmi/chains'

// Your WalletConnect Project ID
export const projectId = '75f904f6a8fbccdee868ea6b30c4bf7d'

// Enhanced PromptPool V2 Smart Contract ABI
const ENHANCED_CONTRACT_ABI = [
  // ===== EXISTING FUNCTIONS (Backward Compatible) =====
  {
    "inputs": [
      {"internalType": "string", "name": "ipfsHash", "type": "string"},
      {"internalType": "string", "name": "title", "type": "string"},
      {"internalType": "string", "name": "category", "type": "string"},
      {"internalType": "uint256", "name": "promptLength", "type": "uint256"}
    ],
    "name": "submitPrompt",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getUserStats",
    "outputs": [
      {"internalType": "uint256", "name": "submissions", "type": "uint256"},
      {"internalType": "uint256", "name": "totalEarned", "type": "uint256"},
      {"internalType": "string", "name": "tier", "type": "string"},
      {"internalType": "bool", "name": "canSubmit", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalSubmissions",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getContractBalance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "promptLength", "type": "uint256"},
      {"internalType": "string", "name": "category", "type": "string"},
      {"internalType": "address", "name": "user", "type": "address"}
    ],
    "name": "getRewardEstimate",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "promptId", "type": "uint256"}],
    "name": "getPrompt",
    "outputs": [
      {"internalType": "string", "name": "ipfsHash", "type": "string"},
      {"internalType": "string", "name": "title", "type": "string"},
      {"internalType": "string", "name": "category", "type": "string"},
      {"internalType": "address", "name": "submitter", "type": "address"},
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"internalType": "uint256", "name": "reward", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // ===== NEW POOL AI CHAT FUNCTIONS =====
  {
    "inputs": [
      {"internalType": "string", "name": "conversationHash", "type": "string"},
      {"internalType": "uint256", "name": "messageCount", "type": "uint256"},
      {"internalType": "uint256", "name": "qualityScore", "type": "uint256"},
      {"internalType": "uint256", "name": "sessionLength", "type": "uint256"},
      {"internalType": "string", "name": "category", "type": "string"},
      {"internalType": "bool", "name": "allowTraining", "type": "bool"}
    ],
    "name": "submitChatSession",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimChatRewards",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getUserChatStats",
    "outputs": [
      {"internalType": "uint256", "name": "totalSessions", "type": "uint256"},
      {"internalType": "uint256", "name": "totalMessages", "type": "uint256"},
      {"internalType": "uint256", "name": "averageQuality", "type": "uint256"},
      {"internalType": "uint256", "name": "pendingRewards", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // ===== NEW REFERRAL FUNCTIONS =====
  {
    "inputs": [{"internalType": "address", "name": "referrer", "type": "address"}],
    "name": "setReferrer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimReferralRewards",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getReferralStats",
    "outputs": [
      {"internalType": "address", "name": "referrer", "type": "address"},
      {"internalType": "uint256", "name": "referralCount", "type": "uint256"},
      {"internalType": "uint256", "name": "totalBonuses", "type": "uint256"},
      {"internalType": "uint256", "name": "pendingBonuses", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // ===== NEW SUBSCRIPTION FUNCTIONS =====
  {
    "inputs": [],
    "name": "paySubscription",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getSubscriptionStatus",
    "outputs": [
      {"internalType": "bool", "name": "isActive", "type": "bool"},
      {"internalType": "uint256", "name": "nextPayment", "type": "uint256"},
      {"internalType": "uint256", "name": "monthlyEarnings", "type": "uint256"},
      {"internalType": "uint256", "name": "requiredPayment", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // ===== UTILITY FUNCTIONS =====
  {
    "inputs": [],
    "name": "getContractInfo",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "pure",
    "type": "function"
  }
] as const

// Enhanced Contract Configuration (Updated)
export const CONTRACT_CONFIG = {
  address: '0x8AA7D6a412E744052e857ED4358117D51eA2B1BB' as `0x${string}`,
  abi: ENHANCED_CONTRACT_ABI,
  chainId: polygon.id
}

// Also export as ENHANCED_CONTRACT_CONFIG for compatibility
export const ENHANCED_CONTRACT_CONFIG = CONTRACT_CONFIG

// Metadata
const metadata = {
  name: 'PromptPool',
  description: 'The World\'s First AI That Pays Users to Chat',
  url: 'https://promptpool.ai',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// Create wagmi config
export const config = defaultWagmiConfig({
  chains: [polygon],
  projectId,
  metadata,
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true
})