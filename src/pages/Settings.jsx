import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Settings({ session, tiktokAccounts }) {
  const [accounts, setAccounts] = useState(tiktokAccounts || [])
  const [addingAccount, setAddingAccount] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState('')

  // Password change
  const [newPw, setNewPw] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [pwSaving, setPwSaving] = useState(false)

  // Email sender settings
  const [emailFromName, setEmailFromName] = useState('')
  const [emailFromAddress, setEmailFromAddress] = useState('')
  const [emailApiKey, setEmailApiKey] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailMsg, setEmailMsg] = useState('')
  const [emailTesting, setEmailTesting] = useState(false)
  const [testEmailAddr, setTestEmailAddr] = useState(session.user.email || '')

  const uid = session.user.id

  useEffect(() => {
    async function loadData() {
      // Load TikTok accounts
      const { data: accts } = await supabase.from('tiktok_accounts').select('*').eq('user_id', uid)
      setAccounts(accts || [])
      // Load email sender settings from profile
      const { data: profile } = await supabase.from('profiles').select('email_from_name,email_from_address,email_api_key').eq('id', uid).single()
      if (profile) {
        setEmailFromName(profile.email_from_name || '')
        setEmailFromAddress(profile.email_from_address || '')
        setEmailApiKey(profile.email_api_key || '')
      }
    }
    loadData()
  }, [uid])

  async function connectTikTok() {
    const username = newUsername.replace('@','').trim()
    if (!username) return
    setConnecting(true)
    setConnectError('')
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
    if (!confirm('Disconnect this TikTok account? Your automations will stop.')) return
    await supabase.from('tiktok_accounts').delete().eq('id', id)
    setAccounts(prev => prev.filter(a => a.id !== id))
  }

  async function saveEmailSettings() {
    setEmailSaving(true)
    setEmailMsg('')
    const { error } = await supabase.from('profiles').upsert({
      id: uid,
      email_from_name: emailFromName.trim(),
      email_from_address: emailFromAddress.trim(),
      email_api_key: emailApiKey.trim(),
      email_provider: 'resend',
    })
    setEmailSaving(false)
    setEmailMsg(error ? '❌ ' + error.message : '✅ Email settings saved!')
    setTimeout(() => setEmailMsg(''), 3000)
  }

  async function sendTestEmail() {
    if (!emailApiKey || !emailFromAddress || !testEmailAddr) {
      setEmailMsg('Fill in From Email, From Name, API Key and a test address first.')
      return
    }
    setEmailTesting(true)
    setEmailMsg('')
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${emailApiKey}` },
        body: JSON.stringify({
          from: `${emailFromName || 'TikFlow'} <${emailFromAddress}>`,
          to: [testEmailAddr],
          subject: 'TikFlow — Email sender test ✅',
          html: '<p>Your TikFlow email sender is working correctly!</p><p>You can now send emails to leads from your automations.</p><br><small style="color:#888">Sent via TikFlow</small>',
        })
      })
      const json = await res.json()
      if (res.ok) {
        setEmailMsg('✅ Test email sent! Check your inbox at ' + testEmailAddr)
      } else {
        setEmailMsg('❌ ' + (json.message || JSON.stringify(json)))
      }
    } catch (e) {
      setEmailMsg('❌ ' + e.message)
    }
    setEmailTesting(false)
  }

  async function changePassword() {
    if (!newPw || newPw.length < 6) { setPwMsg('Password must be at least 6 characters.'); return }
    setPwSaving(true)
    setPwMsg('')
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) { setPwMsg(error.message) } else { setPwMsg('✅ Password updated!'); setNewPw('') }
    setPwSaving(false)
    setTimeout(() => setPwMsg(''), 3000)
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
      <div style={{fontSize:12,color:'#888',marginBottom:18}}>Manage your TikTok accounts, email sender, and account details</div>

      {/* ── TikTok Accounts ── */}
      <div style={{...S.card, borderColor: accounts.length===0 ? 'rgba(254,44,85,0.4)' : '#2A2A2A'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:18}}>📱</span>
            <div style={{fontSize:14,fontWeight:700,color:'#fff'}}>TikTok Accounts</div>
            {accounts.length === 0 && <span style={{fontSize:10,fontWeight:700,background:'rgba(254,44,85,0.15)',color:'#FE2C55',padding:'2px 7px',borderRadius:4}}>REQUIRED</span>}
          </div>
          <button onClick={()=>{setAddingAccount(true);setConnectError('');setNewUsername('')}} style={{background:'#FE2C55',color:'#fff',border:'none',borderRadius:6,padding:'6px 13px',fontSize:11,fontWeight:700,cursor:'pointer'}}>
            ＋ Connect TikTok
          </button>
        </div>

        {accounts.length === 0 && !addingAccount && (
          <div style={{textAlign:'center',padding:'16px 0 8px'}}>
            <div style={{fontSize:28,marginBottom:8}}>📱</div>
            <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:4}}>No TikTok account connected</div>
            <div style={{fontSize:12,color:'#888',marginBottom:14}}>Connect your TikTok account to start automating DMs and capturing leads</div>
            <button onClick={()=>{setAddingAccount(true);setConnectError('');setNewUsername('')}} style={{background:'#FE2C55',color:'#fff',border:'none',borderRadius:8,padding:'9px 22px',fontSize:13,fontWeight:700,cursor:'pointer'}}>
              Connect TikTok Account →
            </button>
          </div>
        )}

        {accounts.map(a => (
          <div key={a.id} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 0',borderBottom:'1px solid #1A1A1A'}}>
            <div style={{width:38,height:38,borderRadius:'50%',background:'linear-gradient(135deg,#FE2C55,#25F4EE)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14,flexShrink:0}}>
              {a.username[0].toUpperCase()}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>@{a.username}</div>
              <div style={{fontSize:11,color:'#888'}}>{a.followers_count ? a.followers_count.toLocaleString() + ' followers' : 'Connected'} · Simulated</div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{background:'rgba(34,197,94,0.12)',color:'#22C55E',padding:'3px 8px',borderRadius:5,fontSize:10,fontWeight:700}}>● Connected</span>
              <button onClick={()=>disconnectAccount(a.id)} style={{background:'transparent',border:'1px solid #2A2A2A',color:'#888',borderRadius:6,padding:'4px 10px',fontSize:11,cursor:'pointer'}}>Disconnect</button>
            </div>
          </div>
        ))}

        {addingAccount && (
          <div style={{marginTop:12,padding:14,background:'#0D0D0D',borderRadius:9,border:'1px solid rgba(254,44,85,0.2)'}}>
            <div style={{fontSize:12,fontWeight:700,color:'#fff',marginBottom:4}}>Enter your TikTok @username</div>
            <div style={{fontSize:11,color:'#888',marginBottom:10}}>We'll simulate the TikTok OAuth connection (real API integration coming soon)</div>
            <div style={{display:'flex',gap:8}}>
              <input value={newUsername} onChange={e=>setNewUsername(e.target.value)} placeholder="@yourtiktokusername" style={{...S.input,flex:1}} onKeyDown={e=>e.key==='Enter'&&connectTikTok()} autoFocus />
              <button onClick={connectTikTok} disabled={connecting||!newUsername.trim()} style={{background:'#FE2C55',color:'#fff',border:'none',borderRadius:7,padding:'8px 16px',fontSize:12,fontWeight:700,cursor:'pointer',opacity:!newUsername.trim()?0.5:1,flexShrink:0,whiteSpace:'nowrap'}}>
                {connecting ? '⏳ Connecting…' : '✓ Connect'}
              </button>
              <button onClick={()=>setAddingAccount(false)} style={{background:'transparent',border:'1px solid #2A2A2A',color:'#888',borderRadius:7,padding:'8px 11px',fontSize:12,cursor:'pointer'}}>Cancel</button>
            </div>
            {connectError && <div style={{fontSize:11,color:'#EE1D52',marginTop:7}}>{connectError}</div>}
          </div>
        )}
      </div>

      {/* ── Email Sender ── */}
      <div style={S.card}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
          <span style={{fontSize:18}}>✉️</span>
          <div style={{fontSize:14,fontWeight:700,color:'#fff'}}>Email Sender</div>
        </div>
        <div style={{fontSize:12,color:'#888',marginBottom:14,lineHeight:1.6}}>
          Configure the email address TikFlow uses to send emails to your leads. Uses <strong style={{color:'#fff'}}>Resend</strong> (free tier: 100 emails/day) — get your free API key at{' '}
          <a href="https://resend.com" target="_blank" rel="noopener noreferrer" style={{color:'#25F4EE'}}>resend.com ↗</a>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
          <div>
            <label style={S.label}>From Name</label>
            <input value={emailFromName} onChange={e=>setEmailFromName(e.target.value)} placeholder="Your Brand Name" style={S.input} />
          </div>
          <div>
            <label style={S.label}>From Email Address</label>
            <input value={emailFromAddress} onChange={e=>setEmailFromAddress(e.target.value)} placeholder="hello@yourdomain.com" style={S.input} />
            <div style={{fontSize:10,color:'#555',marginTop:3}}>Must be a verified Resend sender domain</div>
          </div>
        </div>
        <div style={{marginBottom:12}}>
          <label style={S.label}>Resend API Key</label>
          <input type="password" value={emailApiKey} onChange={e=>setEmailApiKey(e.target.value)} placeholder="re_xxxxxxxxxxxxxxxxxxxx" style={S.input} />
          <div style={{fontSize:10,color:'#555',marginTop:3}}>Get yours free at resend.com → API Keys. Stored securely in your database.</div>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:emailMsg?10:0,flexWrap:'wrap'}}>
          <button onClick={saveEmailSettings} disabled={emailSaving} style={{background:'#FE2C55',color:'#fff',border:'none',borderRadius:7,padding:'7px 16px',fontSize:12,fontWeight:700,cursor:'pointer'}}>
            {emailSaving ? 'Saving…' : 'Save Email Settings'}
          </button>
          <div style={{display:'flex',gap:6,alignItems:'center',flex:1,minWidth:200}}>
            <input value={testEmailAddr} onChange={e=>setTestEmailAddr(e.target.value)} placeholder="Test recipient email" style={{...S.input,fontSize:11,padding:'7px 10px'}} />
            <button onClick={sendTestEmail} disabled={emailTesting||!emailApiKey||!emailFromAddress} style={{background:'rgba(37,244,238,0.1)',border:'1px solid rgba(37,244,238,0.25)',color:'#25F4EE',borderRadius:7,padding:'7px 12px',fontSize:11,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',opacity:(!emailApiKey||!emailFromAddress)?0.4:1}}>
              {emailTesting ? '⏳ Sending…' : '▶ Send Test'}
            </button>
          </div>
        </div>
        {emailMsg && <div style={{fontSize:11,color:emailMsg.startsWith('✅')?'#22C55E':'#EE1D52',marginTop:6}}>{emailMsg}</div>}

        <div style={{marginTop:12,padding:10,background:'rgba(37,244,238,0.05)',border:'1px solid rgba(37,244,238,0.1)',borderRadius:8,fontSize:11,color:'#888',lineHeight:1.6}}>
          💡 Once configured, you can add an <strong style={{color:'#fff'}}>Email Action</strong> to any automation — when a lead triggers it, they receive both a TikTok DM and an email automatically.
        </div>
      </div>

      {/* ── Account ── */}
      <div style={S.card}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
          <span style={{fontSize:18}}>👤</span>
          <div style={{fontSize:14,fontWeight:700,color:'#fff'}}>Account</div>
        </div>
        <div style={{marginBottom:12}}>
          <label style={S.label}>Email</label>
          <input value={session.user.email || ''} disabled style={{...S.input,opacity:0.5,cursor:'not-allowed'}} />
        </div>
        <div style={{marginBottom:12}}>
          <label style={S.label}>New Password</label>
          <input type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Min. 6 characters" style={S.input} />
        </div>
        {pwMsg && <div style={{fontSize:11,color:pwMsg.startsWith('✅')?'#22C55E':'#EE1D52',marginBottom:8}}>{pwMsg}</div>}
        <button onClick={changePassword} disabled={pwSaving||!newPw} style={{background:'#FE2C55',color:'#fff',border:'none',borderRadius:7,padding:'7px 16px',fontSize:12,fontWeight:700,cursor:'pointer',opacity:!newPw?0.5:1}}>
          {pwSaving ? 'Updating…' : 'Update Password'}
        </button>
      </div>

      {/* ── Plan ── */}
      <div style={{...S.card,background:'rgba(37,244,238,0.04)',borderColor:'rgba(37,244,238,0.15)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:'#fff',marginBottom:3}}>Free Plan</div>
            <div style={{fontSize:12,color:'#888'}}>Unlimited automations · Unlimited contacts · 100 emails/day via Resend</div>
          </div>
          <span style={{background:'rgba(37,244,238,0.12)',color:'#25F4EE',padding:'4px 10px',borderRadius:6,fontSize:11,fontWeight:700}}>FREE</span>
        </div>
      </div>

      {/* ── Sign Out ── */}
      <div style={{...S.card,borderColor:'rgba(238,29,82,0.2)'}}>
        <div style={{fontSize:14,fontWeight:700,color:'#fff',marginBottom:10}}>Session</div>
        <button onClick={signOut} style={{background:'rgba(238,29,82,0.1)',border:'1px solid rgba(238,29,82,0.3)',color:'#EE1D52',borderRadius:7,padding:'8px 18px',fontSize:12,fontWeight:700,cursor:'pointer'}}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
