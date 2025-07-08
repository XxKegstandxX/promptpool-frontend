'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import WagmiConnectButton from '../components/WagmiConnectButton'
import { useToast } from '../components/Toast'
import { 
  usePromptPoolAccount, 
  useUserStats, 
  useTotalSubmissions, 
  useContractBalance,
  useRewardEstimate,
  useSubmitPrompt,
  useTierInfo
} from '../hooks/usePromptPool'
import { uploadPromptToIPFS, getIPFSConfig } from '../lib/ipfs'
import { ReferralService } from '../lib/supabase'

// Import the floating particles component
const FloatingParticles = () => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    speed: number;
    opacity: number;
    delay: number;
  }>>([]);
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const newParticles = []
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        speed: Math.random() * 20 + 15,
        opacity: Math.random() * 0.6 + 0.2,
        delay: Math.random() * 15
      })
    }
    setParticles(newParticles)
  }, [])

  if (!isClient) return null

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 animate-float"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            animationDuration: `${particle.speed}s`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
      
      {[...Array(8)].map((_, i) => (
        <div
          key={`bubble-${i}`}
          className="absolute rounded-full border-2 border-teal-400/20 animate-bubble"
          style={{
            left: `${Math.random() * 90}%`,
            top: `${Math.random() * 90}%`,
            width: `${Math.random() * 40 + 20}px`,
            height: `${Math.random() * 40 + 20}px`,
            animationDuration: `${Math.random() * 10 + 20}s`,
            animationDelay: `${Math.random() * 10}s`,
          }}
        />
      ))}
    </div>
  )
}

// Quick Help Modal Component
const QuickHelpModal = ({ 
  activeModal, 
  onClose, 
  ipfsConfig 
}: { 
  activeModal: string | null, 
  onClose: () => void,
  ipfsConfig: { isDemo: boolean }
}) => {
  if (!activeModal) return null

  const helpContent = {
    wallet: {
      title: "🔗 How to Connect Your Wallet",
      content: (
        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
            <h4 className="text-blue-400 font-semibold mb-2">Option 1: Web3Modal (Recommended)</h4>
            <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
              <li>Click the purple "Connect Wallet" button</li>
              <li>Choose from 300+ supported wallets</li>
              <li>Follow the prompts in your wallet app</li>
              <li>Approve the connection</li>
            </ol>
          </div>
          
          <div className="bg-teal-500/10 border border-teal-400/30 rounded-lg p-4">
            <h4 className="text-teal-400 font-semibold mb-2">Option 2: MetaMask Direct</h4>
            <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
              <li>Install MetaMask browser extension or mobile app</li>
              <li>Click the green "Connect with MetaMask" button</li>
              <li>Approve the connection in MetaMask</li>
              <li>Switch to Polygon network if prompted</li>
            </ol>
          </div>

          <div className="bg-orange-500/10 border border-orange-400/30 rounded-lg p-4">
            <h4 className="text-orange-400 font-semibold mb-2">📱 Mobile Users</h4>
            <p className="text-sm text-gray-300">
              If MetaMask doesn't open automatically, we'll provide a direct link to open the MetaMask app. 
              Make sure you have MetaMask installed first!
            </p>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4">
            <h4 className="text-yellow-400 font-semibold mb-2">⚠️ Troubleshooting</h4>
            <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
              <li>Make sure you're on the Polygon network</li>
              <li>Try refreshing the page if connection fails</li>
              <li>Check that your wallet isn't already connected to another dapp</li>
              <li>Disable other wallet extensions to avoid conflicts</li>
            </ul>
          </div>
        </div>
      )
    },
    rewards: {
      title: "💰 How Rewards Work",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-orange-500/10 border border-orange-400/30 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">🥉</span>
                <h4 className="text-orange-400 font-semibold">Bronze (5-10 POOL)</h4>
              </div>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li>Automatic approval</li>
                <li>Instant payment</li>
                <li>Basic quality prompts</li>
                <li>Perfect for beginners</li>
              </ul>
            </div>

            <div className="bg-gray-400/10 border border-gray-400/30 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">🥈</span>
                <h4 className="text-gray-300 font-semibold">Silver (15-25 POOL)</h4>
              </div>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li>Automatic approval</li>
                <li>Instant payment</li>
                <li>Good quality required</li>
                <li>Higher rewards</li>
              </ul>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">🥇</span>
                <h4 className="text-yellow-400 font-semibold">Gold (30-50 POOL)</h4>
              </div>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li>Manual review</li>
                <li>24-48h approval</li>
                <li>High quality prompts</li>
                <li>Expert evaluation</li>
              </ul>
            </div>

            <div className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">💎</span>
                <h4 className="text-purple-400 font-semibold">Platinum (75-100 POOL)</h4>
              </div>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li>Expert panel review</li>
                <li>2-7 day approval</li>
                <li>Exceptional quality</li>
                <li>Highest rewards</li>
              </ul>
            </div>
          </div>

          <div className="bg-teal-500/10 border border-teal-400/30 rounded-lg p-4">
            <h4 className="text-teal-400 font-semibold mb-2">🎯 How Tiers Are Determined</h4>
            <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
              <li><strong>Length:</strong> Longer, detailed prompts score higher</li>
              <li><strong>Originality:</strong> Unique prompts get better tiers</li>
              <li><strong>Category:</strong> Technical prompts often score higher</li>
              <li><strong>User Reputation:</strong> Better history = higher tiers</li>
              <li><strong>Training Value:</strong> How useful for AI training</li>
            </ul>
          </div>

          <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
            <h4 className="text-green-400 font-semibold mb-2">🚀 Pro Tips</h4>
            <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
              <li>Start with Bronze/Silver to build reputation</li>
              <li>Detailed prompts (100+ words) perform better</li>
              <li>Include context and examples in your prompts</li>
              <li>Consistent quality submissions increase your tier over time</li>
            </ul>
          </div>
        </div>
      )
    },
    prompts: {
      title: "📝 What Makes a Good Prompt",
      content: (
        <div className="space-y-4">
          <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
            <h4 className="text-green-400 font-semibold mb-2">✅ Good Prompt Characteristics</h4>
            <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside">
              <li><strong>Clear and Specific:</strong> Exactly what you want the AI to do</li>
              <li><strong>Detailed Context:</strong> Background information and constraints</li>
              <li><strong>Examples Included:</strong> Show the AI what good output looks like</li>
              <li><strong>Proper Length:</strong> Minimum 50 words, ideally 100-300 words</li>
              <li><strong>Well-Structured:</strong> Organized with clear sections</li>
              <li><strong>Original Content:</strong> Your own creative work, not copied</li>
            </ul>
          </div>

          <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
            <h4 className="text-blue-400 font-semibold mb-2">💎 Example: High-Quality Prompt</h4>
            <div className="bg-slate-800/50 rounded p-3 text-sm text-gray-300 font-mono">
              <p className="mb-2"><strong>Title:</strong> "Creative Writing Assistant for Sci-Fi Stories"</p>
              <p className="mb-2"><strong>Category:</strong> Creative Writing</p>
              <p><strong>Content:</strong> "You are a creative writing assistant specializing in science fiction. Help writers develop compelling sci-fi stories by providing: 1) Unique plot concepts that haven't been overused, 2) Scientifically plausible explanations for futuristic technology, 3) Character development suggestions for diverse casts. When suggesting plots, always include a brief scientific explanation for key technologies. Focus on stories that explore human nature through technological advancement. Example output format: 'Plot: [concept] | Science: [explanation] | Characters: [suggestions]'"</p>
            </div>
          </div>

          <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4">
            <h4 className="text-red-400 font-semibold mb-2">❌ Avoid These Mistakes</h4>
            <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
              <li>Too vague: "Help me write something"</li>
              <li>Too short: Single sentence prompts</li>
              <li>Copied content: Prompts found elsewhere online</li>
              <li>No context: Jumping straight to requests</li>
              <li>Poor grammar: Makes prompts hard to understand</li>
              <li>Inappropriate content: Keep it professional and helpful</li>
            </ul>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4">
            <h4 className="text-yellow-400 font-semibold mb-2">🎯 Categories That Perform Well</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
              <div>
                <p><strong>Technical/Programming:</strong></p>
                <ul className="list-disc list-inside text-xs space-y-1 mt-1">
                  <li>Code generation prompts</li>
                  <li>Debugging assistance</li>
                  <li>Architecture explanations</li>
                </ul>
              </div>
              <div>
                <p><strong>Educational:</strong></p>
                <ul className="list-disc list-inside text-xs space-y-1 mt-1">
                  <li>Step-by-step tutorials</li>
                  <li>Concept explanations</li>
                  <li>Learning activities</li>
                </ul>
              </div>
              <div>
                <p><strong>Creative Writing:</strong></p>
                <ul className="list-disc list-inside text-xs space-y-1 mt-1">
                  <li>Story development</li>
                  <li>Character creation</li>
                  <li>World building</li>
                </ul>
              </div>
              <div>
                <p><strong>Analytical:</strong></p>
                <ul className="list-disc list-inside text-xs space-y-1 mt-1">
                  <li>Data analysis tasks</li>
                  <li>Research methodologies</li>
                  <li>Problem-solving frameworks</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    },
    ipfs: {
      title: "🌐 What is IPFS Storage",
      content: (
        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
            <h4 className="text-blue-400 font-semibold mb-2">🌍 IPFS Explained Simply</h4>
            <p className="text-sm text-gray-300 mb-2">
              IPFS (InterPlanetary File System) is like a global, permanent filing cabinet that no single company controls. 
              When you submit a prompt, it gets stored across multiple computers worldwide, making it:
            </p>
            <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
              <li><strong>Permanent:</strong> Your prompts can never be deleted or lost</li>
              <li><strong>Decentralized:</strong> No single point of failure</li>
              <li><strong>Verifiable:</strong> Each file gets a unique, unchangeable fingerprint</li>
              <li><strong>Accessible:</strong> Available from anywhere in the world</li>
            </ul>
          </div>

          <div className="bg-teal-500/10 border border-teal-400/30 rounded-lg p-4">
            <h4 className="text-teal-400 font-semibold mb-2">🔒 Why We Use IPFS</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
              <div>
                <p><strong>vs Traditional Servers:</strong></p>
                <ul className="list-disc list-inside text-xs space-y-1 mt-1">
                  <li>✅ Can't be shut down</li>
                  <li>✅ No censorship risk</li>
                  <li>✅ Global availability</li>
                  <li>✅ Lower costs</li>
                </ul>
              </div>
              <div>
                <p><strong>vs Cloud Storage:</strong></p>
                <ul className="list-disc list-inside text-xs space-y-1 mt-1">
                  <li>✅ You own your data</li>
                  <li>✅ No monthly fees</li>
                  <li>✅ Cannot be deleted</li>
                  <li>✅ Cryptographically verified</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-4">
            <h4 className="text-purple-400 font-semibold mb-2">🔗 Your IPFS Hash</h4>
            <p className="text-sm text-gray-300 mb-2">
              When you submit a prompt, you get an IPFS hash that looks like: 
              <code className="bg-slate-800 px-2 py-1 rounded text-teal-400 ml-1">QmX7x8x9x...</code>
            </p>
            <p className="text-sm text-gray-300 mb-2">This hash is like a permanent address for your content. You can:</p>
            <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
              <li>View it on any IPFS gateway</li>
              <li>Share it with others</li>
              <li>Prove you created the content</li>
              <li>Access it forever</li>
            </ul>
          </div>

          <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
            <h4 className="text-green-400 font-semibold mb-2">⚡ Current Status</h4>
            <div className={`flex items-center space-x-2 mb-2 ${ipfsConfig.isDemo ? 'text-yellow-400' : 'text-green-400'}`}>
              <div className="text-lg">{ipfsConfig.isDemo ? '🧪' : '🌐'}</div>
              <span className="font-semibold">{ipfsConfig.isDemo ? 'Demo Mode' : 'Production Mode'}</span>
            </div>
            <p className="text-sm text-gray-300">
              {ipfsConfig.isDemo 
                ? 'Currently using simulated IPFS for testing. Your prompts are saved locally but will be moved to real IPFS in production.'
                : 'Your prompts are being stored on real IPFS via Pinata, making them permanently accessible worldwide.'
              }
            </p>
          </div>

          <div className="bg-orange-500/10 border border-orange-400/30 rounded-lg p-4">
            <h4 className="text-orange-400 font-semibold mb-2">🔍 Learn More</h4>
            <p className="text-sm text-gray-300 mb-2">Want to explore IPFS further?</p>
            <div className="flex flex-wrap gap-2">
              <a href="https://ipfs.io/" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-white text-xs bg-slate-800 px-3 py-1 rounded transition-colors">
                IPFS.io →
              </a>
              <a href="https://docs.ipfs.io/" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-white text-xs bg-slate-800 px-3 py-1 rounded transition-colors">
                Documentation →
              </a>
              <a href="https://pinata.cloud/" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-white text-xs bg-slate-800 px-3 py-1 rounded transition-colors">
                Pinata →
              </a>
            </div>
          </div>
        </div>
      )
    }
  }

  const currentContent = helpContent[activeModal as keyof typeof helpContent]
  if (!currentContent) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-teal-500/30 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h3 className="text-2xl font-bold text-white">{currentContent.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {currentContent.content}
        </div>
      </div>
    </div>
  )
}

