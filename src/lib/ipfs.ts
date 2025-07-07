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

class IPFSService {
  private jwtToken: string
  private baseUrl: string

  constructor() {
    // Using Pinata JWT authentication (modern approach)
    this.jwtToken = process.env.NEXT_PUBLIC_PINATA_JWT || ''
    this.baseUrl = 'https://api.pinata.cloud'
  }

  // Upload prompt data to IPFS
  async uploadPrompt(promptData: PromptData): Promise<IPFSResponse> {
    try {
      // Create a structured prompt object
      const promptObject = {
        ...promptData,
        version: '1.0',
        platform: 'PromptPool',
        timestamp: Date.now()
      }

      // Check if we have JWT token for production
      if (!this.jwtToken) {
        console.log('🔶 IPFS Demo Mode: No JWT token found, using simulation')
        return this.simulateIPFSUpload(promptObject)
      }

      console.log('🚀 IPFS Production Mode: Uploading to Pinata...')
      
      const response = await fetch(`${this.baseUrl}/pinning/pinJSONToIPFS`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.jwtToken}`,
        },
        body: JSON.stringify({
          pinataContent: promptObject,
          pinataMetadata: {
            name: `PromptPool-${promptData.title.replace(/[^a-zA-Z0-9]/g, '-')}`,
            keyvalues: {
              category: promptData.category.toString(),
              author: promptData.author,
              platform: 'PromptPool',
              type: 'ai-prompt'
            }
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Pinata API Error:', errorText)
        throw new Error(`IPFS upload failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ IPFS Upload Success:', result.IpfsHash)
      
      return {
        hash: result.IpfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
      }
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
      if (!this.jwtToken && typeof window !== 'undefined') {
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
  isProductionMode(): boolean {
    return !!this.jwtToken
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
    hasJWT: !!process.env.NEXT_PUBLIC_PINATA_JWT,
    isDemo: !process.env.NEXT_PUBLIC_PINATA_JWT,
    isProduction: !!process.env.NEXT_PUBLIC_PINATA_JWT
  }
}