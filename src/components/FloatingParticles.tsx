'use client'

import { useEffect, useState } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  speed: number
  opacity: number
  delay: number
}

export default function FloatingParticles() {
  const [particles, setParticles] = useState<Particle[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // This ensures we only render particles on the client side
    setIsClient(true)
    
    // Create 50 particles for a rich effect
    const newParticles: Particle[] = []
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2, // 2-6px
        speed: Math.random() * 20 + 15, // 15-35s animation
        opacity: Math.random() * 0.6 + 0.2, // 0.2-0.8 opacity
        delay: Math.random() * 15 // 0-15s delay
      })
    }
    setParticles(newParticles)
  }, [])

  // Don't render anything on server side
  if (!isClient) {
    return null
  }

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 animate-float"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            animationDuration: `${particle.speed}s`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
      
      {/* Add some larger, slower moving bubbles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`bubble-${i}`}
          className="absolute rounded-full border-2 border-teal-400/20 animate-bubble"
          style={{
            left: `${Math.random() * 90}%`,
            top: `${Math.random() * 90}%`,
            width: `${Math.random() * 40 + 20}px`,
            height: `${Math.random() * 40 + 20}px`,
            animationDuration: `${Math.random() * 10 + 20}s`,
            animationDelay: `${Math.random() * 10}s`,
          }}
        />
      ))}
    </div>
  )
}