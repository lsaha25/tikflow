import { useState } from 'react'

const TYPE_ICONS = { message:'💬', email:'📧', sms:'📱', delay:'⏱' }

export default function Sequences({ sequences }) {
  const [active, setActive] = useState(sequences[0])

  return (
    <div className="page">
      <div className="page-hd">
        <div>
          <div className="page-title">Sequences</div>
          <div className="page-sub">Drip DM campaigns over time — missing from ManyChat for TikTok</div>
        </div>
        <button className="btn btn-primary">＋ New Sequence</button>
      </div>

      <div className="two-col">
        {/* Sequence list */}
        <div>
          {sequences.map(s => (
            <div key={s.id} className="item" style={{ borderColor: active?.id===s.id ? 'var(--red)' : 'var(--border)' }}
              onClick={() => setActive(s)}>
              <div className="item-ico" style={{ background:'rgba(236,72,153,.12)' }}>📆</div>
              <div className="item-info">
                <div className="item-name">{s.name}</div>
                <div className="item-desc">{s.steps.length} steps · {s.enrolled} enrolled</div>
              </div>
              <div className="item-meta">
                <span className="tag t-active">{s.status}</span>
              </div>
            </div>
          ))}

          <div className="card" style={{ background:'rgba(139,92,246,.05)', borderColor:'rgba(139,92,246,.25)', marginTop:4 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--violet)', marginBottom:6 }}>📆 Cross-Channel Sequences</div>
            <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.7 }}>
              Collect email/phone in TikTok DM, then continue the sequence via{' '}
              <strong style={{ color:'var(--text)' }}>Email, SMS, or WhatsApp.</strong>
            </div>
            <button className="btn btn-ghost btn-xs" style={{ marginTop:10 }}>Set up cross-channel →</button>
          </div>
        </div>

        {/* Sequence steps */}
        {active && (
          <div>
            <div className="card">
              <div className="card-hd">
                <div>
                  <div className="card-title">{active.name}</div>
                  <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{active.steps.length} steps · {active.enrolled} contacts enrolled</div>
                </div>
                <button className="btn btn-ghost btn-xs">✏️ Edit</button>
              </div>

              <div style={{ position:'relative', paddingLeft:22 }}>
                {/* Timeline line */}
                <div style={{ position:'absolute', left:9, top:8, bottom:8, width:2, background:'var(--border)' }} />

                {active.steps.map((step, i) => (
                  <div key={i} style={{ position:'relative', marginBottom:12 }}>
                    {/* Dot */}
                    <div style={{ position:'absolute', left:-17, top:10, width:10, height:10, background:'var(--bg)', border:'2px solid var(--red)', borderRadius:'50%' }} />

                    <div style={{ background:'var(--card2)', border:'1px solid var(--border)', borderRadius:9, padding:'10px 12px' }}>
                      <div style={{ fontSize:11, color:'var(--red)', fontWeight:700, marginBottom:3 }}>{step.day}</div>
                      <div style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>
                        {TYPE_ICONS[step.type]||'💬'} {step.label}
                      </div>
                      <div style={{ fontSize:11, color:'var(--muted)' }}>"{step.preview}"</div>
                    </div>
                  </div>
                ))}

                {/* Add step */}
                <div style={{ position:'relative' }}>
                  <div style={{ position:'absolute', left:-17, top:10, width:10, height:10, background:'var(--border)', borderRadius:'50%' }} />
                  <button className="btn btn-ghost btn-sm" style={{ width:'100%', justifyContent:'center', border:'1px dashed var(--border)' }}>
                    ＋ Add Step
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
