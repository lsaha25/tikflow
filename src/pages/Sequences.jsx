import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const STEP_TYPES = [
  { id:'message', icon:'💬', label:'Send DM' },
  { id:'delay',   icon:'⏱',  label:'Wait' },
  { id:'tag',     icon:'🏷',  label:'Add Tag' },
]

function SequenceModal({ onClose, onSave, initial }) {
  const [name, setName] = useState(initial?.name || '')
  const [steps, setSteps] = useState(initial?.steps || [{ type:'message', content:'Hey {{first_name}}! 👋 Welcome!', delay_hours:0 }])
  const [saving, setSaving] = useState(false)

  const S = {
    input: { width:'100%', background:'#0D0D0D', border:'1px solid #2A2A2A', borderRadius:8, padding:'8px 11px', color:'#fff', fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' },
    label: { fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'#888', display:'block', marginBottom:5 },
  }

  function addStep() {
    setSteps(prev => [...prev, { type:'message', content:'', delay_hours:24 }])
  }
  function removeStep(i) {
    setSteps(prev => prev.filter((_,idx)=>idx!==i))
  }
  function updateStep(i, field, val) {
    setSteps(prev => prev.map((s,idx) => idx===i ? {...s,[field]:val} : s))
  }

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    await onSave({ name, steps })
    setSaving(false)
    onClose()
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:'#181818',border:'1px solid #2A2A2A',borderRadius:16,width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{padding:'14px 18px',borderBottom:'1px solid #2A2A2A',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontSize:14,fontWeight:800,color:'#fff'}}>{initial ? 'Edit' : 'New'} Sequence</div>
          <button onClick={onClose} style={{background:'#222',border:'1px solid #2A2A2A',color:'#888',borderRadius:6,width:26,height:26,cursor:'pointer',fontSize:13}}>✕</button>
        </div>
        <div style={{padding:'16px 18px',display:'flex',flexDirection:'column',gap:14}}>
          <div><label style={S.label}>Sequence Name *</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. New Follower Welcome Series" style={S.input} /></div>

          <div>
            <label style={S.label}>Steps</label>
            {steps.map((step, i) => (
              <div key={i} style={{background:'#0D0D0D',border:'1px solid #2A2A2A',borderRadius:9,padding:12,marginBottom:8,position:'relative'}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:'50%',background:'rgba(254,44,85,0.2)',color:'#FE2C55',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800}}>{i+1}</div>
                  {i > 0 && <div style={{fontSize:11,color:'#555'}}>After {steps[i-1]?.delay_hours || 0}h delay</div>}
                  <button onClick={()=>removeStep(i)} disabled={steps.length===1} style={{marginLeft:'auto',background:'transparent',border:'none',color:'#444',cursor:'pointer',fontSize:13,opacity:steps.length===1?0.3:1}}>✕</button>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:8,marginBottom:8}}>
                  <select value={step.type} onChange={e=>updateStep(i,'type',e.target.value)} style={{background:'#181818',border:'1px solid #2A2A2A',borderRadius:7,padding:'7px 10px',color:'#fff',fontSize:12,outline:'none',cursor:'pointer'}}>
                    {STEP_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                  </select>
                  {step.type === 'delay' ? (
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <input type="number" min="1" value={step.delay_hours} onChange={e=>updateStep(i,'delay_hours',parseInt(e.target.value)||1)} style={{...S.input,width:80}} />
                      <span style={{color:'#888',fontSize:12}}>hours</span>
                    </div>
                  ) : step.type === 'tag' ? (
                    <input value={step.content} onChange={e=>updateStep(i,'content',e.target.value)} placeholder="Tag name to apply" style={S.input} />
                  ) : (
                    <textarea value={step.content} onChange={e=>updateStep(i,'content',e.target.value)} rows={2} placeholder="DM message…" style={{...S.input,resize:'vertical'}} />
                  )}
                </div>
                {step.type !== 'delay' && (
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <span style={{fontSize:11,color:'#555'}}>Send after</span>
                    <input type="number" min="0" value={step.delay_hours} onChange={e=>updateStep(i,'delay_hours',parseInt(e.target.value)||0)} style={{...S.input,width:70}} />
                    <span style={{fontSize:11,color:'#555'}}>hours from previous step</span>
                  </div>
                )}
              </div>
            ))}
            <button onClick={addStep} style={{width:'100%',background:'transparent',border:'1px dashed #2A2A2A',color:'#555',borderRadius:8,padding:'9px',fontSize:12,cursor:'pointer',marginTop:4}}>＋ Add Step</button>
          </div>

          <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:4}}>
            <button onClick={onClose} style={{background:'transparent',border:'1px solid #2A2A2A',color:'#888',borderRadius:7,padding:'7px 14px',fontSize:12,cursor:'pointer'}}>Cancel</button>
            <button onClick={save} disabled={saving||!name.trim()} style={{background:'#FE2C55',color:'#fff',border:'none',borderRadius:7,padding:'7px 16px',fontSize:12,fontWeight:700,cursor:'pointer',opacity:!name.trim()?0.5:1}}>
              {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Sequence'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Sequences({ session }) {
  const [sequences, setSequences] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [active, setActive] = useState(null)
  const uid = session.user.id

  useEffect(() => { load() }, [uid])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('sequences').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    setSequences(data || [])
    if (data && data.length > 0 && !active) setActive(data[0])
    setLoading(false)
  }

  async function save(fields) {
    if (editing) {
      await supabase.from('sequences').update(fields).eq('id', editing.id)
    } else {
      await supabase.from('sequences').insert({ ...fields, user_id: uid, status: 'active', enrolled: 0 })
    }
    setEditing(null)
    load()
  }

  async function del(id) {
    if (!confirm('Delete this sequence?')) return
    await supabase.from('sequences').delete().eq('id', id)
    setSequences(prev => prev.filter(s => s.id !== id))
    if (active?.id === id) setActive(null)
  }

  async function toggle(s) {
    const newStatus = s.status === 'active' ? 'paused' : 'active'
    await supabase.from('sequences').update({ status: newStatus }).eq('id', s.id)
    setSequences(prev => prev.map(x => x.id===s.id ? {...x, status:newStatus} : x))
    if (active?.id === s.id) setActive(prev => ({...prev, status:newStatus}))
  }

  const STEP_ICONS = { message:'💬', delay:'⏱', tag:'🏷', email:'📧' }

  return (
    <div style={{padding:'20px 24px'}}>
      {showModal && <SequenceModal onClose={()=>{setShowModal(false);setEditing(null)}} onSave={save} initial={editing} />}

      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:'#fff'}}>Sequences</div>
          <div style={{fontSize:12,color:'#888',marginTop:2}}>Drip DM campaigns that run automatically over time</div>
        </div>
        <button onClick={()=>{setEditing(null);setShowModal(true)}} style={{background:'#FE2C55',color:'#fff',border:'none',borderRadius:8,padding:'8px 16px',fontSize:12,fontWeight:700,cursor:'pointer'}}>＋ New Sequence</button>
      </div>

      {loading ? <div style={{color:'#888',fontSize:13}}>Loading…</div> :
       sequences.length === 0 ? (
        <div style={{textAlign:'center',padding:'48px 0',background:'#181818',border:'1px solid #2A2A2A',borderRadius:12}}>
          <div style={{fontSize:32,marginBottom:10}}>📆</div>
          <div style={{fontSize:15,fontWeight:700,color:'#fff',marginBottom:6}}>No sequences yet</div>
          <div style={{fontSize:12,color:'#888',marginBottom:16}}>Build drip campaigns — welcome series, follow-up flows, nurture sequences</div>
          <button onClick={()=>setShowModal(true)} style={{background:'#FE2C55',color:'#fff',border:'none',borderRadius:8,padding:'9px 20px',fontSize:12,fontWeight:700,cursor:'pointer'}}>Create Your First Sequence</button>
        </div>
       ) : (
        <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:14}}>
          {/* List */}
          <div>
            {sequences.map(s => (
              <div key={s.id} onClick={()=>setActive(s)}
                style={{background:'#181818',border:`1.5px solid ${active?.id===s.id?'#FE2C55':'#2A2A2A'}`,borderRadius:10,padding:12,marginBottom:8,cursor:'pointer',transition:'border-color 0.15s'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:5}}>
                  <div style={{fontSize:13,fontWeight:700,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,marginRight:8}}>{s.name}</div>
                  <span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:4,background:s.status==='active'?'rgba(34,197,94,0.13)':'rgba(245,158,11,0.13)',color:s.status==='active'?'#22C55E':'#F59E0B',flexShrink:0}}>
                    {s.status}
                  </span>
                </div>
                <div style={{fontSize:11,color:'#555'}}>{(s.steps||[]).length} steps · {s.enrolled||0} enrolled</div>
              </div>
            ))}
          </div>

          {/* Detail */}
          {active && (
            <div style={{background:'#181818',border:'1px solid #2A2A2A',borderRadius:12,padding:16}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <div>
                  <div style={{fontSize:15,fontWeight:800,color:'#fff',marginBottom:3}}>{active.name}</div>
                  <div style={{fontSize:11,color:'#888'}}>{active.enrolled||0} contacts enrolled</div>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>toggle(active)} style={{background:active.status==='active'?'rgba(245,158,11,0.1)':'rgba(34,197,94,0.1)',border:`1px solid ${active.status==='active'?'rgba(245,158,11,0.3)':'rgba(34,197,94,0.3)'}`,color:active.status==='active'?'#F59E0B':'#22C55E',borderRadius:6,padding:'5px 11px',fontSize:11,fontWeight:700,cursor:'pointer'}}>
                    {active.status==='active' ? '⏸ Pause' : '▶ Resume'}
                  </button>
                  <button onClick={()=>{setEditing(active);setShowModal(true)}} style={{background:'transparent',border:'1px solid #2A2A2A',color:'#888',borderRadius:6,padding:'5px 10px',fontSize:11,cursor:'pointer'}}>Edit</button>
                  <button onClick={()=>del(active.id)} style={{background:'transparent',border:'none',color:'#444',cursor:'pointer',fontSize:14}}>🗑</button>
                </div>
              </div>

              <div style={{position:'relative'}}>
                {(active.steps||[]).map((step, i) => (
                  <div key={i} style={{display:'flex',gap:12,marginBottom:8}}>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',flexShrink:0}}>
                      <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(254,44,85,0.12)',border:'1.5px solid rgba(254,44,85,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>
                        {STEP_ICONS[step.type]||'💬'}
                      </div>
                      {i < (active.steps||[]).length-1 && <div style={{width:1,flex:1,background:'#2A2A2A',margin:'3px 0',minHeight:16}} />}
                    </div>
                    <div style={{flex:1,background:'#0D0D0D',border:'1px solid #2A2A2A',borderRadius:8,padding:'10px 12px',marginBottom:4}}>
                      <div style={{fontSize:11,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4}}>
                        Step {i+1} · {step.type === 'message' ? 'Send DM' : step.type === 'delay' ? 'Wait' : 'Add Tag'}
                        {step.delay_hours > 0 && <span style={{marginLeft:6,color:'#555',fontWeight:500}}>after {step.delay_hours}h</span>}
                      </div>
                      <div style={{fontSize:12,color:'#ccc',lineHeight:1.5}}>
                        {step.type === 'delay' ? `Wait ${step.delay_hours} hours` : step.content || '(empty)'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
       )
      }

      <div style={{marginTop:16,padding:14,background:'rgba(236,72,153,0.05)',border:'1px solid rgba(236,72,153,0.15)',borderRadius:10,fontSize:12,color:'#888',lineHeight:1.7}}>
        💡 <strong style={{color:'#fff'}}>Sequences</strong> automate multi-step DM conversations over days or weeks. New followers get a welcome message immediately, then a follow-up 24 hours later, then an offer 3 days later — all on autopilot.
      </div>
    </div>
  )
}
