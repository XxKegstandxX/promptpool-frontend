'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

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

// Your live contract details
const CONTRACT_ADDRESS = "0x2D6048916FD4017D9348563d442a3476a710D335"

// Contract ABI - simplified for key functions
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

export default function PromptPoolApp() {
  const [currentPage, setCurrentPage] = useState<PageType>('home')
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
  const [totalSubmissions, setTotalSubmissions] = useState<string>('0')
  const [contractBalance, setContractBalance] = useState<string>('0')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Form states
  const [promptTitle, setPromptTitle] = useState('')
  const [promptContent, setPromptContent] = useState('')
  const [category, setCategory] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [estimatedReward, setEstimatedReward] = useState<string>('0')

  // Connect wallet function
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        await provider.send("eth_requestAccounts", [])
        const signer = await provider.getSigner()
        const address = await signer.getAddress()
        
        // Check if we're on Polygon
        const network = await provider.getNetwork()
        if (network.chainId !== 137n) {
          alert('Please switch to Polygon network!')
          return
        }

        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
        
        setAccount(address)
        setContract(contractInstance)
        setIsConnected(true)
        
        // Load user data
        loadUserData(contractInstance, address)
        loadContractData(contractInstance)
        
      } catch (error) {
        console.error('Error connecting wallet:', error)
        alert('Error connecting wallet!')
      }
    } else {
      alert('Please install MetaMask!')
    }
  }

  // Load user statistics
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

  // Load contract statistics
  const loadContractData = async (contractInstance: ethers.Contract) => {
    try {
      const submissions = await contractInstance.getTotalSubmissions()
      const balance = await contractInstance.getContractBalance()
      
      setTotalSubmissions(submissions.toString())
      setContractBalance(ethers.formatEther(balance))
    } catch (error) {
      console.error('Error loading contract data:', error)
    }
  }

  // Estimate reward for current prompt
  const estimateReward = async () => {
    if (!contract || !account || promptContent.length < 20) return
    
    try {
      const result = await contract.getRewardEstimate(promptContent.length, category, account)
      setEstimatedReward(ethers.formatEther(result[1]))
    } catch (error) {
      console.error('Error estimating reward:', error)
    }
  }

  useEffect(() => {
    if (contract && account && promptContent.length >= 20) {
      estimateReward()
    }
  }, [promptContent, category, contract, account, estimateReward])

  // Submit prompt
  const submitPrompt = async () => {
    if (!contract || !promptTitle || !promptContent) return
    
    setIsSubmitting(true)
    
    try {
      // Create fake IPFS hash for now
      const ipfsHash = `Qm${Math.random().toString(36).substring(2, 15)}`
      
      const tx = await contract.submitPrompt(
        ipfsHash,
        promptTitle,
        category,
        promptContent.length
      )
      
      await tx.wait()
      
      alert('Prompt submitted successfully! 🎉')
      
      // Clear form
      setPromptTitle('')
      setPromptContent('')
      
      // Reload data
      loadUserData(contract, account)
      loadContractData(contract)
      
    } catch (error) {
      console.error('Error submitting prompt:', error)
      alert('Error submitting prompt!')
    }
    
    setIsSubmitting(false)
  }

  const getTierName = (tier: number) => {
    const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum']
    return tiers[tier] || 'Bronze'
  }

  const getTierColor = (tier: number) => {
    const colors = ['text-orange-400', 'text-gray-300', 'text-yellow-400', 'text-purple-400']
    return colors[tier] || 'text-orange-400'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black relative">
      {/* Enhanced Floating Particles */}
      <FloatingParticles />

      {/* Navigation Header */}
      <header className="relative z-50 border-b border-teal-500/20 bg-black/50 backdrop-blur-lg sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div 
              className="flex items-center space-x-2 cursor-pointer"
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
            
            {/* Wallet Connection */}
            <div className="flex items-center space-x-4">
              {!isConnected ? (
                <button
                  onClick={connectWallet}
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold py-2 px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Connect Wallet
                </button>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-teal-400 font-mono">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </div>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              )}
              
              {/* Mobile menu button */}
              <button 
                className="md:hidden text-white"
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
              
              {/* Live Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-6 transform hover:scale-105 transition-all duration-200">
                  <div className="text-3xl font-bold text-teal-400 mb-2">{totalSubmissions}</div>
                  <div className="text-sm text-gray-400">Total Prompts</div>
                  <div className="text-xs text-teal-300 mt-1">📈 Live Data</div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-6 transform hover:scale-105 transition-all duration-200">
                  <div className="text-3xl font-bold text-green-400 mb-2">{parseFloat(contractBalance).toFixed(0)}</div>
                  <div className="text-sm text-gray-400">POOL Available</div>
                  <div className="text-xs text-green-300 mt-1">💰 Ready to Pay</div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-6 transform hover:scale-105 transition-all duration-200">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">5-100</div>
                  <div className="text-sm text-gray-400">POOL Range</div>
                  <div className="text-xs text-yellow-300 mt-1">🎯 Per Prompt</div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-6 transform hover:scale-105 transition-all duration-200">
                  <div className="text-3xl font-bold text-purple-400 mb-2">🌍</div>
                  <div className="text-sm text-gray-400">Eco-Friendly</div>
                  <div className="text-xs text-purple-300 mt-1">♻️ Zero Waste</div>
                </div>
              </div>
            </div>

            {/* User Stats (if connected) */}
            {isConnected && userStats && (
              <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8 mb-16">
                <h3 className="text-2xl font-bold text-white mb-6 text-center">
                  Welcome Back, Contributor! 👋
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-teal-400">{userStats.totalSubmissions}</div>
                    <div className="text-sm text-gray-400">Prompts Submitted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{userStats.approvedSubmissions}</div>
                    <div className="text-sm text-gray-400">Approved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{parseFloat(userStats.totalRewards).toFixed(2)}</div>
                    <div className="text-sm text-gray-400">POOL Earned</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getTierColor(userStats.currentTier)}`}>
                      {getTierName(userStats.currentTier)}
                    </div>
                    <div className="text-sm text-gray-400">Current Tier</div>
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
                <div className="text-4xl mb-4">🧠</div>
                <h3 className="text-xl font-bold text-white mb-4">AI-Powered Scoring</h3>
                <p className="text-gray-400">Advanced algorithms evaluate prompt quality, ensuring fair rewards for valuable contributions.</p>
              </div>
              <div className="bg-slate-800/30 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8 text-center transform hover:scale-105 transition-all duration-300">
                <div className="text-4xl mb-4">🌱</div>
                <h3 className="text-xl font-bold text-white mb-4">Eco-Friendly Mining</h3>
                <p className="text-gray-400">No energy-intensive hardware. Contribute with just your creativity and earn crypto sustainably.</p>
              </div>
            </div>

            {/* Roadmap Section */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8 mb-16">
              <h2 className="text-3xl font-bold text-center text-white mb-8">Token Roadmap</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-6">
                  <h4 className="text-lg font-bold text-teal-400 mb-2">Phase 1: Foundation</h4>
                  <p className="text-sm text-gray-300">✅ Launch POOL token, deploy smart contracts, beta testing platform.</p>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
                  <h4 className="text-lg font-bold text-yellow-400 mb-2">Phase 2: Growth</h4>
                  <p className="text-sm text-gray-300">🚧 Scale contributor base, advanced validation, AI partnerships.</p>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6">
                  <h4 className="text-lg font-bold text-purple-400 mb-2">Phase 3: Expansion</h4>
                  <p className="text-sm text-gray-300">📱 Mobile app, governance features, prompt marketplace.</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
                  <h4 className="text-lg font-bold text-blue-400 mb-2">Phase 4: Evolution</h4>
                  <p className="text-sm text-gray-300">🌍 Global partnerships, enterprise solutions, AI integration.</p>
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
                <p className="text-gray-400">Connect your crypto wallet to the PromptPool platform using WalletConnect or MetaMask.</p>
              </div>
              <div className="text-center">
                <div className="bg-teal-500 text-black w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
                <h3 className="text-xl font-bold text-white mb-3">Submit Prompts</h3>
                <p className="text-gray-400">Create high-quality prompts for AI training. Focus on clarity, creativity, and usefulness.</p>
              </div>
              <div className="text-center">
                <div className="bg-teal-500 text-black w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
                <h3 className="text-xl font-bold text-white mb-3">AI Evaluation</h3>
                <p className="text-gray-400">Our algorithms assess quality, originality, and training value to determine your reward tier.</p>
              </div>
              <div className="text-center">
                <div className="bg-teal-500 text-black w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">4</div>
                <h3 className="text-xl font-bold text-white mb-3">Earn Rewards</h3>
                <p className="text-gray-400">Receive POOL tokens instantly for Bronze/Silver tiers, or after review for higher tiers.</p>
              </div>
            </div>

            {/* Reward Tiers */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8">
              <h2 className="text-3xl font-bold text-center text-white mb-8">Reward Structure</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-orange-400 mb-2">🥉 Bronze</h3>
                  <div className="text-2xl font-bold text-white mb-2">5-10 POOL</div>
                  <p className="text-sm text-gray-300">Instant approval for basic quality prompts</p>
                </div>
                <div className="bg-gradient-to-br from-gray-400/20 to-gray-300/20 border border-gray-400/30 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-300 mb-2">🥈 Silver</h3>
                  <div className="text-2xl font-bold text-white mb-2">15-25 POOL</div>
                  <p className="text-sm text-gray-300">Instant approval for good quality prompts</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-400/20 border border-yellow-500/30 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-yellow-400 mb-2">🥇 Gold</h3>
                  <div className="text-2xl font-bold text-white mb-2">30-50 POOL</div>
                  <p className="text-sm text-gray-300">Moderator review for high-quality prompts</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-400/20 border border-purple-500/30 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-purple-400 mb-2">💎 Platinum</h3>
                  <div className="text-2xl font-bold text-white mb-2">75-100 POOL</div>
                  <p className="text-sm text-gray-300">Expert review for exceptional prompts</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Connect & Contribute Page */}
        {currentPage === 'connect' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-teal-400 bg-clip-text text-transparent">
                Connect & Contribute
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Start earning POOL tokens by contributing valuable prompts to our AI training database
              </p>
            </div>

            {!isConnected ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-6">🔗</div>
                <h3 className="text-3xl font-bold text-white mb-6">Connect Your Wallet</h3>
                <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                  Connect your wallet to start earning POOL tokens for your AI prompt contributions.
                </p>
                <button
                  onClick={connectWallet}
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold py-4 px-8 rounded-full transition-all duration-200 transform hover:scale-105 shadow-xl"
                >
                  Connect Wallet 🚀
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Submit Prompt */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <span className="mr-3">✨</span>
                    Submit New Prompt
                  </h3>
                  
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
                          Estimated Reward: <span className="font-bold text-lg">{parseFloat(estimatedReward).toFixed(2)} POOL</span>
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={submitPrompt}
                      disabled={!promptTitle || promptContent.length < 20 || isSubmitting}
                      className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? '⏳ Submitting...' : '🚀 Submit Prompt & Earn POOL'}
                    </button>
                  </div>
                </div>

                {/* User Dashboard */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <span className="mr-3">📊</span>
                    Your Dashboard
                  </h3>
                  
                  {userStats ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-teal-400">{userStats.totalSubmissions}</div>
                          <div className="text-sm text-gray-400">Submitted</div>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-green-400">{userStats.approvedSubmissions}</div>
                          <div className="text-sm text-gray-400">Approved</div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-500/30 rounded-lg p-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-white mb-2">
                            {parseFloat(userStats.totalRewards).toFixed(2)} POOL
                          </div>
                          <div className="text-sm text-gray-300">Total Earned</div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Current Tier:</span>
                          <span className={`font-bold ${getTierColor(userStats.currentTier)}`}>
                            {getTierName(userStats.currentTier)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Reputation:</span>
                          <span className="text-white font-semibold">{userStats.reputationScore}/1000</span>
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
                Meet the innovators building the future of AI-powered cryptocurrency
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8 text-center transform hover:scale-105 transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  🚀
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Alex Chen</h3>
                <p className="text-teal-400 mb-3">Founder & CEO</p>
                <p className="text-gray-400 text-sm">
                  Former AI researcher with 8+ years in machine learning and blockchain. Passionate about democratizing AI development.
                </p>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8 text-center transform hover:scale-105 transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  ⚡
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Sarah Martinez</h3>
                <p className="text-purple-400 mb-3">CTO</p>
                <p className="text-gray-400 text-sm">
                  Blockchain architect with experience building DeFi protocols. Expert in smart contract development.
                </p>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8 text-center transform hover:scale-105 transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  🎯
                </div>
                <h3 className="text-xl font-bold text-white mb-2">David Kim</h3>
                <p className="text-yellow-400 mb-3">Head of AI</p>
                <p className="text-gray-400 text-sm">
                  PhD in Computer Science, specializing in NLP and training data optimization for large language models.
                </p>
              </div>
            </div>

            <div className="bg-slate-800/30 backdrop-blur-sm border border-teal-500/20 rounded-xl p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-8">Our Mission</h2>
              <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                To create a sustainable ecosystem where AI advancement is driven by community participation, 
                ensuring that contributors are fairly rewarded for their valuable input while building more 
                diverse and robust AI training datasets. We believe the future of AI should be built by everyone, for everyone.
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
                Get in touch with the PromptPool team
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
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-teal-500 focus:outline-none"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-teal-400 mb-2">Email</label>
                    <input
                      type="email"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-teal-500 focus:outline-none"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-teal-400 mb-2">Subject</label>
                    <input
                      type="text"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-teal-500 focus:outline-none"
                      placeholder="What's this about?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-teal-400 mb-2">Message</label>
                    <textarea
                      className="w-full h-32 bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-teal-500 focus:outline-none resize-none"
                      placeholder="Tell us how we can help you..."
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    Send Message
                  </button>
                </form>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl p-8">
                <h3 className="text-2xl font-bold text-white mb-6">Join Our Community</h3>
                <p className="text-gray-400 mb-8">
                  Connect with other PromptPool contributors and stay updated on the latest developments
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <a href="#" className="bg-slate-700/50 hover:bg-slate-700 rounded-lg p-4 text-center transition-colors">
                    <div className="text-2xl mb-2">🐦</div>
                    <div className="text-sm text-gray-300">Twitter</div>
                  </a>
                  <a href="#" className="bg-slate-700/50 hover:bg-slate-700 rounded-lg p-4 text-center transition-colors">
                    <div className="text-2xl mb-2">💬</div>
                    <div className="text-sm text-gray-300">Discord</div>
                  </a>
                  <a href="#" className="bg-slate-700/50 hover:bg-slate-700 rounded-lg p-4 text-center transition-colors">
                    <div className="text-2xl mb-2">📱</div>
                    <div className="text-sm text-gray-300">Telegram</div>
                  </a>
                  <a href="#" className="bg-slate-700/50 hover:bg-slate-700 rounded-lg p-4 text-center transition-colors">
                    <div className="text-2xl mb-2">💻</div>
                    <div className="text-sm text-gray-300">GitHub</div>
                  </a>
                </div>

                <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-white mb-2">Contract Address</h4>
                  <p className="text-xs text-gray-400 font-mono break-all">
                    {CONTRACT_ADDRESS}
                  </p>
                  <p className="text-xs text-teal-400 mt-2">Polygon Mainnet</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}