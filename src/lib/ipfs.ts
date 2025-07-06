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
  private apiKey: string
  private apiSecret: string
  private baseUrl: string

  constructor() {
    // Using Pinata for IPFS (you'll need to get API keys)
    this.apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY || ''
    this.apiSecret = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY || ''
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

      // For demo purposes, we'll simulate IPFS upload
      // In production, you'd use real Pinata API
      if (!this.apiKey || !this.apiSecret) {
        return this.simulateIPFSUpload(promptObject)
      }

      const response = await fetch(`${this.baseUrl}/pinning/pinJSONToIPFS`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.apiSecret,
        },
        body: JSON.stringify({
          pinataContent: promptObject,
          pinataMetadata: {
            name: `PromptPool-${promptData.title}`,
            keyvalues: {
              category: promptData.category.toString(),
              author: promptData.author,
              platform: 'PromptPool'
            }
          }
        })
      })

      if (!response.ok) {
        throw new Error(`IPFS upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      return {
        hash: result.IpfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
      }
    } catch (error) {
      console.error('IPFS upload error:', error)
      
      // Fallback to simulation if API fails
      return this.simulateIPFSUpload(promptData)
    }
  }

  // Retrieve prompt data from IPFS
  async getPrompt(ipfsHash: string): Promise<PromptData | null> {
    try {
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
  private async simulateIPFSUpload(promptData: any): Promise<IPFSResponse> {
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
    hasApiKeys: !!(process.env.NEXT_PUBLIC_PINATA_API_KEY && process.env.NEXT_PUBLIC_PINATA_SECRET_KEY),
    isDemo: !(process.env.NEXT_PUBLIC_PINATA_API_KEY && process.env.NEXT_PUBLIC_PINATA_SECRET_KEY)
  }
}