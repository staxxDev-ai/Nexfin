'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

type LoginError = {
  email?: string
  pass?: string
  general?: string
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<LoginError>({})
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('nexfin_auth')) {
      router.replace('/dashboard')
      return
    }

    // Captura e-mail da URL
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    } else {
      const savedEmail = localStorage.getItem('nexfin_saved_email')
      if (savedEmail) setEmail(savedEmail)
    }

    setRemember(localStorage.getItem('nexfin_remember') === 'true')
    setMounted(true)
  }, [router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!email.trim() || !email.includes('@')) return setErrors({ email: 'Informe um e-mail válido.' })
    if (!password) return setErrors({ pass: 'Informe sua senha.' })

    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, recaptchaToken: 'bypass' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Credenciais inválidas.')
      }

      localStorage.setItem('nexfin_auth', data.access_token)
      localStorage.setItem('nexfin_user', data.user.name)
      
      if (remember) {
        localStorage.setItem('nexfin_saved_email', email)
        localStorage.setItem('nexfin_remember', 'true')
      } else {
        localStorage.removeItem('nexfin_saved_email')
        localStorage.setItem('nexfin_remember', 'false')
      }

      router.replace('/dashboard')
    } catch (err: any) {
      setErrors({ general: err.message || 'Erro ao entrar. Verifique seus dados.' })
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div style={containerStyle}>
      <div style={backgroundGrid} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={cardStyle}
      >
        <div style={{ textAlign: 'center', marginBottom: 24, marginTop: -20 }}>
          <Image src="/logo-devoc-white.png" alt="NEXFIN" width={200} height={100} priority style={{ objectFit: 'contain' }} />
          <h2 style={{ fontSize: 18, color: '#fff', fontWeight: 600, letterSpacing: '0.05em', margin: '-10px 0 0' }}>BEM-VINDO DE VOLTA</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>Acesse sua inteligência financeira</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>E-MAIL</label>
            <div style={inputWrapper}>
              <Mail size={16} style={inputIcon} />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors({}) }}
                placeholder="seu@email.com"
                style={inputStyle(!!errors.email)}
              />
            </div>
            {errors.email && <p style={errorText}>{errors.email}</p>}
          </div>

          {/* Senha */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={labelStyle}>SENHA</label>
              <Link href="/forgot-password" style={{ fontSize: 10, color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>ESQUECI MINHA SENHA</Link>
            </div>
            <div style={inputWrapper}>
              <Lock size={16} style={inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus={!!email}
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors({}) }}
                placeholder="••••••"
                style={inputStyle(!!errors.pass)}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} style={eyeStyle}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.pass && <p style={errorText}>{errors.pass}</p>}
          </div>

          {/* Erro Geral */}
          {errors.general && (
            <div style={generalErrorBox}>
              ⚠️ {errors.general}
            </div>
          )}

          {/* Lembrar */}
          <div style={rememberBox}>
            <input
              type="checkbox"
              id="remember_me"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              style={checkboxStyle}
            />
            <label htmlFor="remember_me" style={rememberLabel}>
              Mantenha-me conectado neste dispositivo
            </label>
          </div>

          {/* Botão */}
          <button type="submit" disabled={loading} style={submitButtonStyle(loading)}>
            {loading ? '⏳ AUTENTICANDO...' : 'ENTRAR NO NEXFIN →'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              Ainda não tem conta?{' '}
              <Link href="/register" style={linkStyle}>
                Criar conta gratuita
              </Link>
            </p>
          </div>
        </form>

        <div style={cardFooter}>
          NEXFIN · ENCRYPTED LOGIN
        </div>
      </motion.div>

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050d1e; font-family: "Inter", sans-serif; }
        input:focus { outline: none; border-color: rgba(96,165,250,0.6) !important; background: rgba(255,255,255,0.08) !important; }
        button:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
      `}</style>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}

// Estilos (Reutilizando consistência do Register)
const containerStyle: React.CSSProperties = {
  minHeight: '100vh', background: 'linear-gradient(135deg, #050d1e 0%, #0a1535 40%, #0d1f45 70%, #091530 100%)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden',
}

const backgroundGrid: React.CSSProperties = {
  position: 'absolute', inset: 0,
  backgroundImage: 'linear-gradient(to right, rgba(59,130,246,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(59,130,246,0.08) 1px, transparent 1px)',
  backgroundSize: '40px 40px', maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 80%)', WebkitMaskImage: 'radial-gradient(ellipse at center, black 0%, transparent 80%)',
  pointerEvents: 'none', zIndex: 1,
}

const cardStyle: React.CSSProperties = {
  width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: '32px', boxShadow: '0 32px 80px rgba(0,0,0,0.5)', position: 'relative', zIndex: 10,
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 6, letterSpacing: '0.1em',
}

const inputWrapper: React.CSSProperties = {
  position: 'relative', display: 'flex', alignItems: 'center',
}

const inputIcon: React.CSSProperties = {
  position: 'absolute', left: 12, color: 'rgba(255,255,255,0.2)',
}

const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${hasError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.12)'}`,
  borderRadius: 12, padding: '13px 14px 13px 40px', color: '#fff', fontSize: 13, outline: 'none', transition: 'all 0.2s',
})

const eyeStyle: React.CSSProperties = {
  position: 'absolute', right: 12, background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', display: 'flex', alignItems: 'center',
}

const errorText: React.CSSProperties = {
  margin: '5px 0 0', fontSize: 11, color: '#fca5a5',
}

const generalErrorBox: React.CSSProperties = {
  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16,
}

const rememberBox: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)',
}

const checkboxStyle: React.CSSProperties = {
  width: 14, height: 14, cursor: 'pointer', accentColor: '#2563eb',
}

const rememberLabel: React.CSSProperties = {
  fontSize: 12, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', userSelect: 'none',
}

const submitButtonStyle = (loading: boolean): React.CSSProperties => ({
  width: '100%', padding: '16px', background: loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #2563eb, #1e40af)',
  border: 'none', borderRadius: 14, color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
  boxShadow: loading ? 'none' : '0 8px 24px rgba(37,99,235,0.3)', transition: 'all 0.3s', opacity: loading ? 0.7 : 1,
})

const linkStyle: React.CSSProperties = {
  color: '#60a5fa', fontWeight: 600, textDecoration: 'none',
}

const cardFooter: React.CSSProperties = {
  textAlign: 'center', marginTop: 28, fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', fontWeight: 600,
}
