import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const TAG_COLORS = {
  comment:'#25F4EE', live:'#EE1D52', follow:'#22C55E', story:'#F59E0B',
  mention:'#8B5CF6', dm:'#EC4899', simulated:'#444', interested:'#14B8A6',
  buyer:'#22C55E', lead:'#3B82F6', vip:'#F59E0B',
}

function AddContactModal({ onClose, onSave }) {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!username.trim()) return
    setSaving(true)
    await onSave({
      tiktok_username: username.replace('@','').trim(),
      display_name: displayName.trim() || username.trim(),
      email: email.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
      tags: tags.split(',').map(t=>t.trim()).filter(Boolean),
      trigger_type: 'manual',
    })
    setSaving(false)
    onClose()
  }

  const S = { input: { width:'100%', background:'#0D0D0D', border:'1px solid #2A2A2A', borderRadius:8, padding:'8px 11px', color:'#fff', fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }, label: { fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'#888', display:'block', marginBottom:5 } }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:'#181818',border:'1px solid #2A2A2A',borderRadius:16,width:'100%',maxWidth:440,maxHeight:'85vh',overflowY:'auto'}}>
        <div style={{padding:'14px 18px',borderBottom:'1px solid #2A2A2A',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontSize:14,fontWeight:800,color:'#fff'}}>Add Contact Manually</div>
          <button onClick={onClose} style={{background:'#222',border:'1px solid #2A2A2A',color:'#888',borderRadius:6,width:26,height:26,cursor:'pointer',fontSize:13}}>✕</button>
        </div>
        <div style={{padding:'16px 18px',display:'flex',flexDirection:'column',gap:12}}>
          <div><label style={S.label}>TikTok Username *</label><input value={username} onChange={e=>setUsername(e.target.value)} placeholder="@username" style={S.input} /></div>
          <div><label style={S.label}>Display Name</label><input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Full name" style={S.input} /></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div><label style={S.label}>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@example.com" style={S.input} /></div>
            <div><label style={S.label}>Phone</label><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+1 555 0100" style={S.input} /></div>
          </div>
          <div><label style={S.label}>Tags (comma separated)</label><input value={tags} onChange={e=>setTags(e.target.value)} placeholder="lead, buyer, vip" style={S.input} /></div>
          <div><label style={S.label}>Notes</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="Any notes about this contact…" style={{...S.input,resize:'vertical'}} /></div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:4}}>
            <button onClick={onClose} style={{background:'transparent',border:'1px solid #2A2A2A',color:'#888',borderRadius:7,padding:'7px 14px',fontSize:12,cursor:'pointer'}}>Cancel</button>
            <button onClick={save} disabled={saving||!username.trim()} style={{background:'#FE2C55',color:'#fff',border:'none',borderRadius:7,padding:'7px 16px',fontSize:12,fontWeight:700,cursor:'pointer',opacity:!username.trim()?0.5:1}}>
              {saving ? 'Saving…' : 'Add Contact'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Contacts({ session }) {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState(null)
  const fileRef = useRef()
  const uid = session.user.id

  useEffect(() => { load() }, [uid])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('contacts').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    setContacts(data || [])
    setLoading(false)
  }

  async function addContact(fields) {
    await supabase.from('contacts').insert({ ...fields, user_id: uid })
    load()
  }

  async function deleteContact(id) {
    if (!confirm('Remove this contact?')) return
    await supabase.from('contacts').delete().eq('id', id)
    setContacts(prev => prev.filter(c => c.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  function exportCSV() {
    const headers = ['tiktok_username','display_name','email','phone','tags','trigger_type','notes','created_at']
    const rows = contacts.map(c => headers.map(h => {
      const v = h === 'tags' ? (c.tags||[]).join('|') : (c[h] || '')
      return `"${String(v).replace(/"/g,'""')}"`
    }).join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `tikflow_contacts_${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  function importCSV(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      const lines = ev.target.result.split('\n').filter(Boolean)
      const headers = lines[0].split(',').map(h => h.replace(/"/g,'').trim())
      const rows = lines.slice(1)
      const toInsert = rows.map(row => {
        const vals = row.split(',').map(v => v.replace(/^"|"$/g,'').trim())
        const obj = {}
        headers.forEach((h,i) => { obj[h] = vals[i] || '' })
        return {
          user_id: uid,
          tiktok_username: obj.tiktok_username || obj.username || '',
          display_name: obj.display_name || obj.name || '',
          email: obj.email || '',
          phone: obj.phone || '',
          notes: obj.notes || '',
          tags: obj.tags ? obj.tags.split('|').filter(Boolean) : [],
          trigger_type: obj.trigger_type || 'import',
        }
      }).filter(c => c.tiktok_username)
      if (toInsert.length === 0) { alert('No valid contacts found in CSV.'); return }
      await supabase.from('contacts').insert(toInsert)
      load()
      alert(`Imported ${toInsert.length} contacts!`)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const allTags = [...new Set(contacts.flatMap(c => c.tags || []))]
  const filtered = contacts.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || (c.tiktok_username||'').toLowerCase().includes(q) || (c.display_name||'').toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q)
    const matchTag = filterTag === 'all' || (c.tags||[]).includes(filterTag)
    return matchSearch && matchTag
  })

  return (
    <div style={{padding:'20px 24px'}}>
      {showAdd && <AddContactModal onClose={() => setShowAdd(false)} onSave={addContact} />}
      <input type="file" accept=".csv" ref={fileRef} onChange={importCSV} style={{display:'none'}} />

      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:'#fff'}}>Contacts</div>
          <div style={{fontSize:12,color:'#888',marginTop:2}}>{contacts.length} leads collected</div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={() => fileRef.current.click()} style={{background:'transparent',border:'1px solid #2A2A2A',color:'#888',borderRadius:7,padding:'7px 12px',fontSize:11,cursor:'pointer',fontWeight:600}}>⬆ Import CSV</button>
          <button onClick={exportCSV} disabled={contacts.length===0} style={{background:'transparent',border:'1px solid #2A2A2A',color:'#888',borderRadius:7,padding:'7px 12px',fontSize:11,cursor:'pointer',fontWeight:600,opacity:contacts.length===0?0.4:1}}>⬇ Export CSV</button>
          <button onClick={() => setShowAdd(true)} style={{background:'#FE2C55',color:'#fff',border:'none',borderRadius:7,padding:'7px 14px',fontSize:11,fontWeight:700,cursor:'pointer'}}>＋ Add Contact</button>
        </div>
      </div>

      {/* Search + tag filters */}
      <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by username, name, email…" style={{flex:'1',minWidth:200,background:'#181818',border:'1px solid #2A2A2A',borderRadius:8,padding:'7px 12px',color:'#fff',fontSize:12,outline:'none',fontFamily:'inherit'}} />
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {['all',...allTags].map(t => (
            <button key={t} onClick={()=>setFilterTag(t)} style={{background:filterTag===t?'rgba(254,44,85,0.15)':'transparent',border:`1px solid ${filterTag===t?'#FE2C55':'#2A2A2A'}`,color:filterTag===t?'#FE2C55':'#888',borderRadius:20,padding:'4px 10px',fontSize:10,fontWeight:600,cursor:'pointer',textTransform:'capitalize'}}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div style={{color:'#888',fontSize:13}}>Loading contacts…</div> :
       filtered.length === 0 ? (
        <div style={{textAlign:'center',padding:'48px 0',background:'#181818',border:'1px solid #2A2A2A',borderRadius:12}}>
          <div style={{fontSize:32,marginBottom:10}}>👥</div>
          <div style={{fontSize:15,fontWeight:700,color:'#fff',marginBottom:6}}>{contacts.length === 0 ? 'No contacts yet' : 'No matches'}</div>
          <div style={{fontSize:12,color:'#888',marginBottom:14}}>{contacts.length === 0 ? 'Simulate triggers on your automations or import a CSV to add leads' : 'Try a different search or tag filter'}</div>
          {contacts.length === 0 && <button onClick={() => setShowAdd(true)} style={{background:'#FE2C55',color:'#fff',border:'none',borderRadius:7,padding:'8px 18px',fontSize:12,fontWeight:700,cursor:'pointer'}}>Add First Contact</button>}
        </div>
       ) : (
        <div style={{background:'#181818',border:'1px solid #2A2A2A',borderRadius:12,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{borderBottom:'1px solid #2A2A2A'}}>
                {['TikTok','Name','Email','Source','Tags','Added',''].map(h => (
                  <th key={h} style={{textAlign:'left',padding:'9px 12px',color:'#555',fontWeight:600,fontSize:10,textTransform:'uppercase',letterSpacing:'0.06em'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} style={{borderBottom:'1px solid #1A1A1A',cursor:'pointer'}} onClick={() => setSelected(selected?.id===c.id?null:c)}>
                  <td style={{padding:'10px 12px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:26,height:26,borderRadius:'50%',background:'rgba(37,244,238,0.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#25F4EE',flexShrink:0}}>
                        {(c.tiktok_username||'?')[0].toUpperCase()}
                      </div>
                      <span style={{color:'#25F4EE',fontWeight:600}}>@{c.tiktok_username}</span>
                    </div>
                  </td>
                  <td style={{padding:'10px 12px',color:'#ccc'}}>{c.display_name || '—'}</td>
                  <td style={{padding:'10px 12px',color:'#888'}}>{c.email || '—'}</td>
                  <td style={{padding:'10px 12px'}}>
                    <span style={{background:'rgba(254,44,85,0.1)',color:'#FE2C55',padding:'2px 7px',borderRadius:4,fontSize:10,fontWeight:600}}>{c.trigger_type}</span>
                  </td>
                  <td style={{padding:'10px 12px'}}>
                    <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                      {(c.tags||[]).slice(0,2).map(t => (
                        <span key={t} style={{background:`${TAG_COLORS[t]||'#333'}22`,color:TAG_COLORS[t]||'#888',padding:'2px 6px',borderRadius:4,fontSize:10,fontWeight:600}}>{t}</span>
                      ))}
                      {(c.tags||[]).length > 2 && <span style={{color:'#555',fontSize:10}}>+{c.tags.length-2}</span>}
                    </div>
                  </td>
                  <td style={{padding:'10px 12px',color:'#555',fontSize:11}}>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td style={{padding:'10px 12px'}}><button onClick={e=>{e.stopPropagation();deleteContact(c.id)}} style={{background:'transparent',border:'none',color:'#444',cursor:'pointer',fontSize:14}}>🗑</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
       )
      }

      {/* Detail panel */}
      {selected && (
        <div style={{marginTop:14,background:'#181818',border:'1px solid #2A2A2A',borderRadius:12,padding:16}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>Contact Detail</div>
            <button onClick={()=>setSelected(null)} style={{background:'transparent',border:'none',color:'#555',cursor:'pointer',fontSize:13}}>✕</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,fontSize:12}}>
            {[
              {l:'TikTok',v:`@${selected.tiktok_username}`},
              {l:'Display Name',v:selected.display_name||'—'},
              {l:'Email',v:selected.email||'—'},
              {l:'Phone',v:selected.phone||'—'},
              {l:'Source',v:selected.trigger_type},
              {l:'Added',v:new Date(selected.created_at).toLocaleString()},
            ].map(({l,v}) => (
              <div key={l} style={{background:'#0D0D0D',borderRadius:8,padding:'9px 12px'}}>
                <div style={{fontSize:10,color:'#555',marginBottom:3,textTransform:'uppercase',fontWeight:700}}>{l}</div>
                <div style={{color:'#fff',fontWeight:600}}>{v}</div>
              </div>
            ))}
          </div>
          {selected.notes && <div style={{marginTop:10,background:'#0D0D0D',borderRadius:8,padding:'9px 12px',fontSize:12,color:'#888'}}><span style={{color:'#555',fontSize:10,fontWeight:700,textTransform:'uppercase',display:'block',marginBottom:3}}>Notes</span>{selected.notes}</div>}
        </div>
      )}
    </div>
  )
}
