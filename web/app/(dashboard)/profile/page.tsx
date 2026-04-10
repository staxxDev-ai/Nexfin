'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Mail, 
  Calendar, 
  Camera, 
  Save, 
  ArrowLeft 
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [age, setAge] = useState('28')
  const [bio, setBio] = useState('Analista Financeiro Sênior na NEXFIN.')
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200&h=200')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const savedName = localStorage.getItem('nexfin_user')
    const savedEmail = localStorage.getItem('nexfin_email') || 'admin@nexfin.com'
    const savedAvatar = localStorage.getItem('nexfin_avatar')
    if (savedName) setName(savedName)
    if (savedAvatar) setAvatar(savedAvatar)
    setEmail(savedEmail)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          // Criação do Canvas para Redimensionamento
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          // Tamanho alvo (200x200 é ideal para o círculo de perfil)
          const targetSize = 200
          canvas.width = targetSize
          canvas.height = targetSize
          
          if (ctx) {
            // Desenha a imagem redimensionada (quadrado central)
            const minSize = Math.min(img.width, img.height)
            const startX = (img.width - minSize) / 2
            const startY = (img.height - minSize) / 2
            
            ctx.drawImage(img, startX, startY, minSize, minSize, 0, 0, targetSize, targetSize)
            
            // Converte para JPG comprimido para economizar espaço (máx ~30kb)
            const base64String = canvas.toDataURL('image/jpeg', 0.8)
            setAvatar(base64String)
            localStorage.setItem('nexfin_avatar', base64String)
          }
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    setSaving(true)
    
    // Pequeno delay para efeito visual premium
    setTimeout(() => {
      try {
        localStorage.setItem('nexfin_user', name)
        localStorage.setItem('nexfin_avatar', avatar)
        
        // Dispara evento para o TopNav atualizar em tempo real
        window.dispatchEvent(new Event('storage'))
        
        setSaving(false)
        router.push('/dashboard') // Redireciona para confirmar o sucesso
      } catch (err) {
        setSaving(false)
        alert('Erro ao salvar: A imagem pode ser grande demais para o cache local. Tente uma imagem menor.')
        console.error('Falha no LocalStorage:', err)
      }
    }, 800)
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Input de Arquivo Escondido */}
      <input 
        type="file" 
        id="avatar-upload" 
        accept="image/*" 
        onChange={handleFileChange} 
        style={{ display: 'none' }} 
      />

      {/* Botão Voltar */}
      <motion.button 
        whileHover={{ x: -4 }}
        onClick={() => router.push('/dashboard')}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, background: 'none',
          border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13,
          fontWeight: 600, cursor: 'pointer', marginBottom: 24, padding: 0
        }}
      >
        <ArrowLeft size={16} />
        VOLTAR AO DASHBOARD
      </motion.button>

      {/* Cabeçalho do Perfil */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>
          Personalização do Perfil
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>
          Gerencie suas informações e identidade na plataforma.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 40 }}>
        
        {/* Lado Esquerdo: Avatar */}
        <div style={{ textAlign: 'center' }}>
          <div 
            onClick={() => document.getElementById('avatar-upload')?.click()}
            style={{ 
              position: 'relative', width: 160, height: 160, margin: '0 auto 20px',
              borderRadius: '50%', padding: 4, background: 'linear-gradient(135deg, #2563eb, #1e40af)',
              boxShadow: '0 20px 40px rgba(37,99,235,0.2)', cursor: 'pointer'
            }}
          >
            <div style={{ 
              width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', 
              background: '#050d1e', position: 'relative' 
            }}>
              <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ 
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.2s'
              }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}>
                <Camera size={24} color="#fff" />
              </div>
            </div>
            
            <div style={{
              position: 'absolute', bottom: 8, right: 8, width: 36, height: 36,
              borderRadius: '50%', background: '#2563eb', border: 'none', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              <Camera size={16} color="#fff" />
            </div>
          </div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.05em' }}>
            CLIQUE PARA ALTERAR FOTO
          </span>
        </div>

        {/* Lado Direito: Formulário */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 4, padding: '32px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'grid', gap: 24 }}>
            
            {/* Campo: Nome */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 8, letterSpacing: '0.1em' }}>
                NOME COMPLETO
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Seu nome"
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, padding: '14px 16px 14px 44px', color: '#fff', fontSize: 14, outline: 'none',
                    transition: 'all 0.2s', boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Linha: Email e Idade */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 8, letterSpacing: '0.1em' }}>
                  E-MAIL CORPORATIVO
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                  <input 
                    type="email" 
                    value={email} 
                    readOnly
                    style={{
                      width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: 12, padding: '14px 16px 14px 44px', color: 'rgba(255,255,255,0.4)', fontSize: 14,
                      outline: 'none', boxSizing: 'border-box', cursor: 'not-allowed'
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 8, letterSpacing: '0.1em' }}>
                  IDADE
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                  <input 
                    type="number" 
                    value={age} 
                    onChange={(e) => setAge(e.target.value)} 
                    style={{
                      width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12, padding: '14px 16px 14px 44px', color: '#fff', fontSize: 14, outline: 'none',
                      transition: 'all 0.2s', boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Campo: Bio */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 8, letterSpacing: '0.1em' }}>
                BIOGRAFIA / CARGO
              </label>
              <textarea 
                value={bio} 
                onChange={(e) => setBio(e.target.value)} 
                rows={3}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, padding: '14px 16px', color: '#fff', fontSize: 14, outline: 'none',
                  transition: 'all 0.2s', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'none'
                }}
              />
            </div>

            <button 
              onClick={handleSave}
              disabled={saving}
              style={{
                marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '16px', background: saving ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #2563eb, #1e40af)',
                border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 14,
                cursor: saving ? 'wait' : 'pointer', transition: 'all 0.3s',
                boxShadow: '0 8px 25px rgba(37,99,235,0.25)'
              }}
            >
              {saving ? 'SALVANDO...' : <><Save size={18} /> SALVAR ALTERAÇÕES</>}
            </button>

          </div>
        </div>
      </div>

    </div>
  )
}
