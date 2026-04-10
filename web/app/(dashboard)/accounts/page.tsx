'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Script from 'next/script'
import {
  Building2, CheckCircle2, AlertCircle, Key, Zap,
  Wifi, WifiOff, TrendingUp, CreditCard, Loader2, X,
  Settings2, ChevronRight, PieChart, Banknote
} from 'lucide-react'
import { usePrivacy } from '@/context/PrivacyContext'

// ─── Tipos ───────────────────────────────────────────────────────────────────
type BankAccount = {
  id: string
  bankName: string
  bankCode: string
  bankColor: string | null
  bankLogoUrl: string | null
  accountType: 'CHECKING' | 'SAVINGS' | 'INVESTMENT' | 'CREDIT'
  accountNumber: string | null
  balance: number
  currency: string
  isConnected: boolean
  lastSyncAt: string | null
  pluggyItemId: string | null
}

type SetupStep = 1 | 2 | 3 | 4 | 5
type FormStatus = 'idle' | 'validating' | 'saving' | 'generating-token' | 'success' | 'error'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

const ACCOUNT_TYPE_LABELS: Record<string, { label: string; icon: any }> = {
  CHECKING: { label: 'C.C (Conta Corrente)', icon: Banknote },
  SAVINGS: { label: 'Poupança', icon: TrendingUp },
  INVESTMENT: { label: 'Investimentos', icon: PieChart },
  CREDIT: { label: 'Cartão de Crédito', icon: CreditCard },
}

