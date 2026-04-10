import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const API = process.env.API_URL 
      || process.env.NEXT_PUBLIC_API_URL 
      || 'https://nexfin-production.up.railway.app/api/v1'

    console.log('[Proxy /auth/register] Conectando em:', API)

    const response = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const contentType = response.headers.get('content-type')
    let data
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      const text = await response.text()
      console.error('[Proxy /auth/register] Resposta não-JSON recebida:', {
        status: response.status,
        text: text.substring(0, 500)
      })
      return NextResponse.json(
        { message: `O backend no Railway retornou um erro (Status ${response.status}). Verifique os logs do Railway para detalhes.` },
        { status: response.status }
      )
    }

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err: any) {
    console.error('[Proxy /auth/register] Erro de rede:', {
      message: err.message,
      code: err.code
    })
    return NextResponse.json(
      { message: `Falha na conexão com o Railway (${err.message}). O servidor pode estar offline ou o endereço está incorreto.` },
      { status: 503 }
    )
  }
}
