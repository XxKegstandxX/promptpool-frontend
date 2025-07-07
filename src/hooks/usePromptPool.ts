// src/hooks/usePromptPool.ts
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi'
import { CONTRACT_CONFIG } from '../lib/wagmi-config'
import { useState, useEffect } from 'react'
import { formatEther } from 'viem'

// Hook for reading user stats
export function useUserStats(address?: `0x${string}`) {
  const result = useReadContract({
    ...CONTRACT_CONFIG,
    functionName: 'getUserStats',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000, // Refetch every 10 seconds
    }
  })

  // Format the stats data
  const userStats = result.data ? {
    totalSubmissions: result.data[0].toString(),
    approvedSubmissions: result.data[1].toString(),
    totalRewards: formatEther(result.data[2]),
    reputationScore: result.data[3].toString(),
    currentTier: result.data[4],
    lastSubmissionTime: result.data[5],
    consecutiveApprovals: result.data[6].toString()
  } : null

  return {
    ...result,
    userStats
  }
}

// Hook for reading total submissions
export function useTotalSubmissions() {
  return useReadContract({
    ...CONTRACT_CONFIG,
    functionName: 'getTotalSubmissions',
    query: {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  })
}

// Hook for reading contract balance
export function useContractBalance() {
  const result = useReadContract({
    ...CONTRACT_CONFIG,
    functionName: 'getContractBalance',
    query: {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  })

  const balance = result.data ? formatEther(result.data) : '0'

  return {
    ...result,
    balance
  }
}

// Hook for checking if user can submit
export function useCanSubmit(address?: `0x${string}`) {
  return useReadContract({
    ...CONTRACT_CONFIG,
    functionName: 'canSubmit',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000, // Check every 5 seconds
    }
  })
}

// Hook for reward estimation
export function useRewardEstimate(
  promptLength: number,
  category: number,
  address?: `0x${string}`
) {
  const result = useReadContract({
    ...CONTRACT_CONFIG,
    functionName: 'getRewardEstimate',
    args: promptLength > 0 && address ? [BigInt(promptLength), category, address] : undefined,
    query: {
      enabled: !!address && promptLength >= 20,
      refetchOnWindowFocus: false,
    }
  })

  const estimatedReward = result.data ? formatEther(result.data[1]) : '0'
  const tier = result.data ? result.data[0] : 0

  return {
    ...result,
    estimatedReward,
    tier
  }
}

// Hook for submitting prompts
export function useSubmitPrompt() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess, error: txError } = useWaitForTransactionReceipt({
    hash,
  })

  const submitPrompt = async (
    ipfsHash: string,
    title: string,
    category: number,
    promptLength: number
  ) => {
    try {
      await writeContract({
        ...CONTRACT_CONFIG,
        functionName: 'submitPrompt',
        args: [ipfsHash, title, category, BigInt(promptLength)]
      })
    } catch (error) {
      throw error
    }
  }

  return {
    submitPrompt,
    isSubmitting: isPending || isConfirming,
    isConfirming,
    isSuccess,
    hash,
    error: error || txError
  }
}

// Hook for getting a specific prompt
export function usePrompt(promptId: number) {
  return useReadContract({
    ...CONTRACT_CONFIG,
    functionName: 'getPrompt',
    args: [BigInt(promptId)],
    query: {
      enabled: promptId >= 0,
    }
  })
}

// Helper hook to get account info with ENS support
export function usePromptPoolAccount() {
  const { address, isConnected, isConnecting, isDisconnected } = useAccount()
  
  // Get ETH balance
  const { data: balance } = useBalance({
    address,
    query: {
      enabled: !!address,
    }
  })

  return {
    address,
    isConnected,
    isConnecting,
    isDisconnected,
    balance: balance ? formatEther(balance.value) : '0'
  }
}

// Hook for getting tier information
export function useTierInfo() {
  const getTierName = (tier: number) => {
    const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum']
    return tiers[tier] || 'Bronze'
  }

  const getTierColor = (tier: number) => {
    const colors = ['text-orange-400', 'text-gray-300', 'text-yellow-400', 'text-purple-400']
    return colors[tier] || 'text-orange-400'
  }

  const getTierEmoji = (tier: number) => {
    const emojis = ['🥉', '🥈', '🥇', '💎']
    return emojis[tier] || '🥉'
  }

  return {
    getTierName,
    getTierColor,
    getTierEmoji
  }
}