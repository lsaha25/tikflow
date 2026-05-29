import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Settings({ session, tiktokAccounts: initialAccounts }) {
  const [accounts, setAccounts] = useState(initialAccounts || [])
  const uid = session.user.id

  // TikTok OAuth developer credentials
  const [clientKey, setClientKey] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [redirectUri, setRedirectUri] = useState('')
  const [credSaving, setCredSaving] = useState(false)
  const [credMsg, setCredMsg] = useState('')

  // Slack
  const [slackWebhook, setSlackWebhook] = useState('')
  const [slackSaving, setSlackSaving] = useState(false)
  const [slackMsg, setSlackMsg] = useState('')
  const [slackTesting, setSlackTesting] = useState(false)

  // Email sender
  const [emailFromName, setEmailFromName] = useState('')
  const [emailFromAddress, setEmailFromAddress] = useState('')
  const [emailApiKey, setEmailApiKey] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailMsg, setEmailMsg] = useState('')
  const [emailTesting, setEmailTesting] = useState(false)
  const [testEmailAddr, setTestEmailAddr] = useState(session.user.email || '')

  // Password
  const [newPw, setNewPw] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [pwSaving, setPwSaving] = useState(false)

  // Handle TikTok OAuth callback (page loaded with ?tiktok_connected=1 or ?tiktok_error=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('tiktok_connected') === '1') {
      window.history.replaceState({}, '', window.location.pathname)
      loadAccounts()
      setCredMsg('✅ TikTok account connected successfully!')
    } else if (params.get('tiktok_error')) {
      window.history.replaceState({}, '', window.location.pathname)
      setCredMsg('❌ TikTok error: ' + decodeURIComponent(params.get('tiktok_error')))
    }
  }, [])

  useEffect(() => {
    async function loadAll() {
      loadAccounts()
      const { data: p } = await supabase
        .from('profiles')
        .select('tiktok_client_key,tiktok_client_secret,tiktok_redirect_uri,slack_webhook_url,email_from_name,email_from_address,email_api_key')
        .eq('id', uid).single()
      if (p) {
        setClientKey(p.tiktok_client_key || '')
        setClientSecret(p.tiktok_client_secret || '')
        setRedirectUri(p.tiktok_redirect_uri || '')
        setSlackWebhook(p.slack_webhook_url || '')
        setEmailFromName(p.email_from_name || '')
        setEmailFromAddress(p.email_from_address || '')
        setEmailApiKey(p.email_api_key || '')
      }
    }
    loadAll()
  }, [uid])

  async function loadAccounts() {
    const { data } = await supabase.from('tiktok_accounts').select('*').eq('user_id', uid)
    setAccounts(data || [])
  }

  async function saveCredentials() {
    if (!clientKey || !clientSecret || !redirectUri) {
      setCredMsg('❌ Fill in all three fields first.')
      return
    }
    setCredSaving(true)
    setCredMsg('')
    await supabase.from('profiles').upsert({
      id: uid,
      tiktok_client_key: clientKey.trim(),
      tiktok_client_secret: clientSecret.trim(),
      tiktok_redirect_uri: redirectUri.trim(),
    })
    setCredSaving(false)
    setCredMsg('✅ Credentials saved. Now click "Connect with TikTok".')
    setTimeout(() => setCredMsg(''), 4000)
  }

  function startTikTokOAuth() {
    if (!clientKey) { setCredMsg('❌ Save your Client Key first.'); return }
    const state = uid  // pass user ID as state so callback knows who to link
    const scope = 'user.info.basic'
    const params = new URLSearchParams({
      client_key: clientKey,
      scope,
      response_type: 'code',
      redirect_uri: redirectUri,
      state,
    })
    window.location.href = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`
  }

  async function disconnectAccount(id) {
    if (!confirm('Disconnect this TikTok account?')) return
    await supabase.from('tiktok_accounts').delete().eq('id', id)
    setAccounts(prev => prev.filter(a => a.id !== id))
  }

  async function saveSlack() {
    setSlackSaving(true)
    setSlackMsg('')
    await supabase.from('profiles').upsert({ id: uid, slack_webhook_url: slackWebhook.trim() })
    setSlackSaving(false)
    setSlackMsg('✅ Slack webhook saved!')
    setTimeout(() => setSlackMsg(''), 3000)
  }

  async function testSlack() {
    if (!slackWebhook) return
    setSlackTesting(true)
    setSlackMsg('')
    try {
      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '✅ *TikFlow test notification* — Slack is connected successfully! You\'ll receive lead alerts here.',
          username: 'TikFlow',
          icon_emoji: ':zap:',
        }),
      })
      setSlackMsg('✅ Test message sent to Slack!')
    } catch (e) {
      setSlackMsg('❌ Failed: ' + e.message)
    }
    setSlackTesting(false)
    setTimeout(() => setSlackMsg(''), 4000)
  }

  async function saveEmailSettings() {
    setEmailSaving(true)
    setEmailMsg('')
    const { error } = await supabase.from('profiles').upsert({
      id: uid,
      email_from_name: emailFromName.trim(),
      email_from_address: emailFromAddress.trim(),
      email_api_key: emailApiKey.trim(),
    })
    setEmailSaving(false)
    setEmailMsg(error ? '❌ ' + error.message : '✅ Email settings saved!')
    setTimeout(() => setEmailMsg(''), 3000)
  }

  async function sendTestEmail() {
    if (!emailApiKey || !emailFromAddress || !testEmailAddr) return
    setEmailTesting(true)
    setEmailMsg('')
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${emailApiKey}` },
        body: JSON.stringify({
          from: `${emailFromName || 'TikFlow'} <${emailFromAddress}>`,
          to: [testEmailAddr],
          subject: 'TikFlow — email sender test ✅',
          html: '<p>Your TikFlow email sender is working!</p>',
        })
      })
      const json = await res.json()
      setEmailMsg(res.ok ? '✅ Test email sent to ' + testEmailAddr : '❌ ' + (json.message || JSON.stringify(json)))
    } catch (e) { setEmailMsg('❌ ' + e.message) }
    setEmailTesting(false)
  }

  async function changePassword() {
    if (!newPw || newPw.length < 6) { setPwMsg('Min. 6 characters'); return }
    setPwSaving(true); setPwMsg('')
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setPwMsg(error ? error.message : '✅ Password updated!')
    setPwSaving(false); setNewPw('')
    setTimeout(() => setPwMsg(''), 3000)
  }

  const S = {
    input: { width:'100%', background:'#0D0D0D', border:'1px solid #2A2A2A', borderRadius:8, padding:'8px 11px', color:'#fff', fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' },
    label: { fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'#888', display:'block', marginBottom:5 },
    card: { background:'#181818', border:'1px solid #2A2A2A', borderRadius:12, padding:18, marginBottom:14 },
    btn: (color='#FE2C55') => ({ background:color, color:'#fff', border:'none', borderRadius:7, padding:'7px 15px', fontSize:12, fontWeight:700, cursor:'pointer' }),
    outBtn: { background:'transparent', border:'1px solid #2A2A2A', color:'#888', borderRadius:7, padding:'7px 13px', fontSize:12, cursor:'pointer' },
  }

  const EDGE_FN_URL = 'https://[YOUR-PROJECT-REF].supabase.co/functions/v1/tiktok-callback'

  return (
    <div style={{padding:'20px 24px',maxWidth:660}}>
      <div style={{fontSize:20,fontWeight:800,color:'#fff',marginBottom:4}}>Settings</div>
      <div style={{fontSize:12,color:'#888',marginBottom:18}}>Connect TikTok, Slack, email sender, and manage your account</div>

      {/* ── TikTok Login ── */}
      <div style={{...S.card, borderColor: accounts.length===0 ? 'rgba(254,44,85,0.4)' : '#2A2A2A'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
          <span style={{fontSize:20}}>📱</span>
          <div style={{fontSize:14,fontWeight:700,color:'#fff'}}>TikTok Login</div>
          {accounts.length === 0 && <span style={{fontSize:10,fontWeight:700,background:'rgba(254,44,85,0.15)',color:'#FE2C55',padding:'2px 7px',borderRadius:4}}>REQUIRED</span>}
        </div>

        {/* Connected accounts */}
        {accounts.map(a => (
          <div key={a.id} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 12px',background:'rgba(34,197,94,0.06)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:9,marginBottom:10}}>
            {a.avatar_url
              ? <img src={a.avatar_url} style={{width:38,height:38,borderRadius:'50%',objectFit:'cover'}} />
              : <div style={{width:38,height:38,borderRadius:'50%',background:'linear-gradient(135deg,#FE2C55,#25F4EE)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14}}>{a.username[0].toUpperCase()}</div>
            }
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>@{a.username}</div>
              <div style={{fontSize:11,color:'#888'}}>{a.followers_count ? a.followers_count.toLocaleString() + ' followers' : 'Connected'} {a.access_token ? '· Real OAuth ✓' : '· Simulated'}</div>
            </div>
            <span style={{background:'rgba(34,197,94,0.12)',color:'#22C55E',padding:'3px 8px',borderRadius:5,fontSize:10,fontWeight:700}}>● Connected</span>
            <button onClick={()=>disconnectAccount(a.id)} style={S.outBtn}>Disconnect</button>
          </div>
        ))}

        {/* Developer credentials */}
        <div style={{background:'#0D0D0D',border:'1px solid #2A2A2A',borderRadius:10,padding:14}}>
          <div style={{fontSize:12,fontWeight:700,color:'#fff',marginBottom:4}}>TikTok Developer App Credentials</div>
          <div style={{fontSize:11,color:'#888',marginBottom:12,lineHeight:1.6}}>
            From <a href="https://developers.tiktok.com/apps/" target="_blank" rel="noopener noreferrer" style={{color:'#25F4EE'}}>developers.tiktok.com ↗</a> → your app → App Details
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div>
              <label style={S.label}>Client Key</label>
              <input value={clientKey} onChange={e=>setClientKey(e.target.value)} placeholder="awxxxxxxxxxxxx" style={S.input} />
            </div>
            <div>
              <label style={S.label}>Client Secret</label>
              <input type="password" value={clientSecret} onChange={e=>setClientSecret(e.target.value)} placeholder="••••••••••••••••" style={S.input} />
            </div>
          </div>
          <div style={{marginBottom:10}}>
            <label style={S.label}>Redirect URI (your Supabase Edge Function URL)</label>
            <input value={redirectUri} onChange={e=>setRedirectUri(e.target.value)} placeholder={EDGE_FN_URL} style={S.input} />
            <div style={{fontSize:10,color:'#555',marginTop:4}}>
              Must match exactly what you set in your TikTok app's redirect URIs. See setup instructions below.
            </div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <button onClick={saveCredentials} disabled={credSaving} style={S.btn()}>
              {credSaving ? 'Saving…' : 'Save Credentials'}
            </button>
            <button onClick={startTikTokOAuth} disabled={!clientKey || !redirectUri} style={{...S.btn('#010101'),border:'1.5px solid #FE2C55',color:'#FE2C55',opacity:(!clientKey||!redirectUri)?0.4:1,display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontSize:14}}>📱</span> Login with TikTok
            </button>
          </div>
          {credMsg && <div style={{fontSize:11,color:credMsg.startsWith('✅')?'#22C55E':'#EE1D52',marginTop:8}}>{credMsg}</div>}
        </div>

        {/* Supabase Edge Function setup instructions */}
        <details style={{marginTop:12}}>
          <summary style={{fontSize:12,color:'#25F4EE',cursor:'pointer',fontWeight:600,userSelect:'none'}}>📋 One-time setup: Deploy the Supabase Edge Function →</summary>
          <div style={{marginTop:10,background:'#0D0D0D',border:'1px solid #2A2A2A',borderRadius:8,padding:12,fontSize:11,color:'#888',lineHeight:1.8}}>
            <div style={{color:'#fff',fontWeight:700,marginBottom:8}}>Why? TikTok requires server-side token exchange (the client_secret can't be in the browser). This 3-step setup only needs to be done once.</div>
            {[
              { n:'1', t:'Install Supabase CLI', d:'npm install -g supabase', code:true },
              { n:'2', t:'Login & link your project', d:'supabase login\nsupabase link --project-ref YOUR_PROJECT_REF', code:true },
              { n:'3', t:'Deploy the function (code is in your repo)', d:'cd tikflow\nsupabase functions deploy tiktok-callback --project-ref YOUR_PROJECT_REF', code:true },
              { n:'4', t:'Set the APP_URL secret', d:'supabase secrets set APP_URL=https://lsaha25.github.io/tikflow/ --project-ref YOUR_PROJECT_REF', code:true },
              { n:'5', t:'Add Redirect URI to your TikTok app', d:'In TikTok Developer Portal → your app → Login Kit → add:\nhttps://YOUR_PROJECT_REF.supabase.co/functions/v1/tiktok-callback', code:false },
              { n:'6', t:'Paste that URL as Redirect URI above', d:'https://YOUR_PROJECT_REF.supabase.co/functions/v1/tiktok-callback', code:false },
            ].map(s => (
              <div key={s.n} style={{marginBottom:10}}>
                <div style={{color:'#fff',fontWeight:600,marginBottom:2}}>Step {s.n}: {s.t}</div>
                {s.code
                  ? <pre style={{background:'#181818',border:'1px solid #2A2A2A',borderRadius:5,padding:'6px 10px',fontSize:10,color:'#25F4EE',overflow:'auto',margin:0,whiteSpace:'pre-wrap'}}>{s.d}</pre>
                  : <div style={{color:'#888'}}>{s.d}</div>
                }
              </div>
            ))}
            <div style={{color:'#FE2C55',fontWeight:600,marginTop:4}}>After setup, "Login with TikTok" button above will do a real OAuth login.</div>
          </div>
        </details>
      </div>

      {/* ── Slack Notifications ── */}
      <div style={S.card}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
          <span style={{fontSize:20}}>💬</span>
          <div style={{fontSize:14,fontWeight:700,color:'#fff'}}>Slack Notifications</div>
          {slackWebhook && <span style={{fontSize:10,fontWeight:700,background:'rgba(34,197,94,0.13)',color:'#22C55E',padding:'2px 7px',borderRadius:4}}>● CONNECTED</span>}
        </div>
        <div style={{fontSize:12,color:'#888',marginBottom:12,lineHeight:1.6}}>
          Get notified in Slack when a new lead is captured. Uses an Incoming Webhook — get yours at{' '}
          <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer" style={{color:'#25F4EE'}}>api.slack.com ↗</a>{' '}
          (free, takes 2 minutes).
        </div>
        <div style={{marginBottom:10}}>
          <label style={S.label}>Slack Incoming Webhook URL</label>
          <input value={slackWebhook} onChange={e=>setSlackWebhook(e.target.value)} placeholder="https://hooks.slack.com/services/T.../B.../..." style={S.input} />
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button onClick={saveSlack} disabled={slackSaving} style={S.btn('#4A154B')}>
            {slackSaving ? 'Saving…' : 'Save Webhook'}
          </button>
          <button onClick={testSlack} disabled={slackTesting||!slackWebhook} style={{...S.outBtn,opacity:!slackWebhook?0.4:1}}>
            {slackTesting ? '⏳ Sending…' : '▶ Send Test Message'}
          </button>
        </div>
        {slackMsg && <div style={{fontSize:11,color:slackMsg.startsWith('✅')?'#22C55E':'#EE1D52',marginTop:8}}>{slackMsg}</div>}

        <details style={{marginTop:12}}>
          <summary style={{fontSize:12,color:'#25F4EE',cursor:'pointer',fontWeight:600,userSelect:'none'}}>📋 How to get a Slack webhook URL →</summary>
          <div style={{marginTop:10,background:'#0D0D0D',border:'1px solid #2A2A2A',borderRadius:8,padding:12,fontSize:11,color:'#888',lineHeight:1.8}}>
            {[
              'Go to api.slack.com/apps → Create New App → From scratch',
              'Name it "TikFlow", pick your workspace',
              'Click "Incoming Webhooks" → toggle On',
              'Click "Add New Webhook to Workspace" → choose a channel',
              'Copy the Webhook URL (starts with https://hooks.slack.com/...) → paste above',
            ].map((s,i) => <div key={i}>Step {i+1}: {s}</div>)}
          </div>
        </details>
      </div>

      {/* ── Email Sender ── */}
      <div style={S.card}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
          <span style={{fontSize:20}}>✉️</span>
          <div style={{fontSize:14,fontWeight:700,color:'#fff'}}>Email Sender</div>
          {emailApiKey && emailFromAddress && <span style={{fontSize:10,fontWeight:700,background:'rgba(34,197,94,0.13)',color:'#22C55E',padding:'2px 7px',borderRadius:4}}>● CONFIGURED</span>}
        </div>
        <div style={{fontSize:12,color:'#888',marginBottom:12,lineHeight:1.6}}>
          Send emails to leads via <strong style={{color:'#fff'}}>Resend</strong> (free: 100/day).{' '}
          <a href="https://resend.com" target="_blank" rel="noopener noreferrer" style={{color:'#25F4EE'}}>Get free API key ↗</a>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
          <div><label style={S.label}>From Name</label><input value={emailFromName} onChange={e=>setEmailFromName(e.target.value)} placeholder="Your Brand" style={S.input} /></div>
          <div><label style={S.label}>From Email</label><input value={emailFromAddress} onChange={e=>setEmailFromAddress(e.target.value)} placeholder="hello@yourdomain.com" style={S.input} /></div>
        </div>
        <div style={{marginBottom:10}}><label style={S.label}>Resend API Key</label><input type="password" value={emailApiKey} onChange={e=>setEmailApiKey(e.target.value)} placeholder="re_xxxxxxxxxxxx" style={S.input} /></div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
          <button onClick={saveEmailSettings} disabled={emailSaving} style={S.btn()}>
            {emailSaving ? 'Saving…' : 'Save Email Settings'}
          </button>
          <input value={testEmailAddr} onChange={e=>setTestEmailAddr(e.target.value)} placeholder="test@email.com" style={{...S.input,width:180,fontSize:11,padding:'7px 10px'}} />
          <button onClick={sendTestEmail} disabled={emailTesting||!emailApiKey||!emailFromAddress} style={{...S.outBtn,color:'#25F4EE',borderColor:'rgba(37,244,238,0.3)',opacity:(!emailApiKey||!emailFromAddress)?0.4:1}}>
            {emailTesting ? '⏳' : '▶ Test'}
          </button>
        </div>
        {emailMsg && <div style={{fontSize:11,color:emailMsg.startsWith('✅')?'#22C55E':'#EE1D52',marginTop:8}}>{emailMsg}</div>}
      </div>

      {/* ── Account ── */}
      <div style={S.card}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}><span style={{fontSize:18}}>👤</span><div style={{fontSize:14,fontWeight:700,color:'#fff'}}>Account</div></div>
        <div style={{marginBottom:10}}><label style={S.label}>Email</label><input value={session.user.email||''} disabled style={{...S.input,opacity:0.5,cursor:'not-allowed'}} /></div>
        <div style={{marginBottom:10}}><label style={S.label}>New Password</label><input type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Min. 6 characters" style={S.input} /></div>
        {pwMsg && <div style={{fontSize:11,color:pwMsg.startsWith('✅')?'#22C55E':'#EE1D52',marginBottom:8}}>{pwMsg}</div>}
        <button onClick={changePassword} disabled={pwSaving||!newPw} style={{...S.btn(),opacity:!newPw?0.5:1}}>
          {pwSaving ? 'Updating…' : 'Update Password'}
        </button>
      </div>

      {/* ── Sign Out ── */}
      <div style={{...S.card,borderColor:'rgba(238,29,82,0.2)'}}>
        <div style={{fontSize:14,fontWeight:700,color:'#fff',marginBottom:10}}>Session</div>
        <button onClick={()=>supabase.auth.signOut()} style={{background:'rgba(238,29,82,0.1)',border:'1px solid rgba(238,29,82,0.3)',color:'#EE1D52',borderRadius:7,padding:'8px 18px',fontSize:12,fontWeight:700,cursor:'pointer'}}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
