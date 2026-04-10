'use client'

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react'

export interface CaptchaRef {
  getValue: () => string
  refresh: () => void
}

const Captcha = forwardRef<CaptchaRef>((props, ref) => {
  const [code, setCode] = useState('')

  const generate = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let result = ''
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCode(result)
  }

  useEffect(() => {
    generate()
  }, [])

  useImperativeHandle(ref, () => ({
    getValue: () => code,
    refresh: () => generate()
  }))

  return (
    <div 
      onClick={generate}
      style={{
        background: 'linear-gradient(45deg, #1e293b 0%, #334155 100%)',
        padding: '8px 16px',
        borderRadius: 8,
        cursor: 'pointer',
        userSelect: 'none',
        display: 'inline-block',
        letterSpacing: '6px',
        fontWeight: 'bold',
        fontSize: 20,
        color: '#60a5fa',
        fontStyle: 'italic',
        textDecoration: 'line-through',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
      }}
    >
      {code}
    </div>
  )
})

Captcha.displayName = 'Captcha'

export default Captcha
