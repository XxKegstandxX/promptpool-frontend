// src/app/api/upload-to-ipfs/route.ts
import { NextRequest, NextResponse } from 'next/server'

interface PromptData {
  title: string
  content: string
  category: number
  submittedAt: number
  author: string
}

export async function POST(request: NextRequest) {
  try {
    // Get the JWT from server-side environment variable (secure)
    const jwtToken = process.env.PINATA_JWT
    
    if (!jwtToken) {
      return NextResponse.json(
        { error: 'IPFS service not configured', isDemo: true },
        { status: 200 } // Don't error, just indicate demo mode
      )
    }

    // Parse the request body
    const promptData: PromptData = await request.json()
    
    // Validate required fields
    if (!promptData.title || !promptData.content || !promptData.author) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content, author' },
        { status: 400 }
      )
    }

    // Create structured prompt object
    const promptObject = {
      ...promptData,
      version: '1.0',
      platform: 'PromptPool',
      timestamp: Date.now()
    }

    // Upload to Pinata IPFS
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
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
    
    return NextResponse.json({
      success: true,
      hash: result.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
      isDemo: false
    })

  } catch (error) {
    console.error('IPFS upload error:', error)
    
    return NextResponse.json(
      { 
        error: 'Upload failed', 
        message: error instanceof Error ? error.message : 'Unknown error',
        isDemo: false 
      },
      { status: 500 }
    )
  }
}