// Create this file: src/app/api/test-groq/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🚀 Testing Groq API...');
    
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      console.error('❌ GROQ_API_KEY not found in environment variables');
      return NextResponse.json({ 
        error: 'API key not configured',
        success: false 
      }, { status: 500 });
    }

    console.log('✅ API Key found, making request to Groq...');
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'user', 
            content: 'Hello! Please respond with exactly: "PromptPool AI is working!"'
          }
        ],
        max_tokens: 50,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Groq API Error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Groq Response:', data);
    
    const aiMessage = data.choices[0].message.content;
    console.log('🤖 AI Message:', aiMessage);
    
    return NextResponse.json({ 
      success: true,
      message: aiMessage,
      fullResponse: data
    });

  } catch (error) {
    console.error('❌ Groq API Error:', error);
    return NextResponse.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
}