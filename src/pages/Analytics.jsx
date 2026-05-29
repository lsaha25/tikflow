import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function StatBox({ icon, value, label, color, sub }) {
  return (
    <div style={{background:'#181818',border:`1px solid #2A2A2A`,borderTop:`2px solid ${color}`,borderRadius:10,padding:14}}>
      <div style={{fontSize:18,marginBottom:5}}>{icon}</div>
      <div style={{fontSize:22,fontWeight:800,color:'#fff'}}>{value}</div>
      <div style={{fontSize:11,color:'#888',marginTop:2}}>{label}</div>
      {sub && <div style={{fontSize:10,color:color,marginTop:4}}>{sub}</div>}
    </div>
  )
}

function SimpleBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value/max)*100) : 0
  return (
    <div style={{marginBottom:10}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,fontSize:11}}>
        <span style={{color:'#ccc',textTransform:'capitalize'}}>{label}</span>
        <span style={{color:'#fff',fontWeight:700}}>{value}</span>
      </div>
      <div style={{height:6,background:'#2A2A2A',borderRadius:6,overflow:'hidden'}}>
        <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:6,transition:'width 0.5s ease'}} />
      </div>
    </div>
  )
}

export default function Analytics({ session }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState(30)
  const uid = session.user.id

  useEffect(() => { load() }, [uid, range])

  async function load() {
    setLoading(true)
    const since = new Date(Date.now() - range * 24 * 60 * 60 * 1000).toISOString()

    const [automRes, contRes, bcRes, seqRes, recentContRes] = await Promise.all([
      supabase.from('automations').select('*').eq('user_id', uid),
      supabase.from('contacts').select('*').eq('user_id', uid),
      supabase.from('broadcasts').select('*').eq('user_id', uid),
      supabase.from('sequences').select('*').eq('user_id', uid),
      supabase.from('contacts').select('created_at,trigger_type').eq('user_id', uid).gte('created_at', since),
    ])

    const automations = automRes.data || []
    const contacts = contRes.data || []
    const broadcasts = bcRes.data || []
    const sequences = seqRes.data || []
    const recent = recentContRes.data || []

    const totalDms = automations.reduce((s,a) => s+a.dms_sent, 0)
    const activeAutos = automations.filter(a => a.status === 'active').length
    const sentBroadcasts = broadcasts.filter(b => b.status === 'sent').length
    const broadcastReach = broadcasts.filter(b=>b.status==='sent').reduce((s,b)=>s+(b.sent_count||0),0)

    // Breakdown by trigger type
    const byTrigger = {}
    contacts.forEach(c => { byTrigger[c.trigger_type] = (byTrigger[c.trigger_type]||0)+1 })

    // DMs by automation
    const topAutos = [...automations].sort((a,b)=>b.dms_sent-a.dms_sent).slice(0,5)

    // Recent contacts per day (last 7 days)
    const dayBuckets = {}
    for (let i=6; i>=0; i--) {
      const d = new Date(Date.now() - i*86400000)
      dayBuckets[d.toLocaleDateString('en-US',{weekday:'short'})] = 0
    }
    recent.forEach(c => {
      const day = new Date(c.created_at).toLocaleDateString('en-US',{weekday:'short'})
      if (day in dayBuckets) dayBuckets[day]++
    })

    setData({ automations, contacts, broadcasts, sequences, totalDms, activeAutos, sentBroadcasts, broadcastReach, byTrigger, topAutos, dayBuckets, recentCount: recent.length })
    setLoading(false)
  }

  if (loading) return <div style={{padding:'40px 24px',color:'#888',fontSize:13}}>Loading analytics…</div>

  const maxDay = Math.max(...Object.values(data.dayBuckets))
  const maxTrigger = Math.max(...Object.values(data.byTrigger), 1)
  const maxDms = Math.max(...data.topAutos.map(a=>a.dms_sent), 1)

  const TRIGGER_COLORS = { comment:'#25F4EE', live:'#EE1D52', follow:'#22C55E', story:'#F59E0B', mention:'#8B5CF6', dm:'#EC4899', manual:'#888', import:'#555', simulated:'#444' }

  return (
    <div style={{padding:'20px 24px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:'#fff'}}>Analytics</div>
          <div style={{fontSize:12,color:'#888',marginTop:2}}>Your TikFlow performance at a glance</div>
        </div>
        <div style={{display:'flex',gap:4}}>
          {[7,30,90].map(d => (
            <button key={d} onClick={()=>setRange(d)} style={{background:range===d?'rgba(254,44,85,0.15)':'transparent',border:`1px solid ${range===d?'#FE2C55':'#2A2A2A'}`,color:range===d?'#FE2C55':'#555',borderRadius:6,padding:'5px 11px',fontSize:11,fontWeight:600,cursor:'pointer'}}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
        <StatBox icon="💬" value={data.totalDms} label="Total DMs Sent" color="#FE2C55" />
        <StatBox icon="👥" value={data.contacts.length} label="Total Leads" color="#25F4EE" sub={`+${data.recentCount} in last ${range}d`} />
        <StatBox icon="⚙️" value={data.activeAutos} label="Active Automations" color="#22C55E" sub={`${data.automations.length} total`} />
        <StatBox icon="📣" value={data.broadcastReach} label="Broadcast Reach" color="#F59E0B" sub={`${data.sentBroadcasts} sent`} />
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        {/* Leads per day chart */}
        <div style={{background:'#181818',border:'1px solid #2A2A2A',borderRadius:12,padding:16}}>
          <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:14}}>Leads Captured — Last 7 Days</div>
          {maxDay === 0 ? (
            <div style={{textAlign:'center',padding:'24px 0',color:'#555',fontSize:12}}>No data yet — simulate triggers on your automations</div>
          ) : (
            <div style={{display:'flex',alignItems:'flex-end',gap:6,height:80}}>
              {Object.entries(data.dayBuckets).map(([day, count]) => (
                <div key={day} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                  <div style={{fontSize:10,color:'#888',fontWeight:600}}>{count > 0 ? count : ''}</div>
                  <div style={{width:'100%',background:'rgba(254,44,85,0.7)',borderRadius:'3px 3px 0 0',transition:'height 0.4s',height:maxDay>0?`${Math.max(4,(count/maxDay)*60)}px`:'4px'}} />
                  <div style={{fontSize:9,color:'#555'}}>{day}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leads by trigger type */}
        <div style={{background:'#181818',border:'1px solid #2A2A2A',borderRadius:12,padding:16}}>
          <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:14}}>Leads by Source</div>
          {Object.keys(data.byTrigger).length === 0 ? (
            <div style={{textAlign:'center',padding:'24px 0',color:'#555',fontSize:12}}>No contacts yet</div>
          ) : (
            Object.entries(data.byTrigger).sort((a,b)=>b[1]-a[1]).map(([type, count]) => (
              <SimpleBar key={type} label={type} value={count} max={maxTrigger} color={TRIGGER_COLORS[type]||'#888'} />
            ))
          )}
        </div>
      </div>

      {/* Top automations */}
      <div style={{background:'#181818',border:'1px solid #2A2A2A',borderRadius:12,padding:16,marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:12}}>Top Automations by DMs Sent</div>
        {data.topAutos.length === 0 ? (
          <div style={{color:'#555',fontSize:12}}>No automations yet</div>
        ) : data.topAutos.map((a,i) => (
          <div key={a.id} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
            <div style={{width:20,fontSize:11,color:'#555',fontWeight:700,textAlign:'center'}}>{i+1}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:3,fontSize:12}}>
                <span style={{color:'#ccc',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.name}</span>
                <span style={{color:'#fff',fontWeight:700,flexShrink:0,marginLeft:8}}>{a.dms_sent} DMs</span>
              </div>
              <div style={{height:4,background:'#2A2A2A',borderRadius:4}}>
                <div style={{height:'100%',width:`${maxDms>0?Math.max(2,(a.dms_sent/maxDms)*100):0}%`,background:'linear-gradient(90deg,#FE2C55,#25F4EE)',borderRadius:4}} />
              </div>
            </div>
            <span style={{fontSize:9,fontWeight:700,padding:'2px 5px',borderRadius:3,background:a.status==='active'?'rgba(34,197,94,0.13)':'rgba(245,158,11,0.13)',color:a.status==='active'?'#22C55E':'#F59E0B',flexShrink:0}}>
              {a.status}
            </span>
          </div>
        ))}
      </div>

      {/* Sequences summary */}
      {data.sequences.length > 0 && (
        <div style={{background:'#181818',border:'1px solid #2A2A2A',borderRadius:12,padding:16}}>
          <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:12}}>Sequences</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
            {data.sequences.map(s => (
              <div key={s.id} style={{background:'#0D0D0D',borderRadius:8,padding:10,border:'1px solid #2A2A2A'}}>
                <div style={{fontSize:12,fontWeight:600,color:'#fff',marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.name}</div>
                <div style={{fontSize:11,color:'#888'}}>{s.enrolled||0} enrolled · {(s.steps||[]).length} steps</div>
                <div style={{fontSize:10,marginTop:4,color:s.status==='active'?'#22C55E':'#F59E0B',fontWeight:700}}>{s.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
