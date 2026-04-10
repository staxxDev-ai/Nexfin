import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Usa API_URL (server-side) ou NEXT_PUBLIC_API_URL, com fallback hardcoded para o Railway
    const API = process.env.API_URL 
      || process.env.NEXT_PUBLIC_API_URL 
      || 'https://nexfin-production.up.railway.app/api/v1'

    console.log('[Proxy /auth/register] Conectando em:', API)

    const response = await fetch(`${API}/auth/register`, {
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
    console.error('[Proxy /auth/register] Erro:', err.message)
    return NextResponse.json(
      { message: 'Servidor indisponível. Verifique se o backend está online.' },
      { status: 503 }
    )
  }
}
