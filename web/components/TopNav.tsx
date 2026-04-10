'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  Wallet, 
  History, 
  TrendingUp, 
  Settings, 
  LogOut,
  MessageSquare,
  Eye,
  EyeOff
} from 'lucide-react'
import { usePrivacy } from '@/context/PrivacyContext'

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'accounts', label: 'Contas', icon: Wallet, path: '/accounts' },
  { id: 'history', label: 'Extrato', icon: History, path: '/history' },
  { id: 'investments', label: 'Investimentos', icon: TrendingUp, path: '/investments' },
  { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/chat' },
  { id: 'settings', label: 'Configurações', icon: Settings, path: '/settings' },
]

export default function TopNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { isPrivate, togglePrivacy } = usePrivacy()
  const [avatar, setAvatar] = useState<string | null>(null)

  useEffect(() => {
    // Carrega o avatar se existir no sessionStorage
    const savedAvatar = sessionStorage.getItem('nexfin_avatar')
    if (savedAvatar) setAvatar(savedAvatar)

    // Listener para mudanças no sessionStorage (opcional para refletir no Dashboard sem refresh)
    const handleStorageChange = () => {
      const updatedAvatar = sessionStorage.getItem('nexfin_avatar')
      setAvatar(updatedAvatar)
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('nexfin_auth')
    localStorage.removeItem('nexfin_user')
    sessionStorage.removeItem('nexfin_avatar') // Avatar costuma ser temporário, mas limpamos também
    router.replace('/login')
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: 80, display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 100, padding: '0 24px'
    }}>
      {/* Barra de Navegação Centralizada */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 4, // Design Square
          padding: '6px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }}
      >
        {/* Logo Discreta ou Foto do Usuário - Acesso ao Perfil */}
        <motion.div 
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(59,130,246,0.6)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/profile')}
          style={{ 
            width: 28, height: 28, background: avatar ? 'transparent' : '#2563eb', borderRadius: avatar ? '50%' : 4, 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginRight: 12, cursor: 'pointer', transition: 'all 0.2s',
            zIndex: 10, overflow: 'hidden',
            border: avatar ? '1px solid rgba(59,130,246,0.3)' : 'none'
          }}
        >
          {avatar ? (
            <img src={avatar} alt="Me" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>N</span>
          )}
        </motion.div>

        {/* Abas */}
        <div style={{ display: 'flex', gap: 4 }}>
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.path
            return (
              <div
                key={item.id}
                onClick={() => router.push(item.path)}
                style={{
                  padding: '10px 16px', borderRadius: 4, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  position: 'relative', transition: 'all 0.2s',
                  background: isActive ? 'rgba(37, 99, 235, 0.1)' : 'transparent'
                }}
              >
                <item.icon size={18} color={isActive ? '#60a5fa' : 'rgba(255,255,255,0.4)'} />
                <span style={{ 
                  fontSize: 13, fontWeight: isActive ? 700 : 500, 
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                  letterSpacing: '0.02em' 
                }}>
                  {item.label}
                </span>

                {/* Indicador de Aba Ativa Neon */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    style={{
                      position: 'absolute', bottom: -2, left: 8, right: 8, height: 2,
                      background: '#3b82f6', borderRadius: '2px 2px 0 0',
                      boxShadow: '0 0 10px rgba(59,130,246,0.8)'
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Botão Ocultar/Exibir (Modo Privacidade) */}
        <div style={{ marginLeft: 4 }}>
          <button
            onClick={togglePrivacy}
            style={{
              padding: '10px 16px', borderRadius: 4, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
              background: isPrivate ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              border: 'none', color: isPrivate ? '#60a5fa' : 'rgba(255,255,255,0.6)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = isPrivate ? 'rgba(59, 130, 246, 0.15)' : 'transparent')}
          >
            {isPrivate ? <Eye size={18} /> : <EyeOff size={18} />}
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {isPrivate ? 'Exibir' : 'Ocultar'}
            </span>
          </button>
        </div>

        {/* Divisor */}
        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />

        {/* Logout */}
        <button 
          onClick={handleLogout}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '10px', display: 'flex', alignItems: 'center',
            color: 'rgba(239, 68, 68, 0.6)', transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(239, 68, 68, 0.6)'}
        >
          <LogOut size={18} />
        </button>
      </motion.div>
    </div>
  )
}
