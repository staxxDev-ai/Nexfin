'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Filter, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  StickyNote, 
  ChevronLeft, 
  ChevronRight,
  MoreHorizontal,
  ArrowUpDown,
  Download,
  X,
  Loader2
} from 'lucide-react'
import { useSocket } from '@/context/SocketContext'

const MONTHS = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO']

export default function HistoryPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [noteContent, setNoteContent] = useState('')

  // Estados de Filtro e Ordenação
  const [sortBy, setSortBy] = useState('date-desc') 
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isCustomDateActive, setIsCustomDateActive] = useState(false)
  const { socket } = useSocket()

  // Busca de Dados Reais
  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true)
      try {
        const token = localStorage.getItem('nexfin_auth')
        if (!token) {
          setError('Autenticação necessária.')
          return
        }

        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
        const response = await fetch(`${API}/accounts/open-finance/transactions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (!response.ok) throw new Error('Erro ao carregar extrato.')
        const data = await response.json()
        setTransactions(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchTransactions()
  }, [])

  // ─── Real-time Listener ────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return

    socket.on('transaction:new', (data) => {
      console.log('[Socket] Nova transação recebida:', data)
      // Adiciona a nova transação no topo do estado
      setTransactions(prev => [data, ...prev])
      
      // Feedback visual opcional: Se for uma entrada (Pix), poderíamos mostrar um toast
    })

    return () => {
      socket.off('transaction:new')
    }
  }, [socket])

  // Filtros e Ordenação
  const filteredTransactions = useMemo(() => {
    let result = transactions.filter(t => {
      const tDate = new Date(t.date)
      
      let matchesTime = false
      if (isCustomDateActive && startDate && endDate) {
        const start = new Date(startDate)
        const end = new Date(endDate)
        start.setHours(0,0,0,0)
        end.setHours(23,59,59,999)
        matchesTime = tDate >= start && tDate <= end
      } else {
        matchesTime = tDate.getMonth() === selectedMonth && tDate.getFullYear() === new Date().getFullYear()
      }

      const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.bank.toLowerCase().includes(searchQuery.toLowerCase())
      
      return matchesTime && matchesSearch
    })

    result.sort((a, b) => {
      const valA = Math.abs(a.amount)
      const valB = Math.abs(b.amount)
      
      if (sortBy === 'amount-desc') return valB - valA
      if (sortBy === 'amount-asc') return valA - valB
      if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime()
      if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime()
      if (sortBy === 'name-asc') return a.description.localeCompare(b.description)
      return 0
    })

    return result
  }, [selectedMonth, searchQuery, transactions, sortBy, isCustomDateActive, startDate, endDate])

  const openNoteModal = (t: any) => {
    setSelectedTransaction(t)
    setNoteContent(t.note || '')
    setShowNoteModal(true)
  }

  const saveNote = () => {
    setTransactions(prev => prev.map(t => 
      t.id === selectedTransaction.id ? { ...t, note: noteContent } : t
    ))
    setShowNoteModal(false)
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
      
      {/* Cabeçalho */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>
          Extrato Detalhado
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>
          Acompanhe cada entrada e saída de forma inteligente.
        </p>
      </div>

      {/* Barra de Ferramentas / Filtros */}
      <div style={{ 
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 4, padding: '16px 24px', marginBottom: 32,
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 24,
        justifyContent: 'space-between'
      }}>
        
        {/* Seletor de Mês */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            onClick={() => setSelectedMonth(prev => prev > 0 ? prev - 1 : 11)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
          >
            <ChevronLeft size={20} />
          </button>
          <div style={{ width: 120, textAlign: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#3b82f6', letterSpacing: '0.1em' }}>
              {MONTHS[selectedMonth]} 2026
            </span>
          </div>
          <button 
            onClick={() => setSelectedMonth(prev => prev < 11 ? prev + 1 : 0)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Busca e Período */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, maxWidth: 600 }}>
          <div style={{ 
            position: 'relative', flex: 1, 
            background: 'rgba(255,255,255,0.03)', borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou banco..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                width: '100%', padding: '12px 12px 12px 42px', background: 'none', border: 'none',
                color: '#fff', fontSize: 13, outline: 'none'
              }}
            />
          </div>
          
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px',
                background: showFilterMenu ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.03)', 
                border: showFilterMenu ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                borderRadius: 4, color: showFilterMenu ? '#3b82f6' : 'rgba(255,255,255,0.6)', 
                fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
                letterSpacing: '0.05em'
              }}
            >
              <Filter size={14} />
              FILTROS
            </button>

            {/* Menu Dropdown de Filtros */}
            <AnimatePresence>
              {showFilterMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 8,
                    width: 200, background: '#0a1224', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 4, padding: '12px 8px', zIndex: 100,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)'
                  }}
                >
                  <p style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.2)', padding: '0 12px 8px', letterSpacing: '0.05em' }}>
                    ORDENAR POR
                  </p>
                  {[
                    { id: 'date-desc', label: 'Mais Recentes', icon: Calendar },
                    { id: 'amount-desc', label: 'Maior Valor', icon: ArrowUpRight },
                    { id: 'amount-asc', label: 'Menor Valor', icon: ArrowDownLeft },
                    { id: 'name-asc', label: 'Nome (A-Z)', icon: Search }
                  ].map(option => (
                    <button
                      key={option.id}
                      onClick={() => { setSortBy(option.id); setShowFilterMenu(false); }}
                      style={{
                        width: '100%', padding: '10px 12px', background: sortBy === option.id ? 'rgba(59,130,246,0.1)' : 'none',
                        border: 'none', borderRadius: 4, color: sortBy === option.id ? '#3b82f6' : '#fff',
                        fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10,
                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => { if (sortBy !== option.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={(e) => { if (sortBy !== option.id) e.currentTarget.style.background = 'none'; }}
                    >
                      <option.icon size={14} />
                      {option.label}
                    </button>
                  ))}
                  
                  <div style={{ margin: '8px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }} />
                  
                  <p style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.2)', padding: '8px 12px', letterSpacing: '0.05em' }}>
                    PERÍODO CUSTOMIZADO
                  </p>

                  <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>DE</label>
                      <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{ 
                          width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 4, color: '#fff', fontSize: 11, padding: '6px 8px', outline: 'none'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>ATÉ</label>
                      <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{ 
                          width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 4, color: '#fff', fontSize: 11, padding: '6px 8px', outline: 'none'
                        }}
                      />
                    </div>
                    
                    <button
                      onClick={() => {
                        if (startDate && endDate) {
                          setIsCustomDateActive(true)
                          setShowFilterMenu(false)
                        } else {
                          setIsCustomDateActive(false)
                        }
                      }}
                      style={{
                        width: '100%', padding: '8px', background: isCustomDateActive ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                        border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, fontWeight: 800,
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      {isCustomDateActive ? 'FILTRO ATIVO' : 'APLICAR PERÍODO'}
                    </button>

                    {isCustomDateActive && (
                      <button
                        onClick={() => {
                          setIsCustomDateActive(false)
                          setStartDate('')
                          setEndDate('')
                          setShowFilterMenu(false)
                        }}
                        style={{
                          width: '100%', background: 'none', border: 'none', color: '#ef4444',
                          fontSize: 10, fontWeight: 700, cursor: 'pointer', textAlign: 'center'
                        }}
                      >
                        LIMPAR PERÍODO
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button style={{ 
             background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)',
             padding: '12px', borderRadius: 4, color: '#3b82f6', cursor: 'pointer'
          }}>
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Tabela de Transações */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em' }}>
              <th style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>STATUS</th>
              <th style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>DESCRIÇÃO</th>
              <th style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>BANCO</th>
              <th style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>DATA</th>
              <th style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'right' }}>VALOR</th>
              <th style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>NOTA</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '80px 0', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        style={{ color: '#3b82f6' }}
                      >
                        <Loader2 size={32} />
                      </motion.div>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em' }}>
                        SINCRONIZANDO DADOS REAIS...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} style={{ padding: '80px 0', textAlign: 'center' }}>
                    <div style={{ color: '#ef4444', fontSize: 14, fontWeight: 600 }}>{error}</div>
                  </td>
                </tr>
              ) : filteredTransactions.map((t) => (
                <motion.tr 
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: 'rgba(255,255,255,0.01)',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'}
                >
                  <td style={{ padding: '20px' }}>
                    {t.amount > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#22c55e', fontSize: 10, fontWeight: 800 }}>
                        <ArrowDownLeft size={14} /> ENTRADA
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontSize: 10, fontWeight: 800 }}>
                        <ArrowUpRight size={14} /> SAÍDA
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{t.description}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ 
                          fontSize: 10, padding: '2px 6px', borderRadius: 4, 
                          background: t.accountType === 'CREDIT' ? 'rgba(124, 58, 237, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                          color: t.accountType === 'CREDIT' ? '#a78bfa' : '#60a5fa',
                          fontWeight: 700, border: `1px solid ${t.accountType === 'CREDIT' ? 'rgba(124, 58, 237, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`
                        }}>
                          {t.accountType === 'CREDIT' ? 'CRÉDITO' : 'DÉBITO'}
                        </span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>•</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{t.bank || 'Banco'}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ 
                        width: 24, height: 24, borderRadius: 4, background: t.bankColor || '#3b82f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 10, fontWeight: 900
                      }}>
                        {t.bank ? t.bank[0] : 'B'}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '20px' }}>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                      {new Date(t.date).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td style={{ padding: '20px', textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: 15, fontWeight: 700, 
                      color: t.amount > 0 ? '#22c55e' : '#fff' 
                    }}>
                      {t.amount > 0 ? `+ ` : `- `}
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: t.currency || 'BRL' }).format(Math.abs(t.amount))}
                    </div>
                  </td>
                  <td style={{ padding: '20px', textAlign: 'center' }}>
                    <button 
                      onClick={() => openNoteModal(t)}
                      style={{ 
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: t.note ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                        transition: 'color 0.2s'
                      }}
                    >
                      <StickyNote size={18} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        {filteredTransactions.length === 0 && (
          <div style={{ padding: '80px 0', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
             Nenhuma transação encontrada para este período.
          </div>
        )}
      </div>

      {/* Modal de Notas */}
      <AnimatePresence>
        {showNoteModal && (
          <div style={{ 
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            backdropFilter: 'blur(10px)'
          }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{ 
                width: '100%', maxWidth: 450, background: '#0a1224',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
                padding: '32px', boxShadow: '0 40px 100px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Adicionar Nota</h3>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{selectedTransaction?.description}</p>
                </div>
                <button 
                  onClick={() => setShowNoteModal(false)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <textarea 
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Escreva aqui sua observação sobre esta compra..."
                style={{ 
                  width: '100%', height: 160, background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
                  padding: 16, color: '#fff', fontSize: 14, outline: 'none',
                  resize: 'none', marginBottom: 24, boxSizing: 'border-box'
                }}
              />

              <div style={{ display: 'flex', gap: 16 }}>
                <button 
                  onClick={() => setShowNoteModal(false)}
                  style={{ 
                    flex: 1, padding: '14px', borderRadius: 4, border: '1px solid #fff',
                    background: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  CANCELAR
                </button>
                <button 
                   onClick={saveNote}
                   style={{ 
                    flex: 1, padding: '14px', borderRadius: 4, border: 'none',
                    background: '#3b82f6', color: '#fff', fontWeight: 800, cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  SALVAR NOTA
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
