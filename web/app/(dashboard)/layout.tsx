'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TopNav from '@/components/TopNav'
import { motion } from 'framer-motion'
import { PrivacyProvider } from '@/context/PrivacyContext'
import { SocketProvider } from '@/context/SocketContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem('nexfin_auth')
    if (!token) {
      router.replace('/login')
    } else {
      setIsAuth(true)
    }
  }, [router])

  return (
    <PrivacyProvider>
      <SocketProvider>
      {!mounted || !isAuth ? (
        <div style={{
          height: '100vh', background: '#050d1e', display: 'flex', 
          alignItems: 'center', justifyContent: 'center'
        }}>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ width: 40, height: 40, border: '3px solid #2563eb', borderRadius: 4 }}
          />
        </div>
      ) : (
        <div style={{
          minHeight: '100vh',
          background: '#050d1e',
          // FUNDO: RADIAL GLOW + GRID GEOMÉTRICA (identidade da tela de login)
          backgroundImage: `
            linear-gradient(to right, rgba(59, 130, 246, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59, 130, 246, 0.04) 1px, transparent 1px),
            radial-gradient(at 0% 0%, rgba(37, 99, 235, 0.06) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(29, 78, 216, 0.06) 0px, transparent 50%)
          `,
          backgroundSize: '40px 40px, 40px 40px, 100% 100%, 100% 100%',
          display: 'flex',
          flexDirection: 'column',
          color: '#fff',
          position: 'relative',
          overflowX: 'hidden'
        }}>
          
          {/* Navegação Superior Centralizada */}
          <TopNav />
    
          {/* Área de Conteúdo Principal */}
          <motion.main
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              flex: 1,
              padding: '120px 40px 40px', // Espaço extra no topo por causa da Nav fixa (80px + gap)
              width: '100%',
              maxWidth: '1440px',
              margin: '0 auto', // Centraliza o conteúdo principal
              position: 'relative',
              zIndex: 1,
              boxSizing: 'border-box'
            }}
          >
            {children}
          </motion.main>
        </div>
      )}
      </SocketProvider>
    </PrivacyProvider>
  )
}
