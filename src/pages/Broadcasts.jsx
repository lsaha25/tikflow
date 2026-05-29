import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function BroadcastModal({ onClose, onSave, initial }) {
  const [name, setName] = useState(initial?.name || '')
  const [message, setMessage] = useState(initial?.message || '')
  const [link, setLink] = useState(initial?.link_url || '')
  const [linkLabel, setLinkLabel] = useState(initial?.link_label || 'Click Here')
  const [scheduledAt, setScheduledAt] = useState(initial?.scheduled_at ? initial.scheduled_at.slice(0,16) : '')
  const [saving, setSaving] = useState(false)

  const S = {
    input: { width:'100%', background:'#0D0D0D', border:'1px solid #2A2A2A', borderRadius:8, padding:'8px 11px', color:'#fff', fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' },
    label: { fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'#888', display:'block', marginBottom:5 },
  }

  async function save() {
    if (!name.trim() || !message.trim()) return
    setSaving(true)
    const status = scheduledAt ? 'scheduled' : 'draft'
    await onSave({ name, message, link_url: link, link_label: linkLabel, scheduled_at: scheduledAt || null, status })
    setSaving(false)
    onClose()
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:'#181818',border:'1px solid #2A2A2A',borderRadius:16,width:'100%',maxWidth:480,maxHeight:'85vh',overflowY:'auto'}}>
        <div style={{padding:'14px 18px',borderBottom:'1px solid #2A2A2A',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontSize:14,fontWeight:800,color:'#fff'}}>{initial ? 'Edit' : 'New'} Broadcast</div>
          <button onClick={onClose} style={{background:'#222',border:'1px solid #2A2A2A',color:'#888',borderRadius:6,width:26,height:26,cursor:'pointer',fontSize:13}}>✕</button>
        </div>
        <div style={{padding:'16px 18px',display:'flex',flexDirection:'column',gap:13}}>
          <div><label style={S.label}>Broadcast Name *</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Summer Sale Announcement" style={S.input} /></div>
          <div>
            <label style={S.label}>DM Message *</label>
            <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={4} placeholder="Hey {{first_name}}! 👋 We have something special for you..." style={{...S.input,resize:'vertical'}} />
            <div style={{fontSize:10,color:'#888',marginTop:4}}>Variables: {'{{first_name}}'} {'{{tiktok_username}}'}</div>
          </div>
          <div style={{background:'rgba(37,244,238,0.05)',border:'1px solid rgba(37,244,238,0.15)',borderRadius:8,padding:12}}>
            <div style={{fontSize:11,color:'#25F4EE',fontWeight:700,marginBottom:10}}>🔗 Clickable Link Button (TikTok exclusive feature)</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div><label style={{...S.label,color:'#555'}}>Button Label</label><input value={linkLabel} onChange={e=>setLinkLabel(e.target.value)} placeholder="Shop Now" style={S.input} /></div>
              <div><label style={{...S.label,color:'#555'}}>URL</label><input value={link} onChange={e=>setLink(e.target.value)} placeholder="https://yoursite.com" style={S.input} /></div>
            </div>
          </div>
          <div>
            <label style={S.label}>Schedule Send (optional)</label>
            <input type="datetime-local" value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)} style={{...S.input,colorScheme:'dark'}} />
            <div style={{fontSize:10,color:'#888',marginTop:4}}>Leave empty to save as draft</div>
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:4}}>
            <button onClick={onClose} style={{background:'transparent',border:'1px solid #2A2A2A',color:'#888',borderRadius:7,padding:'7px 14px',fontSize:12,cursor:'pointer'}}>Cancel</button>
            <button onClick={save} disabled={saving||!name.trim()||!message.trim()} style={{background:'#FE2C55',color:'#fff',border:'none',borderRadius:7,padding:'7px 16px',fontSize:12,fontWeight:700,cursor:'pointer',opacity:(!name.trim()||!message.trim())?0.5:1}}>
              {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Broadcast'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Broadcasts({ session }) {
  const [broadcasts, setBroadcasts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [tabFilter, setTabFilter] = useState('all')
  const uid = session.user.id

  useEffect(() => { load() }, [uid])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('broadcasts').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    setBroadcasts(data || [])
    setLoading(false)
  }

  async function save(fields) {
    if (editing) {
      await supabase.from('broadcasts').update(fields).eq('id', editing.id)
    } else {
      await supabase.from('broadcasts').insert({ ...fields, user_id: uid })
    }
    setEditing(null)
    load()
  }

  async function del(id) {
    if (!confirm('Delete this broadcast?')) return
    await supabase.from('broadcasts').delete().eq('id', id)
    setBroadcasts(prev => prev.filter(b => b.id !== id))
  }

  async function simulateSend(b) {
    if (!confirm(`Simulate sending "${b.name}" to all contacts?`)) return
    const { count } = await supabase.from('contacts').select('*', { count:'exact', head:true }).eq('user_id', uid)
    const sent = count || 0
    await supabase.from('broadcasts').update({ status:'sent', sent_count: sent, sent_at: new Date().toISOString() }).eq('id', b.id)
    setBroadcasts(prev => prev.map(x => x.id===b.id ? {...x, status:'sent', sent_count:sent} : x))
  }

  const filtered = tabFilter === 'all' ? broadcasts : broadcasts.filter(b => b.status === tabFilter)
  const STATUS_COLOR = { sent:'#22C55E', scheduled:'#25F4EE', draft:'#888' }

  return (
    <div style={{padding:'20px 24px'}}>
      {showModal && <BroadcastModal onClose={()=>{setShowModal(false);setEditing(null)}} onSave={save} initial={editing} />}

      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:'#fff'}}>Broadcasts</div>
          <div style={{fontSize:12,color:'#888',marginTop:2}}>Mass TikTok DMs with clickable link buttons</div>
        </div>
        <button onClick={()=>{setEditing(null);setShowModal(true)}} style={{background:'#FE2C55',color:'#fff',border:'none',borderRadius:8,padding:'8px 16px',fontSize:12,fontWeight:700,cursor:'pointer'}}>＋ New Broadcast</button>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:4,marginBottom:16,borderBottom:'1px solid #2A2A2A',paddingBottom:0}}>
        {['all','sent','scheduled','draft'].map(t => (
          <button key={t} onClick={()=>setTabFilter(t)} style={{background:'transparent',border:'none',borderBottom:tabFilter===t?'2px solid #FE2C55':'2px solid transparent',color:tabFilter===t?'#fff':'#555',padding:'6px 14px',fontSize:12,fontWeight:600,cursor:'pointer',textTransform:'capitalize',marginBottom:-1}}>
            {t} {broadcasts.filter(b=>t==='all'||b.status===t).length > 0 && <span style={{background:'#222',color:'#888',borderRadius:10,padding:'1px 5px',fontSize:10,marginLeft:4}}>{broadcasts.filter(b=>t==='all'||b.status===t).length}</span>}
          </button>
        ))}
      </div>

      {loading ? <div style={{color:'#888',fontSize:13}}>Loading…</div> :
       filtered.length === 0 ? (
        <div style={{textAlign:'center',padding:'48px 0',background:'#181818',border:'1px solid #2A2A2A',borderRadius:12}}>
          <div style={{fontSize:32,marginBottom:10}}>📣</div>
          <div style={{fontSize:15,fontWeight:700,color:'#fff',marginBottom:6}}>No broadcasts yet</div>
          <div style={{fontSize:12,color:'#888',marginBottom:16}}>Send a mass DM to all your contacts at once, with clickable link buttons</div>
          <button onClick={()=>setShowModal(true)} style={{background:'#FE2C55',color:'#fff',border:'none',borderRadius:8,padding:'9px 20px',fontSize:12,fontWeight:700,cursor:'pointer'}}>Create Your First Broadcast</button>
        </div>
       ) : filtered.map(b => (
        <div key={b.id} style={{background:'#181818',border:'1px solid #2A2A2A',borderRadius:12,padding:16,marginBottom:10}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:8}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700,color:'#fff',marginBottom:3}}>{b.name}</div>
              <div style={{fontSize:11,color:'#888',lineHeight:1.5,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:400}}>
                {b.message}
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0,marginLeft:12}}>
              <span style={{fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:5,background:`${STATUS_COLOR[b.status]}22`,color:STATUS_COLOR[b.status]||'#888',textTransform:'capitalize'}}>{b.status}</span>
            </div>
          </div>

          <div style={{display:'flex',gap:12,fontSize:11,color:'#555',marginBottom:10,flexWrap:'wrap'}}>
            {b.sent_count > 0 && <span>✉ {b.sent_count} sent</span>}
            {b.scheduled_at && b.status==='scheduled' && <span>🕐 {new Date(b.scheduled_at).toLocaleString()}</span>}
            {b.sent_at && b.status==='sent' && <span>✅ Sent {new Date(b.sent_at).toLocaleDateString()}</span>}
            {b.link_url && <span style={{color:'#25F4EE'}}>🔗 {b.link_label || 'Link'}: {b.link_url.slice(0,30)}{b.link_url.length>30?'…':''}</span>}
          </div>

          <div style={{display:'flex',gap:8}}>
            {b.status !== 'sent' && (
              <button onClick={()=>simulateSend(b)} style={{background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.25)',color:'#22C55E',borderRadius:6,padding:'5px 11px',fontSize:11,fontWeight:700,cursor:'pointer'}}>
                ▶ Simulate Send
              </button>
            )}
            {b.status !== 'sent' && (
              <button onClick={()=>{setEditing(b);setShowModal(true)}} style={{background:'transparent',border:'1px solid #2A2A2A',color:'#888',borderRadius:6,padding:'5px 10px',fontSize:11,cursor:'pointer'}}>Edit</button>
            )}
            <button onClick={()=>del(b.id)} style={{background:'transparent',border:'none',color:'#444',cursor:'pointer',fontSize:14,marginLeft:'auto'}}>🗑</button>
          </div>
        </div>
       ))
      }

      <div style={{marginTop:16,padding:14,background:'rgba(37,244,238,0.05)',border:'1px solid rgba(37,244,238,0.15)',borderRadius:10,fontSize:12,color:'#888',lineHeight:1.7}}>
        💡 <strong style={{color:'#fff'}}>Clickable Links in DMs</strong> — TikTok allows link buttons inside DMs (unlike Instagram). Use broadcasts to send promotional messages with a "Shop Now" button that takes users directly to your website or product page.
      </div>
    </div>
  )
}
