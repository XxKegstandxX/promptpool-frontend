'use client'

import React, { ReactNode } from 'react'
import { config, projectId } from './wagmi-config'

import { createWeb3Modal } from '@web3modal/wagmi/react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { State, WagmiProvider } from 'wagmi'

// Setup queryClient
const queryClient = new QueryClient()

if (!projectId) throw new Error('Project ID is not defined')

// Create modal
createWeb3Modal({
  projectId,
  wagmiConfig: config,
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
  enableOnramp: true, // Optional - false as default
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#14b8a6',
    '--w3m-color-mix-strength': 20,
    '--w3m-accent': '#14b8a6',
    '--w3m-border-radius-master': '12px'
  }
})

export default function Web3Provider({
  children,
  initialState
}: {
  children: ReactNode
  initialState?: State
}) {
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}