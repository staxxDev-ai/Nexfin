'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  TrendingDown, 
  Wallet, 
  TrendingUp,
  ExternalLink
} from 'lucide-react'
import { usePrivacy } from '@/context/PrivacyContext'
import { maskValue } from '@/utils/privacy'

interface BankCardProps {
  bankName: string
  color: string
  balance: string
  spent: string
  invested: string
  lastSync: string
}

export default function BankCard({ 
  bankName, 
  color, 
  balance, 
  spent, 
  invested, 
  lastSync 
}: BankCardProps) {
  const router = useRouter()
  const { isPrivate } = usePrivacy()

  const goToStatement = () => {
    // Redireciona para o extrato filtrando pelo nome do banco
    router.push(`/history?bank=${encodeURIComponent(bankName)}`)
  }

  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: `0 20px 40px ${color}15` }}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${color}30`,
        borderRadius: 4,
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20
      }}
    >
      {/* Glasmorphism Accent Background */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 120, height: 120, borderRadius: '50%',
        background: color, filter: 'blur(60px)', opacity: 0.1,
        zIndex: 0
      }} />

      {/* Header: Banco */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ 
            width: 32, height: 32, background: color, borderRadius: 4, 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 15px ${color}40`,
            fontSize: 14, fontWeight: 900, color: '#fff'
          }}>
            {bankName.substring(0, 1)}
          </div>
          <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
            {bankName.toUpperCase()}
          </h3>
        </div>
        <div 
          onClick={goToStatement}
          style={{ padding: 4, cursor: 'pointer', borderRadius: 4, transition: 'background 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border-color)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <ExternalLink size={14} style={{ color: 'var(--text-secondary)' }} />
        </div>
      </div>

      {/* Métricas Principais */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>
        
        {/* Saldo em Conta */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Wallet size={12} color={color} />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
              SALDO EM CONTA
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
            {maskValue(balance, isPrivate)}
          </div>
        </div>

        {/* Grito / Investimentos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <TrendingDown size={12} color="#ef4444" />
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                VALOR GASTO
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>
              {maskValue(spent, isPrivate)}
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <TrendingUp size={12} color="#22c55e" />
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                INVESTIDO
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>
              {maskValue(invested, isPrivate)}
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Sincronização */}
      <div style={{ 
        marginTop: 4, paddingTop: 16, borderTop: '1px solid var(--border-color)',
        fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600,
        display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1
      }}>
        <span>OPEN FINANCE ATIVO</span>
        <span>ATUALIZADO {lastSync}</span>
      </div>
    </motion.div>
  )
}
