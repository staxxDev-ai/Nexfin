import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

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
      { message: 'Falha na conexão com o servidor. Tente novamente.' },
      { status: 503 }
    )
  }
}
