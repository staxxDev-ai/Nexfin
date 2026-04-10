import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Usa API_URL (server-side) ou NEXT_PUBLIC_API_URL, com fallback hardcoded para o Railway
    const API = process.env.API_URL 
      || process.env.NEXT_PUBLIC_API_URL 
      || 'https://nexfin-production.up.railway.app/api/v1'

    console.log('[Proxy /auth/login] Conectando em:', API)

    const response = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err: any) {
    console.error('[Proxy /auth/login] Erro detalhado:', {
      message: err.message,
      code: err.code,
      stack: err.stack
    })
    return NextResponse.json(
      { message: `Erro de conexão: ${err.message}. Verifique se a URL ${process.env.API_URL || 'https://nexfin-production.up.railway.app'} está correta.` },
      { status: 503 }
    )
  }
}
