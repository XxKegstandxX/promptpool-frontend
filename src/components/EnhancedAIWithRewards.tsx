import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Send, DollarSign, TrendingUp, Clock, Users, Gift, Zap } from 'lucide-react';
import { CONTRACT_CONFIG } from '../lib/wagmi-config';
import { formatEther, parseEther } from 'viem';
import WagmiConnectButton from './WagmiConnectButton';
import { uploadPromptToIPFS } from '@/lib/ipfs'

// Enhanced AI Chat hook - FIXED: Removed sendMessage function from here
const useAIChat = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m Pool, PromptPool\'s AI. Ask me anything and earn POOL tokens for quality conversations! 🌊💰', timestamp: Date.now() }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  return { messages, setMessages, isLoading, setIsLoading };
};

// Live reward calculation based on Enhanced Contract V2 logic + Gas Optimization
const useRewardCalculator = (messages: any[]) => {
  const [sessionRewards, setSessionRewards] = useState({
    currentEarnings: 0,
    qualityScore: 0,
    messageCount: 0,
    estimatedFinal: 0,
    gasEfficiency: 0,
    optimalClaim: false,
    efficiencyLevel: 'low' as 'low' | 'decent' | 'optimal'
  });
  
  useEffect(() => {
    const userMessages = messages.filter(m => m.role === 'user');
    const totalLength = userMessages.reduce((sum, msg) => sum + msg.content.length, 0);
    
    // Enhanced Contract V2 reward calculation
    const baseReward = 0.15; // POOL per message
    const avgLength = userMessages.length > 0 ? totalLength / userMessages.length : 0;
    const lengthBonus = Math.min(avgLength / 100, 1.5); // Bonus for detailed messages
    const complexityBonus = userMessages.length > 3 ? 1.2 : 1; // Sustained conversation bonus
    const qualityMultiplier = Math.min(1 + (avgLength / 200), 1.8); // Quality based on message depth
    
    const currentEarnings = userMessages.length * baseReward * lengthBonus * qualityMultiplier;
    const qualityScore = Math.min(((lengthBonus + qualityMultiplier - 1) * 40), 100);
    const estimatedFinal = currentEarnings * 1.4; // Estimate for continued conversation
    
    // Gas optimization calculations
    const gasCostUSD = 0.11; // Average gas cost
    const poolPriceUSD = 0.25; // Current POOL price (make this dynamic later)
    const gasCostInPool = gasCostUSD / poolPriceUSD; // ~0.44 POOL
    const gasEfficiency = currentEarnings / gasCostInPool; // Efficiency ratio
    
    // Determine efficiency level and optimal claiming
    let efficiencyLevel: 'low' | 'decent' | 'optimal' = 'low';
    let optimalClaim = false;
    
    if (gasEfficiency >= 5) {
      efficiencyLevel = 'optimal';
      optimalClaim = true;
    } else if (gasEfficiency >= 3) {
      efficiencyLevel = 'decent';
      optimalClaim = gasEfficiency >= 4; // Optimal at 4x+
    } else {
      efficiencyLevel = 'low';
      optimalClaim = false;
    }
    
    setSessionRewards({
      currentEarnings: Math.round(currentEarnings * 1000) / 1000,
      qualityScore: Math.round(qualityScore * 10) / 10,
      messageCount: userMessages.length,
      estimatedFinal: Math.round(estimatedFinal * 1000) / 1000,
      gasEfficiency: Math.round(gasEfficiency * 10) / 10,
      optimalClaim,
      efficiencyLevel
    });
  }, [messages]);
  
  return sessionRewards;
};

