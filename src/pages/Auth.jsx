import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [mode, setMode] = useState('login') // login | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const S = {
    wrap: {minHeight:'100vh',background:'#0D0D0D',display:'flex',alignItems:'center',justifyContent:'center',padding:24},
    box: {background:'#181818',border:'1px solid #2A2A2A',borderRadius:16,padding:32,width:'100%',maxWidth:400},
    logo: {display:'flex',alignItems:'center',gap:8,marginBottom:24},
    mark: {width:34,height:34,background:'linear-gradient(135deg,#FE2C55,#25F4EE)',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17},
    name: {fontSize:20,fontWeight:800,background:'linear-gradient(135deg,#FE2C55,#25F4EE)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'},
    h1: {fontSize:20,fontWeight:800,color:'#fff',marginBottom:4},
    sub: {fontSize:13,color:'#888',marginBottom:22},
    label: {fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',color:'#888',display:'block',marginBottom:5},
    input: {width:'100%',background:'#0D0D0D',border:'1px solid #2A2A2A',borderRadius:8,padding:'9px 12px',color:'#fff',fontSize:13,outline:'none',fontFamily:'inherit',boxSizing:'border-box'},
    btn: {width:'100%',background:'#FE2C55',color:'#fff',border:'none',borderRadius:8,padding:'10px',fontSize:13,fontWeight:700,cursor:'pointer',marginTop:6},
    error: {background:'rgba(254,44,85,0.1)',border:'1px solid rgba(254,44,85,0.3)',color:'#FE2C55',borderRadius:8,padding:'10px 12px',fontSize:12,marginBottom:14},
    success: {background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.3)',color:'#22C55E',borderRadius:8,padding:'10px 12px',fontSize:12,marginBottom:14},
    switch: {textAlign:'center',marginTop:16,fontSize:12,color:'#888'},
    link: {color:'#25F4EE',cursor:'pointer',fontWeight:600,textDecoration:'none'},
  }

  async function submit(e) {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
        if (error) throw error
        setSuccess('Account created! Check your email to confirm, then sign in.')
        setMode('login')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.wrap}>
      <div style={S.box}>
        <div style={S.logo}>
          <div style={S.mark}>⚡</div>
          <span style={S.name}>TikFlow</span>
        </div>
        <div style={S.h1}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</div>
        <div style={S.sub}>{mode === 'login' ? 'Sign in to your TikFlow dashboard' : 'Start automating your TikTok in minutes'}</div>

        {error && <div style={S.error}>⚠ {error}</div>}
        {success && <div style={S.success}>✓ {success}</div>}

        <form onSubmit={submit}>
          {mode === 'signup' && (
            <div style={{marginBottom:14}}>
              <label style={S.label}>Full Name</label>
              <input style={S.input} type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
            </div>
          )}
          <div style={{marginBottom:14}}>
            <label style={S.label}>Email</label>
            <input style={S.input} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div style={{marginBottom:18}}>
            <label style={S.label}>Password</label>
            <input style={S.input} type="password" placeholder="Minimum 6 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          <button style={{...S.btn, opacity: loading ? 0.7 : 1}} disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? '→ Sign In' : '→ Create Account'}
          </button>
        </form>

        <div style={S.switch}>
          {mode === 'login' ? <>Don't have an account? <span style={S.link} onClick={() => { setMode('signup'); setError(''); setSuccess('') }}>Sign up free</span></>
            : <>Already have an account? <span style={S.link} onClick={() => { setMode('login'); setError(''); setSuccess('') }}>Sign in</span></>}
        </div>
      </div>
    </div>
  )
}
