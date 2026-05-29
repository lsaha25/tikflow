export default function Dashboard({ contacts, flows, setPage }) {
  return (
    <div className="page">
      <div className="page-hd">
        <div>
          <div className="page-title">Welcome back, Arindam 👋</div>
          <div className="page-sub">Your TikTok automations sent <strong style={{ color:'var(--red)' }}>2,847 DMs</strong> this week</div>
        </div>
      </div>

      <div className="stats">
        {[
          { icon:'⚙️', val:'7',     lbl:'Active Flows',     delta:'▲ 2 this week',  hl:'var(--red)'   },
          { icon:'💬', val:'2,847', lbl:'DMs Sent',         delta:'▲ 34% vs last week', hl:'var(--cyan)' },
          { icon:'💥', val:'14.8%', lbl:'Click-through Rate', delta:'▲ 2.1pts',      hl:'var(--green)' },
          { icon:'🎯', val:'389',   lbl:'Leads Captured',   delta:'▲ 61 this week', hl:'var(--amber)' },
        ].map((s,i) => (
          <div key={i} className="stat" style={{ borderTop:`2px solid ${s.hl}` }}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-val">{s.val}</div>
            <div className="stat-lbl">{s.lbl}</div>
            <div className="stat-delta up">{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-hd">
            <div className="card-title">Recent Automations</div>
            <button className="btn btn-ghost btn-xs" onClick={() => setPage('automations')}>View all →</button>
          </div>
          {flows.slice(0,4).map(f => (
            <div key={f.id} className="item" style={{ marginBottom:6 }} onClick={() => setPage('builder')}>
              <div className="item-ico" style={{ background:f.color+'22' }}>{f.icon}</div>
              <div className="item-info">
                <div className="item-name">{f.name}</div>
                <div className="item-desc">{f.desc}</div>
              </div>
              <div className="item-meta">
                <span className={`tag t-${f.status}`}>{f.status}</span>
                <span style={{ fontSize:11, color:'var(--muted)' }}>{f.sent.toLocaleString()} DMs</span>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="card" style={{ marginBottom:12 }}>
            <div className="card-hd"><div className="card-title">Recent Leads</div>
              <button className="btn btn-ghost btn-xs" onClick={() => setPage('contacts')}>View all →</button>
            </div>
            {contacts.slice(0,5).map(c => (
              <div key={c.id} style={{ display:'flex', alignItems:'center', gap:9, padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
                <div className="av" style={{ background:c.avatar }}>{c.name[0]}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600 }}>{c.name}</div>
                  <div style={{ fontSize:11, color:'var(--muted)' }}>{c.handle} · {c.trigger}</div>
                </div>
                <div style={{ fontSize:10, color:'var(--muted)' }}>{c.date}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ background:'rgba(254,44,85,.06)', borderColor:'rgba(254,44,85,.2)' }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:7 }}>🚀 Quick Start</div>
            {[
              { icon:'💬', label:'Comment → DM',    desc:'Trigger on keyword comment' },
              { icon:'🔴', label:'Live Trigger',      desc:'Auto-DM Live viewers'       },
              { icon:'📣', label:'Broadcast',          desc:'Mass DM to followers'       },
            ].map((q,i) => (
              <div key={i} className="item" style={{ marginBottom:5 }} onClick={() => setPage('builder')}>
                <div className="item-ico" style={{ background:'rgba(254,44,85,.12)' }}>{q.icon}</div>
                <div className="item-info">
                  <div className="item-name">{q.label}</div>
                  <div className="item-desc">{q.desc}</div>
                </div>
                <span style={{ color:'var(--muted)', fontSize:16 }}>›</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
