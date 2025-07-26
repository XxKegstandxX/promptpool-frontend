// Create this file: src/app/api/chat-groq/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json();

    if (!message) {
      return NextResponse.json({ 
        error: 'Message is required',
        success: false 
      }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      console.error('❌ GROQ_API_KEY not found in environment variables');
      return NextResponse.json({ 
        error: 'AI service not configured',
        success: false 
      }, { status: 500 });
    }

    console.log('🤖 Processing chat request:', { messageLength: message.length });

    // Check if this is the first user message (only system + user messages = first interaction)
    const isFirstMessage = !conversationHistory || conversationHistory.length === 0;
    
    console.log('📊 Message context:', { isFirstMessage, historyLength: conversationHistory?.length || 0 });

    // Build conversation context for better responses
    const systemPrompt = isFirstMessage 
      ? `You are Pool AI, the helpful assistant for PromptPool - the world's first AI that pays users to chat! 

Welcome! You're earning POOL tokens just by chatting with me - how cool is that? PromptPool is revolutionary because instead of paying monthly fees like other AI services, users get PAID to have conversations.

Key facts:
- You earn POOL tokens for every message
- Built on Polygon blockchain with smart contracts
- Community-owned AI that gets smarter over time

Now, what can I help you with today?`
      : `You are Pool AI, the helpful assistant for PromptPool. Be genuinely helpful, friendly, and knowledgeable. Keep responses concise but informative (1-3 paragraphs max). Focus on answering their questions well - no need to mention POOL tokens or earnings.`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      // Include recent conversation history for context - FIXED: Strip timestamps
      ...(conversationHistory || []).slice(-6).map((msg: any) => ({
        role: msg.role,
        content: msg.content
        // Remove timestamp and other properties that Groq doesn't support
      })),
      {
        role: 'user',
        content: message
      }
    ];

    console.log('🚀 Calling Groq API...');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Groq API Error:', response.status, errorText);
      return NextResponse.json({ 
        error: 'AI service temporarily unavailable',
        success: false 
      }, { status: 500 });
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;
    
    // Log usage for monitoring
    console.log('✅ Groq Response Success:', {
      prompt_tokens: data.usage.prompt_tokens,
      completion_tokens: data.usage.completion_tokens,
      total_time: data.usage.total_time
    });

    return NextResponse.json({ 
      success: true,
      message: aiMessage,
      usage: data.usage
    });

  } catch (error) {
    console.error('❌ Chat API Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      success: false 
    }, { status: 500 });
  }
}