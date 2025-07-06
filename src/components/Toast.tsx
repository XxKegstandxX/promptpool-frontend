'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'loading'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  txHash?: string
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => string // Return ID for removal
  removeToast: (id: string) => void
  removeLoadingToasts: () => void // New function to clear all loading toasts
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])

    // Auto remove toast after duration (default 5 seconds)
    // But don't auto-remove loading toasts
    if (toast.type !== 'loading') {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration || 5000)
    }

    return id // Return the ID so caller can remove it manually
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const removeLoadingToasts = () => {
    setToasts(prev => prev.filter(toast => toast.type !== 'loading'))
  }

  return (
    <ToastContext.Provider value={{ addToast, removeToast, removeLoadingToasts }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[], removeToast: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-h-screen overflow-y-auto">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast, onRemove: () => void }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Delay to trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const handleRemove = () => {
    setIsVisible(false)
    setTimeout(onRemove, 300) // Wait for animation
  }

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500/90 border-green-400 text-white'
      case 'error':
        return 'bg-red-500/90 border-red-400 text-white'
      case 'info':
        return 'bg-blue-500/90 border-blue-400 text-white'
      case 'loading':
        return 'bg-teal-500/90 border-teal-400 text-white'
      default:
        return 'bg-slate-800/90 border-slate-600 text-white'
    }
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'info':
        return 'ℹ️'
      case 'loading':
        return (
          <div className="animate-spin text-lg">⭯</div>
        )
      default:
        return '💡'
    }
  }

  return (
    <div
      className={`
        ${getToastStyles()}
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        transition-all duration-300 ease-in-out
        min-w-80 max-w-md p-4 rounded-lg border backdrop-blur-sm shadow-xl
        transform
      `}
    >
      <div className="flex items-start gap-3">
        <div className="text-xl flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm mb-1">{toast.title}</h4>
          {toast.message && (
            <p className="text-xs opacity-90 break-words">{toast.message}</p>
          )}
          {toast.txHash && (
            <a
              href={`https://polygonscan.com/tx/${toast.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs underline opacity-75 hover:opacity-100 transition-opacity mt-1 inline-block"
            >
              View on PolygonScan ↗
            </a>
          )}
        </div>
        
        <button
          onClick={handleRemove}
          className="text-white/70 hover:text-white transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  )
}