// Your live contract details (keeping for ethers fallback)
const CONTRACT_ADDRESS = "0x2D6048916FD4017D9348563d442a3476a710D335"
const CONTRACT_ABI = [
  "function submitPrompt(string ipfsHash, string title, uint8 category, uint256 promptLength) external",
  "function getPrompt(uint256 promptId) external view returns (tuple(address contributor, string ipfsHash, string title, uint8 category, uint8 tier, uint256 rewardAmount, uint256 submittedAt, bool isApproved, bool isPaid, uint8 qualityScore))",
  "function getUserStats(address user) external view returns (tuple(uint256 totalSubmissions, uint256 approvedSubmissions, uint256 totalRewards, uint256 reputationScore, uint8 currentTier, uint256 lastSubmissionTime, uint256 consecutiveApprovals))",
  "function getTotalSubmissions() external view returns (uint256)",
  "function getContractBalance() external view returns (uint256)",
  "function canSubmit(address user) external view returns (bool)",
  "function getRewardEstimate(uint256 promptLength, uint8 category, address user) external view returns (uint8 tier, uint256 rewardAmount)"
]

type PageType = 'home' | 'how-it-works' | 'connect' | 'team' | 'contact'

// Type for user contributions
interface UserContribution {
  id: string;
  title: string;
  ipfsHash: string;
  category: number;
  submittedAt: number;
  tier: number;
  reward: string;
  status: 'pending' | 'approved';
}

export default function PromptPoolApp() {
  const [currentPage, setCurrentPage] = useState<PageType>('home')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Form states
  const [promptTitle, setPromptTitle] = useState('')
  const [promptContent, setPromptContent] = useState('')
  const [category, setCategory] = useState(0)
  
  // Contributions tracking with localStorage persistence
  const [showContributions, setShowContributions] = useState(false)
  const [userContributions, setUserContributions] = useState<UserContribution[]>(() => {
    // Load contributions from localStorage on initialization
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('promptpool-contributions')
        return stored ? JSON.parse(stored) : []
      } catch (error) {
        console.error('Error loading contributions from localStorage:', error)
        return []
      }
    }
    return []
  })
  // Referral state
const [referralCode, setReferralCode] = useState('')
const [userReferralCode, setUserReferralCode] = useState('')
const [referralStats, setReferralStats] = useState({
  totalReferrals: 0,
  totalEarnings: 0,
  referralCode: '',
  referredUsers: []
})
const [isReferralApplied, setIsReferralApplied] = useState(false)

// Modal state for Quick Help
const [activeModal, setActiveModal] = useState<string | null>(null)

  // Legacy ethers states (keeping for fallback)
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState<string>('')
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [userStats, setUserStats] = useState<{
    totalSubmissions: string;
    approvedSubmissions: string;
    totalRewards: string;
    reputationScore: string;
    currentTier: number;
    consecutiveApprovals: string;
  } | null>(null)

  // Wagmi hooks
  const { address, isConnected: isWagmiConnected } = usePromptPoolAccount()
  const { data: totalSubmissions } = useTotalSubmissions()
  const { balance: contractBalance } = useContractBalance()
  const { userStats: wagmiUserStats } = useUserStats(address)
  const { estimatedReward } = useRewardEstimate(promptContent.length, category, address)
  const { submitPrompt, isSubmitting, isSuccess, hash, error } = useSubmitPrompt()
  const { getTierName, getTierColor } = useTierInfo()
  
  // Toast notifications with removal functions
  const { addToast, removeToast, removeLoadingToasts } = useToast()
  
  // IPFS configuration
  const ipfsConfig = getIPFSConfig()

  // Legacy ethers wallet connection (keeping as fallback)
  const connectWallet = async () => {
    // Mobile check - if on mobile, try to open MetaMask app directly
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

    if (isMobile && typeof window.ethereum === 'undefined') {
      // Try to open MetaMask mobile app
      const metamaskAppDeepLink = `https://metamask.app.link/dapp/${window.location.href}`
      window.open(metamaskAppDeepLink, '_blank')

      addToast({
        type: 'info',
        title: 'Opening MetaMask App',
        message: 'If MetaMask doesn\'t open automatically, please open the MetaMask app and navigate to Browser tab'
      })
      return
    }

    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        await provider.send("eth_requestAccounts", [])
        const signer = await provider.getSigner()
        const address = await signer.getAddress()
        
        const network = await provider.getNetwork()
        if (network.chainId !== 137n) {
          addToast({
            type: 'error',
            title: 'Wrong Network',
            message: 'Please switch to Polygon network!'
          })
          return
        }

        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
        
        setAccount(address)
        setContract(contractInstance)
        setIsConnected(true)
        
        addToast({
          type: 'success',
          title: 'Wallet Connected!',
          message: `Connected with ${address.slice(0, 6)}...${address.slice(-4)}`
        })
        
        loadUserData(contractInstance, address)
        
      } catch (error) {
        console.error('Error connecting wallet:', error)
        addToast({
          type: 'error',
          title: 'Connection Failed',
          message: 'Error connecting wallet!'
        })
      }
    } else {
      addToast({
        type: 'error',
        title: 'No Wallet Found',
        message: 'Please install MetaMask!'
      })
    }
  }