// ─── Componente de Card de Instituição (Unificado) ───────────────────────────
function InstitutionCard({ 
  group, 
  onSettings 
}: { 
  group: { itemId: string, name: string, color: string, logo: string | null, accounts: BankAccount[] },
  onSettings: (itemId: string) => void
}) {
  const { isPrivate } = usePrivacy()
  const totalBalance = group.accounts.reduce((acc, curr) => acc + curr.balance, 0)
  const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBalance)
  
  const anyConnected = group.accounts.some(a => a.isConnected)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* ── Cabeçalho do Banco ── */}
      <div style={{ 
        padding: '24px', 
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            {group.logo ? (
              <img src={group.logo} alt={group.name} style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${group.color || '#3b82f6'}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Building2 size={22} color={group.color || '#3b82f6'} />
              </div>
            )}
            <div style={{ 
              position: 'absolute', bottom: -2, right: -2,
              width: 14, height: 14, borderRadius: '50%',
              background: '#0b1426', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: anyConnected ? '#22c55e' : '#ef4444' }} />
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em' }}>{group.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 11, color: anyConnected ? '#22c55e' : '#ef4444', fontWeight: 700, letterSpacing: '0.02em' }}>
                {anyConnected ? 'CONECTADO' : 'DESCONECTADO'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onSettings(group.itemId)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
        >
          <Settings2 size={15} />
          Ajustar
        </button>
      </div>

      {/* ── Lista de Sub-contas ── */}
      <div style={{ padding: '12px 0' }}>
        {group.accounts.map((acc, idx) => {
          const Icon = ACCOUNT_TYPE_LABELS[acc.accountType]?.icon || Banknote
          const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(acc.balance)
          
          return (
            <div 
              key={acc.id}
              style={{
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: idx === group.accounts.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <Icon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                    {ACCOUNT_TYPE_LABELS[acc.accountType]?.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                    {acc.accountNumber ? `Final ${acc.accountNumber.slice(-4)}` : 'Conta Protegida'}
                  </div>
                </div>
              </div>
              <div style={{ 
                fontSize: 16, 
                fontWeight: 700, 
                color: acc.balance >= 0 ? '#fff' : '#ef4444',
                filter: isPrivate ? 'blur(5px)' : 'none',
                transition: 'filter 0.3s ease'
              }}>
                {formattedValue}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Rodapé (Saldo Consolidado) ── */}
      <div style={{ 
        padding: '20px 24px', 
        background: 'rgba(255,255,255,0.015)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        marginTop: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 4 }}>
              SALDO CONSOLIDADO
            </div>
            <div style={{ 
              fontSize: 22, 
              fontWeight: 900, 
              color: totalBalance >= 0 ? '#22c55e' : '#ef4444', 
              letterSpacing: '-0.02em',
              filter: isPrivate ? 'blur(5px)' : 'none',
              transition: 'filter 0.3s ease'
            }}>
              {formattedTotal}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(34,197,94,0.4)', fontSize: 11, fontWeight: 600 }}>
             <Loader2 size={12} style={{ animation: 'spin 3s linear infinite' }} />
             Auto-Sincronizando
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function AccountsPage() {
  const [showSetup, setShowSetup]   = useState(false)
  const [step, setStep]             = useState<SetupStep>(1)
  const [creds, setCreds]           = useState({ clientId: '', clientSecret: '' })
  const [status, setStatus]         = useState<FormStatus>('idle')
  const [errorMsg, setErrorMsg]     = useState<string | null>(null)
  const [accounts, setAccounts]     = useState<BankAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [pluggyReady, setPluggyReady] = useState(false)
  const [sdkLoadError, setSdkLoadError] = useState(false)
  const [lastFetch, setLastFetch] = useState<Date>(new Date())

  const getToken = () => localStorage.getItem('nexfin_auth') || ''

  // ─── Buscar contas reais do backend ──────────────────────────────────────
  const fetchAccounts = useCallback(async (silent = false) => {
    if (!silent) setLoadingAccounts(true)
    try {
      const res = await fetch(`${API}/accounts/open-finance/accounts`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAccounts(data)
        setLastFetch(new Date())
      }
    } catch (e) {
      console.error('[AccountsPage] Erro ao buscar contas:', e)
    } finally {
      if (!silent) setLoadingAccounts(false)
    }
  }, [])

  // ─── Polling Automático (10s) ─────────────────────────────────────────────
  useEffect(() => {
    fetchAccounts()
    const interval = setInterval(() => {
      fetchAccounts(true) // Fetch silencioso em background
    }, 10000)
    return () => clearInterval(interval)
  }, [fetchAccounts])

  // ─── Agrupamento por Instituição ──────────────────────────────────────────
  const groupedAccounts = useMemo(() => {
    const groups: Record<string, { itemId: string, name: string, color: string, logo: string | null, accounts: BankAccount[] }> = {}
    
    accounts.forEach(acc => {
      const id = acc.pluggyItemId || 'manual-' + acc.bankName
      if (!groups[id]) {
        groups[id] = {
          itemId: id,
          name: acc.bankName,
          color: acc.bankColor || '#3b82f6',
          logo: acc.bankLogoUrl,
          accounts: []
        }
      }
      groups[id].accounts.push(acc)
    })
    
    return Object.values(groups)
  }, [accounts])

  // ─── Lógica de Setup e Callbacks da Pluggy (mantidos da versão anterior) ───
  const handleSaveCredentials = async () => {
    if (!creds.clientId.trim() || !creds.clientSecret.trim()) {
      setErrorMsg('Preencha o Client ID e o Client Secret.')
      return
    }
    setStatus('validating')
    setErrorMsg(null)

    try {
      const res = await fetch(`${API}/accounts/open-finance/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ clientId: creds.clientId.trim(), clientSecret: creds.clientSecret.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Erro ao validar credenciais.')
      setStatus('idle')
      setStep(4)
    } catch (err: any) {
      setErrorMsg(err.message)
      setStatus('error')
    }
  }

  const handleOpenWidget = async () => {
    if (!pluggyReady) {
      setErrorMsg('O widget da Pluggy ainda está carregando. Aguarde um momento.')
      return
    }
    setStatus('generating-token')
    setErrorMsg(null)

    try {
      const res = await fetch(`${API}/accounts/open-finance/connect-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}: Não foi possível gerar o token de conexão.`)

      const { accessToken } = data
      setStatus('idle')

      const PluggyConnect = (window as any).PluggyConnect
      const connect = new PluggyConnect({
        connectToken: accessToken,
        includeSandbox: true,
        onSuccess: async (widgetData: any) => {
          const itemId = widgetData?.item?.id || widgetData?.itemId || widgetData?.id
          if (!itemId) {
            setErrorMsg('Conexão realizada mas não foi possível identificar o banco.')
            setStatus('error')
            return
          }

          try {
            const linkRes = await fetch(`${API}/accounts/open-finance/link`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
              body: JSON.stringify({ itemId }),
            })
            if (!linkRes.ok) throw new Error('Falha ao vincular banco.')
            setStep(5)
            setStatus('success')
            fetchAccounts(true)
            setTimeout(() => { handleCloseSetup() }, 3500)
          } catch (err: any) {
            setErrorMsg(`Erro ao salvar conexão: ${err.message}`)
            setStatus('error')
          }
        },
        onError: (err: any) => {
          setErrorMsg(`Erro no widget: ${err?.message || 'Falha interna'}`)
          setStatus('error')
        },
        onClose: () => { if (status !== 'success') setStatus('idle') },
      })

      connect.init()
    } catch (err: any) {
      setErrorMsg(err.message)
      setStatus('error')
    }
  }

  const checkCredentials = async () => {
    try {
      const response = await fetch(`${API}/accounts/open-finance/check-credentials`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      const data = await response.json()
      if (data.hasCredentials) {
        setStep(4)
        setStatus('idle')
      }
    } catch (e) {
      console.error('Falha ao verificar credenciais:', e)
    }
  }

  useEffect(() => {
    if (showSetup) {
      checkCredentials()
    }
  }, [showSetup])

  const handleCloseSetup = () => {
    setShowSetup(false)
    setStep(1)
    setStatus('idle')
    setErrorMsg(null)
    setCreds({ clientId: '', clientSecret: '' })
  }

  const handleOpenSettings = (itemId: string) => {
    alert(`Opções de ajuste para a conexão: ${itemId}\nFuncionalidade em desenvolvimento.`)
  }

  return (
    <>
      <Script
        id="pluggy-connect-sdk"
        src="https://cdn.pluggy.ai/pluggy-connect/v2.7.0/pluggy-connect.js"
        strategy="afterInteractive"
        onLoad={() => setPluggyReady(true)}
        onError={() => setSdkLoadError(true)}
      />

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <h1 style={{ fontSize: 36, fontWeight: 900, margin: 0, letterSpacing: '-0.03em' }}>
              Minhas Conexões
            </h1>
            <p style={{ margin: '12px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              {groupedAccounts.length} instituições ativas 
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
              <span style={{ color: 'rgba(34,197,94,0.6)', fontWeight: 600 }}>Sincronização Automática Ativa</span>
            </p>
          </div>
          <button
            onClick={() => setShowSetup(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '16px 28px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              border: 'none', borderRadius: 14, color: '#fff', fontWeight: 800,
              cursor: 'pointer', fontSize: 15, boxShadow: '0 12px 40px rgba(37,99,235,0.3)',
              transition: 'transform 0.2s'
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Zap size={18} />
            NOVA CONEXÃO
          </button>
        </div>

        {/* ── Lista de Bancos Agrupados ── */}
        {loadingAccounts ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '120px 0' }}>
            <Loader2 size={32} color="#3b82f6" style={{ animation: 'spin 1.5s linear infinite' }} />
            <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: 15 }}>Preparando sua carteira...</span>
          </div>
        ) : groupedAccounts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              textAlign: 'center', padding: '100px 40px',
              background: 'rgba(255,255,255,0.015)',
              border: '1px dashed rgba(255,255,255,0.08)',
              borderRadius: 24,
            }}
          >
            <div style={{ 
              width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.03)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
            }}>
              <Building2 size={32} color="rgba(255,255,255,0.1)" />
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Tudo pronto para começar?</h3>
            <p style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 36, maxWidth: 460, margin: '0 auto 36px', lineHeight: 1.6 }}>
              Conecte seus bancos via Open Finance. Seus saldos e transações serão atualizados automaticamente a cada 10 segundos.
            </p>
            <button
              onClick={() => setShowSetup(true)}
              style={{
                padding: '16px 40px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', 
                fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            >
              CONECTAR PRIMEIRO BANCO
            </button>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 32 }}>
            {groupedAccounts.map((group) => (
              <InstitutionCard key={group.itemId} group={group} onSettings={handleOpenSettings} />
            ))}
          </div>
        )}

        {/* ── Modal de Setup ────────────────────────────────────────────────── */}
        <AnimatePresence>
          {showSetup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)',
                zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
              }}
            >
              <motion.div
                initial={{ scale: 0.95, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 30 }}
                style={{
                  width: '100%', maxWidth: 480,
                  background: '#0b1426',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 24, padding: '40px',
                  position: 'relative',
                  boxShadow: '0 30px 100px rgba(0,0,0,0.5)'
                }}
              >
                <button
                  onClick={handleCloseSetup}
                  style={{
                    position: 'absolute', top: 20, right: 20,
                    background: 'rgba(255,255,255,0.06)', border: 'none',
                    borderRadius: 10, padding: 8, cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
                    display: 'flex',
                  }}
                >
                  <X size={18} />
                </button>

                {/* ── Steps 1-4 (reutilizados) ── */}
                {step === 1 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(37,99,235,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Zap size={24} color="#3b82f6" />
                      </div>
                      <div>
                        <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>Ativar Open Finance</h2>
                        <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>SEGURO • AUTOMÁTICO • PREMIUM</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
                      {[
                        { text: 'Acesse o dashboard em pluggy.ai' },
                        { text: 'Copie seu Client ID e Client Secret' },
                        { text: 'Sua conexão será atualizada a cada 10s' },
                      ].map(({ text }, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} />
                          <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{text}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setStep(2)}
                      style={{
                        width: '100%', padding: '18px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        border: 'none', borderRadius: 14, color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 16,
                        boxShadow: '0 10px 30px rgba(37,99,235,0.3)'
                      }}
                    >
                      CONFIGURAR AGORA
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <div>
                     <div style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Credenciais</h2>
                        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Insira suas chaves da API Pluggy</p>
                     </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: 8 }}>CLIENT ID</label>
                        <input
                          value={creds.clientId}
                          onChange={e => setCreds(p => ({ ...p, clientId: e.target.value }))}
                          placeholder="ID da sua aplicação"
                          style={{
                            width: '100%', boxSizing: 'border-box', padding: '16px',
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'monospace'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: 8 }}>CLIENT SECRET</label>
                        <input
                          value={creds.clientSecret}
                          onChange={e => setCreds(p => ({ ...p, clientSecret: e.target.value }))}
                          type="password"
                          placeholder="Sua chave secreta"
                          style={{
                            width: '100%', boxSizing: 'border-box', padding: '16px',
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'monospace'
                          }}
                        />
                      </div>
                    </div>

                    {errorMsg && (
                      <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 14, marginBottom: 24, color: '#fca5a5', fontSize: 13 }}>
                        {errorMsg}
                      </div>
                    )}

                    <button
                      onClick={handleSaveCredentials}
                      disabled={status === 'validating'}
                      style={{
                        width: '100%', padding: '18px', background: '#3b82f6',
                        border: 'none', borderRadius: 14, color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 16
                      }}
                    >
                      {status === 'validating' ? 'VALIDANDO...' : 'PROSSEGUIR'}
                    </button>
                  </div>
                )}

                {step === 4 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                      <CheckCircle2 size={36} color="#22c55e" />
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Tudo Certo!</h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32, fontSize: 15 }}>Chaves validadas. Agora selecione seu banco.</p>

                    <button
                      onClick={handleOpenWidget}
                      disabled={status === 'generating-token'}
                      style={{
                        width: '100%', padding: '18px', background: status === 'generating-token' ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #10b981, #059669)',
                        border: 'none', borderRadius: 14, color: '#fff', fontWeight: 800, cursor: status === 'generating-token' ? 'wait' : 'pointer', fontSize: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                      }}
                    >
                      {status === 'generating-token' ? (
                        <>
                          <Loader2 size={20} style={{ animation: 'spin 1.5s linear infinite' }} />
                          GERANDO TOKEN...
                        </>
                      ) : (
                        'ABRIR SELETOR DE BANCOS'
                      )}
                    </button>
                  </div>
                )}

                {step === 5 && (
                  <div style={{ textAlign: 'center' }}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                      <CheckCircle2 size={44} color="#22c55e" />
                    </motion.div>
                    <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 12 }}>Banco Conectado!</h2>
                    <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 0, fontSize: 16 }}>Suas contas serão unificadas no dashboard.</p>
                  </div>
                )}

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}
