'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface PrivacyContextType {
  isPrivate: boolean
  togglePrivacy: () => void
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined)

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [isPrivate, setIsPrivate] = useState(false)

  // Recuperar preferência do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('nexfin_privacy_mode')
    if (saved === 'true') {
      setIsPrivate(true)
    }
  }, [])

  const togglePrivacy = () => {
    setIsPrivate(prev => {
      const newValue = !prev
      localStorage.setItem('nexfin_privacy_mode', String(newValue))
      return newValue
    })
  }

  return (
    <PrivacyContext.Provider value={{ isPrivate, togglePrivacy }}>
      {children}
    </PrivacyContext.Provider>
  )
}

export function usePrivacy() {
  const context = useContext(PrivacyContext)
  if (context === undefined) {
    throw new Error('usePrivacy must be used within a PrivacyProvider')
  }
  return context
}
