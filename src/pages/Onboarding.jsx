import { useState } from 'react'
import { supabase } from '../lib/supabase'

const FAKE_FOLLOWERS = () => Math.floor(Math.random() * 80000) + 5000

export default function Onboarding({ session, onDone }) {
  const [username, setUsername] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')

  const S = {
    wrap: {minHeight:'100vh',background:'#0D0D0D',display:'flex',alignItems:'center',justifyContent:'center',padding:24},
    box: {background:'#181818',border:'1px solid #2A2A2A',borderRadius:16,padding:32,width:'100%',maxWidth:460},
    step: {display:'flex',alignItems:'center',gap:10,marginBottom:22},
    dot: (active) => ({width:28,height:28,borderRadius:'50%',background:active?'#FE2C55':'rgba(254,44,85,0.15)',color:active?'#fff':'#FE2C55',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,flexShrink:0}),
    input: {width:'100%',background:'#0D0D0D',border:'1px solid #2A2A2A',borderRadius:8,padding:'10px 12px 10px 36px',color:'#fff',fontSize:14,outline:'none',fontFamily:'inherit',boxSizing:'border-box'},
    btn: {width:'100%',background:'#FE2C55',color:'#fff',border:'none',borderRadius:8,padding:'11px',fontSize:13,fontWeight:700,cursor:'pointer',marginTop:4},
    skip: {width:'100%',background:'transparent',color:'#888',border:'1px solid #2A2A2A',borderRadius:8,padding:'10px',fontSize:12,fontWeight:600,cursor:'pointer',marginTop:8},
  }

  async function connect(e) {
    e.preventDefault()
    if (!username.trim()) return
    setError(''); setConnecting(true)
    await new Promise(r => setTimeout(r, 1500)) // simulate OAuth
    const clean = username.replace('@','').trim()
    const { error } = await supabase.from('tiktok_accounts').insert({
      user_id: session.user.id,
      username: clean,
      display_name: clean,
      followers: FAKE_FOLLOWERS(),
    })
    setConnecting(false)
    if (error) { setError(error.message); return }
    onDone()
  }

  return (
    <div style={S.wrap}>
      <div style={S.box}>
        <div style={{fontSize:28,marginBottom:6}}>⚡</div>
        <div style={{fontSize:22,fontWeight:800,color:'#fff',marginBottom:4}}>Connect your TikTok</div>
        <div style={{fontSize:13,color:'#888',marginBottom:26,lineHeight:1.6}}>Link your TikTok account to start automating comments, DMs, and lead capture.</div>

        {error && <div style={{background:'rgba(254,44,85,0.1)',border:'1px solid rgba(254,44,85,0.3)',color:'#FE2C55',borderRadius:8,padding:'10px 12px',fontSize:12,marginBottom:14}}>⚠ {error}</div>}

        <form onSubmit={connect}>
          <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',color:'#888',marginBottom:6}}>TikTok Username</div>
          <div style={{position:'relative',marginBottom:16}}>
            <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#888',fontSize:13,fontWeight:600}}>@</span>
            <input style={S.input} type="text" placeholder="yourtiktokhandle" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <button style={{...S.btn, opacity: connecting ? 0.75 : 1}} disabled={connecting}>
            {connecting ? '⏳ Connecting to TikTok…' : '🔗 Connect TikTok Account'}
          </button>
        </form>

        <div style={{margin:'20px 0',borderTop:'1px solid #2A2A2A'}} />

        <div style={{fontSize:12,color:'#888',lineHeight:1.7}}>
          <div style={{fontWeight:700,color:'#fff',marginBottom:6}}>What you'll be able to do:</div>
          {['Auto-DM anyone who comments on your videos','Capture leads from TikTok into your CRM','Run drip sequences over TikTok DM','Send mass broadcasts to your followers','Track CTR, opens, and revenue per flow'].map(f => (
            <div key={f} style={{display:'flex',gap:7,marginBottom:4}}>
              <span style={{color:'#22C55E',fontWeight:700}}>✓</span>{f}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
