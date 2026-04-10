'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import ReCAPTCHA from 'react-google-recaptcha'

type RegisterError = { name?: string; email?: string; pass?: string; confirmPass?: string; general?: string }

const RECAPTCHA_SITE_KEY = "6LcZF6osAAAAAA9MzMe8QBSZ0LLjrlrvhJVVxtgr";

export default function RegisterPage() {
  const router = useRouter()
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  const [name,          setName]          = useState('')
  const [email,         setEmail]         = useState('')
  const [password,      setPassword]      = useState('')
  const [confirmPass,   setConfirmPass]   = useState('')
  const [showPass,      setShowPass]      = useState(false)
  const [errors,        setErrors]        = useState<RegisterError>({})
  const [loading,       setLoading]       = useState(false)
  const [mounted,       setMounted]       = useState(false)
  const [remember,      setRemember]      = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('nexfin_auth')) {
        router.replace('/dashboard')
        return;
      }
      setRemember(localStorage.getItem('nexfin_remember') === 'true');
    }
    setMounted(true)
  }, [router])

  const onRegisterAttempt = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    // Validações básicas de frontend
    if (!name.trim()) {
      setErrors({ name: 'Informe seu nome completo.' })
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setErrors({ email: 'Informe um e-mail válido.' })
      return
    }
    if (password.length < 6) {
      setErrors({ pass: 'A senha deve ter no mínimo 6 caracteres.' })
      return
    }
    if (password !== confirmPass) {
      setErrors({ confirmPass: 'As senhas não coincidem.' })
      return
    }

    setLoading(true)
    
    try {
      if (recaptchaRef.current) {
        recaptchaRef.current.execute();
      }
    } catch (err) {
      setLoading(false)
      setErrors({ general: 'Falha ao iniciar verificação de segurança.' })
    }
  }

  const onReCaptchaChange = async (token: string | null) => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
      const response = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, recaptchaToken: token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Falha ao criar conta.');
      }

      // Login automático
      localStorage.setItem('nexfin_auth', data.access_token)
      localStorage.setItem('nexfin_user', data.user.name)

      // Se o usuário marcou lembrar dados
      if (remember) {
        localStorage.setItem('nexfin_saved_email', email);
      }

      router.replace('/dashboard')

    } catch (err: any) {
      setErrors({ general: err.message })
      recaptchaRef.current?.reset()
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #050d1e 0%, #0a1535 40%, #0d1f45 70%, #091530 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Inter", "Helvetica Neue", sans-serif',
      padding: '24px', position: 'relative', overflow: 'hidden',
    }}>

      {/* Grade de fundo tecnológica */}
      <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(59, 130, 246, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59, 130, 246, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 0%, transparent 80%)',
          pointerEvents: 'none', zIndex: 1
      }}/>

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
          position: 'relative', zIndex: 10
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24, marginTop: -20 }}>
          <Image src="/logo-devoc-white.png" alt="NEXFIN" width={240} height={180} priority style={{ objectFit: 'contain' }} />
          <h2 style={{ fontSize: 18, color: '#fff', fontWeight: 600, letterSpacing: '0.05em', margin: '-10px 0 0' }}>Crie sua conta</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>Entre para o futuro da gestão financeira</p>
        </div>

        <form onSubmit={onRegisterAttempt}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 6, letterSpacing: '0.1em' }}>NOME COMPLETO</label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setErrors({}) }}
              placeholder="Ex: João Silva"
              style={inputStyle(!!errors.name)}
            />
            {errors.name && <p style={errorText}>{errors.name}</p>}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 6, letterSpacing: '0.1em' }}>E-MAIL CORPORATIVO</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors({}) }}
              placeholder="seu@empresa.com"
              style={inputStyle(!!errors.email)}
            />
            {errors.email && <p style={errorText}>{errors.email}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 6, letterSpacing: '0.1em' }}>SENHA</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors({}) }}
                placeholder="••••••"
                style={inputStyle(!!errors.pass)}
              />
              {errors.pass && <p style={errorText}>{errors.pass}</p>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 6, letterSpacing: '0.1em' }}>CONFIRMAR</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirmPass}
                onChange={e => { setConfirmPass(e.target.value); setErrors({}) }}
                placeholder="••••••"
                style={inputStyle(!!errors.confirmPass)}
              />
              {errors.confirmPass && <p style={errorText}>{errors.confirmPass}</p>}
            </div>
          </div>

          {errors.general && <p style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '10px', borderRadius: 8, fontSize: 12, marginBottom: 16 }}>⚠️ {errors.general}</p>}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
            <input 
              type="checkbox" 
              id="remember_reg" 
              checked={remember}
              onChange={(e) => {
                const isChecked = e.target.checked;
                setRemember(isChecked);
                localStorage.setItem('nexfin_remember', isChecked.toString());
                if (!isChecked) localStorage.removeItem('nexfin_saved_email');
              }}
              style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#2563eb' }}
            />
            <label htmlFor="remember_reg" style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', userSelect: 'none' }}>
              Lembrar meus dados neste navegador
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '16px', background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #2563eb, #1e40af)',
              border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer', boxShadow: '0 8px 24px rgba(37,99,235,0.25)', transition: 'all 0.3s'
            }}
          >
            {loading ? 'CRIANDO CONTA...' : 'CRIAR MINHA CONTA'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              Já tem uma conta?{' '}
              <Link href="/login" style={{ color: '#60a5fa', fontWeight: 600, textDecoration: 'none' }}>
                Fazer login
              </Link>
            </p>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: 32, fontSize: 10, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.15em', fontWeight: 600, textTransform: 'uppercase' }}>
          SECURE ENROLLMENT - v1.0
        </div>
      </motion.div>

      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={RECAPTCHA_SITE_KEY}
        size="invisible"
        badge="bottomright"
        theme="dark"
        onChange={onReCaptchaChange}
      />

      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #050d1e; font-family: "Inter", sans-serif; overflow: hidden; }
        input:focus { border-color: rgba(96,165,250,0.5) !important; background: rgba(255,255,255,0.08) !important; }
        button:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.1); }
      `}</style>
    </div>
  )
}

const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: '100%', background: 'rgba(255,255,255,0.05)',
  border: `1px solid ${hasError ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.12)'}`,
  borderRadius: 12, padding: '14px 16px',
  color: '#fff', fontSize: 14, outline: 'none', transition: 'all 0.2s',
  boxSizing: 'border-box',
})

const errorText: React.CSSProperties = {
  margin: '6px 0 0', fontSize: 11, color: '#fca5a5'
}
