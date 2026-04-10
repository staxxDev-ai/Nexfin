'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  PieChart, 
  Wallet, 
  BarChart3, 
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Loader2,
  ChevronRight,
  Globe,
  Coins
} from 'lucide-react'

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchInvestments() {
      setLoading(true)
      try {
        const token = localStorage.getItem('nexfin_auth')
        if (!token) {
          setError('Sessão expirada. Refaça o login.')
          return
        }

        const response = await fetch('http://localhost:3001/api/v1/accounts/open-finance/investments', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (!response.ok) throw new Error('Falha ao carregar central de investimentos.')
        const data = await response.json()
        setInvestments(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchInvestments()
  }, [])

  const totalBalance = useMemo(() => {
    return investments.reduce((acc, inv) => acc + inv.balance, 0)
  }, [investments])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 24 }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{ color: '#10b981' }}
        >
          <Loader2 size={48} />
        </motion.div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '0.05em' }}>CONECTANDO AO MERCADO</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Sincronizando seus ativos em tempo real...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Cabeçalho */}
      <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
             <div style={{ 
                padding: '8px', background: 'rgba(16, 185, 129, 0.1)', 
                borderRadius: 4, color: '#10b981' 
             }}>
                <TrendingUp size={20} />
             </div>
             <span style={{ fontSize: 12, fontWeight: 800, color: '#10b981', letterSpacing: '0.1em' }}>HUB DE INVESTIMENTOS</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>
            Seu Futuro em Dados
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>
            Visão consolidada de todas as suas posições e rendimentos.
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
           <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 700, marginBottom: 4 }}>PATRIMÔNIO SOB GESTÃO</p>
           <h2 style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>
             {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBalance)}
           </h2>
        </div>
      </div>

      {investments.length === 0 ? (
        <div style={{ 
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 4, padding: '60px 40px', textAlign: 'center'
        }}>
           <PieChart size={48} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: 24 }} />
           <h3 style={{ fontSize: 18, color: '#fff', marginBottom: 12 }}>Nenhum investimento detectado</h3>
           <p style={{ color: 'rgba(255,255,255,0.4)', maxWidth: 400, margin: '0 auto' }}>
             Vincule contas de corretoras ou bancos com investimentos ativos para visualizar seu portfólio aqui.
           </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
          {investments.map((inv, idx) => (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 4,
                padding: '24px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ 
                position: 'absolute', top: 0, left: 0, width: 4, height: '100%', 
                background: inv.bankColor || '#10b981' 
              }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                   <h4 style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: 4 }}>
                     {inv.type.replace('_', ' ')} / {inv.subtype?.replace('_', ' ') || 'ATIVO'}
                   </h4>
                   <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{inv.name}</h3>
                </div>
                <div style={{ 
                  width: 32, height: 32, borderRadius: 6, background: inv.bankColor || '#3b82f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 900, color: '#fff'
                }}>
                  {inv.bank ? inv.bank[0] : 'B'}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Saldo Atual</span>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', marginTop: 4 }}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: inv.currency || 'BRL' }).format(inv.balance)}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
                 {inv.annualRate && (
                   <div style={{ flex: 1 }}>
                     <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>RENT. ANUAL</span>
                     <div style={{ fontSize: 13, color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ArrowUpRight size={14} style={{ color: '#10b981' }} />
                        {(inv.annualRate * 100).toFixed(2)}%
                     </div>
                   </div>
                 )}
                 <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>INSTITUIÇÃO</span>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{inv.bank || 'Banco'}</div>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Footer Info */}
      <div style={{ 
        marginTop: 48, padding: '24px', background: 'rgba(59, 130, 246, 0.05)', 
        border: '1px solid rgba(59, 130, 246, 0.1)', borderRadius: 4,
        display: 'flex', alignItems: 'center', gap: 16
      }}>
         <ShieldCheck size={24} style={{ color: '#3b82f6' }} />
         <div>
            <h5 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Dados criptografados e protegidos</h5>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              Suas informações de investimentos são sincronizadas via TLS 1.3 e armazenadas em ambiente seguro.
            </p>
         </div>
         <button style={{ 
           marginLeft: 'auto', background: 'rgba(255,255,255,0.05)', border: 'none', 
           padding: '8px 16px', borderRadius: 4, color: '#fff', fontSize: 11, 
           fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 
         }}>
           DETALHES <ChevronRight size={14} />
         </button>
      </div>

    </div>
  )
}
