import { useState } from 'react'

export default function Settings({ tiktokConnected, setTiktokConnected }) {
  const [connecting, setConnecting] = useState(false)

  const connect = () => {
    setConnecting(true)
    setTimeout(() => { setConnecting(false); setTiktokConnected(true) }, 2000)
  }

  return (
    <div className="page">
      <div className="page-hd">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-sub">Manage your TikTok account connection and preferences</div>
        </div>
      </div>

      {/* TikTok account */}
      <div className="settings-sect">
        <div className="ss-title">TikTok Account</div>
        <div className="ss-row">
          <div>
            <div className="ss-label">Connected Account</div>
            <div className="ss-desc">TikTok Business Account required for automations</div>
          </div>
          {tiktokConnected ? (
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13 }}>
                <span style={{ fontSize:14 }}>⚡</span>
                <span style={{ fontWeight:600 }}>@unifyia</span>
              </div>
              <span className="connected">✓ Connected</span>
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={connect} disabled={connecting}>
              {connecting ? '⏳ Connecting…' : '🔗 Connect TikTok'}
            </button>
          )}
        </div>
        {tiktokConnected && (<>
          <div className="ss-row">
            <div><div className="ss-label">Account Type</div><div className="ss-desc">Business account — required for DM automation</div></div>
            <span className="tag t-active">Business ✓</span>
          </div>
          <div className="ss-row">
            <div><div className="ss-label">Permissions</div><div className="ss-desc">DM access · Comment read · Profile read · Live access</div></div>
            <button className="btn btn-ghost btn-xs">Manage</button>
          </div>
          <div className="ss-row">
            <div><div className="ss-label">DMs Used This Month</div><div className="ss-desc">Resets June 1</div></div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:13, fontWeight:700 }}>2,847 / 10,000</div>
              <div className="prog" style={{ width:120, marginTop:5 }}>
                <div className="prog-fill" style={{ width:'28%' }} />
              </div>
            </div>
          </div>
        </>)}
      </div>

      {/* Integrations */}
      <div className="settings-sect">
        <div className="ss-title">Integrations</div>
        {[
          { icon:'📧', name:'Gmail / Google Workspace', desc:'Send emails from your Google account', connected:true,  color:'#3B82F6' },
          { icon:'📱', name:'Twilio SMS',               desc:'Send SMS via Twilio',                  connected:false, color:'#F97316' },
          { icon:'💬', name:'Mailchimp',                desc:'Sync leads to Mailchimp lists',         connected:false, color:'#F59E0B' },
          { icon:'⚡', name:'Zapier / Make',            desc:'Connect to 5000+ apps via webhook',     connected:true,  color:'#FF6B35' },
          { icon:'🤖', name:'OpenAI',                   desc:'Power AI Step nodes with GPT-4o',       connected:false, color:'#25F4EE' },
          { icon:'💬', name:'Slack',                    desc:'Send team notifications to Slack',      connected:false, color:'#A78BFA' },
        ].map((item, i) => (
          <div key={i} className="ss-row">
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:item.color+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>{item.icon}</div>
              <div><div className="ss-label">{item.name}</div><div className="ss-desc">{item.desc}</div></div>
            </div>
            {item.connected
              ? <span className="connected">✓ Connected</span>
              : <button className="btn btn-secondary btn-xs">Connect</button>
            }
          </div>
        ))}
      </div>

      {/* Automation behaviour */}
      <div className="settings-sect">
        <div className="ss-title">Automation Behaviour</div>
        {[
          { label:'Duplicate DM Protection',    desc:'Don\'t send the same DM twice within 24h',              key:'dedup',     on:true  },
          { label:'AI Smart Replies',           desc:'Use AI to classify intent and route to correct flow',   key:'ai',        on:true  },
          { label:'Live Stream Automation',     desc:'Trigger DMs during TikTok LIVE sessions',              key:'live',      on:true  },
          { label:'Cross-Channel Bridge',       desc:'Allow TikTok flows to continue via Email/SMS (Beta)',   key:'cross',     on:false },
          { label:'Smart Timing',               desc:'Only send DMs during contact\'s active hours',          key:'timing',    on:true  },
        ].map((row, i) => (
          <div key={i} className="ss-row">
            <div><div className="ss-label">{row.label}</div><div className="ss-desc">{row.desc}</div></div>
            <label className="tog">
              <input type="checkbox" defaultChecked={row.on} readOnly />
              <span className="tog-sl" />
            </label>
          </div>
        ))}
      </div>

      {/* Notifications */}
      <div className="settings-sect">
        <div className="ss-title">Notifications</div>
        {[
          { label:'Weekly Performance Report', desc:'Email summary of your automation stats', on:true  },
          { label:'Flow Error Alerts',         desc:'Notify when an automation fails',         on:true  },
          { label:'New Lead Notifications',    desc:'Ping me when a new contact is captured', on:false },
        ].map((row, i) => (
          <div key={i} className="ss-row">
            <div><div className="ss-label">{row.label}</div><div className="ss-desc">{row.desc}</div></div>
            <label className="tog">
              <input type="checkbox" defaultChecked={row.on} readOnly />
              <span className="tog-sl" />
            </label>
          </div>
        ))}
      </div>

      {/* Plan */}
      <div className="settings-sect">
        <div className="ss-title">Plan & Billing</div>
        <div className="ss-row">
          <div><div className="ss-label">Current Plan</div><div className="ss-desc">Pro · 10,000 DMs / month · Unlimited flows</div></div>
          <button className="btn btn-primary btn-sm">Upgrade</button>
        </div>
      </div>
    </div>
  )
}
