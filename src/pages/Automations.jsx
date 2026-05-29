import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TRIGGERS = [
  {id:'comment',icon:'💬',label:'Comment Trigger',desc:'Someone comments on your video'},
  {id:'live',icon:'🔴',label:'Live Stream Comment',desc:'Comment during TikTok LIVE'},
  {id:'follow',icon:'🔔',label:'New Follower',desc:'Someone follows your account'},
  {id:'story',icon:'📸',label:'Story Reply',desc:'Someone replies to your story'},
  {id:'mention',icon:'🎯',label:'Video Mention',desc:'Someone mentions @you in a video'},
  {id:'dm',icon:'📩',label:'DM Received',desc:'Someone sends you a DM'},
]

const FAKE_USERS = ['sakura_dancing','tiktok_vibes99','alex_creator','mia_fashionista','streetfood_king','yogalife_daily','gamemaster_pro','travel_with_anna','fitness_beast','coffee_moments']

function Modal({ onClose, onSave, initial }) {
  const [name, setName] = useState(initial?.name||'')
  const [trigger, setTrigger] = useState(initial?.trigger_type||'comment')
  const [keywords, setKeywords] = useState((initial?.keywords||[]).join(', '))
  const [message, setMessage] = useState(initial?.dm_message||'Hey {{first_name}}! 👋 Thanks for reaching out. Here\'s the link you asked for 👇')
  const [saving, setSaving] = useState(false)
  const IS = {overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20},modal:{background:'#181818',border:'1px solid #2A2A2A',borderRadius:16,width:'100%',maxWidth:500,maxHeight:'85vh',overflowY:'auto'}}
  async function save() {
    if (!name.trim()) return
    setSaving(true)
    await onSave({ name, trigger_type:trigger, keywords:keywords.split(',').map(k=>k.trim()).filter(Boolean), dm_message:message })
    setSaving(false)
    onClose()
  }
  return (
    <div style={IS.overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={IS.modal}>
        <div style={{padding:'16px 20px',borderBottom:'1px solid #2A2A2A',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontSize:15,fontWeight:800,color:'#fff'}}>{initial?'Edit':'New'} Automation</div>
          <button onClick={onClose} style={{background:'#222',border:'1px solid #2A2A2A',color:'#888',borderRadius:6,width:26,height:26,cursor:'pointer',fontSize:13}}>✕</button>
        </div>
        <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:14}}>
          <div>
            <label style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',color:'#888',display:'block',marginBottom:5}}>Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Comment → DM Link" style={{width:'100%',background:'#0D0D0D',border:'1px solid #2A2A2A',borderRadius:8,padding:'9px 11px',color:'#fff',fontSize:13,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}} />
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',color:'#888',display:'block',marginBottom:8}}>Trigger Type</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {TRIGGERS.map(t => (
                <div key={t.id} onClick={()=>setTrigger(t.id)} style={{border:`1.5px solid ${trigger===t.id?'#FE2C55':'#2A2A2A'}`,background:trigger===t.id?'rgba(254,44,85,0.07)':'transparent',borderRadius:9,padding:'10px 11px',cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:17}}>{t.icon}</span>
                  <div><div style={{fontSize:12,fontWeight:600,color:'#fff'}}>{t.label}</div><div style={{fontSize:10,color:'#888'}}>{t.desc}</div></div>
                </div>
              ))}
            </div>
          </div>
          {['comment','live'].includes(trigger) && (
            <div>
              <label style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',color:'#888',display:'block',marginBottom:5}}>Keywords (comma separated)</label>
              <input value={keywords} onChange={e=>setKeywords(e.target.value)} placeholder="link, send it, drop it, price" style={{width:'100%',background:'#0D0D0D',border:'1px solid #2A2A2A',borderRadius:8,padding:'9px 11px',color:'#fff',fontSize:13,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}} />
              <div style={{fontSize:10,color:'#888',marginTop:4}}>Leave empty to trigger on any comment</div>
            </div>
          )}
          <div>
            <label style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',color:'#888',display:'block',marginBottom:5}}>DM Message</label>
            <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={3} style={{width:'100%',background:'#0D0D0D',border:'1px solid #2A2A2A',borderRadius:8,padding:'9px 11px',color:'#fff',fontSize:13,outline:'none',fontFamily:'inherit',resize:'vertical',boxSizing:'border-box'}} />
            <div style={{fontSize:10,color:'#888',marginTop:4}}>Variables: {'{{first_name}}'} {'{{tiktok_username}}'}</div>
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:4}}>
            <button onClick={onClose} style={{background:'transparent',border:'1px solid #2A2A2A',color:'#888',borderRadius:7,padding:'7px 14px',fontSize:12,cursor:'pointer'}}>Cancel</button>
            <button onClick={save} disabled={saving} style={{background:'#FE2C55',color:'#fff',border:'none',borderRadius:7,padding:'7px 16px',fontSize:12,fontWeight:700,cursor:'pointer'}}>
              {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Automation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Automations({ session }) {
  const [automations, setAutomations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [simulating, setSimulating] = useState(null)
  const uid = session.user.id

  useEffect(() => { load() }, [uid])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('automations').select('*').eq('user_id',uid).order('created_at',{ascending:false})
    setAutomations(data||[])
    setLoading(false)
  }

  async function save(fields) {
    if (editing) {
      await supabase.from('automations').update(fields).eq('id',editing.id)
    } else {
      await supabase.from('automations').insert({...fields, user_id:uid})
    }
    setEditing(null)
    load()
  }

  async function toggle(a) {
    const newStatus = a.status === 'active' ? 'paused' : 'active'
    await supabase.from('automations').update({status:newStatus}).eq('id',a.id)
    setAutomations(prev => prev.map(x => x.id===a.id ? {...x,status:newStatus} : x))
  }

  async function del(id) {
    if (!confirm('Delete this automation?')) return
    await supabase.from('automations').delete().eq('id',id)
    setAutomations(prev => prev.filter(x => x.id!==id))
  }

  async function simulate(a) {
    setSimulating(a.id)
    const fakeUser = FAKE_USERS[Math.floor(Math.random()*FAKE_USERS.length)] + '_' + Math.floor(Math.random()*999)
    await supabase.from('contacts').insert({
      user_id: uid, tiktok_username: fakeUser, display_name: fakeUser,
      trigger_type: a.trigger_type, automation_id: a.id,
      tags: [a.trigger_type, 'simulated'],
    })
    await supabase.from('automations').update({dms_sent: a.dms_sent+1}).eq('id',a.id)
    setAutomations(prev => prev.map(x => x.id===a.id ? {...x,dms_sent:x.dms_sent+1} : x))
    await new Promise(r => setTimeout(r, 800))
    setSimulating(null)
  }

  const ICONS = {comment:'💬',live:'🔴',follow:'🔔',story:'📸',mention:'🎯',dm:'📩'}

  return (
    <div style={{padding:'20px 24px'}}>
      {showModal && <Modal onClose={()=>{setShowModal(false);setEditing(null)}} onSave={save} initial={editing} />}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:'#fff'}}>Automations</div>
          <div style={{fontSize:12,color:'#888',marginTop:2}}>{automations.length} flows in your account</div>
        </div>
        <button onClick={()=>{setEditing(null);setShowModal(true)}} style={{background:'#FE2C55',color:'#fff',border:'none',borderRadius:8,padding:'8px 16px',fontSize:12,fontWeight:700,cursor:'pointer'}}>＋ New Automation</button>
      </div>

      {loading ? <div style={{color:'#888',fontSize:13}}>Loading…</div> :
       automations.length === 0 ? (
        <div style={{textAlign:'center',padding:'48px 0',background:'#181818',border:'1px solid #2A2A2A',borderRadius:12}}>
          <div style={{fontSize:32,marginBottom:10}}>⚡</div>
          <div style={{fontSize:15,fontWeight:700,color:'#fff',marginBottom:6}}>No automations yet</div>
          <div style={{fontSize:12,color:'#888',marginBottom:16}}>Create your first automation to start capturing leads</div>
          <button onClick={()=>setShowModal(true)} style={{background:'#FE2C55',color:'#fff',border:'none',borderRadius:8,padding:'9px 20px',fontSize:12,fontWeight:700,cursor:'pointer'}}>＋ Create Automation</button>
        </div>
       ) : automations.map(a => (
        <div key={a.id} style={{background:'#181818',border:'1px solid #2A2A2A',borderRadius:12,padding:'14px 16px',marginBottom:10,display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:40,height:40,borderRadius:10,background:'rgba(254,44,85,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{ICONS[a.trigger_type]||'⚡'}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:2}}>{a.name}</div>
            <div style={{fontSize:11,color:'#888'}}>
              {a.trigger_type} trigger
              {(a.keywords||[]).length>0 && ` · Keywords: ${a.keywords.join(', ')}`}
              &nbsp;·&nbsp;<span style={{color:'#25F4EE',fontWeight:600}}>{a.dms_sent} DMs sent</span>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
            {/* Simulate button */}
            <button onClick={()=>simulate(a)} disabled={simulating===a.id||a.status!=='active'} title="Simulate a trigger — adds a test contact and increments DMs sent" style={{background:'rgba(37,244,238,0.1)',border:'1px solid rgba(37,244,238,0.25)',color:'#25F4EE',borderRadius:6,padding:'5px 10px',fontSize:11,fontWeight:700,cursor:a.status==='active'?'pointer':'not-allowed',opacity:a.status!=='active'?0.4:1}}>
              {simulating===a.id ? '⏳' : '▶ Simulate'}
            </button>
            <button onClick={()=>{setEditing(a);setShowModal(true)}} style={{background:'transparent',border:'1px solid #2A2A2A',color:'#888',borderRadius:6,padding:'5px 9px',fontSize:11,cursor:'pointer'}}>Edit</button>
            {/* Toggle */}
            <label style={{position:'relative',width:36,height:19,cursor:'pointer',flexShrink:0}}>
              <input type="checkbox" checked={a.status==='active'} onChange={()=>toggle(a)} style={{opacity:0,width:0,height:0}} />
              <span style={{position:'absolute',inset:0,background:a.status==='active'?'#FE2C55':'#444',borderRadius:19,transition:'0.18s'}} />
              <span style={{position:'absolute',width:13,height:13,top:3,left:a.status==='active'?20:3,background:'#fff',borderRadius:'50%',transition:'0.18s'}} />
            </label>
            <button onClick={()=>del(a.id)} style={{background:'transparent',border:'none',color:'#555',cursor:'pointer',fontSize:15,padding:'0 2px'}}>🗑</button>
          </div>
        </div>
       ))
      }

      <div style={{marginTop:16,padding:14,background:'rgba(37,244,238,0.05)',border:'1px solid rgba(37,244,238,0.15)',borderRadius:10,fontSize:12,color:'#888',lineHeight:1.7}}>
        💡 <strong style={{color:'#fff'}}>Simulate Trigger</strong> — click ▶ Simulate on any active automation to create a test contact and see the full flow in action. Real TikTok triggers will work once connected to the TikTok API.
      </div>
    </div>
  )
}
