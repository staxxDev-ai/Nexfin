'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import ReCAPTCHA from 'react-google-recaptcha'

type FieldError = { email?: string; pass?: string; captcha?: string; general?: string }

// CHAVE DE PRODUÇÃO FORNECIDA PELO USUÁRIO (reCAPTCHA v3 / v2 Invisível)
const RECAPTCHA_SITE_KEY = "6LcZF6osAAAAAA9MzMe8QBSZ0LLjrlrvhJVVxtgr";

export default function LoginPage() {
  const router = useRouter()
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  const [step,           setStep]           = useState(1) // 1: Email, 2: Password
  const [email,          setEmail]          = useState('')
  const [password,       setPassword]       = useState('')
  const [showPass,       setShowPass]       = useState(false)
  const [errors,         setErrors]         = useState<FieldError>({})
  const [loading,        setLoading]        = useState(false)
  const [mounted,        setMounted]        = useState(false)

  // Monta animação inicial ao carregar a página
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('nexfin_auth')) {
      router.replace('/dashboard')
      return;
    }
    setMounted(true)
  }, [router])

  // Validação do Step 1 (E-mail)
  const handleNextStep = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrors({})
    
    if (!email.trim() || !email.includes('@')) {
      setErrors({ email: 'Informe um e-mail corporativo válido.' })
      return
    }
    setStep(2)
  }

  // Validação final e Gatilho do reCAPTCHA Invisível
  const onLoginAttempt = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    if (!password) {
      setErrors({ pass: 'Informe sua senha de acesso.' })
      return
    }

    setLoading(true)
    
    // Dispara a análise invisível do Google
    try {
      if (recaptchaRef.current) {
        recaptchaRef.current.execute();
      }
    } catch (err) {
      setLoading(false)
      setErrors({ general: 'Falha ao iniciar verificação de segurança.' })
    }
  }

  // Executado quando o Google retorna o token invisível
  const onReCaptchaChange = async (token: string | null) => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
      const response = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, recaptchaToken: token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Credenciais inválidas.');
      }

      localStorage.setItem('nexfin_auth', data.access_token)
      localStorage.setItem('nexfin_user', data.user.name)
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

      {/* Grade de fundo tecnológica geométrica */}
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

      {/* Glow decorativo pulsante */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.22, 0.15] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute', top: '-15%', left: '50%', transform: 'translateX(-50%)',
          width: 900, height: 900, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(29,78,216,0.2) 0%, transparent 75%)',
          pointerEvents: 'none', zIndex: 2
        }}
      />

      {/* Card de login principal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        layout
        style={{
          width: '100%', maxWidth: 420,
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 4, 
          padding: '24px 32px 32px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02) inset',
          position: 'relative', zIndex: 10
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 0, marginTop: -30 }}>
          <Image src="/logo-devoc-white.png" alt="NEXFIN" width={320} height={280} priority style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 20px rgba(59,130,246,0.3))' }} />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.5 }}>
              <form onSubmit={handleNextStep}>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 8, letterSpacing: '0.12em' }}>
                    IDENTIFICAÇÃO CORPORATIVA
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.3, fontSize: 18 }}>✉️</span>
                    <input
                      autoFocus
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setErrors({}) }}
                      placeholder="seu@empresa.com"
                      style={{
                        width: '100%', background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${errors.email ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.12)'}`,
                        borderRadius: 12, padding: '16px 16px 16px 48px',
                        color: '#fff', fontSize: 15, outline: 'none', transition: 'all 0.2s',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  {errors.email && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#fca5a5' }}>{errors.email}</p>}
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%', padding: '16px', background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                    border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700,
                    cursor: 'pointer', boxShadow: '0 8px 24px rgba(37,99,235,0.25)', transition: 'all 0.3s'
                  }}
                >
                  PRÓXIMO PASSO
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.5 }}>
              <div 
                onClick={() => setStep(1)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                  background: 'rgba(255,255,255,0.04)', borderRadius: 10, cursor: 'pointer',
                  marginBottom: 20, border: '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <span style={{ fontSize: 12, opacity: 0.5 }}>👤</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{email}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#60a5fa', fontWeight: 600 }}>EDITAR</span>
              </div>

              <form onSubmit={onLoginAttempt}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 8, letterSpacing: '0.12em' }}>
                    SENHA DE ACESSO
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }}>🔑</span>
                    <input
                      autoFocus
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setErrors({}) }}
                      placeholder="••••••••"
                      style={{
                        width: '100%', background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${errors.pass ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.12)'}`,
                        borderRadius: 12, padding: '16px 48px 16px 48px',
                        color: '#fff', fontSize: 15, outline: 'none', transition: 'all 0.2s',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {errors.pass && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#fca5a5' }}>{errors.pass}</p>}
                </div>


                {errors.general && <p style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '10px', borderRadius: 10, fontSize: 12, marginBottom: 16 }}>⚠️ {errors.general}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '16px', background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #2563eb, #1e40af)',
                    border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700,
                    cursor: loading ? 'wait' : 'pointer', boxShadow: '0 8px 24px rgba(37,99,235,0.25)', transition: 'all 0.3s'
                  }}
                >
                  {loading ? 'AUTENTICANDO...' : 'ACESSAR PLATAFORMA'}
                </button>

                <div style={{ textAlign: 'center', marginTop: 20 }}>
                  <Link 
                    href="/forgot-password" 
                    style={{ 
                      color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none', 
                      fontWeight: 500, transition: 'color 0.2s' 
                    }}
                    onMouseOver={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                    onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                  >
                    Esqueci minha senha
                  </Link>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ textAlign: 'center', marginTop: 32, fontSize: 10, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.15em', fontWeight: 600, textTransform: 'uppercase' }}>
          NEXFIN CORE v1 - 2026
        </div>
      </motion.div>

      {/* google reCAPTCHA Invisível - Flutuando no canto inferior direito */}
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
        button:active:not(:disabled) { transform: translateY(0); }
      `}</style>
    </div>
  )
}
