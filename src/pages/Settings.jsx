import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Settings({ session, tiktokAccounts }) {
  const [accounts, setAccounts] = useState(tiktokAccounts || [])
  const [addingAccount, setAddingAccount] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState('')
  const [email, setEmail] = useState(session.user.email || '')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const uid = session.user.id

  useEffect(() => {
    supabase.from('tiktok_accounts').select('*').eq('user_id', uid)
      .then(({ data }) => setAccounts(data || []))
  }, [uid])

  async function connectTikTok() {
    const username = newUsername.replace('@','').trim()
    if (!username) return
    setConnecting(true)
    setConnectError('')
    // Simulate OAuth
    await new Promise(r => setTimeout(r, 1500))
    const { data: existing } = await supabase.from('tiktok_accounts').select('id').eq('user_id', uid).eq('username', username)
    if (existing && existing.length > 0) {
      setConnectError('That account is already connected.')
      setConnecting(false)
      return
    }
    const { error } = await supabase.from('tiktok_accounts').insert({
      user_id: uid,
      username,
      display_name: username,
      followers_count: Math.floor(Math.random() * 50000) + 100,
    })
    if (error) { setConnectError(error.message); setConnecting(false); return }
    const { data } = await supabase.from('tiktok_accounts').select('*').eq('user_id', uid)
    setAccounts(data || [])
    setNewUsername('')
    setAddingAccount(false)
    setConnecting(false)
  }

  async function disconnectAccount(id) {
    if (!confirm('Disconnect this TikTok account? Your automations will stop working.')) return
    await supabase.from('tiktok_accounts').delete().eq('id', id)
    setAccounts(prev => prev.filter(a => a.id !== id))
  }

  async function changePassword() {
    if (!newPw || newPw.length < 6) { setPwMsg('Password must be at least 6 characters.'); return }
    setPwSaving(true)
    setPwMsg('')
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) { setPwMsg(error.message) } else { setPwMsg('Password updated!'); setCurrentPw(''); setNewPw('') }
    setPwSaving(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const S = {
    input: { width:'100%', background:'#0D0D0D', border:'1px solid #2A2A2A', borderRadius:8, padding:'8px 11px', color:'#fff', fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' },
    label: { fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'#888', display:'block', marginBottom:5 },
    card: { background:'#181818', border:'1px solid #2A2A2A', borderRadius:12, padding:18, marginBottom:14 },
  }

  return (
    <div style={{padding:'20px 24px',maxWidth:640}}>
      <div style={{fontSize:20,fontWeight:800,color:'#fff',marginBottom:4}}>Settings</div>
      <div style={{fontSize:12,color:'#888',marginBottom:18}}>Manage your account and connected TikTok profiles</div>

      {/* TikTok Accounts */}
      <div style={S.card}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:700,color:'#fff'}}>TikTok Accounts</div>
          <button onClick={()=>{setAddingAccount(true);setConnectError('');setNewUsername('')}} style={{background:'transparent',border:'1px solid #2A2A2A',color:'#888',borderRadius:6,padding:'5px 12px',fontSize:11,fontWeight:600,cursor:'pointer'}}>＋ Connect Account</button>
        </div>

        {accounts.map(a => (
          <div key={a.id} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 0',borderBottom:'1px solid #1A1A1A'}}>
            <div style={{width:38,height:38,borderRadius:'50%',background:'linear-gradient(135deg,#FE2C55,#25F4EE)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14,flexShrink:0}}>
              {a.username[0].toUpperCase()}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>@{a.username}</div>
              <div style={{fontSize:11,color:'#888'}}>{a.followers_count ? a.followers_count.toLocaleString() + ' followers (simulated)' : 'Connected'}</div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{background:'rgba(34,197,94,0.12)',color:'#22C55E',padding:'3px 8px',borderRadius:5,fontSize:10,fontWeight:700}}>● Connected</span>
              <button onClick={()=>disconnectAccount(a.id)} style={{background:'transparent',border:'1px solid #2A2A2A',color:'#888',borderRadius:6,padding:'4px 10px',fontSize:11,cursor:'pointer'}}>Disconnect</button>
            </div>
          </div>
        ))}

        {accounts.length === 0 && !addingAccount && (
          <div style={{textAlign:'center',padding:'20px 0',color:'#555',fontSize:12}}>No TikTok accounts connected yet</div>
        )}

        {addingAccount && (
          <div style={{marginTop:12,padding:12,background:'#0D0D0D',borderRadius:9,border:'1px solid #2A2A2A'}}>
            <div style={{fontSize:12,color:'#888',marginBottom:8}}>Enter your TikTok @username to simulate connection</div>
            <div style={{display:'flex',gap:8}}>
              <input value={newUsername} onChange={e=>setNewUsername(e.target.value)} placeholder="@yourusername" style={{...S.input,flex:1}} onKeyDown={e=>e.key==='Enter'&&connectTikTok()} />
              <button onClick={connectTikTok} disabled={connecting||!newUsername.trim()} style={{background:'#FE2C55',color:'#fff',border:'none',borderRadius:7,padding:'8px 14px',fontSize:12,fontWeight:700,cursor:'pointer',opacity:!newUsername.trim()?0.5:1,flexShrink:0}}>
                {connecting ? '⏳ Connecting…' : 'Connect'}
              </button>
              <button onClick={()=>setAddingAccount(false)} style={{background:'transparent',border:'1px solid #2A2A2A',color:'#888',borderRadius:7,padding:'8px 11px',fontSize:12,cursor:'pointer'}}>Cancel</button>
            </div>
            {connectError && <div style={{fontSize:11,color:'#EE1D52',marginTop:7}}>{connectError}</div>}
          </div>
        )}
      </div>

      {/* Account */}
      <div style={S.card}>
        <div style={{fontSize:14,fontWeight:700,color:'#fff',marginBottom:14}}>Account</div>
        <div style={{marginBottom:12}}>
          <label style={S.label}>Email</label>
          <input value={email} disabled style={{...S.input,opacity:0.5,cursor:'not-allowed'}} />
          <div style={{fontSize:10,color:'#555',marginTop:4}}>Email cannot be changed</div>
        </div>
        <div style={{marginBottom:12}}>
          <label style={S.label}>New Password</label>
          <input type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Min. 6 characters" style={S.input} />
        </div>
        {pwMsg && <div style={{fontSize:11,color:pwMsg.includes('!')?'#22C55E':'#EE1D52',marginBottom:8}}>{pwMsg}</div>}
        <button onClick={changePassword} disabled={pwSaving||!newPw} style={{background:'#FE2C55',color:'#fff',border:'none',borderRadius:7,padding:'7px 16px',fontSize:12,fontWeight:700,cursor:'pointer',opacity:!newPw?0.5:1}}>
          {pwSaving ? 'Updating…' : 'Update Password'}
        </button>
      </div>

      {/* Plan info */}
      <div style={{...S.card,background:'rgba(37,244,238,0.04)',borderColor:'rgba(37,244,238,0.15)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:'#fff',marginBottom:3}}>Free Plan</div>
            <div style={{fontSize:12,color:'#888'}}>Unlimited automations · Unlimited contacts · Supabase storage</div>
          </div>
          <span style={{background:'rgba(37,244,238,0.12)',color:'#25F4EE',padding:'4px 10px',borderRadius:6,fontSize:11,fontWeight:700}}>FREE</span>
        </div>
      </div>

      {/* Danger zone */}
      <div style={{...S.card,borderColor:'rgba(238,29,82,0.2)'}}>
        <div style={{fontSize:14,fontWeight:700,color:'#fff',marginBottom:10}}>Session</div>
        <button onClick={signOut} style={{background:'rgba(238,29,82,0.1)',border:'1px solid rgba(238,29,82,0.3)',color:'#EE1D52',borderRadius:7,padding:'8px 18px',fontSize:12,fontWeight:700,cursor:'pointer'}}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