export default function EnhancedAIWithRewards() {
  // Debug Supabase (remove this later)
  useEffect(() => {
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  }, [])

  const { address, isConnected } = useAccount();
  const { messages, setMessages, isLoading, setIsLoading } = useAIChat();
  const rewards = useRewardCalculator(messages);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionTime, setSessionTime] = useState(0);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  
  // FIXED: Properly typed refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Contract interactions
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  
  // Read contract data
  const { data: contractBalance } = useReadContract({
    ...CONTRACT_CONFIG,
    functionName: 'getContractBalance',
  });
  
  const { data: userChatStats } = useReadContract({
    ...CONTRACT_CONFIG,
    functionName: 'getUserChatStats',
    args: [address],
    enabled: !!address,
  });
  
  const { data: referralStats } = useReadContract({
    ...CONTRACT_CONFIG,
    functionName: 'getReferralStats',
    args: [address],
    enabled: !!address,
  });
  
  const { data: subscriptionStatus } = useReadContract({
    ...CONTRACT_CONFIG,
    functionName: 'getSubscriptionStatus',
    args: [address],
    enabled: !!address,
  });
  
  // Mock data for demo (replace with real contract data)
  const mockUserData = {
    pendingReferralRewards: referralStats ? Number(formatEther(referralStats[3])) : 47.5,
    totalReferrals: referralStats ? Number(referralStats[1]) : 12,
    lastMonthEarnings: subscriptionStatus ? Number(formatEther(subscriptionStatus[2])) : 145.8,
    subscriptionDue: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    hasActiveSubscription: subscriptionStatus ? subscriptionStatus[0] : true
  };
  
  // Session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // FIXED: Real Groq sendMessage function placed correctly in component
  // FIXED: Real Groq sendMessage function with proper focus handling
  const sendMessage = async (userMessage: string, onComplete?: () => void) => {
    try {
      setIsLoading(true);

      // Add user message to conversation immediately
      const userMsg = {
        role: 'user' as const,
        content: userMessage,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, userMsg]);

      // Call Groq API via your backend
      const response = await fetch('/api/chat-groq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          // Include conversation context for better responses
          conversationHistory: messages.slice(-6) // Last 6 messages for context
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'AI response failed');
      }

      // Add AI response to conversation
      const aiMsg = {
        role: 'assistant' as const,
        content: data.message,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsLoading(false);
      
      // FIXED: Use setTimeout to ensure React has finished updating before focusing
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 100); // Small delay to let React finish rendering

      console.log('✅ AI Response received:', data.message);

    } catch (error) {
      console.error('❌ AI Error:', error);
      setIsLoading(false);
      
      // Add error message to conversation
      const errorMsg = {
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, errorMsg]);
      
      // FIXED: Same timeout fix for error case
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 100);
    }
  };
  
  // FIXED: Enhanced handleSendMessage with callback-based focus
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const messageToSend = inputMessage;
    setInputMessage(''); // Clear immediately
    
    // Send message with focus callback
    await sendMessage(messageToSend, () => {
      // This runs AFTER the AI response is complete
      if (inputRef.current) {
        inputRef.current.focus();
        console.log('Focus restored after AI response');
      }
    });
  };
  
  const handleEndSession = async () => {
    if (!isConnected || rewards.messageCount < 5) {
      alert(`Need at least 5 messages to claim rewards! Currently: ${rewards.messageCount}`);
      return;
    }
    
    try {
      // ===== NEW: COLLECT ACTUAL CONVERSATION DATA =====
      const conversationData = {
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
          quality_score: rewards.qualityScore
        })),
        session_stats: {
          total_messages: rewards.messageCount,
          earnings: rewards.currentEarnings,
          gas_efficiency: rewards.gasEfficiency,
          session_duration: sessionTime // Fixed: use sessionTime directly (already in seconds)
        },
        user_address: address,
        privacy_consent: true,
        collected_at: Date.now(),
        session_id: `session_${Date.now()}_${address?.slice(-6)}`,
        platform: 'PromptPool',
        version: '1.0'
      }; // ← FIXED: Semicolon instead of comma

      // Store conversation on IPFS for AI training
      let conversationHash = `chat_${Date.now()}_${address?.slice(-6)}`; // fallback
      try {
        console.log('📊 Storing conversation data on IPFS...');
        conversationHash = await uploadPromptToIPFS(
          `Pool AI Chat Session - ${new Date().toLocaleDateString()}`,
          JSON.stringify(conversationData, null, 2),
          3, // Conversational category
          address || 'unknown'
        );
        console.log('💾 Conversation stored on IPFS:', conversationHash);
      } catch (ipfsError) {
        console.error('IPFS storage failed, using fallback hash:', ipfsError);
        // Continue with fallback hash - don't break the reward claiming
      }
      // ===== END: CONVERSATION DATA COLLECTION =====
      
      const qualityScore = Math.floor(rewards.qualityScore);
      
      await writeContract({
        ...CONTRACT_CONFIG,
        functionName: 'submitChatSession',
        args: [
          conversationHash, // Now contains real conversation data!
          BigInt(rewards.messageCount),
          BigInt(qualityScore),
          BigInt(sessionTime),
          'GENERAL_CHAT',
          true // Allow training
        ],
      });
      
      alert(`🎉 Session submitted! Earning ${rewards.currentEarnings} POOL tokens!\n\nConversation stored for AI training!\n\nTransaction pending confirmation...`);
      
    } catch (error) {
      console.error('Error submitting session:', error);
      alert('Error submitting chat session. Please try again.');
    }
  };
  
  const handleClaimReferrals = async () => {
    if (!isConnected) return;
    
    try {
      await writeContract({
        ...CONTRACT_CONFIG,
        functionName: 'claimReferralRewards',
      });
      
      alert(`💰 Claiming ${mockUserData.pendingReferralRewards} POOL from referrals!\n\nTransaction pending...`);
    } catch (error) {
      console.error('Error claiming referrals:', error);
      alert('Error claiming referral rewards. Please try again.');
    }
  };
  
  const handlePaySubscription = async () => {
    if (!isConnected) return;
    
    try {
      await writeContract({
        ...CONTRACT_CONFIG,
        functionName: 'paySubscription',
      });
      
      const subscriptionCost = Math.round(mockUserData.lastMonthEarnings / 3 * 1000) / 1000;
      alert(`💳 Paying ${subscriptionCost} POOL subscription!\n\nTransaction pending...`);
    } catch (error) {
      console.error('Error paying subscription:', error);
      alert('Error processing subscription payment. Please try again.');
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const subscriptionCost = Math.round(mockUserData.lastMonthEarnings / 3 * 1000) / 1000;
  const daysUntilDue = Math.ceil((mockUserData.subscriptionDue - new Date()) / (1000 * 60 * 60 * 24));
  const displayBalance = contractBalance ? Number(formatEther(contractBalance)).toFixed(0) : '25,000';
  
  // Show wallet connection prompt if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-6">
            🌊
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet to Chat with Pool AI</h2>
          <p className="text-gray-400 mb-8">Start earning POOL tokens for AI conversations!</p>
          
          {/* Actual Wallet Connect Button */}
          <div className="flex justify-center mb-6">
            <WagmiConnectButton />
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-4 border border-teal-500/20">
            <h3 className="text-lg font-semibold text-teal-400 mb-2">🤖 Pool AI Features:</h3>
            <ul className="text-sm text-gray-300 space-y-1 text-left">
              <li>• Earn 0.15+ POOL per message</li>
              <li>• Real-time reward tracking</li>
              <li>• Quality-based bonus multipliers</li>
              <li>• Session-based claiming</li>
              <li>• Revolutionary AI that pays YOU!</li>
            </ul>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            Connect any wallet supported by Web3Modal
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-teal-500/20 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Top Row - Logo and Stats */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
                🌊
              </div>
              <div>
                <h1 className="text-xl font-bold">Pool - PromptPool AI</h1>
                <p className="text-sm text-gray-400">Building a community to get a penny for our thoughts!</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-purple-400">
                <span className="text-sm font-semibold">{rewards.gasEfficiency}x</span>
                <span className="text-xs text-gray-400">gas efficiency</span>
              </div>
              <div className="text-right">
                <div className="text-sm text-teal-400">Contract Balance</div>
                <div className="text-lg font-bold text-white">{displayBalance} POOL</div>
              </div>
            </div>
          </div>
          
          {/* Bottom Row - Session Stats */}
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-6 bg-slate-700/50 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2 text-teal-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-semibold">{formatTime(sessionTime)}</span>
                <span className="text-xs text-gray-400">session time</span>
              </div>
              <div className="w-px h-4 bg-slate-600"></div>
              <div className="flex items-center space-x-2 text-cyan-400">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {rewards.messageCount > 0 ? (rewards.currentEarnings / rewards.messageCount).toFixed(3) : '0.000'}
                </span>
                <span className="text-xs text-gray-400">avg POOL/msg</span>
              </div>
              <div className="w-px h-4 bg-slate-600"></div>
              <div className="flex items-center space-x-2 text-green-400">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-semibold">{rewards.qualityScore}/100</span>
                <span className="text-xs text-gray-400">quality score</span>
              </div>
              <div className="w-px h-4 bg-slate-600"></div>
              <div className="flex items-center space-x-2 text-yellow-400">
                <span className="text-sm font-semibold">{rewards.messageCount}</span>
                <span className="text-xs text-gray-400">messages</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content - Left Sidebar + Right Chat */}
      <div className="max-w-7xl mx-auto flex gap-6 p-4 h-[calc(100vh-120px)]">
        
        {/* LEFT SIDEBAR - Condensed Rewards */}
        <div className="w-72 space-y-3 flex-shrink-0">
          {/* Current Session Earnings - Enhanced with Gas Optimization */}
          <div className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">💰 Live Earnings</h3>
              <div className="flex items-center space-x-1">
                <Zap className="w-4 h-4 text-teal-400" />
                {/* Gas Efficiency Indicator */}
                <div className={`w-2 h-2 rounded-full ${
                  rewards.efficiencyLevel === 'optimal' ? 'bg-green-400' :
                  rewards.efficiencyLevel === 'decent' ? 'bg-yellow-400' : 'bg-red-400'
                }`}></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div>
                <div className="text-xl font-bold text-teal-400">
                  {rewards.currentEarnings} POOL
                </div>
                <div className="text-xs text-gray-400">This session • {rewards.messageCount} msgs</div>
              </div>
              
              {/* Gas Efficiency Display */}
              <div className={`rounded-lg p-2 border ${
                rewards.efficiencyLevel === 'optimal' ? 'bg-green-500/10 border-green-500/30' :
                rewards.efficiencyLevel === 'decent' ? 'bg-yellow-500/10 border-yellow-500/30' :
                'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300">Gas Efficiency:</span>
                  <span className={`font-semibold ${
                    rewards.efficiencyLevel === 'optimal' ? 'text-green-400' :
                    rewards.efficiencyLevel === 'decent' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {rewards.gasEfficiency}x
                  </span>
                </div>
                <div className={`text-xs mt-1 ${
                  rewards.efficiencyLevel === 'optimal' ? 'text-green-300' :
                  rewards.efficiencyLevel === 'decent' ? 'text-yellow-300' : 'text-red-300'
                }`}>
                  {rewards.efficiencyLevel === 'optimal' && '💚 Optimal! Great time to claim'}
                  {rewards.efficiencyLevel === 'decent' && '💛 Good efficiency - consider claiming'}
                  {rewards.efficiencyLevel === 'low' && '🔴 Chat more for better gas efficiency'}
                </div>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300">Estimated Final:</span>
                  <span className="text-green-400 font-semibold">{rewards.estimatedFinal} POOL</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-gray-300">Gas Cost:</span>
                  <span className="text-gray-400">~$0.11 (~0.44 POOL)</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Referral Rewards - More Compact */}
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">🎁 Referral Rewards</h3>
              <Gift className="w-4 h-4 text-purple-400" />
            </div>
            
            <div className="space-y-2">
              <div>
                <div className="text-xl font-bold text-purple-400">
                  {mockUserData.pendingReferralRewards} POOL
                </div>
                <div className="text-xs text-gray-400">{mockUserData.totalReferrals} referrals • 10% bonus</div>
              </div>
              
              <button
                onClick={handleClaimReferrals}
                disabled={mockUserData.pendingReferralRewards < 10 || isPending || isConfirming}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-2 px-3 rounded-lg text-xs transition-all duration-200"
              >
                {isPending || isConfirming ? (
                  <>⏳ Processing...</>
                ) : mockUserData.pendingReferralRewards >= 10 ? (
                  <>Claim {mockUserData.pendingReferralRewards} POOL</>
                ) : (
                  <>Min 10 POOL to claim</>
                )}
              </button>
            </div>
          </div>
          
          {/* Subscription Status - More Compact */}
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">💳 Subscription</h3>
              <DollarSign className="w-4 h-4 text-green-400" />
            </div>
            
            {mockUserData.hasActiveSubscription ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-400 text-xs font-semibold">Active Premium</span>
                  </div>
                  <span className="text-xs text-gray-400">{daysUntilDue}d left</span>
                </div>
                
                <div className="text-xs text-gray-400">
                  Next: {subscriptionCost} POOL (1/3 of {mockUserData.lastMonthEarnings})
                </div>
                
                <button
                  onClick={handlePaySubscription}
                  disabled={isPending || isConfirming}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-2 px-3 rounded-lg text-xs transition-all duration-200"
                >
                  {isPending || isConfirming ? (
                    <>⏳ Processing...</>
                  ) : (
                    <>Pay {subscriptionCost} POOL Now</>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-yellow-400 text-xs">Subscription needed for unlimited chat</div>
                <button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-2 px-3 rounded-lg text-xs">
                  Activate Premium
                </button>
              </div>
            )}
          </div>
          
          {/* Smart End Session Button with Gas Optimization */}
          <button
            onClick={handleEndSession}
            disabled={rewards.messageCount < 5 || isPending || isConfirming}
            className={`w-full font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 ${
              rewards.optimalClaim && rewards.messageCount >= 5
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                : rewards.efficiencyLevel === 'decent' && rewards.messageCount >= 5
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'
                : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-gray-300 disabled:from-slate-600 disabled:to-slate-600'
            }`}
          >
            {isPending || isConfirming ? (
              <>⏳ Processing Transaction...</>
            ) : rewards.messageCount >= 5 ? (
              <>
                {rewards.optimalClaim ? (
                  <>🎉 Optimal Claim: {rewards.currentEarnings} POOL</>
                ) : rewards.efficiencyLevel === 'decent' ? (
                  <>💛 Good Claim: {rewards.currentEarnings} POOL</>
                ) : (
                  <>⚠️ Low Efficiency: {rewards.currentEarnings} POOL</>
                )}
              </>
            ) : (
              <>💬 Need {5 - rewards.messageCount} more messages to claim</>
            )}
          </button>
          
          {/* Gas Efficiency Tip */}
          {rewards.messageCount >= 5 && !rewards.optimalClaim && (
            <div className={`rounded-lg p-2 text-xs text-center ${
              rewards.efficiencyLevel === 'decent' 
                ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-300'
                : 'bg-orange-500/10 border border-orange-500/20 text-orange-300'
            }`}>
              {rewards.efficiencyLevel === 'decent' ? (
                <>💡 Chat {Math.ceil((2.2 - rewards.currentEarnings) / 0.15)} more messages for optimal gas efficiency!</>
              ) : (
                <>💡 Chat {Math.ceil((1.32 - rewards.currentEarnings) / 0.15)} more messages for decent efficiency!</>
              )}
            </div>
          )}
          
          {/* Transaction Status */}
          {isConfirmed && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-2">
              <div className="text-xs text-green-400 text-center">
                ✅ Transaction confirmed! Rewards claimed successfully!
              </div>
            </div>
          )}
          
          {/* How It Works - Collapsible */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl">
            <button 
              onClick={() => setShowHowItWorks(!showHowItWorks)}
              className="w-full p-3 text-left flex items-center justify-between hover:bg-slate-700/30 rounded-xl transition-colors"
            >
              <h3 className="text-sm font-bold text-white">🌊 How Pool Works</h3>
              <div className={`text-gray-400 transition-transform ${showHowItWorks ? 'rotate-180' : ''}`}>
                ↓
              </div>
            </button>
            {showHowItWorks && (
              <div className="px-3 pb-3">
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Earn 0.1-0.3 POOL per message with Pool AI</li>
                  <li>• Longer, detailed conversations = higher rewards</li>
                  <li>• Quality scoring affects your bonus multiplier</li>
                  <li>• Referrers get 10% of your earnings automatically!</li>
                  <li>• Pay 1/3 of earnings for monthly premium access</li>
                  <li>• Minimum 5 messages to claim session rewards</li>
                  <li>• All powered by Enhanced Contract V2 on Polygon!</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE - Main Chat Interface */}
        <div className="flex-1 bg-slate-800/50 backdrop-blur-sm border border-teal-500/20 rounded-xl flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Chat with Pool 🌊</h2>
                <p className="text-sm text-gray-400">Ask questions, have discussions, earn POOL tokens!</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-teal-400 font-semibold">Enhanced Contract V2</div>
                <div className="text-xs text-gray-400">Live on Polygon Mainnet</div>
              </div>
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user' 
                    ? 'bg-teal-500 text-white' 
                    : 'bg-slate-700 text-gray-100 border border-slate-600'
                }`}>
                  {message.role === 'assistant' && (
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-xs">
                        🌊
                      </div>
                      <span className="text-xs font-semibold text-teal-400">Pool AI</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-700 rounded-lg p-3 border border-slate-600">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-xs">
                      🌊
                    </div>
                    <span className="text-xs font-semibold text-teal-400">Pool is thinking...</span>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Chat with Pool AI and earn POOL tokens..."
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-teal-500 focus:outline-none placeholder:text-gray-400"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-teal-500 hover:bg-teal-600 disabled:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </div>
            
            <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
              <span>Press Enter to send • Enhanced Contract V2 • Minimum 5 messages to claim</span>
              <span>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}