import { useState, useEffect } from 'react'
import { supabase, isConfigured } from './lib/supabase'
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Automations from './pages/Automations'
import Contacts from './pages/Contacts'
import Broadcasts from './pages/Broadcasts'
import Sequences from './pages/Sequences'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'

const NAV = [
  { group: 'Overview', items: [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'contacts',  icon: '👥', label: 'Contacts',  badge: null },
  ]},
  { group: 'Automate', items: [
    { id: 'automations', icon: '⚙️', label: 'Automations' },
    { id: 'broadcasts',  icon: '📣', label: 'Broadcasts' },
    { id: 'sequences',   icon: '📆', label: 'Sequences' },
  ]},
  { group: 'Insights', items: [
    { id: 'analytics', icon: '📊', label: 'Analytics', dot: true },
  ]},
  { group: 'Account', items: [
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ]},
]

function SetupRequired() {
  return (
    <div style={{minHeight:'100vh',background:'#0D0D0D',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{background:'#181818',border:'1px solid #2A2A2A',borderRadius:16,padding:32,maxWidth:520,width:'100%'}}>
        <div style={{fontSize:32,marginBottom:8}}>⚡</div>
        <div style={{fontSize:22,fontWeight:800,color:'#fff',marginBottom:6}}>TikFlow Setup</div>
        <div style={{fontSize:13,color:'#888',marginBottom:24,lineHeight:1.7}}>
          Connect your free Supabase database to get started. Takes 2 minutes.
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {[
            {n:'1',t:'Create a free Supabase account',d:'Go to supabase.com → New Project → name it "tikflow"',link:'https://supabase.com/dashboard/new'},
            {n:'2',t:'Run the database schema',d:'In Supabase → SQL Editor → paste the SQL from src/lib/schema.sql → Run'},
            {n:'3',t:'Add your credentials to GitHub',d:'In your tikflow GitHub repo → Settings → Secrets → add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (from Supabase Project → Settings → API)'},
            {n:'4',t:'Re-deploy',d:'Push any change to main (or re-run the GitHub Actions workflow) — the app will be live with full auth'},
          ].map(s => (
            <div key={s.n} style={{display:'flex',gap:12,alignItems:'flex-start'}}>
              <div style={{width:26,height:26,borderRadius:'50%',background:'rgba(254,44,85,0.15)',color:'#FE2C55',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,flexShrink:0,marginTop:2}}>{s.n}</div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:2}}>{s.t}</div>
                <div style={{fontSize:11.5,color:'#888',lineHeight:1.55}}>{s.d}
                  {s.link && <> — <a href={s.link} target="_blank" rel="noopener noreferrer" style={{color:'#25F4EE'}}>Open Supabase ↗</a></>}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{marginTop:20,padding:12,background:'rgba(37,244,238,0.06)',border:'1px solid rgba(37,244,238,0.2)',borderRadius:8,fontSize:12,color:'#25F4EE',lineHeight:1.6}}>
          💡 Running locally? Create a <code style={{background:'rgba(0,0,0,0.3)',padding:'0 4px',borderRadius:3}}>.env</code> file with <code style={{background:'rgba(0,0,0,0.3)',padding:'0 4px',borderRadius:3}}>VITE_SUPABASE_URL</code> and <code style={{background:'rgba(0,0,0,0.3)',padding:'0 4px',borderRadius:3}}>VITE_SUPABASE_ANON_KEY</code>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('dashboard')
  const [tiktokAccounts, setTiktokAccounts] = useState([])
  const [hasOnboarded, setHasOnboarded] = useState(false)

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    supabase.from('tiktok_accounts').select('*').eq('user_id', session.user.id)
      .then(({ data }) => {
        setTiktokAccounts(data || [])
        setHasOnboarded((data || []).length > 0)
      })
  }, [session])

  if (!isConfigured) return <SetupRequired />
  if (loading) return (
    <div style={{minHeight:'100vh',background:'#0D0D0D',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#888',fontSize:14}}>Loading TikFlow…</div>
    </div>
  )
  if (!session) return <Auth />
  if (!hasOnboarded) return <Onboarding session={session} onDone={() => setHasOnboarded(true)} />

  const user = session.user
  const PAGES = { dashboard: Dashboard, automations: Automations, contacts: Contacts, broadcasts: Broadcasts, sequences: Sequences, analytics: Analytics, settings: Settings }
  const PageComp = PAGES[page] || Dashboard

  return (
    <div style={{display:'flex',height:'100vh',background:'#0D0D0D',color:'#fff',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',overflow:'hidden'}}>
      {/* Sidebar */}
      <div style={{width:220,background:'#010101',borderRight:'1px solid #2A2A2A',display:'flex',flexDirection:'column',flexShrink:0}}>
        <div style={{padding:'16px 14px',display:'flex',alignItems:'center',gap:9,borderBottom:'1px solid #2A2A2A'}}>
          <div style={{width:30,height:30,background:'linear-gradient(135deg,#FE2C55,#25F4EE)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>⚡</div>
          <span style={{fontSize:17,fontWeight:800,background:'linear-gradient(135deg,#FE2C55,#25F4EE)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',letterSpacing:-0.5}}>TikFlow</span>
          <span style={{marginLeft:'auto',fontSize:8,fontWeight:700,background:'#FE2C55',color:'#fff',padding:'2px 4px',borderRadius:3}}>BETA</span>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'8px 0'}}>
          {NAV.map(group => (
            <div key={group.group} style={{padding:'10px 10px 2px'}}>
              <div style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',color:'#444',padding:'0 6px',marginBottom:3}}>{group.group}</div>
              {group.items.map(item => (
                <div key={item.id} onClick={() => setPage(item.id)}
                  style={{display:'flex',alignItems:'center',gap:8,padding:'7px 8px',borderRadius:6,cursor:'pointer',color:page===item.id?'#FE2C55':'#888',background:page===item.id?'rgba(254,44,85,0.1)':'transparent',fontSize:12.5,fontWeight:500,marginBottom:1,transition:'all 0.12s',userSelect:'none'}}>
                  <span style={{fontSize:13,width:16,textAlign:'center'}}>{item.icon}</span>
                  {item.label}
                  {item.dot && <span style={{marginLeft:'auto',width:6,height:6,background:'#22C55E',borderRadius:'50%'}} />}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{padding:10,borderTop:'1px solid #2A2A2A'}}>
          {/* Connect TikTok CTA — shown when no account connected */}
          {tiktokAccounts.length === 0 && (
            <div onClick={() => setPage('settings')} style={{marginBottom:8,background:'rgba(254,44,85,0.12)',border:'1px solid rgba(254,44,85,0.35)',borderRadius:8,padding:'9px 10px',cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:16}}>📱</span>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:700,color:'#FE2C55'}}>Connect TikTok</div>
                <div style={{fontSize:10,color:'#888',marginTop:1}}>Required to start automating</div>
              </div>
              <span style={{fontSize:13,color:'#FE2C55'}}>→</span>
            </div>
          )}
          <div style={{display:'flex',alignItems:'center',gap:8,padding:8,background:'#181818',borderRadius:8,cursor:'pointer'}} onClick={() => setPage('settings')}>
            <div style={{width:26,height:26,borderRadius:'50%',background:'linear-gradient(135deg,#FE2C55,#25F4EE)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:11,flexShrink:0}}>
              {user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11,fontWeight:600,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.email}</div>
              {tiktokAccounts[0] ? <div style={{fontSize:10,color:'#25F4EE',fontWeight:600}}>@{tiktokAccounts[0].username} ✓</div> : <div style={{fontSize:10,color:'#EE1D52'}}>No TikTok connected</div>}
            </div>
            <div style={{width:7,height:7,background:tiktokAccounts.length>0?'#22C55E':'#EE1D52',borderRadius:'50%',flexShrink:0}} />
          </div>
        </div>
      </div>
      {/* Main */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{height:46,borderBottom:'1px solid #2A2A2A',display:'flex',alignItems:'center',padding:'0 20px',gap:10,background:'#0D0D0D',flexShrink:0}}>
          <div style={{fontSize:13,fontWeight:700}}>{NAV.flatMap(g=>g.items).find(i=>i.id===page)?.label||'Dashboard'}</div>
          <div style={{flex:1}} />
          {tiktokAccounts.length > 0 && (
            <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11.5,color:'#888'}}>
              <span style={{color:'#25F4EE',fontWeight:700}}>⚡</span>
              <span style={{fontWeight:600,color:'#fff'}}>@{tiktokAccounts[0].username}</span>
              <span style={{background:'rgba(34,197,94,0.13)',color:'#22C55E',padding:'2px 6px',borderRadius:4,fontSize:10,fontWeight:700}}>Connected</span>
            </div>
          )}
        </div>
        <div style={{flex:1,overflowY:'auto'}}>
          <PageComp session={session} tiktokAccounts={tiktokAccounts} onNavigate={setPage} />
        </div>
      </div>
    </div>
  )
}
