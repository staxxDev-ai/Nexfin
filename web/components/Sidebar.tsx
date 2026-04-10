'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  Wallet, 
  History, 
  TrendingUp, 
  Settings, 
  LogOut,
  ChevronRight,
  MessageSquare
} from 'lucide-react'

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'accounts', label: 'Minhas Contas', icon: Wallet, path: '/accounts' },
  { id: 'history', label: 'Extrato', icon: History, path: '/history' },
  { id: 'investments', label: 'Investimentos', icon: TrendingUp, path: '/investments' },
  { id: 'chat', label: 'Chat Inteligente', icon: MessageSquare, path: '/chat' },
  { id: 'settings', label: 'Configurações', icon: Settings, path: '/settings' },
]

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('nexfin_auth')
    localStorage.removeItem('nexfin_user')
    // Opcional: manter o nexfin_remember se quiser que o e-mail continue salvo
    router.replace('/login')
  }

  return (
    <motion.div
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      initial={false}
      animate={{ width: isExpanded ? 260 : 80 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        height: '100vh',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 12px',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
        boxShadow: '20px 0 50px rgba(0,0,0,0.2)'
      }}
    >
      {/* Logo Curta / Logo Expandida */}
      <div style={{ padding: '0 12px', marginBottom: 40, height: 40, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <motion.div
          animate={{ x: isExpanded ? 0 : 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12 }}
        >
          <div style={{ 
            width: 32, height: 32, background: '#2563eb', borderRadius: 4, 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, boxShadow: '0 0 20px rgba(37,99,235,0.4)'
          }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>N</span>
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                style={{ color: '#fff', fontWeight: 700, fontSize: 18, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}
              >
                NEXFIN
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Navegação */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.path
          return (
            <div
              key={item.id}
              onClick={() => router.push(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                borderRadius: 4,
                cursor: 'pointer',
                background: isActive ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
                border: isActive ? '1px solid rgba(37, 99, 235, 0.3)' : '1px solid transparent',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <item.icon size={22} color={isActive ? '#60a5fa' : 'rgba(255,255,255,0.5)'} />
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    style={{ 
                      marginLeft: 16, color: isActive ? '#fff' : 'rgba(255,255,255,0.6)', 
                      fontSize: 14, fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap' 
                    }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {isActive && !isExpanded && (
                <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, background: '#2563eb', borderRadius: '0 4px 4px 0' }} />
              )}
            </div>
          )
        })}
      </nav>

      {/* Logout */}
      <div 
        onClick={handleLogout}
        style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          padding: '12px',
          borderRadius: 4,
          cursor: 'pointer',
          background: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid transparent',
          transition: 'all 0.2s'
        }}
      >
        <LogOut size={22} color="rgba(239, 68, 68, 0.6)" />
        <AnimatePresence>
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              style={{ marginLeft: 16, color: 'rgba(239, 68, 68, 0.8)', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}
            >
              Sair da Conta
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
