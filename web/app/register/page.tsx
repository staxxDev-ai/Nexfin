'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'

type RegisterError = {
  name?: string
  email?: string
  pass?: string
  confirmPass?: string
  general?: string
}

export default function RegisterPage() {
  const router = useRouter()

  const [name,         setName]         = useState('')
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [confirmPass,  setConfirmPass]  = useState('')
  const [errors,       setErrors]       = useState<RegisterError>({})
  const [loading,      setLoading]      = useState(false)
  const [mounted,      setMounted]      = useState(false)
  const [remember,     setRemember]     = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('nexfin_auth')) {
      router.replace('/dashboard')
      return
    }
    setRemember(localStorage.getItem('nexfin_remember') === 'true')
    setMounted(true)
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!name.trim()) return setErrors({ name: 'Informe seu nome completo.' })
    if (!email.trim() || !email.includes('@')) return setErrors({ email: 'Informe um e-mail válido.' })
    if (password.length < 6) return setErrors({ pass: 'Mínimo 6 caracteres.' })
    if (password !== confirmPass) return setErrors({ confirmPass: 'As senhas não coincidem.' })

    setLoading(true)

    try {
      // Chama a rota proxy do Next.js (mesmo domínio = sem CORS)
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, recaptchaToken: 'bypass' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `Erro ${response.status}`)
      }

      localStorage.setItem('nexfin_auth', data.access_token)
      localStorage.setItem('nexfin_user', data.user.name)
      if (remember) localStorage.setItem('nexfin_saved_email', email)

      router.replace('/dashboard')
    } catch (err: any) {
      setErrors({ general: err.message || 'Erro ao criar conta. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #050d1e 0%, #0a1535 40%, #0d1f45 70%, #091530 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Inter", "Helvetica Neue", sans-serif',
      padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(to right, rgba(59,130,246,0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(59,130,246,0.08) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 0%, transparent 80%)',
        pointerEvents: 'none', zIndex: 1,
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: '100%', maxWidth: 450,
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 4,
          padding: '24px 32px 32px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          position: 'relative', zIndex: 10,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24, marginTop: -20 }}>
          <Image src="/logo-devoc-white.png" alt="NEXFIN" width={240} height={180} priority style={{ objectFit: 'contain' }} />
          <h2 style={{ fontSize: 18, color: '#fff', fontWeight: 600, letterSpacing: '0.05em', margin: '-10px 0 0' }}>Crie sua conta</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>Entre para o futuro da gestão financeira</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Nome */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>NOME COMPLETO</label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setErrors({}) }}
              placeholder="Ex: João Silva"
              style={inputStyle(!!errors.name)}
            />
            {errors.name && <p style={errorText}>{errors.name}</p>}
          </div>

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>E-MAIL</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors({}) }}
              placeholder="seu@email.com"
              style={inputStyle(!!errors.email)}
            />
            {errors.email && <p style={errorText}>{errors.email}</p>}
          </div>

          {/* Senhas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ position: 'relative' }}>
              <label style={labelStyle}>SENHA</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors({}) }}
                placeholder="••••••"
                style={inputStyle(!!errors.pass)}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} style={eyeStyle}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              {errors.pass && <p style={errorText}>{errors.pass}</p>}
            </div>
            <div style={{ position: 'relative' }}>
              <label style={labelStyle}>CONFIRMAR</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPass}
                onChange={e => { setConfirmPass(e.target.value); setErrors({}) }}
                placeholder="••••••"
                style={inputStyle(!!errors.confirmPass)}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} style={eyeStyle}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              {errors.confirmPass && <p style={errorText}>{errors.confirmPass}</p>}
            </div>
          </div>

          {/* Erro Geral */}
          {errors.general && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
              ⚠️ {errors.general}
            </div>
          )}

          {/* Lembrar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
            <input
              type="checkbox"
              id="remember_reg"
              checked={remember}
              onChange={e => {
                setRemember(e.target.checked)
                localStorage.setItem('nexfin_remember', String(e.target.checked))
                if (!e.target.checked) localStorage.removeItem('nexfin_saved_email')
              }}
              style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#2563eb' }}
            />
            <label htmlFor="remember_reg" style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', userSelect: 'none' }}>
              Lembrar meus dados neste navegador
            </label>
          </div>

          {/* Botão */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '16px',
              background: loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #2563eb, #1e40af)',
              border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 8px 24px rgba(37,99,235,0.3)',
              transition: 'all 0.3s',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '⏳ CRIANDO CONTA...' : 'CRIAR MINHA CONTA →'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              Já tem uma conta?{' '}
              <Link href="/login" style={{ color: '#60a5fa', fontWeight: 600, textDecoration: 'none' }}>
                Fazer login
              </Link>
            </p>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: 28, fontSize: 10, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.15em', fontWeight: 600 }}>
          NEXFIN · SECURE ENROLLMENT
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

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 700,
  color: 'rgba(255,255,255,0.3)', marginBottom: 6, letterSpacing: '0.1em',
}

const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: `1px solid ${hasError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.12)'}`,
  borderRadius: 10, padding: '13px 40px 13px 14px',
  color: '#fff', fontSize: 13, outline: 'none', transition: 'all 0.2s',
  boxSizing: 'border-box',
})

const eyeStyle: React.CSSProperties = {
  position: 'absolute', right: 12,
  top: 'calc(50% + 10px)', transform: 'translateY(-50%)',
  background: 'none', border: 'none',
  color: 'rgba(255,255,255,0.35)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', padding: 0,
}

const errorText: React.CSSProperties = {
  margin: '5px 0 0', fontSize: 11, color: '#fca5a5',
}
