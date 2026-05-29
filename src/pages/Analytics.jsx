import { analyticsData } from '../data'

export default function Analytics() {
  const { weekly, triggers } = analyticsData
  const maxDMs = Math.max(...weekly.map(d => d.dms))

  return (
    <div className="page">
      <div className="page-hd">
        <div>
          <div className="page-title">Analytics</div>
          <div className="page-sub">Performance across all your TikTok automations</div>
        </div>
        <button className="btn btn-ghost btn-sm">📥 Export CSV</button>
      </div>

      <div className="stats">
        {[
          { icon:'💬', val:'12,481', lbl:'Total DMs Sent',      delta:'▲ 18% this month', hl:'var(--red)'   },
          { icon:'👁',  val:'79.4%',  lbl:'Open Rate',           delta:'▲ 3.2pts',          hl:'var(--cyan)'  },
          { icon:'🖱',  val:'14.8%',  lbl:'Click Rate',          delta:'▲ 2.1pts',          hl:'var(--green)' },
          { icon:'💰', val:'$4,230', lbl:'Revenue Attributed',  delta:'▲ 41% MoM',         hl:'var(--amber)' },
        ].map((s,i) => (
          <div key={i} className="stat" style={{ borderTop:`2px solid ${s.hl}` }}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-val">{s.val}</div>
            <div className="stat-lbl">{s.lbl}</div>
            <div className="stat-delta up">{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="two-col" style={{ marginBottom:16 }}>
        {/* Bar chart */}
        <div className="card">
          <div className="card-title" style={{ marginBottom:14 }}>DMs Sent — Last 7 Days</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:130 }}>
            {weekly.map((d,i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5, height:'100%', justifyContent:'flex-end' }}>
                <div style={{ fontSize:10, color:'var(--muted)' }}>{d.dms}</div>
                <div style={{ width:'100%', borderRadius:'4px 4px 0 0', background: i===6?'var(--cyan)':'var(--red)', opacity: i===6?1:0.75, height:`${Math.round(d.dms/maxDMs*100)}%`, minHeight:4 }} />
                <div style={{ fontSize:10, color:'var(--muted)' }}>{d.day}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trigger breakdown */}
        <div className="card">
          <div className="card-title" style={{ marginBottom:14 }}>Trigger Breakdown</div>
          {triggers.map((t,i) => (
            <div key={i} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                <span>{t.name}</span>
                <span style={{ color:t.color, fontWeight:700 }}>{t.pct}%</span>
              </div>
              <div className="prog" style={{ height:5 }}>
                <div className="prog-fill" style={{ width:`${t.pct}%`, background:t.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top flows table */}
      <div className="card">
        <div className="card-hd"><div className="card-title">Top Performing Flows</div></div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Flow</th>
              <th style={{ textAlign:'right' }}>Triggered</th>
              <th style={{ textAlign:'right' }}>DMs Sent</th>
              <th style={{ textAlign:'right' }}>CTR</th>
              <th style={{ textAlign:'right' }}>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name:'💬 Comment Keyword → DM', triggered:1482, sent:1204, ctr:'18.4%', rev:'$1,240', color:'var(--green)'  },
              { name:'📣 Summer Sale Broadcast', triggered:4210, sent:4210, ctr:'22.0%', rev:'$2,100', color:'var(--green)'  },
              { name:'🔴 Live Stream Comment',   triggered:512,  sent:432,  ctr:'11.3%', rev:'$580',   color:'var(--amber)'  },
              { name:'📆 7-Day Nurture Sequence',triggered:189,  sent:567,  ctr:'15.8%', rev:'$310',   color:'var(--cyan)'   },
            ].map((r,i) => (
              <tr key={i}>
                <td style={{ fontWeight:500 }}>{r.name}</td>
                <td style={{ textAlign:'right', color:'var(--muted)' }}>{r.triggered.toLocaleString()}</td>
                <td style={{ textAlign:'right', color:'var(--muted)' }}>{r.sent.toLocaleString()}</td>
                <td style={{ textAlign:'right', color:r.color, fontWeight:700 }}>{r.ctr}</td>
                <td style={{ textAlign:'right', fontWeight:700 }}>{r.rev}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
