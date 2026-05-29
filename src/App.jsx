import { useState } from 'react'
import FlowBuilder from './pages/FlowBuilder'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import Broadcasts from './pages/Broadcasts'
import Sequences from './pages/Sequences'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import { initialContacts, initialFlows, initialBroadcasts, initialSequences } from './data'

const NAV = [
  { group: 'Overview', items: [
    { id: 'dashboard',   icon: '🏠', label: 'Dashboard' },
    { id: 'contacts',    icon: '👥', label: 'Contacts', badge: '12' },
  ]},
  { group: 'Automate', items: [
    { id: 'builder',     icon: '⚡', label: 'Flow Builder' },
    { id: 'automations', icon: '⚙️', label: 'Automations', badge: '7' },
    { id: 'broadcasts',  icon: '📣', label: 'Broadcasts' },
    { id: 'sequences',   icon: '📆', label: 'Sequences' },
  ]},
  { group: 'Insights', items: [
    { id: 'analytics',   icon: '📊', label: 'Analytics' },
  ]},
  { group: 'Account', items: [
    { id: 'settings',    icon: '⚙️', label: 'Settings' },
  ]},
]

const TITLES = {
  dashboard: 'Dashboard', contacts: 'Contacts', builder: 'Flow Builder',
  automations: 'Automations', broadcasts: 'Broadcasts', sequences: 'Sequences',
  analytics: 'Analytics', settings: 'Settings',
}

export default function App() {
  const [page, setPage] = useState('builder')
  const [tiktokConnected, setTiktokConnected] = useState(true)
  const [contacts, setContacts] = useState(initialContacts)
  const [flows, setFlows] = useState(initialFlows)
  const [broadcasts] = useState(initialBroadcasts)
  const [sequences] = useState(initialSequences)

  const props = { contacts, setContacts, flows, setFlows, broadcasts, sequences, tiktokConnected, setTiktokConnected, setPage }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-mark">⚡</div>
          <span className="logo-name">TikFlow</span>
          <span className="logo-tag">BETA</span>
        </div>

        {NAV.map(group => (
          <div key={group.group} className="nav-group">
            <div className="nav-label">{group.group}</div>
            {group.items.map(item => (
              <div
                key={item.id}
                className={`nav-item${page === item.id ? ' active' : ''}`}
                onClick={() => setPage(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </div>
            ))}
          </div>
        ))}

        <div className="sidebar-footer">
          <div className="acct-card">
            <div className="acct-av">A</div>
            <div>
              <div className="acct-name">Arindam Das</div>
              <div className="acct-handle">@unifyia</div>
            </div>
            <div style={{ marginLeft:'auto', width:7, height:7, background:'var(--green)', borderRadius:'50%' }} />
          </div>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <span className="topbar-title">{TITLES[page] || page}</span>
          <div className="topbar-spacer" />
          {!tiktokConnected && (
            <button className="btn btn-primary btn-sm" onClick={() => setPage('settings')}>
              🔗 Connect TikTok
            </button>
          )}
          {tiktokConnected && page !== 'builder' && (
            <button className="btn btn-primary btn-sm" onClick={() => setPage('builder')}>
              ＋ New Flow
            </button>
          )}
          {page === 'builder' && (
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-secondary btn-sm">💾 Save</button>
              <button className="btn btn-primary btn-sm">▶ Publish Flow</button>
            </div>
          )}
        </div>

        {page === 'dashboard'   && <Dashboard {...props} />}
        {page === 'builder'     && <FlowBuilder {...props} />}
        {page === 'automations' && <AutomationsPage {...props} />}
        {page === 'contacts'    && <Contacts {...props} />}
        {page === 'broadcasts'  && <Broadcasts {...props} />}
        {page === 'sequences'   && <Sequences {...props} />}
        {page === 'analytics'   && <Analytics {...props} />}
        {page === 'settings'    && <Settings {...props} />}
      </div>
    </div>
  )
}

function AutomationsPage({ flows, setPage }) {
  return (
    <div className="page">
      <div className="page-hd">
        <div>
          <div className="page-title">Automations</div>
          <div className="page-sub">All your TikTok automation flows</div>
        </div>
        <button className="btn btn-primary" onClick={() => setPage('builder')}>＋ New Flow</button>
      </div>

      {flows.map(f => (
        <div key={f.id} className="item" onClick={() => setPage('builder')}>
          <div className="item-ico" style={{ background: f.color + '22' }}>{f.icon}</div>
          <div className="item-info">
            <div className="item-name">{f.name}</div>
            <div className="item-desc">{f.desc} · {f.nodes} nodes</div>
          </div>
          <div className="item-meta">
            <span className={`tag t-${f.status}`}>{f.status}</span>
            <span style={{ fontSize:11, color:'var(--muted)' }}>{f.sent.toLocaleString()} DMs</span>
          </div>
          <label className="tog" onClick={e => e.stopPropagation()}>
            <input type="checkbox" defaultChecked={f.status === 'active'} readOnly />
            <span className="tog-sl" />
          </label>
        </div>
      ))}
    </div>
  )
}
