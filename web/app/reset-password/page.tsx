'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    if (!token) {
      setError('Token de recuperação ausente ou inválido.')
      return
    }

    setLoading(true)

    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
      const response = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao redefinir senha.')
      }

      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
        <h2 style={{ color: '#fff', fontSize: 20, marginBottom: 12 }}>Senha Redefinida!</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          Sua senha foi atualizada com sucesso. Você será redirecionado para o login em instantes.
        </p>
        <button
          onClick={() => router.push('/login')}
          style={{
            width: '100%', padding: '14px', background: 'linear-gradient(135deg, #2563eb, #1e40af)',
            border: 'none', borderRadius: 12, color: '#fff', 
            fontSize: 14, fontWeight: 700, cursor: 'pointer'
          }}
        >
          IR PARA O LOGIN AGORA
        </button>
      </div>
    )
  }

  return (
    <>
      <h2 style={{ color: '#fff', fontSize: 20, marginBottom: 8 }}>Nova Senha</h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 24 }}>
        Crie uma senha forte e segura para sua conta.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 8, letterSpacing: '0.12em' }}>
            NOVA SENHA
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12, padding: '16px',
              color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 8, letterSpacing: '0.12em' }}>
            CONFIRMAR NOVA SENHA
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
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
          disabled={loading || !token}
          style={{
            width: '100%', padding: '16px', background: (loading || !token) ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #2563eb, #1e40af)',
            border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: (loading || !token) ? 'wait' : 'pointer', boxShadow: '0 8px 24px rgba(37,99,235,0.25)', transition: 'all 0.3s'
          }}
        >
          {loading ? 'ATUALIZANDO...' : 'REDEFINIR SENHA'}
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #050d1e 0%, #0a1535 40%, #0d1f45 70%, #091530 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Inter", sans-serif',
      padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
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

        <Suspense fallback={<p style={{ color: '#fff', textAlign: 'center' }}>Carregando...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </motion.div>
    </div>
  )
}
