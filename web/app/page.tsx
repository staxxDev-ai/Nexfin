'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Mail, Sparkles, ShieldCheck, Zap } from 'lucide-react'

export default function RootPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Se o usuário já está logado, pula a landing
    if (localStorage.getItem('nexfin_auth')) {
      router.replace('/dashboard')
      return
    }
    setMounted(true)
  }, [router])

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) return

    setLoading(true)
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()

      if (data.exists) {
        router.push(`/login?email=${encodeURIComponent(email)}`)
      } else {
        router.push(`/register?email=${encodeURIComponent(email)}`)
      }
    } catch (err) {
      // Se der erro na checagem, manda para o registro por padrão
      router.push(`/register?email=${encodeURIComponent(email)}`)
    }
  }

  if (!mounted) return null

  return (
    <div style={containerStyle}>
      {/* Background Decorativo */}
      <div style={backgroundWrapper}>
        <div style={gridBackground} />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
          style={blurCircle1} 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          style={blurCircle2} 
        />
      </div>

      {/* Header / Logo */}
      <header style={headerStyle}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <Image src="/logo-devoc-white.png" alt="NEXFIN" width={180} height={60} style={{ objectFit: 'contain' }} />
        </motion.div>
      </header>

      {/* Hero Content */}
      <main style={mainStyle}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          style={heroBadge}
        >
          <Sparkles size={14} color="#60a5fa" />
          <span>INTELIGÊNCIA FINANCEIRA DE ELITE</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={titleStyle}
        >
          Domine suas finanças <br />
          <span style={gradientText}>com o poder da IA.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={subtitleStyle}
        >
          Uma nova era de gestão patrimonial. O Nexfin combina análise inteligente de dados <br />
          com uma interface de elite para transformar sua vida financeira.
        </motion.p>

        {/* Formulário de Início Rápido */}
        <motion.form
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          onSubmit={handleContinue}
          style={formStyle}
        >
          <div style={inputContainer}>
            <Mail style={inputIcon} size={20} />
            <input
              type="email"
              placeholder="Digite seu e-mail para começar"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              required
            />
          </div>
          <button type="submit" disabled={loading} style={buttonStyle}>
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={loaderStyle}>
                  Checando...
                </motion.div>
              ) : (
                <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={buttonInner}>
                  Continuar <ArrowRight size={18} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </motion.form>

        {/* Features Rápidas */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          style={featuresContainer}
        >
          <div style={featureItem}><ShieldCheck size={16} /> Secure Enrollment</div>
          <div style={featureDivider} />
          <div style={featureItem}><Zap size={16} /> AI Insights</div>
          <div style={featureDivider} />
          <div style={featureItem}><Sparkles size={16} /> Open Finance</div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer style={footerStyle}>
        NEXFIN — DESENVOLVIDO PELA DEVOC PARA MENTES VISIONÁRIAS
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { margin: 0; padding: 0; overflow-x: hidden; background: #050d1e; }
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:focus { outline: none; box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.3); }
      `}</style>
    </div>
  )
}

// Estilos Core
const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex', flexDirection: 'column',
  color: '#fff',
  fontFamily: '"Inter", sans-serif',
  position: 'relative', overflow: 'hidden',
}

const backgroundWrapper: React.CSSProperties = {
  position: 'absolute', inset: 0, zIndex: -1, background: '#050d1e',
}

const gridBackground: React.CSSProperties = {
  position: 'absolute', inset: 0,
  backgroundImage: `
    linear-gradient(to right, rgba(59,130,246,0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(59,130,246,0.05) 1px, transparent 1px)
  `,
  backgroundSize: '80px 80px',
  maskImage: 'radial-gradient(circle at center, black, transparent)',
  WebkitMaskImage: 'radial-gradient(circle at center, black, transparent)',
}

const blurCircle1: React.CSSProperties = {
  position: 'absolute', top: '10%', right: '10%', width: 500, height: 500,
  background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(80px)',
}

const blurCircle2: React.CSSProperties = {
  position: 'absolute', bottom: '10%', left: '10%', width: 400, height: 400,
  background: 'radial-gradient(circle, rgba(147,51,234,0.1) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(80px)',
}

const headerStyle: React.CSSProperties = {
  padding: '40px 60px', display: 'flex', justifyContent: 'center',
}

const mainStyle: React.CSSProperties = {
  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  padding: '0 24px', textAlign: 'center', zIndex: 1,
}

const heroBadge: React.CSSProperties = {
  background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)',
  padding: '8px 16px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: 8,
  fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#60a5fa', marginBottom: 24,
}

const titleStyle: React.CSSProperties = {
  fontSize: 'clamp(32px, 5vw, 68px)', fontWeight: 800, lineHeight: 1.1, margin: 0, letterSpacing: '-0.02em',
}

const gradientText: React.CSSProperties = {
  background: 'linear-gradient(to right, #60a5fa, #a855f7)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
}

const subtitleStyle: React.CSSProperties = {
  fontSize: 'clamp(14px, 1.5vw, 18px)', color: 'rgba(255,255,255,0.5)', marginTop: 24, lineHeight: 1.6, maxWidth: 800,
}

const formStyle: React.CSSProperties = {
  display: 'flex', gap: 12, width: '100%', maxWidth: 500, marginTop: 48,
  background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 20,
  border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)',
  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
}

const inputContainer: React.CSSProperties = {
  flex: 1, position: 'relative', display: 'flex', alignItems: 'center',
}

const inputIcon: React.CSSProperties = {
  position: 'absolute', left: 16, color: 'rgba(255,255,255,0.3)',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '16px 16px 16px 48px',
  background: 'transparent', border: 'none', color: '#fff', fontSize: 16,
}

const buttonStyle: React.CSSProperties = {
  padding: '16px 32px', borderRadius: '14px',
  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
  color: '#fff', border: 'none', fontWeight: 700, fontSize: 15,
  cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: 8,
  boxShadow: '0 4px 15px rgba(37,99,235,0.3)',
}

const buttonInner: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
}

const loaderStyle: React.CSSProperties = {
  fontSize: 14, opacity: 0.8,
}

const featuresContainer: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 20, marginTop: 60, opacity: 0.7,
}

const featureItem: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em',
}

const featureDivider: React.CSSProperties = {
  width: 1, height: 12, background: 'rgba(255,255,255,0.1)',
}

const footerStyle: React.CSSProperties = {
  padding: 40, textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em', fontWeight: 600,
}
