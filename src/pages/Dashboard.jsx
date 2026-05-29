import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function StatCard({ icon, value, label, delta, color }) {
  return (
    <div style={{background:'#181818',border:`1px solid #2A2A2A`,borderTop:`2px solid ${color}`,borderRadius:12,padding:16}}>
      <div style={{fontSize:20,marginBottom:6}}>{icon}</div>
      <div style={{fontSize:24,fontWeight:800,color:'#fff'}}>{value}</div>
      <div style={{fontSize:11,color:'#888',marginTop:2}}>{label}</div>
      {delta && <div style={{fontSize:10,color:'#22C55E',marginTop:4}}>▲ {delta}</div>}
    </div>
  )
}

export default function Dashboard({ session, tiktokAccounts, onNavigate }) {
  const [stats, setStats] = useState({ automations:0, contacts:0, broadcasts:0, dms:0 })
  const [recentContacts, setRecentContacts] = useState([])
  const [recentAutomations, setRecentAutomations] = useState([])
  const uid = session.user.id

  useEffect(() => {
    async function load() {
      const [a, c, b] = await Promise.all([
        supabase.from('automations').select('id,dms_sent').eq('user_id',uid),
        supabase.from('contacts').select('id').eq('user_id',uid),
        supabase.from('broadcasts').select('id').eq('user_id',uid),
      ])
      const totalDms = (a.data||[]).reduce((s,x)=>s+x.dms_sent,0)
      setStats({ automations:(a.data||[]).length, contacts:(c.data||[]).length, broadcasts:(b.data||[]).length, dms:totalDms })
      const rc = await supabase.from('contacts').select('*').eq('user_id',uid).order('created_at',{ascending:false}).limit(5)
      setRecentContacts(rc.data||[])
      const ra = await supabase.from('automations').select('*').eq('user_id',uid).order('created_at',{ascending:false}).limit(4)
      setRecentAutomations(ra.data||[])
    }
    load()
  }, [uid])

  const TRIGGER_ICONS = {comment:'💬',live:'🔴',follow:'🔔',story:'📸',mention:'🎯',dm:'📩',broadcast:'📣',sequence:'📆'}

  return (
    <div style={{padding:'20px 24px'}}>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:20,fontWeight:800,color:'#fff'}}>Welcome back 👋</div>
        {tiktokAccounts[0] && <div style={{fontSize:12,color:'#888',marginTop:3}}>Managing <span style={{color:'#25F4EE',fontWeight:600}}>@{tiktokAccounts[0].username}</span></div>}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        <StatCard icon="⚙️" value={stats.automations} label="Active Flows" color="#FE2C55" />
        <StatCard icon="💬" value={stats.dms} label="DMs Sent" color="#25F4EE" />
        <StatCard icon="👥" value={stats.contacts} label="Leads Captured" color="#22C55E" />
        <StatCard icon="📣" value={stats.broadcasts} label="Broadcasts" color="#F59E0B" />
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        {/* Recent Automations */}
        <div style={{background:'#181818',border:'1px solid #2A2A2A',borderRadius:12,padding:16}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>Your Automations</div>
            <button onClick={() => onNavigate('automations')} style={{background:'transparent',border:'1px solid #2A2A2A',color:'#888',borderRadius:6,padding:'3px 9px',fontSize:11,cursor:'pointer'}}>View all</button>
          </div>
          {recentAutomations.length === 0 ? (
            <div style={{textAlign:'center',padding:'20px 0',color:'#888',fontSize:12}}>
              <div style={{fontSize:24,marginBottom:8}}>⚙️</div>
              No automations yet
              <div><button onClick={() => onNavigate('automations')} style={{marginTop:10,background:'#FE2C55',color:'#fff',border:'none',borderRadius:6,padding:'6px 14px',fontSize:11,fontWeight:700,cursor:'pointer'}}>Create your first</button></div>
            </div>
          ) : recentAutomations.map(a => (
            <div key={a.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:'1px solid #2A2A2A'}}>
              <div style={{width:34,height:34,borderRadius:8,background:'rgba(254,44,85,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0}}>{TRIGGER_ICONS[a.trigger_type]||'⚡'}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.name}</div>
                <div style={{fontSize:10,color:'#888'}}>{a.dms_sent} DMs sent</div>
              </div>
              <span style={{fontSize:10,fontWeight:600,padding:'2px 7px',borderRadius:4,background:a.status==='active'?'rgba(34,197,94,0.13)':'rgba(245,158,11,0.13)',color:a.status==='active'?'#22C55E':'#F59E0B'}}>{a.status}</span>
            </div>
          ))}
        </div>

        {/* Recent Contacts */}
        <div style={{background:'#181818',border:'1px solid #2A2A2A',borderRadius:12,padding:16}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>Recent Leads</div>
            <button onClick={() => onNavigate('contacts')} style={{background:'transparent',border:'1px solid #2A2A2A',color:'#888',borderRadius:6,padding:'3px 9px',fontSize:11,cursor:'pointer'}}>View all</button>
          </div>
          {recentContacts.length === 0 ? (
            <div style={{textAlign:'center',padding:'20px 0',color:'#888',fontSize:12}}>
              <div style={{fontSize:24,marginBottom:8}}>👥</div>
              No leads yet — create an automation and simulate a trigger
            </div>
          ) : recentContacts.map(c => (
            <div key={c.id} style={{display:'flex',alignItems:'center',gap:9,padding:'8px 0',borderBottom:'1px solid #2A2A2A'}}>
              <div style={{width:28,height:28,borderRadius:'50%',background:'rgba(37,244,238,0.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#25F4EE',flexShrink:0}}>
                {c.tiktok_username?.[0]?.toUpperCase()||'?'}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:'#fff'}}>@{c.tiktok_username}</div>
                <div style={{fontSize:10,color:'#888'}}>{c.trigger_type} trigger · {new Date(c.created_at).toLocaleDateString()}</div>
              </div>
              {(c.tags||[]).slice(0,1).map(t => (
                <span key={t} style={{fontSize:10,padding:'2px 6px',borderRadius:4,background:'rgba(37,244,238,0.1)',color:'#25F4EE'}}>{t}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{marginTop:14,background:'rgba(254,44,85,0.06)',border:'1px solid rgba(254,44,85,0.2)',borderRadius:12,padding:16,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:3}}>🚀 Ready to automate?</div>
          <div style={{fontSize:12,color:'#888'}}>Create your first comment trigger — someone comments "link" and TikFlow auto-DMs them instantly.</div>
        </div>
        <button onClick={() => onNavigate('automations')} style={{background:'#FE2C55',color:'#fff',border:'none',borderRadius:8,padding:'8px 16px',fontSize:12,fontWeight:700,cursor:'pointer',flexShrink:0,marginLeft:16}}>＋ New Automation</button>
      </div>
    </div>
  )
}
