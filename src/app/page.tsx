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
  useTierInfo,
  useUserSubmissions
} from '../hooks/usePromptPool'
import { uploadPromptToIPFS, getIPFSConfig } from '../lib/ipfs'
import { ReferralService } from '../lib/supabase'
import EnhancedAIWithRewards from '../components/EnhancedAIWithRewards'

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
            <h4 className="text-blue-400 font-semibold mb-2">Web3Modal (Recommended)</h4>
            <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
              <li>Click the purple "Connect Wallet" button</li>
              <li>Choose from 300+ supported wallets</li>
              <li>Follow the prompts in your wallet app</li>
              <li>Approve the connection</li>
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
    
    'ai-chat': {
      title: "🤖 Maximizing Your AI Chat Earnings",
      content: (
        <div className="space-y-4">
          <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
            <h4 className="text-green-400 font-semibold mb-2">💡 How to Earn More POOL</h4>
            <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside">
              <li><strong>Longer conversations:</strong> Each message earns 0.15+ POOL tokens</li>
              <li><strong>Quality interactions:</strong> Thoughtful questions and detailed discussions earn more</li>
              <li><strong>Regular usage:</strong> Consistent chatting builds up claimable rewards</li>
              <li><strong>Wait for optimal timing:</strong> Our system tells you when to claim for maximum profit</li>
            </ul>
          </div>

          <div className="bg-teal-500/10 border border-teal-400/30 rounded-lg p-4">
            <h4 className="text-teal-400 font-semibold mb-2">🎯 Real Earning Examples</h4>
            <div className="space-y-3 text-sm">
              <div className="bg-slate-800/50 rounded p-3">
                <p className="text-white font-medium">Short conversation (3 messages):</p>
                <p className="text-gray-300">Earn: ~0.50 POOL | Gas: $0.11 | Profit: ~$0.01</p>
              </div>
              <div className="bg-slate-800/50 rounded p-3">
                <p className="text-white font-medium">Medium conversation (8 messages):</p>
                <p className="text-gray-300">Earn: ~1.5 POOL | Gas: $0.11 | Profit: ~$0.26</p>
              </div>
              <div className="bg-slate-800/50 rounded p-3">
                <p className="text-white font-medium">Long conversation (15+ messages):</p>
                <p className="text-gray-300">Earn: ~3.0+ POOL | Gas: $0.11 | Profit: ~$0.64+</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
            <h4 className="text-blue-400 font-semibold mb-2">🤖 Best Topics for AI Chat</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
              <div>
                <p><strong>Learning & Education:</strong></p>
                <ul className="list-disc list-inside text-xs space-y-1 mt-1">
                  <li>Ask for explanations</li>
                  <li>Request tutorials</li>
                  <li>Discuss concepts</li>
                </ul>
              </div>
              <div>
                <p><strong>Problem Solving:</strong></p>
                <ul className="list-disc list-inside text-xs space-y-1 mt-1">
                  <li>Code debugging help</li>
                  <li>Project planning</li>
                  <li>Creative brainstorming</li>
                </ul>
              </div>
              <div>
                <p><strong>Creative Projects:</strong></p>
                <ul className="list-disc list-inside text-xs space-y-1 mt-1">
                  <li>Writing assistance</li>
                  <li>Idea generation</li>
                  <li>Content planning</li>
                </ul>
              </div>
              <div>
                <p><strong>General Discussion:</strong></p>
                <ul className="list-disc list-inside text-xs space-y-1 mt-1">
                  <li>Current events</li>
                  <li>Technology trends</li>
                  <li>Philosophical topics</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <h4 className="text-purple-400 font-semibold mb-2">🎮 Pro Tips</h4>
            <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
              <li>Ask follow-up questions to extend conversations naturally</li>
              <li>Request examples or elaboration when AI gives brief answers</li>
              <li>Chat about topics you're genuinely interested in - it shows!</li>
              <li>Use the AI for real work/learning - you get paid to be productive!</li>
              <li>Check the gas efficiency indicator before claiming rewards</li>
            </ul>
          </div>
        </div>
      )
    },

    'gas-optimization': {
      title: "⚡ Understanding Gas Optimization",
      content: (
        <div className="space-y-4">
          <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4">
            <h4 className="text-yellow-400 font-semibold mb-2">🎯 How Our Smart System Works</h4>
            <p className="text-sm text-gray-300 mb-3">
              Our revolutionary gas optimization system calculates the perfect time to claim your rewards, ensuring you 
              <strong className="text-yellow-400"> always profit</strong> from every transaction.
            </p>
            <div className="bg-slate-800/50 rounded p-3">
              <p className="text-gray-300 text-sm">
                <strong className="text-yellow-400">Formula:</strong> Efficiency = (POOL Earned × Current Price) ÷ Gas Cost
              </p>
            </div>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <h4 className="text-red-400 font-semibold mb-2 flex items-center">
              🔴 Low Efficiency (1.0x - 2.5x)
            </h4>
            <p className="text-sm text-gray-300 mb-2">You'll break even but minimal profit</p>
            <div className="bg-slate-800/50 rounded p-3 text-sm">
              <p className="text-red-300">Example: 0.5 POOL earned (~$0.12) vs $0.11 gas = $0.01 profit</p>
              <p className="text-gray-400 mt-1">System suggests: "Chat 3 more messages for better efficiency"</p>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <h4 className="text-yellow-400 font-semibold mb-2 flex items-center">
              🟡 Good Efficiency (2.5x - 4.5x)
            </h4>
            <p className="text-sm text-gray-300 mb-2">Decent profit - you can claim now or wait for optimal</p>
            <div className="bg-slate-800/50 rounded p-3 text-sm">
              <p className="text-yellow-300">Example: 1.2 POOL earned (~$0.30) vs $0.11 gas = $0.19 profit</p>
              <p className="text-gray-400 mt-1">System suggests: "Good time to claim, or chat 2 more for optimal"</p>
            </div>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <h4 className="text-green-400 font-semibold mb-2 flex items-center">
              🟢 Optimal Efficiency (4.5x+)
            </h4>
            <p className="text-sm text-gray-300 mb-2">Maximum profitability - perfect time to claim!</p>
            <div className="bg-slate-800/50 rounded p-3 text-sm">
              <p className="text-green-300">Example: 2.5+ POOL earned (~$0.62+) vs $0.11 gas = $0.51+ profit</p>
              <p className="text-gray-400 mt-1">System suggests: "Optimal time to claim rewards!"</p>
            </div>
          </div>

          <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4">
            <h4 className="text-teal-400 font-semibold mb-2">🔒 Safety Features</h4>
            <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
              <li><strong>Profit guarantee:</strong> System won't let you claim unless you'll profit</li>
              <li><strong>Real-time calculation:</strong> Live efficiency updates as you chat</li>
              <li><strong>Smart suggestions:</strong> Clear guidance on when to claim or keep chatting</li>
              <li><strong>Gas price monitoring:</strong> Adjusts recommendations based on current network fees</li>
              <li><strong>Transparent costs:</strong> Always shows exact gas cost and expected profit</li>
            </ul>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <h4 className="text-purple-400 font-semibold mb-2">💡 Why This Matters</h4>
            <p className="text-sm text-gray-300">
              Traditional crypto apps often let users lose money on transactions. Our system is revolutionary because it 
              <strong className="text-purple-400"> guarantees you always profit</strong>. We've solved the "micro-transaction problem" 
              that has plagued crypto adoption for years!
            </p>
          </div>
        </div>
      )
    },

    'crypto-basics': {
      title: "🎓 Crypto Basics for Complete Beginners",
      content: (
        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
            <h4 className="text-blue-400 font-semibold mb-2">🏦 What is a Crypto Wallet?</h4>
            <p className="text-sm text-gray-300 mb-3">
              Think of a crypto wallet like a digital bank account, but <strong>you</strong> control it completely. 
              No bank, no government, no company can freeze or control your wallet.
            </p>
            <div className="bg-slate-800/50 rounded p-3">
              <p className="text-gray-300 text-sm">
                <strong className="text-blue-400">Your wallet has:</strong> A unique address (like an account number) 
                and private keys (like your password). Never share your private keys with anyone!
              </p>
            </div>
          </div>

          <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
            <h4 className="text-green-400 font-semibold mb-2">🪙 What are Tokens?</h4>
            <p className="text-sm text-gray-300 mb-3">
              Tokens are like digital coins, but each type serves different purposes:
            </p>
            <div className="space-y-2 text-sm">
              <div className="bg-slate-800/50 rounded p-3">
                <p className="text-green-300 font-medium">POOL Tokens (PromptPool's currency):</p>
                <p className="text-gray-300">What you earn for chatting with AI. Can be traded for real money!</p>
              </div>
              <div className="bg-slate-800/50 rounded p-3">
                <p className="text-blue-300 font-medium">POL Tokens (Polygon's gas currency):</p>
                <p className="text-gray-300">Used to pay tiny fees for transactions. Like digital stamps!</p>
              </div>
              <div className="bg-slate-800/50 rounded p-3">
                <p className="text-purple-300 font-medium">Other tokens:</p>
                <p className="text-gray-300">USDC (digital dollars), ETH (Ethereum), BTC (Bitcoin), etc.</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-500/10 border border-orange-400/30 rounded-lg p-4">
            <h4 className="text-orange-400 font-semibold mb-2">⛓️ What is Blockchain?</h4>
            <p className="text-sm text-gray-300 mb-3">
              Imagine a digital ledger that's copied across thousands of computers worldwide. 
              Every transaction is recorded permanently and can't be faked or deleted.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-800/50 rounded p-3">
                <p className="text-orange-300 font-medium">Benefits:</p>
                <ul className="list-disc list-inside text-xs text-gray-300 mt-1">
                  <li>No single point of failure</li>
                  <li>Transparent and auditable</li>
                  <li>Censorship resistant</li>
                  <li>Global and accessible 24/7</li>
                </ul>
              </div>
              <div className="bg-slate-800/50 rounded p-3">
                <p className="text-orange-300 font-medium">Why Polygon?</p>
                <ul className="list-disc list-inside text-xs text-gray-300 mt-1">
                  <li>Super cheap transactions ($0.01-$0.50)</li>
                  <li>Lightning fast (2-3 seconds)</li>
                  <li>Environmentally friendly</li>
                  <li>Same security as Ethereum</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <h4 className="text-purple-400 font-semibold mb-2">🚀 Why is This Revolutionary?</h4>
            <div className="space-y-3 text-sm">
              <div className="bg-slate-800/50 rounded p-3">
                <p className="text-purple-300 font-medium">Traditional System:</p>
                <p className="text-gray-300">Banks control your money → Take fees → Can freeze accounts → Limited hours</p>
              </div>
              <div className="bg-slate-800/50 rounded p-3">
                <p className="text-purple-300 font-medium">Crypto System:</p>
                <p className="text-gray-300">You control your money → Minimal fees → No one can freeze → Always available</p>
              </div>
            </div>
          </div>

          <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4">
            <h4 className="text-teal-400 font-semibold mb-2">🛡️ Safety Tips for Beginners</h4>
            <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
              <li><strong>Never share your seed phrase:</strong> These 12-24 words are the keys to your wallet</li>
              <li><strong>Start small:</strong> Begin with small amounts to learn how everything works</li>
              <li><strong>Double-check addresses:</strong> Always verify wallet addresses before sending</li>
              <li><strong>Use official apps:</strong> Download MetaMask from metamask.io, not random sites</li>
              <li><strong>Keep backups:</strong> Write down your seed phrase and store it safely offline</li>
              <li><strong>Ask questions:</strong> The crypto community is helpful - don't be afraid to ask!</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-teal-500/10 to-purple-500/10 border border-teal-500/20 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">🌟 Your PromptPool Journey</h4>
            <p className="text-sm text-gray-300 mb-2">
              The beautiful thing about PromptPool is you don't need to understand everything right away! 
            </p>
            <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
              <li>Create a wallet (we'll guide you)</li>
              <li>Get free gas tokens (we provide the link)</li>
              <li>Connect and start chatting (earn real money!)</li>
              <li>Learn more as you go (we're here to help)</li>
            </ol>
            <p className="text-sm text-teal-400 mt-3 font-medium">
              Welcome to the future of finance - where users are rewarded, not exploited! 🚀
            </p>
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

type PageType = 'home' | 'how-it-works' | 'connect' | 'pool-ai-chat' | 'team' | 'contact'

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
  // 🔍 Add this debug:
console.log('Total submissions from wagmi:', totalSubmissions?.toString())
  const { balance: contractBalance } = useContractBalance()
  const { userStats: wagmiUserStats } = useUserStats(address)
  const { estimatedReward } = useRewardEstimate(promptContent.length, category, address)
  const { submitPrompt, isSubmitting, isSuccess, hash, error } = useSubmitPrompt()
  const { getTierName, getTierColor } = useTierInfo()
  const { userSubmissions } = useUserSubmissions(address)
  // 🔍 Add these debug logs:
console.log('Debug info:')
console.log('- Address:', address)
console.log('- Total submissions:', totalSubmissions?.toString())
console.log('- User submissions:', userSubmissions)
console.log('- User submissions length:', userSubmissions.length)
  
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
                Getting Started
              </button>
              
              {/* Pool AI Chat Button - SEPARATE */}
              <button 
                onClick={() => setCurrentPage('pool-ai-chat')}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold py-2 px-4 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
              >
                <span>🤖</span>
                <span>Chat & Earn</span>
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
        className="hidden bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold py-2 px-4 lg:px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg text-xs lg:text-sm"
      >
        Connect Wallet
      </button>
    ) : (
      <div className="hidden flex items-center space-x-2">
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
                {['home', 'how-it-works', 'connect', 'pool-ai-chat', 'team', 'contact'].map((page) => (
                  <button
  key={page}
  onClick={() => {
    setCurrentPage(page as PageType)
    setIsMobileMenuOpen(false)
  }}
  className={`block px-3 py-2 text-base font-medium transition-colors flex items-center space-x-2 ${currentPage === page ? 'text-teal-400' : 'text-gray-300 hover:text-teal-400'}`}
>
  {page === 'pool-ai-chat' && <span>🤖</span>}
  <span>
    {page === 'pool-ai-chat' 
      ? 'Pool AI Chat' 
      : page === 'connect'
  ? 'Getting Started'
      : page.charAt(0).toUpperCase() + page.slice(1).replace('-', ' ')
    }
  </span>
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
            {/* Hero Section - UPDATED */}
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-teal-200 to-cyan-400 bg-clip-text text-transparent leading-tight">
                World's First AI That<br />
                <span className="text-3xl md:text-5xl">Pays Users to Chat</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
                Chat with Pool AI and earn POOL tokens for every conversation. No monthly fees, no subscriptions - just get paid to use revolutionary AI. Building a community to get a penny for our thoughts!
              </p>
              
              <button 
                onClick={() => setCurrentPage('pool-ai-chat')}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold py-4 px-8 rounded-full transition-all duration-200 transform hover:scale-105 shadow-xl mb-12"
              >
                Start Chatting & Earning 🤖
              </button>
              
              {/* Enhanced Live Stats - UPDATED */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-6 transform hover:scale-105 transition-all duration-200">
                  <div className="text-3xl font-bold text-teal-400 mb-2">LIVE</div>
                  <div className="text-sm text-gray-400">AI Chat System</div>
                  <div className="text-xs text-teal-300 mt-1">🤖 Llama 3.1 8B</div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-6 transform hover:scale-105 transition-all duration-200">
                  <div className="text-3xl font-bold text-green-400 mb-2">{parseFloat(displayContractBalance).toFixed(0)}</div>
                  <div className="text-sm text-gray-400">POOL Available</div>
                  <div className="text-xs text-green-300 mt-1">💰 Ready to Pay</div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-6 transform hover:scale-105 transition-all duration-200">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">0.5s</div>
                  <div className="text-sm text-gray-400">Response Time</div>
                  <div className="text-xs text-yellow-300 mt-1">⚡ Lightning Fast</div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-6 transform hover:scale-105 transition-all duration-200">
                  <div className="text-3xl font-bold text-purple-400 mb-2">99%</div>
                  <div className="text-sm text-gray-400">Profit Margin</div>
                  <div className="text-xs text-purple-300 mt-1">💎 Users Always Win</div>
                </div>
              </div>
            </div>

            {/* Enhanced User Stats */}
            {displayIsConnected && displayUserStats && (
              <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8 mb-16">
                <h3 className="text-2xl font-bold text-white mb-6 text-center">
                  Welcome Back, AI Pioneer! 👋
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-teal-400">{displayUserStats.totalSubmissions}</div>
                    <div className="text-sm text-gray-400">Total Contributions</div>
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

            {/* Features Section - UPDATED */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="bg-slate-800/30 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8 text-center transform hover:scale-105 transition-all duration-300">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-xl font-bold text-white mb-4">Real AI Chat</h3>
                <p className="text-gray-400">Chat with Llama 3.1 8B and earn POOL tokens for every conversation. Sub-second responses with contextual memory.</p>
              </div>
              <div className="bg-slate-800/30 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8 text-center transform hover:scale-105 transition-all duration-300">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-bold text-white mb-4">Smart Gas Optimization</h3>
                <p className="text-gray-400">Real-time efficiency tracking guides you to optimal claiming windows for maximum profitability.</p>
              </div>
              <div className="bg-slate-800/30 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8 text-center transform hover:scale-105 transition-all duration-300">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-xl font-bold text-white mb-4">Revolutionary Economics</h3>
                <p className="text-gray-400">First AI that pays users instead of charging them. Earn more than you spend on gas - guaranteed profitability.</p>
              </div>
            </div>

            {/* Strategic Roadmap Section - COMPLETELY UPDATED */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8 mb-16">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">Revolutionary Progress</h2>
                <p className="text-gray-300 max-w-2xl mx-auto">
                  From concept to reality: We've successfully built and launched the world's first AI that <strong className="text-teal-400">pays users to chat</strong> - 
                  proving that community-owned AI is the future
                </p>
              </div>

              {/* Timeline with Connected Flow */}
              <div className="relative">
                {/* Connection Line */}
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-0.5 h-96 bg-gradient-to-b from-green-400 via-teal-400 to-purple-400 opacity-30 hidden lg:block"></div>
                
                <div className="space-y-8">
                  {/* Phase 1: AI Foundation - COMPLETED */}
                  <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-4 lg:space-y-0 lg:space-x-8">
                    <div className="lg:w-1/2 lg:text-right">
                      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 relative">
                        <div className="absolute -top-3 -right-3 bg-green-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                          COMPLETED
                        </div>
                        <h3 className="text-xl font-bold text-green-400 mb-3">
                          🤖 Phase 1: AI Foundation
                        </h3>
                        <div className="text-sm text-gray-300 space-y-2">
                          <div>✅ Real Llama 3.1 8B integration via Groq</div>
                          <div>✅ Sub-second AI responses with context</div>
                          <div>✅ Smart gas optimization system</div>
                          <div>✅ Real-time POOL earnings tracking</div>
                          <div>✅ IPFS conversation data collection</div>
                          <div>✅ Enhanced Contract V2 with 25K POOL loaded</div>
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
                        <div className="text-sm text-green-400 font-semibold mb-1">REVOLUTIONARY SUCCESS</div>
                        <div className="text-gray-300">World's first AI that pays users is LIVE and working</div>
                      </div>
                    </div>
                  </div>

                  {/* Phase 2: AI Training Pipeline - IN PROGRESS */}
                  <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-4 lg:space-y-0 lg:space-x-8">
                    <div className="lg:w-1/2 lg:text-right">
                      <div className="text-center lg:text-right">
                        <div className="text-sm text-teal-400 font-semibold mb-1">ACTIVE DEVELOPMENT</div>
                        <div className="text-gray-300">Building custom AI training pipeline with collected conversations</div>
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
                          IN PROGRESS
                        </div>
                        <h3 className="text-xl font-bold text-teal-400 mb-3">
                          🧠 Phase 2: Custom AI Training
                        </h3>
                        <div className="text-sm text-gray-300 space-y-2">
                          <div>✅ Conversation data collection via IPFS</div>
                          <div>🔄 Deploy trainable Llama 3.1 8B instance</div>
                          <div>🔄 Monthly fine-tuning on user conversations</div>
                          <div>🎯 Web search integration</div>
                          <div>🎯 Code artifact generation</div>
                          <div>🎯 Community-owned AI that gets smarter over time</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phase 3: Token Economy - NEXT */}
                  <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-4 lg:space-y-0 lg:space-x-8">
                    <div className="lg:w-1/2 lg:text-right">
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 relative">
                        <div className="absolute -top-3 -right-3 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                          NEXT
                        </div>
                        <h3 className="text-xl font-bold text-yellow-400 mb-3">
                          💰 Phase 3: Token Economy
                        </h3>
                        <div className="text-sm text-gray-300 space-y-2">
                          <div>🎯 POOL/USDC liquidity pool on QuickSwap</div>
                          <div>🎯 Real-time token price discovery</div>
                          <div>🎯 "1/3 Rule" subscription model</div>
                          <div>🎯 Users pay 1/3 of previous month's earnings</div>
                          <div>🎯 Always keep 2/3+ profit guaranteed</div>
                          <div>🎯 Enterprise API access revenue</div>
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
                        <div className="text-sm text-yellow-400 font-semibold mb-1">ECONOMIC REVOLUTION</div>
                        <div className="text-gray-300">Sustainable model where AI serves users, not corporations</div>
                      </div>
                    </div>
                  </div>

                  {/* Phase 4: AI Dominance - VISION */}
                  <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-4 lg:space-y-0 lg:space-x-8">
                    <div className="lg:w-1/2 lg:text-right">
                      <div className="text-center lg:text-right">
                        <div className="text-sm text-purple-400 font-semibold mb-1">THE VISION</div>
                        <div className="text-gray-300">Disrupting the $150B+ AI industry with community ownership</div>
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
                          GLOBAL IMPACT
                        </div>
                        <h3 className="text-xl font-bold text-purple-400 mb-3">
                          🌍 Phase 4: Market Disruption
                        </h3>
                        <div className="text-sm text-gray-300 space-y-2">
                          <div>🎯 Custom AI rivals GPT-4 capabilities</div>
                          <div>🎯 1M+ daily users earning crypto</div>
                          <div>🎯 AI that gets smarter with every conversation</div>
                          <div>🎯 Community governance and ownership</div>
                          <div>🎯 Major exchange listings and partnerships</div>
                          <div>🎯 <strong className="text-purple-400">Proof that AI can serve humanity, not extract from it</strong></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Vision Statement - UPDATED */}
              <div className="mt-12 text-center">
                <div className="bg-gradient-to-r from-teal-500/10 to-purple-500/10 border border-teal-500/20 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-white mb-2">
                    🌊 The Revolution is LIVE
                  </h4>
                  <p className="text-gray-300 max-w-3xl mx-auto">
                    While others charge $20/month for AI, PromptPool has successfully launched the first AI that <strong className="text-teal-400">pays users</strong> to chat with it. 
                    Real users are earning real POOL tokens for real conversations. Community ownership, transparent development, and revolutionary economics - 
                    the future of AI is here.
                  </p>
                  <div className="mt-4 flex justify-center">
                    <button 
                      onClick={() => setCurrentPage('pool-ai-chat')}
                      className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold py-2 px-6 rounded-full transition-all duration-200 transform hover:scale-105"
                    >
                      Experience the Revolution →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* How It Works Page - COMPLETELY REVAMPED */}
        {currentPage === 'how-it-works' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-teal-400 bg-clip-text text-transparent">
                How Pool AI Works
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                The world's first AI that pays users to chat. No subscriptions, no monthly fees - just earn POOL tokens for every conversation.
              </p>
            </div>

            {/* Revolutionary Comparison */}
            <div className="bg-gradient-to-r from-red-500/10 to-green-500/10 border border-teal-500/20 rounded-xl p-8 mb-16">
              <h2 className="text-2xl font-bold text-center text-white mb-8">🔄 The AI Revolution</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center">
                    <span className="mr-2">💸</span>
                    Traditional AI (ChatGPT, Claude)
                  </h3>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-center"><span className="text-red-400 mr-2">❌</span>Pay $20+ per month</li>
                    <li className="flex items-center"><span className="text-red-400 mr-2">❌</span>Corporate ownership</li>
                    <li className="flex items-center"><span className="text-red-400 mr-2">❌</span>Data extraction model</li>
                    <li className="flex items-center"><span className="text-red-400 mr-2">❌</span>Users get nothing back</li>
                    <li className="flex items-center"><span className="text-red-400 mr-2">❌</span>Closed development</li>
                  </ul>
                  <div className="mt-4 p-3 bg-red-500/20 rounded-lg">
                    <p className="text-red-300 text-sm font-semibold">Result: Users lose $240+ per year</p>
                  </div>
                </div>
                
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center">
                    <span className="mr-2">💰</span>
                    PromptPool AI Revolution
                  </h3>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-center"><span className="text-green-400 mr-2">✅</span>Get PAID to chat with AI</li>
                    <li className="flex items-center"><span className="text-green-400 mr-2">✅</span>Community ownership</li>
                    <li className="flex items-center"><span className="text-green-400 mr-2">✅</span>Fair value distribution</li>
                    <li className="flex items-center"><span className="text-green-400 mr-2">✅</span>Users always profit</li>
                    <li className="flex items-center"><span className="text-green-400 mr-2">✅</span>Transparent development</li>
                  </ul>
                  <div className="mt-4 p-3 bg-green-500/20 rounded-lg">
                    <p className="text-green-300 text-sm font-semibold">Result: Users earn $100+ per year</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 4-Step Process - UPDATED */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-center text-white mb-12">🚀 How to Start Earning</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="text-center group">
                  <div className="bg-teal-500 text-black w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 group-hover:scale-110 transition-transform">1</div>
                  <h3 className="text-xl font-bold text-white mb-3">Connect Wallet</h3>
                  <p className="text-gray-400">Connect your crypto wallet using Web3Modal. Supports MetaMask, WalletConnect, Coinbase Wallet, and 300+ others.</p>
                  <div className="mt-4 text-xs text-teal-400">⚡ Takes 30 seconds</div>
                </div>
                
                <div className="text-center group">
                  <div className="bg-teal-500 text-black w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 group-hover:scale-110 transition-transform">2</div>
                  <h3 className="text-xl font-bold text-white mb-3">Chat with Pool AI</h3>
                  <p className="text-gray-400">Start conversations with our Llama 3.1 8B AI. Ask questions, get help, have discussions - every message earns POOL tokens.</p>
                  <div className="mt-4 text-xs text-teal-400">🤖 0.15+ POOL per message</div>
                </div>
                
                <div className="text-center group">
                  <div className="bg-teal-500 text-black w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 group-hover:scale-110 transition-transform">3</div>
                  <h3 className="text-xl font-bold text-white mb-3">Watch Earnings Grow</h3>
                  <p className="text-gray-400">Real-time tracking shows your POOL earnings. Smart gas optimization tells you the perfect time to claim for maximum profit.</p>
                  <div className="mt-4 text-xs text-teal-400">📈 Live optimization</div>
                </div>
                
                <div className="text-center group">
                  <div className="bg-teal-500 text-black w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-xl mx-auto mb-4 group-hover:scale-110 transition-transform">4</div>
                  <h3 className="text-xl font-bold text-white mb-3">Claim When Optimal</h3>
                  <p className="text-gray-400">Smart contract automatically distributes POOL tokens to your wallet. Gas optimization ensures you always profit.</p>
                  <div className="mt-4 text-xs text-teal-400">💰 Always profitable</div>
                </div>
              </div>
            </div>

            {/* Live Demo Section */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8 mb-16">
              <h2 className="text-2xl font-bold text-center text-white mb-8">💡 See It In Action</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-teal-400">🎯 Example Conversation</h3>
                  <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                    <div className="bg-teal-500 text-white rounded-lg p-3 ml-auto max-w-xs">
                      <p className="text-sm">How do I optimize my React app performance?</p>
                      <div className="text-xs opacity-75 mt-1">+0.18 POOL</div>
                    </div>
                    <div className="bg-slate-600 text-gray-200 rounded-lg p-3 mr-auto max-w-sm">
                      <div className="flex items-center mb-2">
                        <span className="text-teal-400 text-sm font-semibold">Pool AI</span>
                      </div>
                      <p className="text-sm">Here are the key React optimization strategies: 1) Use React.memo for components...</p>
                    </div>
                    <div className="bg-teal-500 text-white rounded-lg p-3 ml-auto max-w-xs">
                      <p className="text-sm">Can you explain useMemo vs useCallback?</p>
                      <div className="text-xs opacity-75 mt-1">+0.22 POOL</div>
                    </div>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <p className="text-green-400 font-semibold text-sm">Session Total: 0.65 POOL (~$0.16)</p>
                    <p className="text-gray-300 text-xs mt-1">Gas cost: ~$0.11 | Net profit: +$0.05</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-teal-400">⚡ Smart Gas Optimization</h3>
                  <div className="space-y-4">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-red-400 font-semibold">Low Efficiency</span>
                        <span className="text-red-400">1.2x</span>
                      </div>
                      <p className="text-gray-300 text-sm">Need 3 more messages for decent efficiency</p>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                        <div className="bg-red-400 h-2 rounded-full w-1/4"></div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-yellow-400 font-semibold">Good Efficiency</span>
                        <span className="text-yellow-400">3.5x</span>
                      </div>
                      <p className="text-gray-300 text-sm">You can claim now, or chat 2 more for optimal</p>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                        <div className="bg-yellow-400 h-2 rounded-full w-3/5"></div>
                      </div>
                    </div>
                    
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-green-400 font-semibold">Optimal Efficiency</span>
                        <span className="text-green-400">5.8x</span>
                      </div>
                      <p className="text-gray-300 text-sm">Perfect time to claim! Maximum profitability</p>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                        <div className="bg-green-400 h-2 rounded-full w-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Architecture */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8 mb-16">
              <h2 className="text-3xl font-bold text-center text-white mb-8">🔧 Revolutionary Technology</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-4xl mb-4">🤖</div>
                  <h3 className="text-xl font-bold text-teal-400 mb-3">Real AI Integration</h3>
                  <p className="text-gray-300 mb-4">Powered by Llama 3.1 8B via Groq for sub-second responses. Real contextual conversations, not chatbots.</p>
                  <div className="bg-teal-500/10 rounded-lg p-3">
                    <p className="text-teal-400 text-sm font-semibold">0.5s average response</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl mb-4">⚡</div>
                  <h3 className="text-xl font-bold text-teal-400 mb-3">Smart Gas Optimization</h3>
                  <p className="text-gray-300 mb-4">Real-time efficiency calculations guide optimal claiming windows. Revolutionary gas coverage system.</p>
                  <div className="bg-teal-500/10 rounded-lg p-3">
                    <p className="text-teal-400 text-sm font-semibold">1x to 10x+ efficiency</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl mb-4">🧠</div>
                  <h3 className="text-xl font-bold text-teal-400 mb-3">AI Training Pipeline</h3>
                  <p className="text-gray-300 mb-4">Conversations stored on IPFS for training custom models. Community-owned AI that gets smarter over time.</p>
                  <div className="bg-teal-500/10 rounded-lg p-3">
                    <p className="text-teal-400 text-sm font-semibold">Monthly improvements</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl mb-4">⛓️</div>
                  <h3 className="text-xl font-bold text-teal-400 mb-3">Polygon Blockchain</h3>
                  <p className="text-gray-300 mb-4">Enhanced smart contracts on Polygon for fast, low-cost transactions. Transparent, auditable rewards.</p>
                  <div className="bg-teal-500/10 rounded-lg p-3">
                    <p className="text-teal-400 text-sm font-semibold">~$0.11 gas cost</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl mb-4">🌐</div>
                  <h3 className="text-xl font-bold text-teal-400 mb-3">IPFS Storage</h3>
                  <p className="text-gray-300 mb-4">Conversations permanently stored on IPFS via Pinata. Decentralized, censorship-resistant data.</p>
                  <div className="bg-teal-500/10 rounded-lg p-3">
                    <p className="text-teal-400 text-sm font-semibold">Permanent storage</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl mb-4">💰</div>
                  <h3 className="text-xl font-bold text-teal-400 mb-3">Revolutionary Economics</h3>
                  <p className="text-gray-300 mb-4">1/3 subscription model ensures users always profit. First AI designed to serve users, not extract value.</p>
                  <div className="bg-teal-500/10 rounded-lg p-3">
                    <p className="text-teal-400 text-sm font-semibold">Always profitable</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Economics Deep Dive */}
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-8 mb-16">
              <h2 className="text-2xl font-bold text-center text-white mb-8">💎 The Economics Revolution</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-green-400 mb-4">🎯 How Users Always Win</h3>
                  <div className="space-y-4">
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2">Monthly Earnings:</h4>
                      <p className="text-gray-300 text-sm">Chat with Pool AI → Earn 150-300 POOL tokens</p>
                      <p className="text-green-400 text-sm font-semibold">Value: $30-75+ per month</p>
                    </div>
                    
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2">Subscription Cost:</h4>
                      <p className="text-gray-300 text-sm">Pay 1/3 of what you earned last month</p>
                      <p className="text-green-400 text-sm font-semibold">Cost: $10-25 per month</p>
                    </div>
                    
                    <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                      <h4 className="font-semibold text-green-400 mb-2">Net Result:</h4>
                      <p className="text-white font-semibold">Users keep 2/3+ of earnings</p>
                      <p className="text-green-400 text-sm">Profit: $20-50+ per month</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-green-400 mb-4">📊 Comparison Chart</h3>
                  <div className="space-y-4">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <h4 className="font-semibold text-red-400 mb-2">ChatGPT Plus User:</h4>
                      <p className="text-gray-300 text-sm">Pays $20/month → Uses AI → Ends up -$240/year</p>
                    </div>
                    
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <h4 className="font-semibold text-green-400 mb-2">PromptPool User:</h4>
                      <p className="text-gray-300 text-sm">Chats with AI → Earns POOL → Ends up +$240-600/year</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-teal-500/20 to-green-500/20 border border-teal-500/30 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2">Total Difference:</h4>
                      <p className="text-teal-400 text-lg font-bold">$500-850/year swing in your favor!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Community Ownership */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-8 mb-16">
              <h2 className="text-2xl font-bold text-center text-white mb-8">🌍 Community-Owned AI Future</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl mb-4">🤝</div>
                  <h3 className="text-lg font-bold text-purple-400 mb-2">Community Ownership</h3>
                  <p className="text-gray-300 text-sm">POOL token holders own and govern the AI. No corporate overlords extracting value.</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl mb-4">🔬</div>
                  <h3 className="text-lg font-bold text-purple-400 mb-2">Transparent Development</h3>
                  <p className="text-gray-300 text-sm">All code open source. Community decides features, improvements, and AI training priorities.</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl mb-4">📈</div>
                  <h3 className="text-lg font-bold text-purple-400 mb-2">Gets Smarter Over Time</h3>
                  <p className="text-gray-300 text-sm">Every conversation improves the AI. Monthly training cycles using community conversations.</p>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-6">Ready to Experience the Future?</h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join the revolution. Be part of the first community to prove that AI can serve humanity instead of extracting from it.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={() => setCurrentPage('pool-ai-chat')}
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold py-4 px-8 rounded-full transition-all duration-200 transform hover:scale-105 shadow-xl"
                >
                  Start Earning with Pool AI 🤖
                </button>
                <button
                  onClick={() => setCurrentPage('connect')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-8 rounded-full transition-all duration-200 transform hover:scale-105 shadow-xl"
                >
                  Learn More 📚
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-6">
                No credit card required. Just connect your wallet and start earning.
              </p>
            </div>
          </div>
        )}

        {/* Getting Started / New User Guide Page */}
        {currentPage === 'connect' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-teal-400 bg-clip-text text-transparent">
                Getting Started
              </h1>
              <p className="text-xl text-gray-300 max-w-4xl mx-auto">
                New to crypto? No problem! This guide will walk you through everything you need to know to start earning POOL tokens with our AI chat system.
              </p>
            </div>

            {/* Step-by-Step Process for Beginners */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-center text-white mb-12">🚀 Your Journey to Earning Crypto</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="text-center group">
                  <div className="bg-blue-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 group-hover:scale-110 transition-transform">1</div>
                  <h3 className="text-xl font-bold text-white mb-3">Create Wallet</h3>
                  <p className="text-gray-400">Download MetaMask or use Web3Modal to create your first crypto wallet. Think of it like a digital bank account.</p>
                  <div className="mt-4 text-xs text-blue-400">⏱️ Takes 2 minutes</div>
                </div>
                
                <div className="text-center group">
                  <div className="bg-green-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 group-hover:scale-110 transition-transform">2</div>
                  <h3 className="text-xl font-bold text-white mb-3">Get Gas Tokens</h3>
                  <p className="text-gray-400">Use our free faucet to get POL tokens for "gas fees" - the small cost to process transactions on the blockchain.</p>
                  <div className="mt-4 text-xs text-green-400">💰 Completely free</div>
                </div>
                
                <div className="text-center group">
                  <div className="bg-teal-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 group-hover:scale-110 transition-transform">3</div>
                  <h3 className="text-xl font-bold text-white mb-3">Connect & Chat</h3>
                  <p className="text-gray-400">Connect your wallet to PromptPool and start chatting with our AI. Each conversation earns you POOL tokens automatically.</p>
                  <div className="mt-4 text-xs text-teal-400">🤖 Earn 0.15+ POOL per message</div>
                </div>
                
                <div className="text-center group">
                  <div className="bg-purple-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 group-hover:scale-110 transition-transform">4</div>
                  <h3 className="text-xl font-bold text-white mb-3">Claim Rewards</h3>
                  <p className="text-gray-400">When our smart system shows optimal efficiency, claim your POOL tokens to your wallet. Always profitable!</p>
                  <div className="mt-4 text-xs text-purple-400">📈 Guaranteed profit</div>
                </div>
              </div>
            </div>

            {/* Understanding Gas - NEW SECTION */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-orange-500/20 rounded-xl p-8 mb-12">
              <h2 className="text-2xl font-bold text-center text-white mb-8 flex items-center justify-center">
                <span className="mr-3">⛽</span>
                Understanding Gas Fees (Don't Worry, It's Simple!)
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-orange-400 mb-3 flex items-center">
                      <span className="mr-2">🤔</span>
                      What is Gas?
                    </h3>
                    <p className="text-gray-300 mb-4">
                      Think of gas like a small transaction fee at your bank, but much cheaper! Every time you send crypto or claim rewards, 
                      you pay a tiny amount (usually $0.01-$0.50) to the network that processes your transaction.
                    </p>
                    <div className="bg-slate-700/50 rounded-lg p-3">
                      <p className="text-sm text-gray-400">
                        <strong className="text-orange-400">Real Example:</strong> Claiming 5 POOL tokens (worth ~$1.25) costs about $0.11 in gas. 
                        You profit $1.14! 📈
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center">
                      <span className="mr-2">⚡</span>
                      Why Polygon is Amazing
                    </h3>
                    <ul className="text-gray-300 space-y-2 text-sm">
                      <li className="flex items-center"><span className="text-green-400 mr-2">✅</span>Super low fees (under $0.50 usually)</li>
                      <li className="flex items-center"><span className="text-green-400 mr-2">✅</span>Lightning fast transactions (2-3 seconds)</li>
                      <li className="flex items-center"><span className="text-green-400 mr-2">✅</span>Environmentally friendly</li>
                      <li className="flex items-center"><span className="text-green-400 mr-2">✅</span>Same security as Ethereum</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-green-400 mb-3 flex items-center">
                      <span className="mr-2">💡</span>
                      Pro Tips for Gas Management
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-slate-700/50 rounded-lg p-3">
                        <h4 className="text-white font-semibold text-sm mb-1">1. Start with Free Faucet</h4>
                        <p className="text-gray-400 text-xs">Get free POL tokens below - enough for 10+ transactions!</p>
                      </div>
                      
                      <div className="bg-slate-700/50 rounded-lg p-3">
                        <h4 className="text-white font-semibold text-sm mb-1">2. Consider Adding $5 POL</h4>
                        <p className="text-gray-400 text-xs">For peace of mind, $5 worth of POL tokens = 50+ transactions</p>
                      </div>
                      
                      <div className="bg-slate-700/50 rounded-lg p-3">
                        <h4 className="text-white font-semibold text-sm mb-1">3. Future: Trade POOL for POL</h4>
                        <p className="text-gray-400 text-xs">Soon you'll be able to exchange earned POOL tokens for more POL gas!</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-purple-400 mb-3">🎯 The Bottom Line</h3>
                    <p className="text-gray-300 text-sm">
                      Our smart gas optimization system ensures you <strong className="text-purple-400">always profit</strong> from your transactions. 
                      The system won't let you claim rewards unless you'll make money! 
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* POL Gas Faucet Callout - ENHANCED */}
            <div className="mb-12">
              <div className="bg-gradient-to-r from-teal-500/10 via-cyan-400/10 to-blue-500/10 border border-teal-400/30 rounded-xl p-8 backdrop-blur-sm">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-4">🚰</div>
                  <h3 className="text-2xl font-bold text-teal-400 mb-2">Free POL Gas Faucet</h3>
                  <p className="text-gray-300 max-w-2xl mx-auto">
                    Get free POL tokens for gas fees! Perfect for newcomers to try PromptPool risk-free. 
                    This will give you enough gas for 10+ transactions.
                  </p>
                </div>
                
                <div className="flex justify-center mb-6">
                  <a
                    href="https://faucet.polygon.technology/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold py-4 px-8 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-3"
                  >
                    <span>🚰</span>
                    <span>Get Free POL Tokens</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <div className="text-lg font-bold text-white mb-1">💰 Free Forever</div>
                    <p className="text-sm text-gray-400">No catch - completely free POL tokens from Polygon's official faucet</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <div className="text-lg font-bold text-white mb-1">⚡ Instant</div>
                    <p className="text-sm text-gray-400">Tokens arrive in your wallet within 30 seconds</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <div className="text-lg font-bold text-white mb-1">🔄 Renewable</div>
                    <p className="text-sm text-gray-400">Can request more tokens every 24 hours if needed</p>
                  </div>
                </div>
                
                <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-center text-blue-300 text-sm">
                    <strong>💡 Pro Tip:</strong> After getting free tokens, consider adding $5 worth of POL to your wallet for long-term use. 
                    You can buy POL on any major crypto exchange like Coinbase, Binance, or directly through MetaMask!
                  </p>
                </div>
              </div>
            </div>

            {/* Updated Quick Help & Tips - RELEVANT TO AI CHAT */}
            <div className="mb-12">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8">
                <h3 className="text-2xl font-bold text-white mb-8 text-center flex items-center justify-center">
                  <span className="mr-3">💡</span>
                  Quick Help & Essential Info
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button 
                    onClick={() => setActiveModal('wallet')}
                    className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-6 text-left hover:bg-blue-500/20 transition-colors"
                  >
                    <div className="flex items-center mb-3">
                      <span className="text-3xl mr-4">🔗</span>
                      <h4 className="text-blue-400 font-semibold text-lg">How to connect your wallet?</h4>
                    </div>
                    <p className="text-sm text-gray-300">Complete step-by-step guide for connecting MetaMask, Coinbase Wallet, and 300+ other wallets</p>
                  </button>
                  
                  <button 
                    onClick={() => setActiveModal('ai-chat')}
                    className="bg-green-500/10 border border-green-400/30 rounded-lg p-6 text-left hover:bg-green-500/20 transition-colors"
                  >
                    <div className="flex items-center mb-3">
                      <span className="text-3xl mr-4">🤖</span>
                      <h4 className="text-green-400 font-semibold text-lg">How to maximize AI chat earnings?</h4>
                    </div>
                    <p className="text-sm text-gray-300">Learn how to have profitable conversations and understand gas optimization timing</p>
                  </button>
                  
                  <button 
                    onClick={() => setActiveModal('gas-optimization')}
                    className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-6 text-left hover:bg-yellow-500/20 transition-colors"
                  >
                    <div className="flex items-center mb-3">
                      <span className="text-3xl mr-4">⚡</span>
                      <h4 className="text-yellow-400 font-semibold text-lg">Understanding gas optimization?</h4>
                    </div>
                    <p className="text-sm text-gray-300">Learn how our smart system ensures you always profit from claiming rewards</p>
                  </button>
                  
                  <button 
                    onClick={() => setActiveModal('crypto-basics')}
                    className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-6 text-left hover:bg-purple-500/20 transition-colors"
                  >
                    <div className="flex items-center mb-3">
                      <span className="text-3xl mr-4">🎓</span>
                      <h4 className="text-purple-400 font-semibold text-lg">New to crypto? Start here!</h4>
                    </div>
                    <p className="text-sm text-gray-300">Crypto basics explained simply - wallets, tokens, blockchain, and why it's revolutionary</p>
                  </button>
                </div>
              </div>
            </div>

            {/* Referral Code Input - Shows when user is NOT connected */}
            {!displayIsConnected && (
              <div className="mb-12">
                <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-400/30 rounded-xl p-8">
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-4">🎁</div>
                    <h3 className="text-2xl font-bold text-pink-400 mb-2">Got a Referral Code?</h3>
                    <p className="text-gray-300 max-w-2xl mx-auto">
                      If a friend referred you to PromptPool, enter their code below! They'll earn 10% of all your POOL rewards 
                      (doesn't reduce your earnings - it's a bonus from us).
                    </p>
                  </div>
                  
                  <div className="max-w-md mx-auto">
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                      <input
                        type="text"
                        placeholder="Enter referral code (optional)"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        className="flex-1 px-4 py-3 bg-slate-700/50 border border-pink-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-400 text-center sm:text-left"
                      />
                      <button 
                        onClick={validateReferralCode}
                        disabled={!referralCode.trim()}
                        className="bg-pink-500 hover:bg-pink-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors whitespace-nowrap"
                      >
                        Validate
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-400">
                      Don't have a referral code? No problem! You can still earn POOL tokens and refer friends later.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Wallet Connection Section */}
            {!displayIsConnected ? (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-12">
                <div className="text-center">
                  <div className="text-6xl mb-6">🚀</div>
                  <h3 className="text-3xl font-bold text-white mb-6">Ready to Start Earning?</h3>
                  <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                    Connect your wallet to begin chatting with our AI and earning POOL tokens. Choose from multiple wallet options 
                    with our enhanced Web3Modal integration - we support over 300 different wallets!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <WagmiConnectButton />
                    <button
                      onClick={connectWallet}
                      className="hidden bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-8 rounded-full transition-all duration-200 transform hover:scale-105 shadow-xl"
                    >
                      Connect with MetaMask 🦊
                    </button>
                  </div>
                  <p className="text-sm text-gray-400 mt-6">
                    Don't have a wallet? MetaMask is beginner-friendly and takes 2 minutes to set up!
                  </p>
                </div>
              </div>
            ) : (
              /* Connected User Dashboard - Simple Version */
              <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8">
                <div className="text-center mb-8">
                  <div className="text-4xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold text-white mb-4">Welcome to PromptPool!</h3>
                  <p className="text-gray-300 mb-6">
                    Your wallet is connected and you're ready to start earning POOL tokens. Head over to our AI chat to begin!
                  </p>
                  <button 
                    onClick={() => setCurrentPage('pool-ai-chat')}
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold py-4 px-8 rounded-full transition-all duration-200 transform hover:scale-105 shadow-xl"
                  >
                    Start Chatting & Earning 🤖
                  </button>
                </div>

                {/* Referral Dashboard for Connected Users */}
                {userReferralCode && (
                  <div className="border-t border-slate-600/30 pt-8">
                    <h4 className="text-xl font-bold text-white mb-6 text-center flex items-center justify-center">
                      <span className="mr-3">👥</span>
                      Refer Friends & Earn Bonuses
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="text-center">
                        <h5 className="text-lg font-semibold text-teal-400 mb-3">Your Referral Code</h5>
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
                      
                      <div className="text-center">
                        <h5 className="text-lg font-semibold text-teal-400 mb-3">Friends Referred</h5>
                        <div className="text-3xl font-bold text-white mb-2">{referralStats.totalReferrals}</div>
                        <div className="text-gray-400 text-sm">People joined through your link</div>
                      </div>
                      
                      <div className="text-center">
                        <h5 className="text-lg font-semibold text-teal-400 mb-3">Bonus Earned</h5>
                        <div className="text-3xl font-bold text-green-400 mb-2">
                          {parseFloat(referralStats.totalEarnings || '0').toFixed(1)} POOL
                        </div>
                        <div className="text-gray-400 text-sm">10% of friends' rewards</div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <h6 className="text-white font-semibold mb-2">💡 How Referrals Work:</h6>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• Share your referral link with friends</li>
                        <li>• When they chat with AI and earn POOL, you get 10% bonus</li>
                        <li>• No limit on referrals - the more friends, the more you earn!</li>
                        <li>• Bonuses are paid automatically when they claim rewards</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Team Page - Founder Story Version */}
{currentPage === 'team' && (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div className="text-center mb-16">
      <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-teal-400 bg-clip-text text-transparent">
        The Story Behind PromptPool
      </h1>
      <p className="text-xl text-gray-300 max-w-3xl mx-auto">
        Sometimes the biggest innovations come from the simplest ideas. 
        This is the story of how one person's curiosity led to building the world's first AI that pays users.
      </p>
    </div>

    {/* Founder Story Section */}
    <div className="bg-slate-800/30 backdrop-blur-sm border border-teal-500/20 rounded-xl p-12 mb-16">
      <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-8 lg:space-y-0 lg:space-x-12">
        {/* Founder Photo/Avatar */}
        <div className="flex-shrink-0">
          <div className="w-32 h-32 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-5xl mx-auto">
            👨‍💻
          </div>
          <div className="text-center mt-4">
            <h3 className="text-xl font-bold text-white">The Founder</h3>
            <p className="text-teal-400 text-sm">Just a guy with an idea</p>
          </div>
        </div>

        {/* Story Content */}
        <div className="flex-1 space-y-6">
          <div className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-teal-400 mb-3 flex items-center">
              <span className="mr-2">🎓</span>
              The Background
            </h4>
            <p className="text-gray-300 leading-relaxed">
              I'm just an average person who went to college for electrical engineering and multimedia/web design. 
              After graduation, I worked retail like millions of others, then eventually found my way into being a 
              digital technician for photo and video production, contracting with large companies through my own business. 
              Classic jack-of-all-trades story - you learn what you need to learn to get things done.
            </p>
          </div>

          <div className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center">
              <span className="mr-2">💡</span>
              The Idea
            </h4>
            <p className="text-gray-300 leading-relaxed">
              One day, I was paying my $20/month for ChatGPT and thought: "What if this was backwards? What if instead of 
              paying to use AI, people got paid to help make it better?" It seemed crazy at first, but the more I thought 
              about it, the more it made sense. Why should only big corporations profit from AI when regular people are 
              the ones making it smarter with their questions and feedback?
            </p>
          </div>

          <div className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-purple-400 mb-3 flex items-center">
              <span className="mr-2">🛠️</span>
              The Journey
            </h4>
            <p className="text-gray-300 leading-relaxed">
              I had to learn everything from scratch. Blockchain development, smart contracts, React, TypeScript, 
              crypto economics - none of this was in my original skill set. Spent months watching YouTube tutorials, 
              reading docs, breaking things, and fixing them again. There were definitely moments where I questioned 
              my sanity, but the vision kept me going: building something that puts power back in the hands of regular people.
            </p>
          </div>

          <div className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-green-400 mb-3 flex items-center">
              <span className="mr-2">🚀</span>
              The Reality
            </h4>
            <p className="text-gray-300 leading-relaxed">
              PromptPool isn't just a project - it's proof that anyone with enough determination can build something 
              revolutionary. No fancy degrees required, no venture capital, no team of 50 engineers. Just one person 
              who believed that the future of AI should reward the people who make it possible, not extract value from them.
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Skills & Technologies Learned */}
    <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8 mb-16">
      <h2 className="text-2xl font-bold text-white mb-8 text-center">Technologies Mastered Along the Way</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { name: 'React', emoji: '⚛️', color: 'from-blue-500 to-cyan-500' },
          { name: 'TypeScript', emoji: '📘', color: 'from-blue-600 to-blue-400' },
          { name: 'Solidity', emoji: '🔗', color: 'from-purple-500 to-indigo-500' },
          { name: 'Web3', emoji: '🌐', color: 'from-green-500 to-teal-500' },
          { name: 'Next.js', emoji: '⚡', color: 'from-gray-600 to-gray-400' },
          { name: 'PostgreSQL', emoji: '🐘', color: 'from-indigo-500 to-blue-500' },
          { name: 'IPFS', emoji: '🌍', color: 'from-orange-500 to-red-500' },
          { name: 'Smart Contracts', emoji: '📜', color: 'from-yellow-500 to-orange-500' },
          { name: 'Crypto Economics', emoji: '💰', color: 'from-green-600 to-emerald-500' },
          { name: 'UI/UX Design', emoji: '🎨', color: 'from-pink-500 to-rose-500' },
          { name: 'DevOps', emoji: '🚀', color: 'from-purple-600 to-pink-500' },
          { name: 'Token Economics', emoji: '🪙', color: 'from-amber-500 to-yellow-500' }
        ].map((tech, index) => (
          <div key={index} className="text-center">
            <div className={`w-16 h-16 bg-gradient-to-r ${tech.color} rounded-full flex items-center justify-center text-2xl mx-auto mb-2`}>
              {tech.emoji}
            </div>
            <p className="text-xs text-gray-300">{tech.name}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Future Team Section */}
    <div className="bg-slate-800/30 backdrop-blur-sm border border-teal-500/20 rounded-xl p-12 text-center mb-16">
      <h2 className="text-3xl font-bold text-white mb-8">Building the Team</h2>
      <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-8">
        What started as a solo mission is growing into something bigger. We're looking for passionate individuals 
        who believe in democratizing AI and putting power back in the hands of the people. No fancy credentials 
        required - just curiosity, determination, and a shared vision of a better future.
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
      <h2 className="text-2xl font-bold text-white mb-4">Join Our Mission</h2>
      <p className="text-gray-300 mb-6">
        Ready to be part of something revolutionary? We're looking for people who share our vision of an AI future 
        that rewards contributors, not just corporations. Whether you're a developer, designer, marketer, or just 
        someone with great ideas - we want to hear from you.
      </p>
      <button 
        className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold py-3 px-8 rounded-full transition-all duration-200 transform hover:scale-105"
        onClick={() => window.open('mailto:team@promptpool.app?subject=Interested in Joining PromptPool&body=Hi! I\'m interested in joining the PromptPool team. Here\'s a bit about me and what I can contribute:', '_blank')}
      >
        Get In Touch 🚀
      </button>
      <p className="text-sm text-gray-400 mt-4">
        Click to send us an email, or reach out through any of our social channels
      </p>
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
        {/* Pool AI Chat Page */}
        {currentPage === 'pool-ai-chat' && (
          <div className="min-h-screen">
            <EnhancedAIWithRewards />
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