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
  const [name, setName] = useState('')

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

  useEffect(() => {
    async function initProfile() {
      // 1. Tenta carregar do cache local imediatamente
      const cachedAvatar = localStorage.getItem('nexfin_avatar')
      const cachedName = localStorage.getItem('nexfin_user')
      if (cachedAvatar) setAvatar(cachedAvatar)
      if (cachedName) setName(cachedName)

      // 2. Busca do backend para garantir sincronia
      try {
        const token = localStorage.getItem('nexfin_auth')
        if (!token) return

        const response = await fetch(`${API_URL}/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          setAvatar(data.avatarUrl)
          setName(data.name)
          
          // Atualiza cache
          if (data.avatarUrl) localStorage.setItem('nexfin_avatar', data.avatarUrl)
          if (data.name) localStorage.setItem('nexfin_user', data.name)
        }
      } catch (err) {
        console.error('Erro ao sincronizar TopNav:', err)
      }
    }

    initProfile()

    const handleStorageChange = () => {
      setAvatar(localStorage.getItem('nexfin_avatar'))
      setName(localStorage.getItem('nexfin_user') || '')
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('nexfin_auth')
    localStorage.removeItem('nexfin_user')
    localStorage.removeItem('nexfin_avatar')
    router.replace('/login')
  }

  const getInitials = (userName: string) => {
    if (!userName) return '?'
    const parts = userName.trim().split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    return userName[0].toUpperCase()
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
        {/* Foto do Usuário / Iniciais - Acesso ao Perfil */}
        <motion.div 
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(59,130,246,0.6)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/profile')}
          style={{ 
            width: 32, height: 32, background: avatar ? 'transparent' : 'linear-gradient(135deg, #2563eb, #1e40af)', 
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginRight: 10, cursor: 'pointer', transition: 'all 0.2s',
            zIndex: 10, overflow: 'hidden',
            border: '2px solid rgba(255,255,255,0.05)'
          }}
        >
          {avatar ? (
            <img src={avatar} alt="Me" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 11, letterSpacing: '-0.02em' }}>
              {getInitials(name)}
            </span>
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
