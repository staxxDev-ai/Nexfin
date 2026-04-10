'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  User, 
  AlertCircle, 
  Sparkles,
  Bot,
  Zap,
  Lock,
  Plus,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Clock
} from 'lucide-react'

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface Thread {
  id: string;
  title: string;
  createdAt: string;
  _count: { messages: number };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [threads, setThreads] = useState<Thread[]>([])
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGeminiActive, setIsGeminiActive] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1. Carregar lista de conversas e status da IA
  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    const init = async () => {
      const token = localStorage.getItem('nexfin_auth')
      if (!token) return

      try {
        // Status IA
        const statusRes = await fetch('http://localhost:3001/api/v1/ai-agents/status', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          signal: controller.signal
        })
        const statusData = await statusRes.json()
        if (isMounted) setIsGeminiActive(!!statusData?.active)

        // Lista de Threads
        const threadsRes = await fetch('http://localhost:3001/api/v1/ai-agents/threads', {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: controller.signal
        })
        const threadsData = await threadsRes.json()
        
        if (isMounted && Array.isArray(threadsData)) {
          setThreads(threadsData)
          // Se houver threads, carregar a mais recente
          if (threadsData.length > 0) {
            loadThread(threadsData[0].id)
          } else {
            startNewChat()
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error('Erro na inicialização:', err)
      }
    }
    init()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  // 2. Carregar mensagens de uma thread
  const loadThread = async (id: string) => {
    const token = localStorage.getItem('nexfin_auth')
    setCurrentThreadId(id)
    setMessages([]) // Limpar mensagens anteriores imediatamente para evitar flash de dados antigos
    setIsLoading(true)
    
    try {
      const res = await fetch(`http://localhost:3001/api/v1/ai-agents/threads/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (Array.isArray(data)) {
        setMessages(data)
      } else {
        setMessages([])
      }
    } catch (err) {
      console.error('Erro ao carregar thread:', err)
      setMessages([])
    } finally {
      setIsLoading(false)
    }
  }

  // 3. Iniciar Nova Conversa
  const startNewChat = async () => {
    const token = localStorage.getItem('nexfin_auth')
    setMessages([]) // Limpar tela imediatamente
    setIsLoading(true)
    try {
      const title = `Insight ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      const res = await fetch('http://localhost:3001/api/v1/ai-agents/threads', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ title })
      })
      const newThread = await res.json()
      setThreads(prev => [newThread, ...prev])
      setCurrentThreadId(newThread.id)
    } catch (err) {
      console.error('Erro ao criar conversa:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // 4. Deletar Conversa
  const deleteThread = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Deseja excluir esta conversa?')) return

    const token = localStorage.getItem('nexfin_auth')
    try {
      await fetch(`http://localhost:3001/api/v1/ai-agents/threads/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setThreads(prev => prev.filter(t => t.id !== id))
      if (currentThreadId === id) {
        setMessages([])
        setCurrentThreadId(null)
      }
    } catch (err) {
      console.error('Erro ao deletar:', err)
    }
  }

  // 5. Enviar Mensagem
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim() || isLoading) return

    const tempUserMsg: Message = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: input,
      createdAt: new Date().toISOString()
    }

    setMessages(prev => [...prev, tempUserMsg])
    const prompt = input
    setInput('')
    setIsLoading(true)

    try {
      const token = localStorage.getItem('nexfin_auth')
      const response = await fetch('http://localhost:3001/api/v1/ai-agents/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          agentName: 'NEXFIN_AI',
          message: prompt,
          threadId: currentThreadId
        })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.message)

      const assistantMsg: Message = {
        id: `temp-ai-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        createdAt: new Date().toISOString()
      }

      setMessages(prev => [...prev, assistantMsg])
      
      // Atualizar contador de mensagens na lista
      setThreads(prev => prev.map(t => 
        t.id === currentThreadId 
          ? { ...t, _count: { messages: (t._count?.messages || 0) + 2 } } 
          : t
      ))

    } catch (error: any) {
      console.error('Erro no chat:', error)
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`, role: 'assistant', content: `❌ Erro: ${error.message}`, createdAt: new Date().toISOString()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 48px)', margin: '0 -24px -24px -24px', overflow: 'hidden' }}>
      
      {/* Sidebar de Conversas */}
      <motion.div 
        animate={{ width: isSidebarOpen ? 280 : 0 }}
        style={{ 
          background: 'rgba(2, 6, 23, 0.4)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        <div style={{ padding: '24px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button 
            onClick={startNewChat}
            style={{
              width: '100%', padding: '12px', borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(37,99,235,0.02) 100%)',
              border: '1px solid rgba(37,99,235,0.3)', color: '#60a5fa',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <Plus size={18} /> Nova Conversa
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 8px' }}>
          {threads.map(t => (
            <div 
              key={t.id}
              onClick={() => loadThread(t.id)}
              style={{
                padding: '12px 14px', borderRadius: '10px', marginBottom: 4,
                background: currentThreadId === t.id ? 'rgba(37,99,235,0.1)' : 'transparent',
                border: `1px solid ${currentThreadId === t.id ? 'rgba(37,99,235,0.2)' : 'transparent'}`,
                cursor: 'pointer', position: 'relative', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 12
              }}
            >
              <MessageSquare size={16} color={currentThreadId === t.id ? '#60a5fa' : 'rgba(255,255,255,0.4)'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontSize: 13, color: currentThreadId === t.id ? '#fff' : 'rgba(255,255,255,0.7)',
                  fontWeight: currentThreadId === t.id ? 600 : 400,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                  {t.title}
                </div>
              </div>
              <button 
                onClick={(e) => deleteThread(t.id, e)}
                style={{ 
                  background: 'none', border: 'none', padding: 4, opacity: 0.3, cursor: 'pointer',
                  color: '#ef4444'
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Toggle Sidebar */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        style={{
          position: 'absolute', left: isSidebarOpen ? 268 : 12, top: '50%', transform: 'translateY(-50%)',
          zIndex: 100, width: 24, height: 48, borderRadius: '0 8px 8px 0',
          background: 'rgba(2, 6, 23, 0.8)', border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)',
          cursor: 'pointer', transition: 'all 0.3s'
        }}
      >
        {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 1100, margin: '0 auto', width: '100%', padding: '0 24px' }}>
        
        {/* Header */}
        <div style={{ 
          padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 48, height: 48, borderRadius: '14px', background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(37,99,235,0.2)'
            }}>
              <Bot size={24} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>NEXFIN AI</h2>
                {isGeminiActive && <Zap size={12} fill="#4ade80" color="#4ade80" />}
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Consultoria Master • {messages.length} Mensagens</p>
            </div>
          </div>
        </div>

        {/* Feed */}
        <div style={{ 
          flex: 1, overflowY: 'auto', padding: '32px 0', 
          display: 'flex', flexDirection: 'column', gap: 32,
          scrollbarWidth: 'none'
        }}>
          <AnimatePresence mode="popLayout">
            {messages.length === 0 && !isLoading && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 0.5, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{ 
                  height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  textAlign: 'center' 
                }}
              >
                <Sparkles size={48} color="#2563eb" style={{ marginBottom: 20 }} />
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>Como posso ajudar hoje?</h3>
                <p style={{ fontSize: 14, marginTop: 8 }}>Pergunte sobre seus saldos, investimentos ou runway.</p>
              </motion.div>
            )}

            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%', display: 'flex', gap: 16,
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                }}
              >
                <div style={{ 
                  width: 32, height: 32, borderRadius: '10px', 
                  background: msg.role === 'user' ? 'rgba(255,255,255,0.05)' : 'rgba(37,99,235,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  {msg.role === 'user' ? <User size={16} /> : <Sparkles size={16} color="#60a5fa" />}
                </div>
                <div style={{
                  padding: '12px 18px', borderRadius: '18px',
                  background: msg.role === 'user' ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#fff', fontSize: 15, lineHeight: 1.6, whiteSpace: 'pre-wrap'
                }}>
                  {msg.content}
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <div style={{ display: 'flex', gap: 16, alignSelf: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: '10px', background: 'rgba(37,99,235,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={16} color="#60a5fa" className="animate-pulse" />
                </div>
                <div style={{ padding: '12px 18px', borderRadius: '18px', background: 'rgba(255,255,255,0.02)', display: 'flex', gap: 4 }}>
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: 3, height: 3, borderRadius: '50%', background: '#60a5fa' }} />
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} style={{ width: 3, height: 3, borderRadius: '50%', background: '#60a5fa' }} />
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} style={{ width: 3, height: 3, borderRadius: '50%', background: '#60a5fa' }} />
                </div>
              </div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar - FIXED DESIGN */}
        <div style={{ padding: '24px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <form 
            onSubmit={handleSendMessage}
            style={{ 
              display: 'flex', 
              gap: 12, 
              alignItems: 'center',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '6px 6px 6px 16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="Pergunte qualquer coisa..."
              disabled={isLoading}
              rows={1}
              style={{
                flex: 1, background: 'none', border: 'none',
                color: '#fff', fontSize: 16, outline: 'none', resize: 'none',
                padding: '8px 0'
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', 
                border: 'none', borderRadius: '12px', width: 42, height: 42,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', cursor: 'pointer', opacity: isLoading || !input.trim() ? 0.3 : 1,
                boxShadow: '0 4px 10px rgba(37,99,235,0.2)', transition: 'all 0.2s'
              }}
            >
              <Send size={18} />
            </button>
          </form>
          <div style={{ 
            fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
          }}>
            <Clock size={10} /> O histórico de chat é salvo automaticamente.
          </div>
        </div>
      </div>
    </div>
  )
}
