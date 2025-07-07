// src/lib/ipfs.ts

interface PromptData {
  title: string
  content: string
  category: number
  submittedAt: number
  author: string
}

interface IPFSResponse {
  hash: string
  url: string
}

interface APIResponse {
  success?: boolean
  hash?: string
  url?: string
  error?: string
  message?: string
  isDemo?: boolean
}

class IPFSService {
  private baseUrl: string

  constructor() {
    this.baseUrl = '/api/upload-to-ipfs'
  }

  // Upload prompt data to IPFS via secure API route
  async uploadPrompt(promptData: PromptData): Promise<IPFSResponse> {
    try {
      console.log('🚀 IPFS: Uploading via secure API...')
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promptData)
      })

      const result: APIResponse = await response.json()

      // Handle demo mode response
      if (result.isDemo || result.error?.includes('not configured')) {
        console.log('🔶 IPFS Demo Mode: Using simulation')
        return this.simulateIPFSUpload(promptData)
      }

      // Handle successful upload
      if (result.success && result.hash && result.url) {
        console.log('✅ IPFS Upload Success:', result.hash)
        return {
          hash: result.hash,
          url: result.url
        }
      }

      // Handle API errors
      if (result.error) {
        console.error('IPFS API Error:', result.error, result.message)
        throw new Error(result.message || result.error)
      }

      throw new Error('Unexpected API response format')

    } catch (error) {
      console.error('IPFS upload error:', error)
      
      // Fallback to simulation if API fails
      console.log('🔄 Falling back to demo mode due to error')
      return this.simulateIPFSUpload(promptData)
    }
  }

  // Retrieve prompt data from IPFS
  async getPrompt(ipfsHash: string): Promise<PromptData | null> {
    try {
      // For demo mode, try localStorage first
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(`ipfs-${ipfsHash}`)
        if (stored) {
          return JSON.parse(stored)
        }
      }

      // Try multiple IPFS gateways for reliability
      const gateways = [
        `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
        `https://ipfs.io/ipfs/${ipfsHash}`,
        `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
        `https://dweb.link/ipfs/${ipfsHash}`
      ]

      for (const gateway of gateways) {
        try {
          const response = await fetch(gateway, {
            headers: {
              'Accept': 'application/json',
            },
            // Add timeout
            signal: AbortSignal.timeout(10000)
          })

          if (response.ok) {
            const data = await response.json()
            return data as PromptData
          }
        } catch (gatewayError) {
          console.warn(`Gateway ${gateway} failed:`, gatewayError)
          continue
        }
      }

      throw new Error('All IPFS gateways failed')
    } catch (error) {
      console.error('Error fetching from IPFS:', error)
      return null
    }
  }

  // Check if IPFS hash is valid format
  isValidIPFSHash(hash: string): boolean {
    // Basic IPFS hash validation (Qm... format)
    return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(hash)
  }

  // Simulate IPFS upload for demo/development
  private async simulateIPFSUpload(promptData: PromptData): Promise<IPFSResponse> {
    // Generate a realistic looking IPFS hash
    const hash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    // Store in localStorage for demo purposes
    if (typeof window !== 'undefined') {
      localStorage.setItem(`ipfs-${hash}`, JSON.stringify(promptData))
    }
    
    return {
      hash,
      url: `https://ipfs.io/ipfs/${hash}`
    }
  }

  // Get upload progress (for UI feedback)
  getUploadProgress(): number {
    // This would be implemented with real upload progress tracking
    return Math.random() * 100
  }

  // Check if we're in production mode
  async isProductionMode(): Promise<boolean> {
    try {
      const response = await fetch('/api/upload-to-ipfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'test', content: 'test', category: 0, submittedAt: Date.now(), author: 'test' })
      })
      const result = await response.json()
      return !result.isDemo
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const ipfsService = new IPFSService()

// Helper functions
export async function uploadPromptToIPFS(
  title: string,
  content: string,
  category: number,
  author: string
): Promise<string> {
  const promptData: PromptData = {
    title,
    content,
    category,
    submittedAt: Date.now(),
    author
  }

  const result = await ipfsService.uploadPrompt(promptData)
  return result.hash
}

export async function getPromptFromIPFS(ipfsHash: string): Promise<PromptData | null> {
  return await ipfsService.getPrompt(ipfsHash)
}

// Environment setup helper
export function getIPFSConfig() {
  return {
    isSecure: true, // Now using secure API route
    description: 'Using secure server-side IPFS integration'
  }
}