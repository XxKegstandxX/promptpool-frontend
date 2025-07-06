// src/lib/wagmi-config.ts
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { cookieStorage, createStorage } from 'wagmi'
import { polygon, polygonAmoy } from 'wagmi/chains'

// Get projectId from https://cloud.walletconnect.com
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id'

if (!projectId) throw new Error('Project ID is not defined')

const metadata = {
  name: 'PromptPool',
  description: 'Earn crypto rewards for AI prompt contributions',
  url: 'https://promptpool.app', // Your domain
  icons: ['https://promptpool.app/icon.png']
}

// Create wagmiConfig
const chains = [polygon, polygonAmoy] as const
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage
  }),
  enableWalletConnect: true, // Optional - true by default
  enableInjected: true, // Optional - true by default
  enableCoinbase: true, // Optional - true by default
})

// Your contract configuration
export const CONTRACT_CONFIG = {
  address: '0x2D6048916FD4017D9348563d442a3476a710D335' as const,
  abi: [
    {
      "type": "function",
      "name": "submitPrompt",
      "inputs": [
        {"name": "ipfsHash", "type": "string"},
        {"name": "title", "type": "string"},
        {"name": "category", "type": "uint8"},
        {"name": "promptLength", "type": "uint256"}
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "getUserStats",
      "inputs": [{"name": "user", "type": "address"}],
      "outputs": [
        {"name": "", "type": "uint256"},
        {"name": "", "type": "uint256"},
        {"name": "", "type": "uint256"},
        {"name": "", "type": "uint256"},
        {"name": "", "type": "uint8"},
        {"name": "", "type": "uint256"},
        {"name": "", "type": "uint256"}
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getTotalSubmissions",
      "inputs": [],
      "outputs": [{"name": "", "type": "uint256"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getContractBalance",
      "inputs": [],
      "outputs": [{"name": "", "type": "uint256"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getRewardEstimate",
      "inputs": [
        {"name": "promptLength", "type": "uint256"},
        {"name": "category", "type": "uint8"},
        {"name": "user", "type": "address"}
      ],
      "outputs": [
        {"name": "tier", "type": "uint8"},
        {"name": "rewardAmount", "type": "uint256"}
      ],
      "stateMutability": "view"
    }
  ] as const,
  chainId: polygon.id
} as const