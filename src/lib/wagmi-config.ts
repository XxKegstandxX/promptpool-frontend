// src/lib/wagmi-config.ts
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { cookieStorage, createStorage } from 'wagmi'
import { polygon, polygonAmoy } from 'wagmi/chains'

// Get projectId from https://cloud.walletconnect.com
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '75f904f6a8fbccdee868ea6b30c4bf7d'

if (!projectId) throw new Error('Project ID is not defined')

const metadata = {
  name: 'PromptPool',
  description: 'Earn crypto rewards for AI prompt contributions',
  url: 'https://promptpool.app', // Your domain
  icons: ['https://promptpool.app/icon.png']
}

// Create wagmiConfig with enhanced mobile support
const chains = [polygon, polygonAmoy] as const
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage
  }),
  // Enhanced mobile wallet options
  enableWalletConnect: true,
  enableInjected: true,
  enableCoinbase: true,
  enableEmail: true,
  // Add social login options for mobile
  enableSocials: ['google', 'discord', 'github', 'apple'],
  // Enhanced mobile wallet detection
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
    '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
  ]
})

// Your contract configuration
export const CONTRACT_CONFIG = {
  address: '0x2D6048916FD4017D9348563d442a3476a710D335' as const,
  abi: [
    // ... your existing ABI stays the same
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