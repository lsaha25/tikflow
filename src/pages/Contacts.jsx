import { useState } from 'react'

const TAG_COLORS = {
  interested: '#14B8A6', buyer:'#22C55E', lead:'#3B82F6',
  vip:'#F59E0B', repeat:'#EC4899', partner:'#8B5CF6', refund:'#FE2C55',
}

export default function Contacts({ contacts, setContacts }) {
  const [search, setSearch]       = useState('')
  const [filterTag, setFilterTag] = useState('all')
  const [selected, setSelected]   = useState(null)

  const allTags = [...new Set(contacts.flatMap(c => c.tags))]

  const filtered = contacts.filter(c => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.handle.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    const matchTag = filterTag === 'all' || c.tags.includes(filterTag)
    return matchSearch && matchTag
  })

  return (
    <div className="page">
      <div className="page-hd">
        <div>
          <div className="page-title">Contacts</div>
          <div className="page-sub">{contacts.length} leads collected from TikTok automations</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-ghost btn-sm">📥 Export CSV</button>
          <button className="btn btn-primary btn-sm">＋ Add Contact</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:16, alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--card)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 12px', flex:1, maxWidth:280 }}>
          <span style={{ color:'var(--muted)' }}>🔍</span>
          <input style={{ background:'transparent', border:'none', outline:'none', color:'var(--text)', fontSize:13, flex:1 }}
            placeholder="Search by name, handle, email…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="tabs" style={{ marginBottom:0 }}>
          <div className={`tab${filterTag==='all'?' active':''}`} onClick={()=>setFilterTag('all')}>All ({contacts.length})</div>
          {allTags.map(t=>(
            <div key={t} className={`tab${filterTag===t?' active':''}`} onClick={()=>setFilterTag(t)}>
              {t} ({contacts.filter(c=>c.tags.includes(t)).length})
            </div>
          ))}
        </div>
      </div>

      <div className="two-col" style={{ gap:14, alignItems:'start' }}>
        {/* Table */}
        <div style={{ gridColumn: selected ? '1' : '1 / -1' }}>
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Contact</th>
                  <th>Trigger</th>
                  <th>Tags</th>
                  <th>Email</th>
                  <th>Date Added</th>
                  <th>Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} style={{ cursor:'pointer' }} onClick={() => setSelected(selected?.id===c.id ? null : c)}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                        <div className="av" style={{ background:c.avatar }}>{c.name[0]}</div>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600 }}>{c.name}</div>
                          <div style={{ fontSize:11, color:'var(--muted)' }}>{c.handle}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontSize:12, color:'var(--muted)' }}>{c.trigger}</span></td>
                    <td>
                      {c.tags.map(t=>(
                        <span key={t} className="chip" style={{ background:(TAG_COLORS[t]||'#888')+'22', color:TAG_COLORS[t]||'#888' }}>{t}</span>
                      ))}
                    </td>
                    <td><span style={{ fontSize:12, color: c.email ? 'var(--text)' : 'var(--dim)' }}>{c.email || '—'}</span></td>
                    <td><span style={{ fontSize:12, color:'var(--muted)' }}>{c.date}</span></td>
                    <td>
                      <span className={`tag ${c.enrolled ? 't-active' : 't-draft'}`}>
                        {c.enrolled ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ textAlign:'center', padding:30, color:'var(--muted)', fontSize:13 }}>
                No contacts match your filter
              </div>
            )}
          </div>
        </div>

        {/* Contact detail sidebar */}
        {selected && (
          <div>
            <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
              <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
                <div className="av" style={{ background:selected.avatar, width:40, height:40, fontSize:16 }}>{selected.name[0]}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700 }}>{selected.name}</div>
                  <div style={{ fontSize:12, color:'var(--muted)' }}>{selected.handle}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background:'var(--card2)', border:'1px solid var(--border)', borderRadius:5, padding:'4px 8px', cursor:'pointer', color:'var(--muted)', fontSize:12 }}>✕</button>
              </div>

              <div style={{ padding:'14px 16px' }}>
                {[
                  { label:'Email',      val: selected.email || '—',      icon:'📧' },
                  { label:'Phone',      val: selected.phone || '—',      icon:'📱' },
                  { label:'Trigger',    val: selected.trigger,            icon:'⚡' },
                  { label:'Flow',       val: selected.flow,               icon:'🔀' },
                  { label:'Added',      val: selected.date,               icon:'📅' },
                ].map(row => (
                  <div key={row.label} style={{ display:'flex', gap:10, marginBottom:10 }}>
                    <span style={{ fontSize:14, width:20 }}>{row.icon}</span>
                    <div>
                      <div style={{ fontSize:10, color:'var(--muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em' }}>{row.label}</div>
                      <div style={{ fontSize:13, fontWeight:500 }}>{row.val}</div>
                    </div>
                  </div>
                ))}

                <div style={{ marginTop:4 }}>
                  <div style={{ fontSize:10, color:'var(--muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:5 }}>Tags</div>
                  {selected.tags.map(t=>(
                    <span key={t} className="chip" style={{ background:(TAG_COLORS[t]||'#888')+'22', color:TAG_COLORS[t]||'#888', fontSize:12, padding:'3px 8px', borderRadius:5, marginRight:4 }}>{t}</span>
                  ))}
                  <button className="btn btn-ghost btn-xs" style={{ marginTop:6, display:'block' }}>＋ Add Tag</button>
                </div>

                <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:6 }}>
                  <button className="btn btn-primary btn-sm" style={{ width:'100%', justifyContent:'center' }}>💬 Send DM</button>
                  <button className="btn btn-secondary btn-sm" style={{ width:'100%', justifyContent:'center' }}>📆 Enroll in Sequence</button>
                  <button className="btn btn-ghost btn-sm" style={{ width:'100%', justifyContent:'center', color:'var(--red)' }}
                    onClick={() => { setContacts(prev => prev.filter(c => c.id !== selected.id)); setSelected(null) }}>
                    🗑 Delete Contact
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
