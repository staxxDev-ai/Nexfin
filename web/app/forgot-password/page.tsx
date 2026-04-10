'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
      const response = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Erro ao processar solicitação.')
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #050d1e 0%, #0a1535 40%, #0d1f45 70%, #091530 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Inter", sans-serif',
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%', maxWidth: 420,
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16, padding: '32px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          position: 'relative', zIndex: 10
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <Image src="/logo-devoc-white.png" alt="NEXFIN" width={180} height={40} priority style={{ objectFit: 'contain' }} />
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📧</div>
            <h2 style={{ color: '#fff', fontSize: 20, marginBottom: 12 }}>E-mail enviado!</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Se o e-mail informado estiver cadastrado, você receberá um link para redefinir sua senha em instantes.
            </p>
            <button
              onClick={() => router.push('/login')}
              style={{
                width: '100%', padding: '14px', background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff', 
                fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              VOLTAR PARA O LOGIN
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ color: '#fff', fontSize: 20, marginBottom: 8 }}>Recuperar Senha</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 24 }}>
              Informe seu e-mail corporativo para receber as instruções de recuperação.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 8, letterSpacing: '0.12em' }}>
                  E-MAIL CADASTRADO
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@empresa.com"
                  required
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 12, padding: '16px',
                    color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box'
                  }}
                />
                {error && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#fca5a5' }}>{error}</p>}
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
                {loading ? 'ENVIANDO...' : 'ENVIAR INSTRUÇÕES'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Link href="/login" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none' }}>
                Lembrou a senha? <span style={{ color: '#60a5fa', fontWeight: 600 }}>Fazer login</span>
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