// Legacy ethers disconnect function
const disconnectWallet = async () => {
  try {
    // Clear the account state
    setAccount('')
    setIsConnected(false)
    
    // Clear any stored connection data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('walletconnect')
      localStorage.removeItem('WEB3_CONNECT_CACHED_PROVIDER')
    }
    
    addToast({
      type: 'success',
      title: 'Wallet Disconnected',
      message: 'Your wallet has been disconnected successfully'
    })
  } catch (error: unknown) {
    console.error('Error disconnecting wallet:', error)
    addToast({
      type: 'error',
      title: 'Disconnect Failed',
      message: error instanceof Error ? error.message : 'Failed to disconnect wallet'
    })
  }
}
  // Legacy user data loading (keeping for ethers fallback)
  const loadUserData = async (contractInstance: ethers.Contract, address: string) => {
    try {
      const stats = await contractInstance.getUserStats(address)
      setUserStats({
        totalSubmissions: stats[0].toString(),
        approvedSubmissions: stats[1].toString(),
        totalRewards: ethers.formatEther(stats[2]),
        reputationScore: stats[3].toString(),
        currentTier: stats[4],
        consecutiveApprovals: stats[6].toString()
      })
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }
// Check URL for referral code on page load
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const refCode = urlParams.get('ref')
  if (refCode) {
    setReferralCode(refCode.toUpperCase())
  }
}, [])

// When user connects, create/get their profile and handle referrals
useEffect(() => {
  const handleUserConnection = async () => {
    if ((isWagmiConnected || isConnected) && (address || account)) {
      const userAddress = address || account
      
      // Create/get user profile
      await ReferralService.createUser(userAddress)
      
      // Load their referral stats
      const stats = await ReferralService.getReferralStats(userAddress)
      if (stats) {
        setReferralStats(stats)
        setUserReferralCode(stats.referralCode)
      }
      
      // If they used a referral code and haven't been referred yet
      if (referralCode && !isReferralApplied) {
        const success = await ReferralService.trackReferral(userAddress, referralCode)
        if (success) {
          setIsReferralApplied(true)
          addToast({
            type: 'success',
            title: 'Referral Applied!',
            message: 'Your referrer will earn 10% of your rewards'
          })
        } else {
          addToast({
            type: 'error',
            title: 'Invalid Referral Code',
            message: 'Please check the referral code and try again'
          })
        }
      }
    }
  }
  
  handleUserConnection()
}, [isWagmiConnected, isConnected, address, account, referralCode, isReferralApplied])

// Copy referral link function
const copyReferralLink = () => {
  const baseUrl = window.location.origin
  const referralLink = `${baseUrl}?ref=${userReferralCode}`
  navigator.clipboard.writeText(referralLink)
  
  addToast({
    type: 'success',
    title: 'Referral Link Copied!',
    message: 'Share this link to earn 10% of your friends\' rewards'
  })
}

// Validate referral code function
const validateReferralCode = async () => {
  if (!referralCode.trim()) return
  
  const user = await ReferralService.getUserByReferralCode(referralCode)
  if (user) {
    addToast({
      type: 'success',
      title: 'Valid Referral Code!',
      message: 'This code will be applied when you connect your wallet'
    })
  } else {
    addToast({
      type: 'error',
      title: 'Invalid Referral Code',
      message: 'Please check the code and try again'
    })
  }
}
  // Fixed prompt submission with proper toast cleanup and contribution tracking
  const handleSubmitPrompt = async () => {
    if (!promptTitle || !promptContent || promptContent.length < 20) {
      addToast({
        type: 'error',
        title: 'Invalid Input',
        message: 'Please fill all fields and ensure prompt is at least 20 characters.'
      })
      return
    }

    if (!isWagmiConnected && !isConnected) {
      addToast({
        type: 'error',
        title: 'Wallet Not Connected',
        message: 'Please connect your wallet first.'
      })
      return
    }

    // Clear any existing loading toasts first
    removeLoadingToasts()

    let ipfsToastId: string | null = null
    let blockchainToastId: string | null = null

    try {
      // Show IPFS uploading toast
      ipfsToastId = addToast({
        type: 'loading',
        title: 'Uploading to IPFS...',
        message: ipfsConfig.isDemo ? 'Using demo mode' : 'Uploading to Pinata'
      })

      // Upload to IPFS
      const ipfsHash = await uploadPromptToIPFS(
        promptTitle,
        promptContent,
        category,
        (address || account) as string
      )

      // Remove IPFS loading toast
      if (ipfsToastId) removeToast(ipfsToastId)

      // Show IPFS success
      addToast({
        type: 'success',
        title: 'IPFS Upload Complete!',
        message: `Hash: ${ipfsHash.slice(0, 20)}...`,
        duration: 3000
      })

      // Add to contributions tracking with localStorage persistence
      const newContribution: UserContribution = {
        id: Date.now().toString(),
        title: promptTitle,
        ipfsHash: ipfsHash,
        category: category,
        submittedAt: Date.now(),
        tier: 0, // Will be determined by contract
        reward: displayEstimatedReward,
        status: 'pending'
      }
      setUserContributions(prev => {
        const updated = [newContribution, ...prev]
        // Also save to localStorage immediately
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('promptpool-contributions', JSON.stringify(updated))
          } catch (error) {
            console.error('Error saving to localStorage:', error)
          }
        }
        return updated
      })

      // Show blockchain submission toast
      blockchainToastId = addToast({
        type: 'loading',
        title: 'Submitting to Blockchain...',
        message: 'Please confirm the transaction'
      })

      if (isWagmiConnected && address) {
        // Use wagmi
        await submitPrompt(ipfsHash, promptTitle, category, promptContent.length)
        // Note: wagmi success/error handling is in useEffect hooks below
      } else if (contract) {
        // Fallback to ethers
        const tx = await contract.submitPrompt(
          ipfsHash,
          promptTitle,
          category,
          promptContent.length
        )
        await tx.wait()
        
        // Remove blockchain loading toast
        if (blockchainToastId) removeToast(blockchainToastId)
        
        // Show success for ethers
        addToast({
          type: 'success',
          title: 'Prompt Submitted! 🎉',
          message: 'Your prompt has been submitted successfully!'
        })
        
        // Clear form
        setPromptTitle('')
        setPromptContent('')
      }

    } catch (error: unknown) {
      console.error('Error submitting prompt:', error)
      
      // Remove any loading toasts
      if (ipfsToastId) removeToast(ipfsToastId)
      if (blockchainToastId) removeToast(blockchainToastId)
      removeLoadingToasts() // Clear any other loading toasts
      
      addToast({
        type: 'error',
        title: 'Submission Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    }
  }

  // Handle successful wagmi submission
  useEffect(() => {
    if (isSuccess && hash) {
      // Remove any loading toasts
      removeLoadingToasts()
      
      addToast({
        type: 'success',
        title: 'Prompt Submitted! 🎉',
        message: 'Your prompt has been submitted successfully!',
        txHash: hash,
        duration: 5000
      })
      
      // Clear form
      setPromptTitle('')
      setPromptContent('')
    }
  }, [isSuccess, hash])

  // Handle submission errors
  useEffect(() => {
    if (error) {
      // Remove any loading toasts
      removeLoadingToasts()
      
      addToast({
        type: 'error',
        title: 'Transaction Failed',
        message: error.message || 'Transaction was rejected'
      })
    }
  }, [error])

  // Save contributions to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && userContributions.length > 0) {
      try {
        localStorage.setItem('promptpool-contributions', JSON.stringify(userContributions))
      } catch (error) {
        console.error('Error saving contributions to localStorage:', error)
      }
    }
  }, [userContributions])

  // Determine which data to display (wagmi first, then ethers fallback)
  const displayUserStats = wagmiUserStats || userStats
  const displayTotalSubmissions = totalSubmissions?.toString() || '0'
  const displayContractBalance = contractBalance || '0'
  const displayEstimatedReward = estimatedReward || '0'
  const displayIsConnected = isWagmiConnected || isConnected
  const displayAccount = address || account

  // Category names helper
  const getCategoryName = (categoryIndex: number) => {
    const categories = ['Creative Writing', 'Technical/Programming', 'Educational', 'Conversational', 'Analytical/Research', 'Other']
    return categories[categoryIndex] || 'Other'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black relative">
      {/* Enhanced Floating Particles */}
      <FloatingParticles />

      {/* Navigation Header */}
      <header className="relative z-50 border-b border-teal-500/20 bg-black/50 backdrop-blur-lg sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* FIXED: Logo with flex-shrink-0 and responsive sizing */}
            <div 
              className="flex items-center space-x-2 cursor-pointer flex-shrink-0"
              onClick={() => setCurrentPage('home')}
            >
              <div className="text-2xl animate-pulse">💧</div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-teal-400 bg-clip-text text-transparent">
                PromptPool
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => setCurrentPage('home')}
                className={`font-medium transition-colors ${currentPage === 'home' ? 'text-teal-400' : 'text-gray-300 hover:text-teal-400'}`}
              >
                Home
              </button>
              <button 
                onClick={() => setCurrentPage('how-it-works')}
                className={`font-medium transition-colors ${currentPage === 'how-it-works' ? 'text-teal-400' : 'text-gray-300 hover:text-teal-400'}`}
              >
                How It Works
              </button>
              <button 
                onClick={() => setCurrentPage('connect')}
                className={`font-medium transition-colors ${currentPage === 'connect' ? 'text-teal-400' : 'text-gray-300 hover:text-teal-400'}`}
              >
                Connect & Contribute
              </button>
              <button 
                onClick={() => setCurrentPage('team')}
                className={`font-medium transition-colors ${currentPage === 'team' ? 'text-teal-400' : 'text-gray-300 hover:text-teal-400'}`}
              >
                Our Team
              </button>
              <button 
                onClick={() => setCurrentPage('contact')}
                className={`font-medium transition-colors ${currentPage === 'contact' ? 'text-teal-400' : 'text-gray-300 hover:text-teal-400'}`}
              >
                Contact
              </button>
            </nav>
            
            {/* FIXED: Enhanced Wallet Connection - Better Mobile Layout */}
