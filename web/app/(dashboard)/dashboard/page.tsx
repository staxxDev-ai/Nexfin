'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard, 
  PieChart,
  TrendingUp,
  Loader2,
  Building2,
  AlertCircle
} from 'lucide-react'
import { usePrivacy } from '@/context/PrivacyContext'
import { useSocket } from '@/context/SocketContext'
import { maskValue } from '@/utils/privacy'

// ─── Tipos ───────────────────────────────────────────────────────────────────
type SummaryItem = {
  id: string
  label: string
  value: string
  change: string
  color: string
  symbol: string
  rawTotal: number
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

export default function DashboardPage() {
  const [userName, setUserName] = useState('Usuário')
  const [summaries, setSummaries] = useState<SummaryItem[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { isPrivate } = usePrivacy()
  const { socket } = useSocket()

  const getToken = () => localStorage.getItem('nexfin_auth') || ''

  // ─── Buscar Resumo Real do Backend ─────────────────────────────────────────
  const fetchSummary = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/accounts/open-finance/summary`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('nexfin_auth')
          localStorage.removeItem('nexfin_user')
          router.push('/login')
          return
        }
        throw new Error('Falha ao carregar dados do dashboard.')
      }

      const data = await res.json()
      setSummaries(data)


      // Buscar Contas Únicas
      const accRes = await fetch(`${API}/accounts/open-finance/accounts`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (accRes.ok) {
        const accData = await accRes.json()
        setAccounts(accData)
      }
    } catch (err: any) {
      console.error('[Dashboard] Erro:', err)
      if (!silent) setError(err.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [router])

  useEffect(() => {
    const name = localStorage.getItem('nexfin_user')
    if (name) setUserName(name)
    fetchSummary()
    
    // Disparar sincronização global em background ao entrar no app
    const syncAll = async () => {
      setSyncing(true)
      try {
        fetch(`${API}/accounts/open-finance/sync-all`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${getToken()}` }
        })
        
        // Após o sync iniciado em background, aguardamos uns segundos para dar refresh nos dados
        setTimeout(() => {
          fetchSummary(true).then(() => setSyncing(false))
        }, 8000) 
      } catch (e) {
        console.error('Falha no auto-sync:', e)
        setSyncing(false)
      }
    }
    syncAll()
  }, [fetchSummary])

  // ─── Real-time Listeners ───────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return

    socket.on('balance:update', (data) => {
      console.log('[Socket] Atualização de saldo recebida:', data)
      fetchSummary(true) // Atualização silenciosa
    })

    socket.on('sync:status', (data) => {
      console.log('[Socket] Status de sincronização:', data)
      if (data.status === 'syncing') setSyncing(true)
      if (data.status === 'done') {
        setSyncing(false)
        fetchSummary(true)
      }
    })

    return () => {
      socket.off('balance:update')
      socket.off('sync:status')
    }
  }, [socket, fetchSummary])

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Cabeçalho de Boas-vindas */}
      <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>
            Olá, {userName}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            Bem-vindo ao seu centro de controle financeiro.
            {syncing && (
              <span style={{ 
                fontSize: 12, color: 'rgba(34,197,94,0.6)', 
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontWeight: 600, background: 'rgba(34,197,94,0.05)',
                padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(34,197,94,0.1)'
              }}>
                <Loader2 size={12} style={{ animation: 'spin 2s linear infinite' }} />
                SINCRONIZANDO CONTAS...
              </span>
            )}
          </p>
        </div>
        
        <button 
          onClick={() => router.push('/accounts')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', border: 'none', borderRadius: 8, color: '#fff',
            fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 8px 30px rgba(37,99,235,0.3)'
          }}
        >
          <Plus size={20} />
          GERENCIAR CONTAS
        </button>
      </div>

      {/* Grid de Saldos Realistas */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12, color: 'var(--text-secondary)' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
          Carregando seus saldos...
        </div>
      ) : error ? (
        <div style={{ padding: 40, textAlign: 'center', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: 12, color: '#fca5a5' }}>
          <AlertCircle size={32} style={{ margin: '0 auto 16px' }} />
          <p>{error}</p>
          <button onClick={() => fetchSummary()} style={{ marginTop: 16, background: 'none', border: '1px solid currentColor', color: 'inherit', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>Tentar novamente</button>
        </div>
      ) : summaries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: 'center', padding: '60px 40px',
            background: 'var(--bg-card)',
            border: '1px dashed var(--border-color)',
            borderRadius: 12, marginBottom: 48
          }}
        >
          <Building2 size={40} color="var(--border-color)" style={{ margin: '0 auto 20px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Nenhuma conta vinculada</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
            Conecte seus bancos para ver seus saldos consolidados aqui.
          </p>
          <button
            onClick={() => router.push('/accounts')}
            style={{ padding: '10px 24px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            Configurar Conexão
          </button>
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 48 }}>
          {summaries.map((balance, index) => (
            <motion.div
              key={balance.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 12,
                padding: '24px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <div style={{
                position: 'absolute', top: '-20%', right: '-10%',
                width: 150, height: 150, borderRadius: '50%',
                background: `radial-gradient(circle, ${balance.color}15 0%, transparent 70%)`,
                zIndex: 0
              }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                  <span style={{ 
                    background: `${balance.color}10`, color: balance.color, 
                    padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800, letterSpacing: '0.05em' 
                  }}>
                    {balance.symbol}
                  </span>
                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: 4, 
                    color: balance.change.startsWith('+') ? '#22c55e' : '#ef4444',
                    fontSize: 12, fontWeight: 700
                  }}>
                    {balance.change.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {balance.change}
                  </div>
                </div>

                <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, letterSpacing: '0.1em' }}>
                  {balance.label}
                </h3>
                
                <div style={{ 
                  fontSize: 28, 
                  fontWeight: 800, 
                  color: 'var(--text-primary)',
                  transition: 'all 0.3s ease'
                }}>
                  {maskValue(balance.value, isPrivate)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Contas e Cartões Detalhados */}
      {accounts.length > 0 && (
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.01em' }}>Contas e Cartões</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {accounts.map(acc => {
              const usedLimit = (acc.creditLimit || 0) - (acc.availableLimit || 0);
              const limitPerc = acc.creditLimit ? Math.min((usedLimit / acc.creditLimit) * 100, 100) : 0;
              
              return (
                <div key={acc.id} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      width: 32, height: 32, borderRadius: 8, background: acc.bankColor || '#3b82f6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 900
                    }}>
                      {acc.bankName[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{acc.bankName}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {acc.accountType === 'CREDIT' ? 'CARTÃO DE CRÉDITO' : 'CONTA CORRENTE'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 4 }}>
                      {acc.accountType === 'CREDIT' ? 'FATURA ATUAL' : 'SALDO DISPONÍVEL'}
                    </div>
                    <div style={{ 
                      fontSize: 20, fontWeight: 800, color: 'var(--text-primary)'
                    }}>
                      {maskValue(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: acc.currency }).format(acc.balance), isPrivate)}
                    </div>
                  </div>

                  {acc.accountType === 'CREDIT' && acc.creditLimit && (
                    <div style={{ marginTop: 8 }}>
                      {!isPrivate && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, marginBottom: 6 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>LIMITE UTILIZADO</span>
                          <span style={{ color: 'var(--text-primary)' }}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: acc.currency }).format(usedLimit)}
                          </span>
                        </div>
                      )}
                      <div style={{ height: 4, width: '100%', background: 'var(--bg-surface)', borderRadius: 2, overflow: 'hidden' }}>
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${limitPerc}%` }}
                          transition={{ duration: 1 }}
                          style={{ height: '100%', background: limitPerc > 80 ? '#ef4444' : '#3b82f6', borderRadius: 2 }} 
                        />
                      </div>
                      {!isPrivate && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginTop: 6, color: 'rgba(255,255,255,0.2)' }}>
                          <span>TOTAL UTILIZADO TOTAL</span>
                          <span>LIMITE DE {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: acc.currency }).format(acc.creditLimit)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Seção de Atalhos Rápidos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {[
          { label: 'Cartões', icon: CreditCard, color: '#f59e0b', route: '/accounts' },
          { label: 'Investimentos', icon: PieChart, color: '#10b981', route: '/investments' },
          { label: 'Fluxo de Caixa', icon: TrendingUp, color: '#6366f1', route: '/history' },
        ].map((item, idx) => (
          <motion.div
            key={item.label}
            whileHover={{ y: -4, background: 'var(--bg-surface)' }}
            onClick={() => router.push(item.route)}
            style={{
              padding: '24px', background: 'var(--bg-card)',
              border: '1px solid var(--border-color)', borderRadius: 12,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16,
              transition: 'all 0.3s',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ 
              width: 48, height: 48, borderRadius: 8, background: `${item.color}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color
            }}>
              <item.icon size={24} />
            </div>
            <span style={{ fontWeight: 600, fontSize: 16 }}>{item.label}</span>
          </motion.div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
