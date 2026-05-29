import { useState } from 'react'

export default function Broadcasts({ broadcasts }) {
  const [modal, setModal] = useState(false)

  return (
    <div className="page">
      <div className="page-hd">
        <div>
          <div className="page-title">Broadcasts</div>
          <div className="page-sub">Mass TikTok DMs with clickable link buttons — not available in ManyChat</div>
        </div>
        <button className="btn btn-primary" onClick={()=>setModal(true)}>＋ New Broadcast</button>
      </div>

      <div className="tabs">
        {['All','Sent','Scheduled','Draft'].map(t=>(
          <div key={t} className={`tab${t==='All'?' active':''}`}>{t}</div>
        ))}
      </div>

      {broadcasts.map(bc => (
        <div key={bc.id} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, padding:16, marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:3 }}>{bc.name}</div>
              <div style={{ fontSize:12, color:'var(--muted)' }}>{bc.time}</div>
            </div>
            <span className={`tag t-${bc.status==='sent'?'active':bc.status==='scheduled'?'paused':'draft'}`}>
              {bc.status}
            </span>
          </div>

          {bc.status !== 'draft' && (
            <>
              <div style={{ display:'flex', gap:24, paddingTop:12, borderTop:'1px solid var(--border)' }}>
                {[
                  { val: bc.recipients.toLocaleString(), lbl:'Delivered' },
                  { val: bc.opened.toLocaleString(),     lbl:'Opened',      color:'var(--cyan)'  },
                  { val: bc.clicks.toLocaleString(),     lbl:'Link Clicks', color:'var(--green)' },
                  { val: bc.ctr,                         lbl:'CTR',         color:'var(--amber)' },
                ].map((s,i) => (
                  <div key={i} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:18, fontWeight:800, color:s.color||'var(--text)' }}>{s.val}</div>
                    <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
              {bc.status === 'sent' && (
                <div className="prog" style={{ marginTop:10 }}>
                  <div className="prog-fill" style={{ width:`${Math.round(bc.opened/bc.recipients*100)}%` }} />
                </div>
              )}
            </>
          )}

          {bc.status === 'draft' && (
            <button className="btn btn-ghost btn-sm">Continue editing →</button>
          )}
        </div>
      ))}

      <div className="card" style={{ background:'rgba(37,244,238,.04)', borderColor:'rgba(37,244,238,.2)' }}>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--cyan)', marginBottom:7 }}>💡 TikFlow Broadcast Features</div>
        <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.7 }}>
          Segment by: <strong style={{ color:'var(--text)' }}>Recent commenters · New followers · Link clickers · Video viewers · Custom tags</strong>
          — and send each segment a personalized DM with fully clickable URL buttons. ManyChat has zero broadcast support for TikTok.
        </div>
      </div>

      {modal && <NewBroadcastModal onClose={()=>setModal(false)} />}
    </div>
  )
}

function NewBroadcastModal({ onClose }) {
  const [step, setStep] = useState(1)
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-hd">
          <div className="modal-title">New Broadcast</div>
          <button onClick={onClose} style={{ background:'var(--card2)', border:'1px solid var(--border)', borderRadius:5, padding:'4px 8px', cursor:'pointer', color:'var(--muted)', fontSize:12 }}>✕</button>
        </div>
        <div className="modal-body">
          {/* Step indicator */}
          <div style={{ display:'flex', gap:6, marginBottom:20 }}>
            {['Audience','Message','Schedule'].map((s,i)=>(
              <div key={s} style={{ flex:1, textAlign:'center' }}>
                <div style={{ width:24, height:24, borderRadius:'50%', background: i+1<=step?'var(--red)':'var(--card2)', color: i+1<=step?'#fff':'var(--muted)', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 4px' }}>{i+1}</div>
                <div style={{ fontSize:10, color: i+1===step?'var(--text)':'var(--muted)', fontWeight:600 }}>{s}</div>
              </div>
            ))}
          </div>

          {step===1 && (<>
            <div className="form-grp">
              <label className="form-lbl">Audience Segment</label>
              <select className="form-inp">
                <option>All followers</option>
                <option>Recent commenters (30 days)</option>
                <option>New followers (7 days)</option>
                <option>Link clickers</option>
                <option>Tagged: interested</option>
                <option>Tagged: buyer</option>
                <option>Custom filter…</option>
              </select>
            </div>
            <div style={{ background:'rgba(37,244,238,.08)', border:'1px solid rgba(37,244,238,.2)', borderRadius:8, padding:'10px 12px', fontSize:12, color:'var(--text)', marginBottom:16 }}>
              <span style={{ color:'var(--cyan)', fontWeight:700 }}>~4,200 recipients</span> match this segment
            </div>
          </>)}

          {step===2 && (<>
            <div className="form-grp">
              <label className="form-lbl">Message</label>
              <textarea className="form-inp" style={{ height:80 }} defaultValue="Hey {{first_name}}! 🔥 We have something special just for you. Tap below 👇" />
            </div>
            <div className="form-grp">
              <label className="form-lbl">Add Link Button</label>
              <div style={{ display:'flex', gap:6 }}>
                <input className="form-inp" placeholder="Button label, e.g. 🛒 Shop Now" style={{ flex:1 }} />
                <input className="form-inp" placeholder="https://" style={{ flex:1 }} />
              </div>
            </div>
            <div style={{ background:'var(--bg)', borderRadius:8, padding:12 }}>
              <div style={{ background:'var(--card2)', borderRadius:'12px 12px 12px 3px', padding:'9px 12px', maxWidth:220, fontSize:12, lineHeight:1.5, marginBottom:7 }}>
                Hey! 🔥 We have something special just for you. Tap below 👇
              </div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'var(--red)', color:'#fff', borderRadius:7, padding:'7px 14px', fontSize:12, fontWeight:700 }}>
                🛒 Shop Now
              </div>
            </div>
          </>)}

          {step===3 && (<>
            <div className="form-grp">
              <label className="form-lbl">Send</label>
              <select className="form-inp">
                <option>Send Now</option>
                <option>Schedule for later</option>
              </select>
            </div>
            <div className="form-grp">
              <label className="form-lbl">Date & Time</label>
              <input className="form-inp" type="datetime-local" />
            </div>
          </>)}

          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:16 }}>
            {step>1 && <button className="btn btn-ghost" onClick={()=>setStep(s=>s-1)}>← Back</button>}
            {step<3
              ? <button className="btn btn-primary" onClick={()=>setStep(s=>s+1)}>Continue →</button>
              : <button className="btn btn-primary" onClick={onClose}>🚀 Send Broadcast</button>
            }
          </div>
        </div>
      </div>
    </div>
  )
}
