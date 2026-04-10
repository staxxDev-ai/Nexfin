import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const API = process.env.API_URL 
      || process.env.NEXT_PUBLIC_API_URL 
      || 'https://nexfin-production.up.railway.app/api/v1'

    console.log('[Proxy /auth/check-email] Verificando e-mail em:', API)

    let response = await fetch(`${API}/auth/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    // Fallback de 404 (sem prefixo)
    if (response.status === 404 && API.includes('/api/v1')) {
      const fallbackAPI = API.replace('/api/v1', '')
      response = await fetch(`${fallbackAPI}/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    }

    const contentType = response.headers.get('content-type')
    let data
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      const text = await response.text()
      console.error('[Proxy /auth/check-email] Resposta não-JSON:', { status: response.status, text: text.substring(0, 200) })
      return NextResponse.json({ message: 'Erro de resposta do servidor.' }, { status: response.status })
    }

    return NextResponse.json(data, { status: response.ok ? 200 : response.status })
  } catch (err: any) {
    console.error('[Proxy /auth/check-email] Erro:', err.message)
    return NextResponse.json({ message: `Erro de conexão: ${err.message}` }, { status: 503 })
  }
}