<div className="flex items-center space-x-2 lg:space-x-4">
  {/* Desktop/Tablet Wallet Buttons - Better Spacing */}
  <div className="hidden sm:flex items-center space-x-2">
    {/* Legacy ethers connection */}
    {!isConnected ? (
      <button
        onClick={connectWallet}
        className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold py-2 px-4 lg:px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg text-xs lg:text-sm"
      >
        Connect Wallet
      </button>
    ) : (
      <div className="flex items-center space-x-2">
        <div className="text-xs lg:text-sm text-teal-400 font-mono">
          {account.slice(0, 4)}...{account.slice(-4)}
        </div>
        <div className="w-2 h-2 lg:w-3 lg:h-3 bg-green-400 rounded-full animate-pulse"></div>
        <button
          onClick={disconnectWallet}
          className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded-full transition-all duration-200"
        >
          Disconnect
          </button>  
      </div>
    )}
    
    {/* Enhanced wagmi connection */}
    <WagmiConnectButton />
  </div>
  
  {/* Mobile menu button */}
  <button 
    className="md:hidden text-white p-2"
    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
  >
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
    </svg>
  </button>
</div>
          </div>
          
          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-teal-500/20 bg-black/80 backdrop-blur-lg">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {['home', 'how-it-works', 'connect', 'team', 'contact'].map((page) => (
                  <button
                    key={page}
                    onClick={() => {
                      setCurrentPage(page as PageType)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`block px-3 py-2 text-base font-medium transition-colors ${currentPage === page ? 'text-teal-400' : 'text-gray-300 hover:text-teal-400'}`}
                  >
                    {page.charAt(0).toUpperCase() + page.slice(1).replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Page Content */}
      <main className="relative z-10">
        {/* Home Page */}
        {currentPage === 'home' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-teal-200 to-cyan-400 bg-clip-text text-transparent leading-tight">
                Revolutionizing AI Training<br />
                <span className="text-3xl md:text-5xl">Through Crypto Rewards</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
                Submit high-quality prompts and earn POOL tokens instantly. No mining hardware needed - just your creativity and knowledge. Join the world&apos;s first &quot;Proof of Contribution&quot; ecosystem.
              </p>
              
              <button 
                onClick={() => setCurrentPage('connect')}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold py-4 px-8 rounded-full transition-all duration-200 transform hover:scale-105 shadow-xl mb-12"
              >
                Start Contributing 🚀
              </button>
              
              {/* Enhanced Live Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-6 transform hover:scale-105 transition-all duration-200">
                  <div className="text-3xl font-bold text-teal-400 mb-2">{displayTotalSubmissions}</div>
                  <div className="text-sm text-gray-400">Total Prompts</div>
                  <div className="text-xs text-teal-300 mt-1">📈 Live Data</div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-6 transform hover:scale-105 transition-all duration-200">
                  <div className="text-3xl font-bold text-green-400 mb-2">{parseFloat(displayContractBalance).toFixed(0)}</div>
                  <div className="text-sm text-gray-400">POOL Available</div>
                  <div className="text-xs text-green-300 mt-1">💰 Ready to Pay</div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-6 transform hover:scale-105 transition-all duration-200">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">5-100</div>
                  <div className="text-sm text-gray-400">POOL Range</div>
                  <div className="text-xs text-yellow-300 mt-1">🎯 Per Prompt</div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-6 transform hover:scale-105 transition-all duration-200">
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    {ipfsConfig.isDemo ? '🧪' : '🌍'}
                  </div>
                  <div className="text-sm text-gray-400">
                    {ipfsConfig.isDemo ? 'Demo Mode' : 'Production'}
                  </div>
                  <div className="text-xs text-purple-300 mt-1">♻️ IPFS Ready</div>
                </div>
              </div>
            </div>

            {/* Enhanced User Stats */}
            {displayIsConnected && displayUserStats && (
              <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8 mb-16">
                <h3 className="text-2xl font-bold text-white mb-6 text-center">
                  Welcome Back, Contributor! 👋
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-teal-400">{displayUserStats.totalSubmissions}</div>
                    <div className="text-sm text-gray-400">Prompts Submitted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{displayUserStats.approvedSubmissions}</div>
                    <div className="text-sm text-gray-400">Approved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{parseFloat(displayUserStats.totalRewards).toFixed(2)}</div>
                    <div className="text-sm text-gray-400">POOL Earned</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getTierColor(displayUserStats.currentTier)}`}>
                      {getTierName(displayUserStats.currentTier)}
                    </div>
                    <div className="text-sm text-gray-400">Current Tier</div>
                  </div>
                </div>
                
                {/* Connection Status */}
                <div className="mt-6 pt-4 border-t border-slate-600/30">
                  <div className="flex justify-center items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${isWagmiConnected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                      <span className="text-gray-300">Web3Modal: {isWagmiConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                      <span className="text-gray-300">Legacy: {isConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Features Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="bg-slate-800/30 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8 text-center transform hover:scale-105 transition-all duration-300">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-bold text-white mb-4">Instant Rewards</h3>
                <p className="text-gray-400">Bronze and Silver tier prompts get approved and paid automatically within seconds.</p>
              </div>
              <div className="bg-slate-800/30 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8 text-center transform hover:scale-105 transition-all duration-300">
                <div className="text-4xl mb-4">🌐</div>
                <h3 className="text-xl font-bold text-white mb-4">IPFS Storage</h3>
                <p className="text-gray-400">All prompts stored on IPFS for permanent, decentralized access. No single point of failure.</p>
              </div>
              <div className="bg-slate-800/30 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8 text-center transform hover:scale-105 transition-all duration-300">
                <div className="text-4xl mb-4">🔗</div>
                <h3 className="text-xl font-bold text-white mb-4">Multi-Wallet Support</h3>
                <p className="text-gray-400">Connect with MetaMask, WalletConnect, Coinbase Wallet, and more through our Web3Modal integration.</p>
              </div>
            </div>

            {/* Strategic Roadmap Section - Updated */}
<div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8 mb-16">
  <div className="text-center mb-8">
    <h2 className="text-3xl font-bold text-white mb-4">Strategic Roadmap</h2>
    <p className="text-gray-300 max-w-2xl mx-auto">
      Building the world's first AI that <strong className="text-teal-400">pays users to use it</strong> - 
      a community-owned alternative to corporate AI monopolies
    </p>
  </div>

  {/* Timeline with Connected Flow */}
  <div className="relative">
    {/* Connection Line */}
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-0.5 h-96 bg-gradient-to-b from-green-400 via-teal-400 to-purple-400 opacity-30 hidden lg:block"></div>
    
    <div className="space-y-8">
      {/* Phase 1: Foundation - COMPLETE */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-4 lg:space-y-0 lg:space-x-8">
        <div className="lg:w-1/2 lg:text-right">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 relative">
            <div className="absolute -top-3 -right-3 bg-green-500 text-black px-2 py-1 rounded-full text-xs font-bold">
              COMPLETE
            </div>
            <h3 className="text-xl font-bold text-green-400 mb-3">
              🏗️ Phase 1: Foundation
            </h3>
            <div className="text-sm text-gray-300 space-y-2">
              <div>✅ Production DApp on Polygon mainnet</div>
              <div>✅ Smart contract with real POOL rewards</div>
              <div>✅ Secure IPFS storage via Pinata</div>
              <div>✅ Professional UI/UX with mobile support</div>
              <div>✅ Dual wallet integration (Web3Modal + MetaMask)</div>
            </div>
          </div>
        </div>
        
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-black font-bold text-xl">
            1
          </div>
        </div>
        
        <div className="lg:w-1/2">
          <div className="text-center lg:text-left">
            <div className="text-sm text-green-400 font-semibold mb-1">COMPLETED</div>
            <div className="text-gray-300">Solid foundation with real users earning POOL tokens</div>
          </div>
        </div>
      </div>

      {/* Phase 2: Viral Growth - IN PROGRESS */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-4 lg:space-y-0 lg:space-x-8">
        <div className="lg:w-1/2 lg:text-right">
          <div className="text-center lg:text-right">
            <div className="text-sm text-teal-400 font-semibold mb-1">IN PROGRESS</div>
            <div className="text-gray-300">Building viral referral engine for exponential growth</div>
          </div>
        </div>
        
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center text-black font-bold text-xl relative">
            2
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal-400 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <div className="lg:w-1/2">
          <div className="bg-teal-500/10 border border-teal-500/30 rounded-xl p-6 relative">
            <div className="absolute -top-3 -right-3 bg-teal-500 text-black px-2 py-1 rounded-full text-xs font-bold animate-pulse">
              ACTIVE
            </div>
            <h3 className="text-xl font-bold text-teal-400 mb-3">
              📈 Phase 2: Viral Growth
            </h3>
            <div className="text-sm text-gray-300 space-y-2">
              <div>✅ Referral system with 10% rewards</div>
              <div>✅ Comprehensive help system</div>
              <div>🔄 Automated bonus payments</div>
              <div>🎯 User leaderboards & social features</div>
              <div>🎯 Target: 100+ active users, viral coefficient > 1.0</div>
            </div>
          </div>
        </div>
      </div>

      {/* Phase 3: Token Liquidity - NEXT */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-4 lg:space-y-0 lg:space-x-8">
        <div className="lg:w-1/2 lg:text-right">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 relative">
            <div className="absolute -top-3 -right-3 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">
              NEXT
            </div>
            <h3 className="text-xl font-bold text-yellow-400 mb-3">
              💰 Phase 3: Token Market
            </h3>
            <div className="text-sm text-gray-300 space-y-2">
              <div>🎯 POOL/USDC liquidity pool on QuickSwap</div>
              <div>🎯 $10K-25K initial liquidity</div>
              <div>🎯 Token trading & price discovery</div>
              <div>🎯 Staking rewards for long-term holders</div>
              <div>🎯 Enterprise partnerships & token utility</div>
            </div>
          </div>
        </div>
        
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-xl">
            3
          </div>
        </div>
        
        <div className="lg:w-1/2">
          <div className="text-center lg:text-left">
            <div className="text-sm text-yellow-400 font-semibold mb-1">4-6 WEEKS</div>
            <div className="text-gray-300">Creating sustainable token economy</div>
          </div>
        </div>
      </div>

      {/* Phase 4: AI Revolution - FUTURE */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-4 lg:space-y-0 lg:space-x-8">
        <div className="lg:w-1/2 lg:text-right">
          <div className="text-center lg:text-right">
            <div className="text-sm text-purple-400 font-semibold mb-1">REVOLUTIONARY</div>
            <div className="text-gray-300">The first AI that pays users to use it</div>
          </div>
        </div>
        
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-black font-bold text-xl">
            4
          </div>
        </div>
        
        <div className="lg:w-1/2">
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 relative">
            <div className="absolute -top-3 -right-3 bg-purple-500 text-black px-2 py-1 rounded-full text-xs font-bold">
              VISION
            </div>
            <h3 className="text-xl font-bold text-purple-400 mb-3">
              🤖 Phase 4: AI Revolution
            </h3>
            <div className="text-sm text-gray-300 space-y-2">
              <div>🎯 Train custom LLM with collected prompts</div>
              <div>🎯 AI that rewards users for conversations</div>
              <div>🎯 Community-owned AI vs corporate monopolies</div>
              <div>🎯 Global disruption of AI market</div>
              <div>🎯 <strong className="text-purple-400">World's first profitable AI for users</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Bottom Vision Statement */}
  <div className="mt-12 text-center">
    <div className="bg-gradient-to-r from-teal-500/10 to-purple-500/10 border border-teal-500/20 rounded-xl p-6">
      <h4 className="text-lg font-bold text-white mb-2">
        💡 The Big Picture
      </h4>
      <p className="text-gray-300 max-w-3xl mx-auto">
        While others charge $20/month for AI, we're building the first AI that <strong className="text-teal-400">pays users</strong> to use it. 
        Community ownership, transparent development, and sustainable token economics - 
        this is the future of AI.
      </p>
    </div>
  </div>
</div>
          </div>
        )}

        {/* How It Works Page */}
        {currentPage === 'how-it-works' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-teal-400 bg-clip-text text-transparent">
                How PromptPool Works
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Learn how our revolutionary &quot;Proof of Contribution&quot; system rewards quality over computational power
              </p>
            </div>

            {/* Process Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              <div className="text-center">
                <div className="bg-teal-500 text-black w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
                <h3 className="text-xl font-bold text-white mb-3">Connect Wallet</h3>
                <p className="text-gray-400">Connect your crypto wallet using Web3Modal or MetaMask. Choose from multiple wallet options including WalletConnect and Coinbase Wallet.</p>
              </div>
              <div className="text-center">
                <div className="bg-teal-500 text-black w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
                <h3 className="text-xl font-bold text-white mb-3">Create Prompts</h3>
                <p className="text-gray-400">Write high-quality prompts for AI training. Your content is automatically uploaded to IPFS for permanent, decentralized storage.</p>
              </div>
              <div className="text-center">
                <div className="bg-teal-500 text-black w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
                <h3 className="text-xl font-bold text-white mb-3">AI Evaluation</h3>
                <p className="text-gray-400">Our advanced algorithms assess quality, originality, and training value to determine your reward tier and POOL token amount.</p>
              </div>
              <div className="text-center">
                <div className="bg-teal-500 text-black w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">4</div>
                <h3 className="text-xl font-bold text-white mb-3">Earn Rewards</h3>
                <p className="text-gray-400">Receive POOL tokens instantly for Bronze/Silver tiers, or after expert review for Gold/Platinum tiers. All transactions are transparent on-chain.</p>
              </div>
            </div>

            {/* Technical Overview */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8 mb-16">
              <h2 className="text-3xl font-bold text-center text-white mb-8">Technical Architecture</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-teal-400">🌐 IPFS Integration</h3>
                  <p className="text-gray-300">All prompts are stored on the InterPlanetary File System (IPFS), ensuring permanent, censorship-resistant access. Content is distributed across multiple nodes globally.</p>
                  
                  <h3 className="text-xl font-bold text-teal-400">⛓️ Smart Contracts</h3>
                  <p className="text-gray-300">Built on Polygon for fast, low-cost transactions. Smart contracts automatically handle quality scoring, tier determination, and instant reward distribution.</p>
                </div>
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-teal-400">🧠 Quality Scoring</h3>
                  <p className="text-gray-300">Multi-factor algorithm considers prompt length, complexity, originality, user reputation, and category-specific criteria to ensure fair evaluation.</p>
                  
                  <h3 className="text-xl font-bold text-teal-400">🔗 Multi-Wallet Support</h3>
                  <p className="text-gray-300">Web3Modal integration provides seamless connection to 300+ wallets including MetaMask, WalletConnect, Coinbase Wallet, and hardware wallets.</p>
                </div>
              </div>
            </div>

            {/* Reward Tiers */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8">
              <h2 className="text-3xl font-bold text-center text-white mb-8">Reward Structure</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-orange-400 mb-2">🥉 Bronze</h3>
                  <div className="text-2xl font-bold text-white mb-2">5-10 POOL</div>
                  <p className="text-sm text-gray-300">Instant approval for basic quality prompts. Perfect for getting started and building reputation.</p>
                  <div className="mt-4 text-xs text-orange-300">
                    • Automatic approval<br/>
                    • Instant payment<br/>
                    • No review required
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-400/20 to-gray-300/20 border border-gray-400/30 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-300 mb-2">🥈 Silver</h3>
                  <div className="text-2xl font-bold text-white mb-2">15-25 POOL</div>
                  <p className="text-sm text-gray-300">Instant approval for good quality prompts. Higher rewards for better content.</p>
                  <div className="mt-4 text-xs text-gray-300">
                    • Automatic approval<br/>
                    • Instant payment<br/>
                    • Quality threshold required
                  </div>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-400/20 border border-yellow-500/30 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-yellow-400 mb-2">🥇 Gold</h3>
                  <div className="text-2xl font-bold text-white mb-2">30-50 POOL</div>
                  <p className="text-sm text-gray-300">Moderator review for high-quality prompts with significant training value.</p>
                  <div className="mt-4 text-xs text-yellow-300">
                    • Manual review<br/>
                    • 24-48h approval<br/>
                    • Expert evaluation
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-400/20 border border-purple-500/30 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-purple-400 mb-2">💎 Platinum</h3>
                  <div className="text-2xl font-bold text-white mb-2">75-100 POOL</div>
                  <p className="text-sm text-gray-300">Expert review for exceptional prompts that advance AI capabilities.</p>
                  <div className="mt-4 text-xs text-purple-300">
                    • Expert panel review<br/>
                    • 2-7 day approval<br/>
                    • Highest quality only
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Connect & Contribute Page */}
        {currentPage === 'connect' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-teal-400 bg-clip-text text-transparent">
                Connect & Contribute
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Start earning POOL tokens by contributing valuable prompts with IPFS storage and instant blockchain rewards
              </p>
            </div>

        {/* POL Gas Faucet Callout */}
<div className="mb-12">
  <div className="bg-gradient-to-r from-teal-500/10 via-cyan-400/10 to-blue-500/10 border border-teal-400/30 rounded-xl p-6 backdrop-blur-sm">
    <div className="flex items-center justify-center space-x-3 mb-4">
      <div className="text-3xl">⛽</div>
      <h3 className="text-xl font-bold text-teal-400">Need Gas for Transactions?</h3>
    </div>
    <p className="text-center text-gray-300 mb-4">
      New to Polygon? Get free POL tokens for gas fees and start your PromptPool journey immediately!
    </p>
    <div className="flex justify-center">
      <a
        href="https://faucet.polygon.technology/"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
      >
        <span>🚰</span>
        <span>Get Free POL Tokens</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
    <div className="mt-4 text-center">
      <p className="text-sm text-gray-400">
        💡 <strong>Tip:</strong> You only need a small amount (~$0.01) for multiple transactions on Polygon!
      </p>
    </div>
  </div>
</div>

{/* Help & Tips Section */}
<div className="mb-12">
  <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8">
    <h3 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center">
      <span className="mr-3">💡</span>
      Quick Help & Tips
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <button 
        onClick={() => setActiveModal('prompts')}
        className="bg-green-500/10 border border-green-400/30 rounded-lg p-4 text-left hover:bg-green-500/20 transition-colors"
      >
        <div className="flex items-center mb-2">
          <span className="text-2xl mr-3">📝</span>
          <h4 className="text-green-400 font-semibold">What makes a good prompt?</h4>
        </div>
        <p className="text-sm text-gray-300">Learn how to write high-quality prompts that earn more POOL tokens</p>
      </button>
      
      <button 
        onClick={() => setActiveModal('rewards')}
        className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4 text-left hover:bg-yellow-500/20 transition-colors"
      >
        <div className="flex items-center mb-2">
          <span className="text-2xl mr-3">💰</span>
          <h4 className="text-yellow-400 font-semibold">How do rewards work?</h4>
        </div>
        <p className="text-sm text-gray-300">Understand the tier system and how to maximize your earnings</p>
      </button>
      
      <button 
        onClick={() => setActiveModal('wallet')}
        className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4 text-left hover:bg-blue-500/20 transition-colors"
      >
        <div className="flex items-center mb-2">
          <span className="text-2xl mr-3">🔗</span>
          <h4 className="text-blue-400 font-semibold">How to connect wallet?</h4>
        </div>
        <p className="text-sm text-gray-300">Step-by-step guide for connecting MetaMask and other wallets</p>
      </button>
      
      <button 
        onClick={() => setActiveModal('ipfs')}
        className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-4 text-left hover:bg-purple-500/20 transition-colors"
      >
        <div className="flex items-center mb-2">
          <span className="text-2xl mr-3">🌐</span>
          <h4 className="text-purple-400 font-semibold">What is IPFS storage?</h4>
        </div>
        <p className="text-sm text-gray-300">Learn about permanent, decentralized storage for your prompts</p>
      </button>
    </div>
  </div>
</div>

{/* Referral Code Input - Shows when user is NOT connected */}
{!displayIsConnected && (
  <div className="mb-8">
    <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-6">
      <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center">
        <span className="mr-2">🎁</span>
        Have a Referral Code?
      </h3>
      <p className="text-gray-300 mb-4 text-sm">
        Enter a friend's referral code and they'll earn 10% of your POOL rewards!
      </p>
      <div className="flex space-x-3">
        <input
          type="text"
          placeholder="Enter referral code (optional)"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
          className="flex-1 px-4 py-3 bg-slate-700/50 border border-blue-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
        />
        <button 
          onClick={validateReferralCode}
          disabled={!referralCode.trim()}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors"
        >
          Validate
        </button>
      </div>
    </div>
  </div>
)}
{!displayIsConnected && (
  <div className="mb-8">
    <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-6">
      <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center">
        <span className="mr-2">🎁</span>
        Have a Referral Code?
      </h3>
      <p className="text-gray-300 mb-4 text-sm">
        Enter a friend's referral code and they'll earn 10% of your POOL rewards!
      </p>
      <div className="flex space-x-3">
        <input
          type="text"
          placeholder="Enter referral code (optional)"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
          className="flex-1 px-4 py-3 bg-slate-700/50 border border-blue-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
        />
        <button 
          onClick={validateReferralCode}
          disabled={!referralCode.trim()}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors"
        >
          Validate
        </button>
      </div>
    </div>
  </div>
)}
            {!displayIsConnected ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-6">🔗</div>
                <h3 className="text-3xl font-bold text-white mb-6">Connect Your Wallet</h3>
                <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                  Connect your wallet to start earning POOL tokens. Choose from multiple wallet options with our enhanced Web3Modal integration.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button
                    onClick={connectWallet}
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold py-4 px-8 rounded-full transition-all duration-200 transform hover:scale-105 shadow-xl"
                  >
                    Connect with MetaMask 🦊
                  </button>
                  <span className="text-gray-500">or</span>
                  <WagmiConnectButton />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Enhanced Submit Prompt */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <span className="mr-3">✨</span>
                    Submit New Prompt
                  </h3>
                  
                  {/* IPFS Status */}
                  <div className={`mb-6 p-3 rounded-lg border ${ipfsConfig.isDemo ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                    <div className="flex items-center space-x-2">
                      <div className="text-lg">{ipfsConfig.isDemo ? '🧪' : '🌐'}</div>
                      <div className="text-sm">
                        <div className="font-semibold">{ipfsConfig.isDemo ? 'Demo Mode' : 'Production IPFS'}</div>
                        <div className="text-xs opacity-75">
                          {ipfsConfig.isDemo ? 'Using simulated IPFS for testing' : 'Connected to Pinata IPFS'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-teal-400 mb-2">
                        Prompt Title
                      </label>
                      <input
                        type="text"
                        value={promptTitle}
                        onChange={(e) => setPromptTitle(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-teal-500 focus:outline-none transition-colors"
                        placeholder="Enter a descriptive title..."
                        maxLength={100}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-teal-400 mb-2">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(parseInt(e.target.value))}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-teal-500 focus:outline-none transition-colors"
                      >
                        <option value={0}>Creative Writing</option>
                        <option value={1}>Technical/Programming</option>
                        <option value={2}>Educational</option>
                        <option value={3}>Conversational</option>
                        <option value={4}>Analytical/Research</option>
                        <option value={5}>Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-teal-400 mb-2">
                        Prompt Content
                      </label>
                      <textarea
                        value={promptContent}
                        onChange={(e) => setPromptContent(e.target.value)}
                        className="w-full h-40 bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-teal-500 focus:outline-none resize-none transition-colors"
                        placeholder="Write your detailed prompt here... (minimum 20 characters)"
                        maxLength={2000}
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{promptContent.length}/2000</span>
                        <span className={promptContent.length >= 20 ? 'text-green-400' : 'text-red-400'}>
                          {promptContent.length >= 20 ? '✓ Valid length' : `Need ${20 - promptContent.length} more characters`}
                        </span>
                      </div>
                    </div>
                    
                    {promptContent.length >= 20 && (
                      <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4">
                        <div className="text-sm text-teal-400">
                          Estimated Reward: <span className="font-bold text-lg">{parseFloat(displayEstimatedReward).toFixed(2)} POOL</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Will be stored on IPFS permanently
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={handleSubmitPrompt}
                      disabled={!promptTitle || promptContent.length < 20 || isSubmitting}
                      className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? '⏳ Processing...' : '🚀 Submit to IPFS & Blockchain'}
                    </button>
                  </div>
                </div>

                {/* Enhanced User Dashboard with Collapsible Contributions */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <span className="mr-3">📊</span>
                    Your Dashboard
                  </h3>
                  
                  {displayUserStats ? (
                    <div className="space-y-6">
                      {/* Existing Stats Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-teal-400">{displayUserStats.totalSubmissions}</div>
                          <div className="text-sm text-gray-400">Submitted</div>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-green-400">{displayUserStats.approvedSubmissions}</div>
                          <div className="text-sm text-gray-400">Approved</div>
                        </div>
                      </div>
                      
                      {/* Existing Total Earned */}
                      <div className="bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-500/30 rounded-lg p-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-white mb-2">
                            {parseFloat(displayUserStats.totalRewards).toFixed(2)} POOL
                          </div>
                          <div className="text-sm text-gray-300">Total Earned</div>
                        </div>
                      </div>
                      
                      {/* Existing Stats Details */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Current Tier:</span>
                          <span className={`font-bold ${getTierColor(displayUserStats.currentTier)}`}>
                            {getTierName(displayUserStats.currentTier)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Reputation:</span>
                          <span className="text-white font-semibold">{displayUserStats.reputationScore}/1000</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Connection:</span>
                          <span className="text-teal-400 font-semibold">
                            {isWagmiConnected ? 'Web3Modal' : 'Legacy'}
                          </span>
                        </div>
                      </div>

                      {/* NEW: Collapsible Contributions Section */}
                      <div className="border-t border-slate-600/30 pt-6">
                        <button
                          onClick={() => setShowContributions(!showContributions)}
                          className="w-full flex items-center justify-between text-left hover:bg-slate-700/30 rounded-lg p-3 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">📝</span>
                            <div>
                              <h4 className="text-lg font-semibold text-white">My Contributions</h4>
                              <p className="text-sm text-gray-400">
                                {userContributions.length} prompts saved permanently
                              </p>
                            </div>
                          </div>
                          <div className={`transform transition-transform ${showContributions ? 'rotate-180' : ''}`}>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>

                        {/* Collapsible Content */}
                        <div className={`mt-4 space-y-3 transition-all duration-300 ${showContributions ? 'opacity-100 max-h-96 overflow-y-auto' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                          {userContributions.length > 0 ? (
                            userContributions.map((contribution) => (
                              <div key={contribution.id} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-semibold text-white text-sm truncate flex-1 mr-2">
                                    {contribution.title}
                                  </h5>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    contribution.status === 'approved' 
                                      ? 'bg-green-500/20 text-green-400' 
                                      : 'bg-yellow-500/20 text-yellow-400'
                                  }`}>
                                    {contribution.status}
                                  </span>
                                </div>
                                
                                <div className="space-y-2 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Category:</span>
                                    <span className="text-gray-300">
                                      {getCategoryName(contribution.category)}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Reward:</span>
                                    <span className="text-teal-400 font-medium">{parseFloat(contribution.reward).toFixed(2)} POOL</span>
                                  </div>
                                  
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Submitted:</span>
                                    <span className="text-gray-300">
                                      {new Date(contribution.submittedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  
                                  <div className="pt-2 border-t border-slate-600/30">
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-400">IPFS:</span>
                                      <div className="flex space-x-2">
                                        <a
                                          href={`https://gateway.pinata.cloud/ipfs/${contribution.ipfsHash}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-teal-400 hover:text-white transition-colors"
                                          title="View on Pinata Gateway"
                                        >
                                          📎 Pinata
                                        </a>
                                        <a
                                          href={`https://ipfs.io/ipfs/${contribution.ipfsHash}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-teal-400 hover:text-white transition-colors"
                                          title="View on IPFS.io Gateway"
                                        >
                                          🌐 IPFS
                                        </a>
                                      </div>
                                    </div>
                                    <div className="mt-1">
                                      <p className="text-gray-500 font-mono text-xs break-all">
                                        {contribution.ipfsHash}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-gray-400">
                              <div className="text-4xl mb-2">📝</div>
                              <p className="text-sm">No contributions yet</p>
                              <p className="text-xs text-gray-500 mt-1">Submit your first prompt to see it here!</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      Submit your first prompt to see stats!
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Referral Dashboard - Shows when user IS connected */}
{displayIsConnected && (
  <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8 mb-8">
    <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
      <span className="mr-3">👥</span>
      Refer Friends & Earn
    </h3>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {/* Your Referral Code */}
      <div className="text-center">
        <h4 className="text-lg font-semibold text-teal-400 mb-3">Your Referral Code</h4>
        <div className="bg-slate-700/50 rounded-lg p-4 mb-3">
          <code className="text-white font-mono text-xl">{userReferralCode}</code>
        </div>
        <button 
          onClick={copyReferralLink}
          className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center mx-auto space-x-2"
        >
          <span>📋</span>
          <span>Copy Link</span>
        </button>
      </div>
      
      {/* Referral Stats */}
      <div className="text-center">
        <h4 className="text-lg font-semibold text-teal-400 mb-3">Friends Referred</h4>
        <div className="text-3xl font-bold text-white mb-2">{referralStats.totalReferrals}</div>
        <div className="text-gray-400 text-sm">People joined through your link</div>
      </div>
      
      <div className="text-center">
        <h4 className="text-lg font-semibold text-teal-400 mb-3">Bonus Earned</h4>
        <div className="text-3xl font-bold text-green-400 mb-2">
          {parseFloat(referralStats.totalEarnings || '0').toFixed(1)} POOL
        </div>
        <div className="text-gray-400 text-sm">10% of friends' rewards</div>
      </div>
    </div>
    
    {/* How it works */}
    <div className="bg-slate-700/30 rounded-lg p-4">
      <h5 className="text-white font-semibold mb-2">💡 How Referrals Work:</h5>
      <ul className="text-gray-300 text-sm space-y-1">
        <li>• Share your referral link with friends</li>
        <li>• When they submit prompts and earn POOL, you get 10% bonus</li>
        <li>• No limit on referrals - the more friends, the more you earn!</li>
        <li>• Bonuses are paid automatically with each prompt submission</li>
      </ul>
    </div>
  </div>
)}
          </div>
        )}

        {/* Team Page */}
        {currentPage === 'team' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-teal-400 bg-clip-text text-transparent">
                Our Team
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Meet the innovators building the future of AI-powered cryptocurrency and decentralized prompt training
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8 text-center transform hover:scale-105 transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  🚀
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Alex Chen</h3>
                <p className="text-teal-400 mb-3">Founder & CEO</p>
                <p className="text-gray-400 text-sm mb-4">
                  Former AI researcher with 8+ years in machine learning and blockchain. Previously led ML teams at Google and OpenAI. Passionate about democratizing AI development through crypto incentives.
                </p>
                <div className="flex justify-center space-x-3">
                  <a href="#" className="text-teal-400 hover:text-white transition-colors">LinkedIn</a>
                  <a href="#" className="text-teal-400 hover:text-white transition-colors">Twitter</a>
                </div>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8 text-center transform hover:scale-105 transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  ⚡
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Sarah Martinez</h3>
                <p className="text-purple-400 mb-3">CTO & Blockchain Lead</p>
                <p className="text-gray-400 text-sm mb-4">
                  Blockchain architect with experience building DeFi protocols handling $100M+ TVL. Expert in smart contract security, Web3 infrastructure, and scalable blockchain solutions.
                </p>
                <div className="flex justify-center space-x-3">
                  <a href="#" className="text-purple-400 hover:text-white transition-colors">LinkedIn</a>
                  <a href="#" className="text-purple-400 hover:text-white transition-colors">GitHub</a>
                </div>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8 text-center transform hover:scale-105 transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  🎯
                </div>
                <h3 className="text-xl font-bold text-white mb-2">David Kim</h3>
                <p className="text-yellow-400 mb-3">Head of AI & Research</p>
                <p className="text-gray-400 text-sm mb-4">
                  PhD in Computer Science from Stanford, specializing in NLP and training data optimization for large language models. Published 50+ papers on AI training methodologies.
                </p>
                <div className="flex justify-center space-x-3">
                  <a href="#" className="text-yellow-400 hover:text-white transition-colors">Scholar</a>
                  <a href="#" className="text-yellow-400 hover:text-white transition-colors">Twitter</a>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8 text-center transform hover:scale-105 transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  🎨
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Maria Rodriguez</h3>
                <p className="text-green-400 mb-3">Head of Design</p>
                <p className="text-gray-400 text-sm mb-4">
                  UX/UI designer with 6+ years creating intuitive Web3 experiences. Previously designed for Coinbase and Uniswap. Focuses on making crypto accessible to everyone.
                </p>
                <div className="flex justify-center space-x-3">
                  <a href="#" className="text-green-400 hover:text-white transition-colors">Dribbble</a>
                  <a href="#" className="text-green-400 hover:text-white transition-colors">Behance</a>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8 text-center transform hover:scale-105 transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  📊
                </div>
                <h3 className="text-xl font-bold text-white mb-2">James Wilson</h3>
                <p className="text-indigo-400 mb-3">Head of Operations</p>
                <p className="text-gray-400 text-sm mb-4">
                  Former Wall Street analyst turned crypto operations expert. Manages tokenomics, community growth, and strategic partnerships. MBA from Wharton.
                </p>
                <div className="flex justify-center space-x-3">
                  <a href="#" className="text-indigo-400 hover:text-white transition-colors">LinkedIn</a>
                  <a href="#" className="text-indigo-400 hover:text-white transition-colors">Medium</a>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8 text-center transform hover:scale-105 transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  🛡️
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Lisa Zhang</h3>
                <p className="text-red-400 mb-3">Security Lead</p>
                <p className="text-gray-400 text-sm mb-4">
                  Cybersecurity expert with focus on blockchain security audits. Former security researcher at Trail of Bits. Ensures platform safety and smart contract integrity.
                </p>
                <div className="flex justify-center space-x-3">
                  <a href="#" className="text-red-400 hover:text-white transition-colors">GitHub</a>
                  <a href="#" className="text-red-400 hover:text-white transition-colors">Security Blog</a>
                </div>
              </div>
            </div>

            {/* Company Mission */}
            <div className="bg-slate-800/30 backdrop-blur-sm border border-teal-500/20 rounded-xl p-12 text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-8">Our Mission</h2>
              <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-8">
                To create a sustainable ecosystem where AI advancement is driven by community participation, 
                ensuring that contributors are fairly rewarded for their valuable input while building more 
                diverse and robust AI training datasets. We believe the future of AI should be built by everyone, for everyone.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                <div className="text-center">
                  <div className="text-4xl mb-4">🌍</div>
                  <h3 className="text-lg font-bold text-white mb-2">Global Impact</h3>
                  <p className="text-gray-400">Making AI development accessible to contributors worldwide</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-4">⚖️</div>
                  <h3 className="text-lg font-bold text-white mb-2">Fair Rewards</h3>
                  <p className="text-gray-400">Transparent, algorithmic reward distribution based on quality</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-4">🔮</div>
                  <h3 className="text-lg font-bold text-white mb-2">Future-Ready</h3>
                  <p className="text-gray-400">Building infrastructure for the next generation of AI</p>
                </div>
              </div>
            </div>

            {/* Join Us Section */}
            <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/30 rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Join Our Team</h2>
              <p className="text-gray-300 mb-6">
                We're always looking for talented individuals who share our vision of democratizing AI development.
              </p>
              <button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold py-3 px-8 rounded-full transition-all duration-200 transform hover:scale-105">
                View Open Positions
              </button>
            </div>
          </div>
        )}

        {/* Contact Page */}
        {currentPage === 'contact' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-teal-400 bg-clip-text text-transparent">
                Contact Us
              </h1>
              <p className="text-xl text-gray-300">
                Get in touch with the PromptPool team. We'd love to hear from you!
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8">
                <h3 className="text-2xl font-bold text-white mb-6">Send Us a Message</h3>
                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-teal-400 mb-2">Name</label>
                    <input
                      type="text"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-teal-500 focus:outline-none transition-colors"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-teal-400 mb-2">Email</label>
                    <input
                      type="email"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-teal-500 focus:outline-none transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-teal-400 mb-2">Subject</label>
                    <select className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-teal-500 focus:outline-none transition-colors">
                      <option value="">Select a topic</option>
                      <option value="general">General Inquiry</option>
                      <option value="technical">Technical Support</option>
                      <option value="business">Business Development</option>
                      <option value="press">Press & Media</option>
                      <option value="bug">Bug Report</option>
                      <option value="feature">Feature Request</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-teal-400 mb-2">Message</label>
                    <textarea
                      className="w-full h-32 bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-teal-500 focus:outline-none resize-none transition-colors"
                      placeholder="Tell us how we can help you..."
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    Send Message 📧
                  </button>
                </form>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8">
                <h3 className="text-2xl font-bold text-white mb-6">Connect With Us</h3>
                <p className="text-gray-400 mb-8">
                  Join our vibrant community and stay updated on the latest developments, announcements, and opportunities.
                </p>
                
                {/* Social Links */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <a href="#" className="bg-slate-700/50 hover:bg-slate-700 rounded-lg p-4 text-center transition-all duration-200 transform hover:scale-105">
                    <div className="text-2xl mb-2">🐦</div>
                    <div className="text-sm text-gray-300">Twitter</div>
                    <div className="text-xs text-gray-500">Latest updates</div>
                  </a>
                  <a href="#" className="bg-slate-700/50 hover:bg-slate-700 rounded-lg p-4 text-center transition-all duration-200 transform hover:scale-105">
                    <div className="text-2xl mb-2">💬</div>
                    <div className="text-sm text-gray-300">Discord</div>
                    <div className="text-xs text-gray-500">Community chat</div>
                  </a>
                  <a href="#" className="bg-slate-700/50 hover:bg-slate-700 rounded-lg p-4 text-center transition-all duration-200 transform hover:scale-105">
                    <div className="text-2xl mb-2">📱</div>
                    <div className="text-sm text-gray-300">Telegram</div>
                    <div className="text-xs text-gray-500">Announcements</div>
                  </a>
                  <a href="#" className="bg-slate-700/50 hover:bg-slate-700 rounded-lg p-4 text-center transition-all duration-200 transform hover:scale-105">
                    <div className="text-2xl mb-2">💻</div>
                    <div className="text-sm text-gray-300">GitHub</div>
                    <div className="text-xs text-gray-500">Open source</div>
                  </a>
                </div>

                {/* Contact Info */}
                <div className="space-y-6">
                  <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-2">📧 Email</h4>
                    <p className="text-sm text-gray-300">hello@promptpool.app</p>
                    <p className="text-xs text-teal-400 mt-1">We respond within 24 hours</p>
                  </div>

                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-2">🏢 Business</h4>
                    <p className="text-sm text-gray-300">partnerships@promptpool.app</p>
                    <p className="text-xs text-purple-400 mt-1">For collaborations & integrations</p>
                  </div>

                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-2">⛓️ Smart Contract</h4>
                    <p className="text-xs text-gray-400 font-mono break-all mb-2">
                      {CONTRACT_ADDRESS}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-green-400">Polygon Mainnet</p>
                      <a 
                        href={`https://polygonscan.com/address/${CONTRACT_ADDRESS}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-400 hover:text-white transition-colors"
                      >
                        View on PolygonScan ↗
                      </a>
                    </div>
                  </div>
                </div>

              
              </div>
            </div>

            {/* Additional Contact Options */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800/30 border border-teal-500/20 rounded-xl p-6 text-center">
                <div className="text-3xl mb-4">🎓</div>
                <h3 className="text-lg font-bold text-white mb-2">Documentation</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Comprehensive guides and API documentation
                </p>
                <a href="#" className="text-teal-400 hover:text-white transition-colors text-sm">
                  Read Docs →
                </a>
              </div>

              <div className="bg-slate-800/30 border border-teal-500/20 rounded-xl p-6 text-center">
                <div className="text-3xl mb-4">🛠️</div>
                <h3 className="text-lg font-bold text-white mb-2">Developer API</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Integrate PromptPool into your applications
                </p>
                <a href="#" className="text-teal-400 hover:text-white transition-colors text-sm">
                  API Reference →
                </a>
              </div>

              <div className="bg-slate-800/30 border border-teal-500/20 rounded-xl p-6 text-center">
                <div className="text-3xl mb-4">💼</div>
                <h3 className="text-lg font-bold text-white mb-2">Careers</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Join our mission to democratize AI development
                </p>
                <a href="#" className="text-teal-400 hover:text-white transition-colors text-sm">
                  View Jobs →
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
  {/* Quick Help Modal */}
      <QuickHelpModal 
        activeModal={activeModal} 
        onClose={() => setActiveModal(null)} 
        ipfsConfig={ipfsConfig}
      />
    </div>
  )
}