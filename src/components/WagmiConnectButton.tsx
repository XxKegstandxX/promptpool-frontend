'use client'

import { useState, useEffect } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'

export default function WagmiConnectButton() {
  const [mounted, setMounted] = useState(false)
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { open } = useWeb3Modal()

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Show placeholder during server-side rendering
  if (!mounted) {
    return (
      <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg">
        Connect with Web3Modal 🌈
      </button>
    )
  }

  // Client-side rendering with actual wallet state
  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-3">
        <div className="text-sm text-teal-400 font-mono">
          {address.slice(0, 6)}...{address.slice(-4)}
        </div>
        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
        <button
          onClick={() => disconnect()}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => open()}
      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg"
    >
      Connect with Web3Modal 🌈
    </button>
  )
}