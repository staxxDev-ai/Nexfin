'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null
  connected: boolean
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    // Obter o ID do usuário para autenticação no namespace
    const userId = localStorage.getItem('nexfin_user_id') || 'guest'
    
    // Conectar ao namespace /nexfin usando variável de ambiente para produção
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3002'
    const socketInstance = io(`${wsUrl}/nexfin`, {
      auth: { userId },
      transports: ['websocket'],
    })

    socketInstance.on('connect', () => {
      console.log('[Socket] Conectado ao servidor NEXFIN')
      setConnected(true)
    })

    socketInstance.on('disconnect', () => {
      console.log('[Socket] Desconectado')
      setConnected(false)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
