'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    // Já autenticado → vai direto para o dashboard
    if (localStorage.getItem('nexfin_auth')) {
      router.replace('/dashboard')
      return
    }

    // Já usou o sistema antes (lembrar marcado) → vai para login
    if (localStorage.getItem('nexfin_remember') === 'true') {
      router.replace('/login')
      return
    }

    // Nunca usou → vai para cadastro
    router.replace('/register')
  }, [router])

  // Tela de transição enquanto decide para onde ir
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #050d1e 0%, #0a1535 50%, #091530 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: 40, height: 40,
        border: '3px solid rgba(37,99,235,0.3)',
        borderTop: '3px solid #2563eb',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050d1e; }
      `}</style>
    </div>
  )
}
