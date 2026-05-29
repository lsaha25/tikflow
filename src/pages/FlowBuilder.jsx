import { useState, useRef, useEffect } from 'react'

// ── Node type registry ──────────────────────────────────
const NT = {
  trigger:   { label:'Trigger',            icon:'⚡', color:'#FE2C55' },
  message:   { label:'Send TikTok DM',     icon:'💬', color:'#22C55E' },
  email:     { label:'Send Email',         icon:'📧', color:'#3B82F6' },
  sms:       { label:'Send SMS',           icon:'📱', color:'#A78BFA' },
  condition: { label:'Condition / Branch', icon:'🔀', color:'#F59E0B' },
  delay:     { label:'Smart Delay',        icon:'⏱',  color:'#6B7280' },
  tag:       { label:'Add / Remove Tag',   icon:'🏷',  color:'#14B8A6' },
  field:     { label:'Set Custom Field',   icon:'📝',  color:'#F97316' },
  sequence:  { label:'Subscribe Sequence', icon:'📆',  color:'#EC4899' },
  split:     { label:'Random Split A/B',   icon:'🎲',  color:'#8B5CF6' },
  ai:        { label:'AI Step',            icon:'🤖',  color:'#25F4EE' },
  webhook:   { label:'Webhook / Zapier',   icon:'🔗',  color:'#78716C' },
  notify:    { label:'Notify Team',        icon:'🔔',  color:'#6366F1' },
  userInput: { label:'Collect Input',      icon:'⌨️',  color:'#10B981' },
}

// Fixed heights per node type for SVG port calculation
const NH = {
  trigger:120, message:160, email:120, sms:98,
  condition:115, delay:92, tag:90, field:90,
  sequence:90, split:108, ai:115, webhook:96,
  notify:90, userInput:120,
}
const NW = 244

// Default configs
const DEF = {
  trigger:   { triggerType:'comment', keywords:['link','send it','price'], video:'any', publicReply:true, publicReplyText:'✅ Check your DMs!' },
  message:   { text:"Hey {{first_name}}! 👋 Here's the link you asked for. Tap below 👇", buttons:[{ type:'url', label:'🔗 Open Link', url:'https://' },{ type:'reply', label:'📋 Tell me more' }] },
  email:     { toField:'email', fromName:'TikFlow', subject:"Here's what you asked for, {{first_name}}!", body:"Hi {{first_name}},\n\nThanks for reaching out on TikTok!\n\nHere's everything you need:\n\n[Your content here]\n\nCheers,\nThe Team" },
  sms:       { toField:'phone', message:"Hey {{first_name}}! Here's the link: https://" },
  condition: { checkType:'field', field:'email', operator:'is_set', value:'' },
  delay:     { amount:1, unit:'days', smartTiming:true },
  tag:       { action:'add', tag:'interested' },
  field:     { field:'source', valueType:'static', value:'tiktok_comment' },
  sequence:  { sequence:'7-Day Nurture' },
  split:     { pctA:50, labelA:'Group A', labelB:'Group B' },
  ai:        { prompt:"Classify the user's intent.", categories:['buy','info','support'] },
  webhook:   { url:'https://hooks.zapier.com/...', method:'POST', body:'{"contact":"{{email}}","source":"tiktok"}' },
  notify:    { message:'New TikTok lead: {{first_name}} ({{email}})', via:'email', to:'' },
  userInput: { question:"What's your email? I'll send it right there 📧", saveToField:'email', validation:'email', allowSkip:true },
}

// Pre-loaded example flow
const INIT_NODES = [
  { id:'n1', type:'trigger',   x:370, y:55,   config:{ ...DEF.trigger } },
  { id:'n2', type:'tag',       x:370, y:223,  config:{ action:'add', tag:'interested' } },
  { id:'n3', type:'userInput', x:370, y:361,  config:{ ...DEF.userInput } },
  { id:'n4', type:'condition', x:370, y:529,  config:{ checkType:'field', field:'email', operator:'is_set', value:'' } },
  { id:'n5', type:'message',   x:80,  y:697,  config:{ ...DEF.message } },
  { id:'n6', type:'message',   x:660, y:697,  config:{ text:"I didn't catch your email 😊 What's a good one to send this to?", buttons:[{ type:'reply', label:'📧 Enter Email' }] } },
  { id:'n7', type:'email',     x:80,  y:910,  config:{ ...DEF.email } },
  { id:'n8', type:'delay',     x:80,  y:1082, config:{ amount:1, unit:'days', smartTiming:true } },
  { id:'n9', type:'sequence',  x:80,  y:1222, config:{ sequence:'7-Day Nurture' } },
]

const INIT_CONNS = [
  { id:'c1', from:'n1', fp:'out', to:'n2', tp:'in', color:'#FE2C55' },
  { id:'c2', from:'n2', fp:'out', to:'n3', tp:'in', color:'#14B8A6' },
  { id:'c3', from:'n3', fp:'out', to:'n4', tp:'in', color:'#10B981' },
  { id:'c4', from:'n4', fp:'yes', to:'n5', tp:'in', color:'#22C55E', label:'YES ✓' },
  { id:'c5', from:'n4', fp:'no',  to:'n6', tp:'in', color:'#F59E0B', label:'NO ✗' },
  { id:'c6', from:'n5', fp:'out', to:'n7', tp:'in', color:'#22C55E' },
  { id:'c7', from:'n7', fp:'out', to:'n8', tp:'in', color:'#3B82F6' },
  { id:'c8', from:'n8', fp:'out', to:'n9', tp:'in', color:'#6B7280' },
]

// Port position calculator
function portXY(node, port) {
  const h = NH[node.type] || 100
  const cx = node.x + NW / 2
  if (port === 'in')  return { x: cx,               y: node.y }
  if (port === 'out') return { x: cx,               y: node.y + h }
  if (port === 'yes') return { x: node.x + NW*0.28, y: node.y + h }
  if (port === 'no')  return { x: node.x + NW*0.72, y: node.y + h }
  if (port === 'a')   return { x: node.x + NW*0.28, y: node.y + h }
  if (port === 'b')   return { x: node.x + NW*0.72, y: node.y + h }
  return { x: cx, y: node.y + h }
}

function bezier(x1,y1,x2,y2) {
  const dy = Math.abs(y2 - y1)
  const cp = Math.max(55, dy * 0.44)
  return `M ${x1} ${y1} C ${x1} ${y1+cp} ${x2} ${y2-cp} ${x2} ${y2}`
}

// ── Node preview content ────────────────────────────────
function NodePreview({ node }) {
  const { config, type } = node
  const s = { fontSize:11, color:'#999', lineHeight:1.5 }
  switch (type) {
    case 'trigger': return (
      <div>
        <div style={{ fontSize:12, fontWeight:600, color:'#fff', marginBottom:5 }}>
          {config.triggerType === 'comment' ? '💬 Comment on video' :
           config.triggerType === 'live'    ? '🔴 Live stream comment' :
           config.triggerType === 'dm'      ? '📩 DM received' :
           config.triggerType === 'follow'  ? '🔔 New follower' :
           config.triggerType === 'story'   ? '📸 Story reply' :
           config.triggerType === 'mention' ? '🎯 Video mention' :
           config.triggerType === 'ref_url' ? '🔗 Ref URL click' : '📷 QR code scan'}
        </div>
        {config.keywords?.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
            {config.keywords.map(k => (
              <span key={k} style={{ background:'rgba(254,44,85,.18)', color:'#FE2C55', padding:'1px 6px', borderRadius:4, fontSize:10, fontWeight:700 }}>{k}</span>
            ))}
          </div>
        )}
      </div>
    )
    case 'message': return (
      <div>
        <div style={{ ...s, marginBottom:5 }}>{(config.text||'').slice(0,65)}{config.text?.length>65?'…':''}</div>
        {config.buttons?.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
            {config.buttons.map((b,i) => (
              <span key={i} style={{ background:'#FE2C55', color:'#fff', padding:'2px 7px', borderRadius:4, fontSize:10, fontWeight:700 }}>{b.label}</span>
            ))}
          </div>
        )}
      </div>
    )
    case 'email': return (
      <div>
        <div style={{ ...s, color:'#60A5FA', fontWeight:700, marginBottom:2 }}>📧 {(config.subject||'').slice(0,40)}{config.subject?.length>40?'…':''}</div>
        <div style={s}>To: {'{{'}email{'}}'}</div>
      </div>
    )
    case 'sms': return <div style={s}>{(config.message||'').slice(0,60)}{config.message?.length>60?'…':''}</div>
    case 'condition': return (
      <div>
        <div style={{ fontSize:11, color:'#F59E0B', fontWeight:700, marginBottom:6 }}>
          {config.checkType==='tag'    ? `Has tag: "${config.tag}"` :
           config.checkType==='field'  ? `${config.field} ${(config.operator||'').replace(/_/g,' ')}` :
           config.checkType==='time'   ? 'Time of day check' : `Random ${config.pct||50}%`}
        </div>
        <div style={{ display:'flex', gap:7 }}>
          <span style={{ background:'rgba(34,197,94,.15)', color:'#22C55E', padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:700 }}>YES →</span>
          <span style={{ background:'rgba(254,44,85,.15)', color:'#FE2C55', padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:700 }}>NO →</span>
        </div>
      </div>
    )
    case 'delay': return <div style={{ fontSize:12, fontWeight:600 }}>⏱ Wait {config.amount} {config.unit}</div>
    case 'tag': return (
      <div style={{ fontSize:12, fontWeight:600 }}>
        {config.action==='add'?'＋':'－'} Tag: <span style={{ color:'#2DD4BF' }}>"{config.tag}"</span>
      </div>
    )
    case 'field': return (
      <div style={{ fontSize:12, fontWeight:600 }}>
        <span style={{ color:'#FB923C' }}>{config.field}</span> = "{config.value}"
      </div>
    )
    case 'sequence': return (
      <div style={{ fontSize:12, fontWeight:600 }}>
        Enroll: <span style={{ color:'#F472B6' }}>{config.sequence}</span>
      </div>
    )
    case 'split': return (
      <div>
        <div style={s}>Random A/B split</div>
        <div style={{ display:'flex', gap:6, marginTop:5 }}>
          <span style={{ background:'rgba(139,92,246,.15)', color:'#A78BFA', padding:'2px 7px', borderRadius:4, fontSize:10, fontWeight:700 }}>A: {config.pctA}%</span>
          <span style={{ background:'rgba(139,92,246,.15)', color:'#A78BFA', padding:'2px 7px', borderRadius:4, fontSize:10, fontWeight:700 }}>B: {100-(config.pctA||50)}%</span>
        </div>
      </div>
    )
    case 'ai': return <div style={s}>{(config.prompt||'').slice(0,60)}{config.prompt?.length>60?'…':''}</div>
    case 'webhook': return <div style={s}>{config.method} {(config.url||'').slice(0,38)}{config.url?.length>38?'…':''}</div>
    case 'notify': return <div style={s}>{(config.message||'').slice(0,55)}{config.message?.length>55?'…':''}</div>
    case 'userInput': return (
      <div>
        <div style={{ ...s, marginBottom:5 }}>{(config.question||'').slice(0,55)}{config.question?.length>55?'…':''}</div>
        <span style={{ background:'rgba(16,185,129,.15)', color:'#34D399', padding:'1px 6px', borderRadius:4, fontSize:10, fontWeight:700 }}>Save → {config.saveToField}</span>
      </div>
    )
    default: return null
  }
}

// ── Config panel forms ──────────────────────────────────
function Inp({ label, children }) {
  return (
    <div className="form-grp">
      {label && <label className="form-lbl">{label}</label>}
      {children}
    </div>
  )
}

function Row({ label, desc, children }) {
  return (
    <div className="form-grp" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div><div style={{ fontSize:12, fontWeight:600 }}>{label}</div>{desc&&<div style={{ fontSize:11, color:'var(--muted)' }}>{desc}</div>}</div>
      {children}
    </div>
  )
}

function TokenHelper() {
  const tokens = ['{{first_name}}','{{last_name}}','{{email}}','{{phone}}','{{tiktok_handle}}']
  return (
    <div style={{ marginBottom:12 }}>
      <div className="form-lbl">Personalization Tokens — click to copy</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
        {tokens.map(t=>(
          <span key={t}
            onClick={()=>{ try{ navigator.clipboard.writeText(t) }catch(e){} }}
            style={{ background:'rgba(37,244,238,.1)', color:'#25F4EE', padding:'2px 6px', borderRadius:4, fontSize:10, fontWeight:700, cursor:'pointer' }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

function ConfigPanel({ node, onUpdate }) {
  const { config, type } = node
  const info = NT[type]

  const sel = (label, key, opts) => (
    <Inp label={label}>
      <select className="form-inp" value={config[key]||''} onChange={e=>onUpdate(key, e.target.value)}>
        {opts.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
      </select>
    </Inp>
  )
  const txt = (label, key, ph='') => (
    <Inp label={label}>
      <input className="form-inp" value={config[key]||''} onChange={e=>onUpdate(key, e.target.value)} placeholder={ph} />
    </Inp>
  )
  const tog = (label, desc, key) => (
    <Row label={label} desc={desc}>
      <label className="tog">
        <input type="checkbox" checked={!!config[key]} onChange={e=>onUpdate(key, e.target.checked)} />
        <span className="tog-sl" />
      </label>
    </Row>
  )

  switch (type) {
    case 'trigger': return (<>
      {sel('Trigger Type','triggerType',[
        {v:'comment',l:'💬 Comment on video'},
        {v:'live',l:'🔴 TikTok Live comment'},
        {v:'dm',l:'📩 DM received'},
        {v:'follow',l:'🔔 New follower'},
        {v:'story',l:'📸 Story reply'},
        {v:'mention',l:'🎯 Video mention'},
        {v:'ref_url',l:'🔗 Ref URL click'},
        {v:'qr',l:'📷 QR code scan'},
      ])}
      {(config.triggerType==='comment'||config.triggerType==='live') && (
        <Inp label="Keyword Filter (comma separated)">
          <input className="form-inp" value={(config.keywords||[]).join(', ')}
            onChange={e=>onUpdate('keywords', e.target.value.split(',').map(k=>k.trim()).filter(Boolean))}
            placeholder="link, send it, price, how much" />
          <div style={{ fontSize:10, color:'var(--muted)', marginTop:4 }}>Leave empty to trigger on any comment</div>
        </Inp>
      )}
      {config.triggerType==='comment' && (
        sel('Apply to','video',[{v:'any',l:'Any video'},{v:'specific',l:'Specific video'},{v:'next',l:'Next published video'}])
      )}
      {tog('Public reply on comment','Post a visible comment reply too','publicReply')}
      {config.publicReply && txt('Public Reply Text','publicReplyText','✅ Check your DMs!')}
    </>)

    case 'message': return (<>
      <Inp label="Message Text">
        <textarea className="form-inp" style={{ height:80 }} value={config.text||''}
          onChange={e=>onUpdate('text', e.target.value)} placeholder="Hey {{first_name}}! 👋" />
      </Inp>
      <TokenHelper />
      <Inp label="Buttons">
        {(config.buttons||[]).map((btn,i)=>(
          <div key={i} style={{ display:'flex', gap:4, marginBottom:5 }}>
            <select className="form-inp sm" style={{ width:88 }} value={btn.type}
              onChange={e=>{ const b=[...config.buttons]; b[i]={...b[i],type:e.target.value}; onUpdate('buttons',b) }}>
              <option value="url">🔗 URL</option>
              <option value="reply">↩️ Reply</option>
              <option value="phone">📞 Phone</option>
              <option value="flow">➡️ Flow</option>
            </select>
            <input className="form-inp sm" style={{ flex:1 }} value={btn.label}
              onChange={e=>{ const b=[...config.buttons]; b[i]={...b[i],label:e.target.value}; onUpdate('buttons',b) }}
              placeholder="Button label" />
            <button onClick={()=>{ onUpdate('buttons', config.buttons.filter((_,j)=>j!==i)) }}
              style={{ background:'var(--card2)', border:'1px solid var(--border)', color:'var(--muted)', borderRadius:5, padding:'4px 7px', cursor:'pointer', fontSize:11 }}>✕</button>
          </div>
        ))}
        <button className="btn btn-ghost btn-xs" style={{ width:'100%', justifyContent:'center', marginTop:2 }}
          onClick={()=>onUpdate('buttons',[...(config.buttons||[]),{type:'url',label:'Button',url:''}])}>
          ＋ Add Button
        </button>
      </Inp>
      {(config.buttons||[]).filter(b=>b.type==='url').map((btn,i)=>(
        <Inp key={i} label={`URL for "${btn.label}"`}>
          <input className="form-inp" value={btn.url||''} placeholder="https://"
            onChange={e=>{ const b=[...config.buttons]; const idx=b.findIndex(x=>x.type==='url'&&x.label===btn.label); if(idx>=0){b[idx]={...b[idx],url:e.target.value};onUpdate('buttons',b)} }} />
        </Inp>
      ))}
      {tog('Typing animation','Simulate human typing before sending','typing')}
    </>)

    case 'email': return (<>
      {sel('To (contact field)','toField',[{v:'email',l:'{{email}}'},{v:'custom_email',l:'{{custom_email}}'}])}
      {txt('From Name','fromName','Your Name or Brand')}
      <Inp label="Subject">
        <input className="form-inp" value={config.subject||''} onChange={e=>onUpdate('subject',e.target.value)} placeholder="Hey {{first_name}}!" />
      </Inp>
      <Inp label="Body">
        <textarea className="form-inp" style={{ height:110 }} value={config.body||''} onChange={e=>onUpdate('body',e.target.value)} />
      </Inp>
      <TokenHelper />
      <div style={{ fontSize:11, color:'var(--muted)', padding:'8px 0', borderTop:'1px solid var(--border)' }}>
        Send via: <span style={{ color:'#3B82F6', fontWeight:700 }}>Gmail ✓</span>
        &nbsp;·&nbsp;
        <span style={{ color:'var(--muted)', cursor:'pointer', textDecoration:'underline' }}>+ Mailchimp</span>
      </div>
    </>)

    case 'sms': return (<>
      {sel('To (field)','toField',[{v:'phone',l:'{{phone}}'},{v:'custom_phone',l:'{{custom_phone}}'}])}
      <Inp label="Message">
        <textarea className="form-inp" value={config.message||''} onChange={e=>onUpdate('message',e.target.value)} />
      </Inp>
      <TokenHelper />
      <div style={{ fontSize:11, color:'var(--muted)' }}>Send via: <span style={{ color:'#A78BFA', fontWeight:700 }}>Twilio ✓</span></div>
    </>)

    case 'condition': return (<>
      {sel('Check Type','checkType',[
        {v:'field',l:'Field / Custom Field'},
        {v:'tag',l:'Has Tag'},
        {v:'time',l:'Time of Day'},
        {v:'random',l:'Random %'},
      ])}
      {config.checkType==='field' && (<>
        {txt('Field Name','field','email')}
        {sel('Operator','operator',[
          {v:'is_set',l:'is set'},
          {v:'is_not_set',l:'is not set'},
          {v:'equals',l:'equals'},
          {v:'not_equals',l:'does not equal'},
          {v:'contains',l:'contains'},
        ])}
        {(config.operator==='equals'||config.operator==='not_equals'||config.operator==='contains') && txt('Value','value','')}
      </>)}
      {config.checkType==='tag' && txt('Tag Name','tag','interested')}
      {config.checkType==='time' && (
        <Inp label="Time is between">
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <input className="form-inp" type="time" value={config.timeFrom||'09:00'} onChange={e=>onUpdate('timeFrom',e.target.value)} style={{ flex:1 }} />
            <span style={{ color:'var(--muted)', fontSize:11 }}>–</span>
            <input className="form-inp" type="time" value={config.timeTo||'21:00'} onChange={e=>onUpdate('timeTo',e.target.value)} style={{ flex:1 }} />
          </div>
        </Inp>
      )}
      {config.checkType==='random' && (
        <Inp label={`YES path: ${config.pct||50}%  ·  NO path: ${100-(config.pct||50)}%`}>
          <input type="range" min="1" max="99" value={config.pct||50}
            onChange={e=>onUpdate('pct',parseInt(e.target.value))}
            style={{ width:'100%', accentColor:'var(--red)' }} />
        </Inp>
      )}
      <div style={{ background:'rgba(255,255,255,.03)', borderRadius:7, padding:'10px 12px', fontSize:11, color:'var(--muted)' }}>
        ✅ <strong style={{ color:'#22C55E' }}>YES</strong> connects to the node on the left output port<br />
        ✗ <strong style={{ color:'#FE2C55' }}>NO</strong> connects to the node on the right output port
      </div>
    </>)

    case 'delay': return (<>
      <Inp label="Wait Duration">
        <div style={{ display:'flex', gap:6 }}>
          <input className="form-inp" type="number" min="1" max="999" value={config.amount||1}
            onChange={e=>onUpdate('amount',parseInt(e.target.value)||1)} style={{ width:80 }} />
          {sel(null,'unit',[{v:'minutes',l:'Minutes'},{v:'hours',l:'Hours'},{v:'days',l:'Days'},{v:'weeks',l:'Weeks'}])}
        </div>
      </Inp>
      {tog('Smart Timing','Only send during recipient\'s active hours','smartTiming')}
    </>)

    case 'tag': return (<>
      {sel('Action','action',[{v:'add',l:'＋ Add Tag'},{v:'remove',l:'－ Remove Tag'}])}
      {txt('Tag Name','tag','e.g. interested, buyer, vip')}
      <div style={{ fontSize:11, color:'var(--muted)' }}>
        Existing: <span style={{ color:'#2DD4BF' }}>interested · buyer · lead · vip · refund</span>
      </div>
    </>)

    case 'field': return (<>
      {txt('Field Name','field','e.g. source, plan, score')}
      {sel('Set Value','valueType',[{v:'static',l:'Static value'},{v:'userInput',l:'From user input'},{v:'clear',l:'Clear / Empty'}])}
      {(!config.valueType||config.valueType==='static') && txt('Value','value','e.g. tiktok, pro, 10')}
      <div style={{ fontSize:11, color:'var(--muted)' }}>
        Fields: <span style={{ color:'#FB923C' }}>source · plan · score · email · phone · city</span>
      </div>
    </>)

    case 'sequence': return (<>
      {sel('Sequence','sequence',['7-Day Nurture','Post-Purchase','Live Stream Follow-up','Re-engagement','Onboarding'])}
      {tog('Skip if already enrolled','Avoid re-enrolling the same contact','skipIfEnrolled')}
    </>)

    case 'split': return (<>
      <Inp label={`Group A: ${config.pctA||50}%  ·  Group B: ${100-(config.pctA||50)}%`}>
        <input type="range" min="1" max="99" value={config.pctA||50}
          onChange={e=>onUpdate('pctA',parseInt(e.target.value))}
          style={{ width:'100%', accentColor:'#8B5CF6' }} />
      </Inp>
      {txt('Label A','labelA','Group A')}
      {txt('Label B','labelB','Group B')}
    </>)

    case 'ai': return (<>
      <Inp label="Classification Prompt">
        <textarea className="form-inp" style={{ height:80 }} value={config.prompt||''}
          onChange={e=>onUpdate('prompt',e.target.value)} />
      </Inp>
      <Inp label="Intent Categories (comma separated)">
        <input className="form-inp" value={(config.categories||[]).join(', ')}
          onChange={e=>onUpdate('categories',e.target.value.split(',').map(c=>c.trim()))}
          placeholder="buy, info, support, cancel" />
      </Inp>
      {sel('Model','model',[{v:'gpt4o',l:'GPT-4o (recommended)'},{v:'gpt35',l:'GPT-3.5 Turbo'},{v:'haiku',l:'Claude Haiku'}])}
    </>)

    case 'webhook': return (<>
      {txt('URL','url','https://hooks.zapier.com/...')}
      {sel('Method','method',['POST','GET','PUT','PATCH'])}
      <Inp label="Request Body (JSON)">
        <textarea className="form-inp" style={{ fontFamily:'monospace', fontSize:11, height:90 }}
          value={config.body||''} onChange={e=>onUpdate('body',e.target.value)} />
      </Inp>
      {tog('Store response in field','Save webhook response to contact field','storeResponse')}
    </>)

    case 'notify': return (<>
      <Inp label="Notification Message">
        <textarea className="form-inp" value={config.message||''}
          onChange={e=>onUpdate('message',e.target.value)} />
      </Inp>
      <TokenHelper />
      {sel('Send via','via',[{v:'email',l:'📧 Email'},{v:'slack',l:'💬 Slack'}])}
      {txt('To','to','team@yourcompany.com')}
    </>)

    case 'userInput': return (<>
      <Inp label="Question to Ask">
        <textarea className="form-inp" value={config.question||''}
          onChange={e=>onUpdate('question',e.target.value)} />
      </Inp>
      {txt('Save response to field','saveToField','email')}
      {sel('Validation','validation',[{v:'none',l:'None (any text)'},{v:'email',l:'Email address'},{v:'phone',l:'Phone number'},{v:'number',l:'Number only'}])}
      {tog('Allow skip','User can skip this question','allowSkip')}
      {config.allowSkip && txt('Skip button label','skipLabel','Skip')}
    </>)

    default: return <div style={{ fontSize:12, color:'var(--muted)' }}>Select a node to configure it.</div>
  }
}

// ── Main FlowBuilder component ──────────────────────────
export default function FlowBuilder() {
  const [nodes, setNodes]       = useState(INIT_NODES)
  const [conns]                 = useState(INIT_CONNS)
  const [selectedId, setSelId]  = useState('n1')
  const dragRef                 = useRef(null)

  const selected = nodes.find(n => n.id === selectedId)

  // Window-level drag handlers
  useEffect(() => {
    const onMove = e => {
      if (!dragRef.current) return
      const { id, sx, sy, nx, ny } = dragRef.current
      setNodes(prev => prev.map(n => n.id === id
        ? { ...n, x: Math.max(10, nx + e.clientX - sx), y: Math.max(10, ny + e.clientY - sy) }
        : n
      ))
    }
    const onUp = () => { dragRef.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  const startDrag = (e, id) => {
    e.preventDefault(); e.stopPropagation()
    const n = nodes.find(x => x.id === id)
    dragRef.current = { id, sx: e.clientX, sy: e.clientY, nx: n.x, ny: n.y }
    setSelId(id)
  }

  const updateConfig = (field, value) => {
    setNodes(prev => prev.map(n => n.id === selectedId
      ? { ...n, config: { ...n.config, [field]: value } }
      : n
    ))
  }

  const addNode = type => {
    const id = `n${Date.now()}`
    setNodes(prev => [...prev, { id, type, x: 370 + Math.random()*80-40, y: 1450, config: { ...DEF[type] } }])
    setSelId(id)
  }

  return (
    <div className="fb-wrap">

      {/* ── Left: Node Library ── */}
      <div className="fb-lib">
        <div style={{ padding:'10px 12px 5px', fontSize:9, fontWeight:800, textTransform:'uppercase', letterSpacing:'.1em', color:'var(--dim)' }}>
          Node Library
        </div>
        <div style={{ padding:'0 12px 6px', fontSize:10, color:'var(--muted)' }}>Click to add to canvas</div>
        {Object.entries(NT).map(([type, info]) => (
          <div key={type} className="node-lib-item" onClick={() => addNode(type)}>
            <div className="node-lib-icon" style={{ background: info.color + '22' }}>{info.icon}</div>
            <div className="node-lib-name">{info.label}</div>
          </div>
        ))}
        <div style={{ padding:'12px', marginTop:'auto', borderTop:'1px solid var(--border)', fontSize:10, color:'var(--dim)', lineHeight:1.6 }}>
          Click a node type above to add it. Drag nodes to reposition.
        </div>
      </div>

      {/* ── Center: Canvas ── */}
      <div className="fb-canvas" onClick={() => setSelId(null)}>

        {/* Sticky canvas toolbar */}
        <div style={{ position:'sticky', top:0, zIndex:5, height:36, background:'rgba(13,13,13,.92)', backdropFilter:'blur(6px)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', padding:'0 14px', gap:10 }}>
          <span style={{ fontSize:11, color:'var(--muted)' }}>
            <span className="live-dot" style={{ marginRight:5 }} />
            {nodes.length} nodes · {conns.length} connections
          </span>
          <span style={{ marginLeft:'auto', fontSize:11, color:'var(--dim)' }}>
            Drag nodes to reposition · Click to configure
          </span>
        </div>

        {/* Stage */}
        <div className="canvas-stage" style={{ position:'relative', width:3200, height:2400 }}>

          {/* SVG connections */}
          <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', overflow:'visible' }}>
            {conns.map(conn => {
              const fn = nodes.find(n => n.id === conn.from)
              const tn = nodes.find(n => n.id === conn.to)
              if (!fn || !tn) return null
              const fp = portXY(fn, conn.fp)
              const tp = portXY(tn, conn.tp)
              const d  = bezier(fp.x, fp.y, tp.x, tp.y)
              const mx = (fp.x + tp.x) / 2
              const my = (fp.y + tp.y) / 2
              return (
                <g key={conn.id}>
                  {/* Glow shadow */}
                  <path d={d} fill="none" stroke={conn.color||'#444'} strokeWidth="5" opacity=".08" />
                  {/* Main line */}
                  <path d={d} fill="none" stroke={conn.color||'#444'} strokeWidth="2" opacity=".65" strokeDasharray={conn.dashed?'6 4':undefined} />
                  {/* Arrow head */}
                  <circle cx={tp.x} cy={tp.y} r="4" fill={conn.color||'#444'} opacity=".8" />
                  {/* Label */}
                  {conn.label && (
                    <g>
                      <rect x={mx-20} y={my-8} width={40} height={16} rx={4} fill="#181818" stroke={conn.color} strokeWidth="1" opacity=".95" />
                      <text x={mx} y={my+4} fill={conn.color} fontSize="9" textAnchor="middle" fontWeight="800">{conn.label}</text>
                    </g>
                  )}
                </g>
              )
            })}
          </svg>

          {/* Nodes */}
          {nodes.map(node => {
            const info = NT[node.type]
            const isSel = node.id === selectedId
            const h = NH[node.type] || 100

            return (
              <div key={node.id}
                onMouseDown={e => startDrag(e, node.id)}
                onClick={e => { e.stopPropagation(); setSelId(node.id) }}
                style={{
                  position:'absolute', left:node.x, top:node.y, width:NW,
                  borderRadius:11, overflow:'visible',
                  cursor: dragRef.current?.id === node.id ? 'grabbing' : 'grab',
                  userSelect:'none', zIndex: isSel ? 10 : 1,
                  filter: isSel ? `drop-shadow(0 0 8px ${info.color}55)` : 'drop-shadow(0 2px 8px rgba(0,0,0,.6))',
                }}
              >
                {/* Input port */}
                <div style={{
                  position:'absolute', top:-6, left:'50%', transform:'translateX(-50%)',
                  width:12, height:12, borderRadius:'50%',
                  background:'#181818', border:`2px solid ${info.color}`,
                  zIndex:20, transition:'transform .15s',
                }} />

                {/* Card */}
                <div style={{
                  borderRadius:10, overflow:'hidden', background:'#181818',
                  border:`2px solid ${isSel ? info.color : '#2A2A2A'}`,
                  transition:'border-color .15s',
                }}>
                  {/* Header */}
                  <div style={{
                    padding:'8px 11px', background:`${info.color}1A`,
                    borderBottom:`1px solid ${info.color}28`,
                    display:'flex', alignItems:'center', gap:6,
                  }}>
                    <span style={{ fontSize:13 }}>{info.icon}</span>
                    <span style={{ fontSize:10, fontWeight:800, color:info.color, textTransform:'uppercase', letterSpacing:'.06em' }}>{info.label}</span>
                    {isSel && <span style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:info.color, flexShrink:0 }} />}
                  </div>
                  {/* Body */}
                  <div style={{ padding:'9px 11px' }}>
                    <NodePreview node={node} />
                  </div>
                </div>

                {/* Output port(s) */}
                {node.type === 'condition' || node.type === 'split' ? (
                  <>
                    <div style={{ position:'absolute', bottom:-6, left:'28%', transform:'translateX(-50%)', width:12, height:12, borderRadius:'50%', background: node.type==='condition'?'#22C55E':'#8B5CF6', zIndex:20 }} />
                    <div style={{ position:'absolute', bottom:-6, left:'72%', transform:'translateX(-50%)', width:12, height:12, borderRadius:'50%', background: node.type==='condition'?'#FE2C55':'#8B5CF6', zIndex:20 }} />
                    <div style={{ position:'absolute', bottom:-18, left:'28%', transform:'translateX(-50%)', fontSize:8, fontWeight:800, color: node.type==='condition'?'#22C55E':'#8B5CF6', whiteSpace:'nowrap' }}>
                      {node.type==='condition' ? 'YES' : 'A'}
                    </div>
                    <div style={{ position:'absolute', bottom:-18, left:'72%', transform:'translateX(-50%)', fontSize:8, fontWeight:800, color: node.type==='condition'?'#FE2C55':'#8B5CF6', whiteSpace:'nowrap' }}>
                      {node.type==='condition' ? 'NO' : 'B'}
                    </div>
                  </>
                ) : (
                  <div style={{ position:'absolute', bottom:-6, left:'50%', transform:'translateX(-50%)', width:12, height:12, borderRadius:'50%', background:info.color, zIndex:20 }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Right: Config Panel ── */}
      {selected ? (
        <div className="fb-config">
          {/* Config header */}
          <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', background:`${NT[selected.type].color}10`, position:'sticky', top:0, zIndex:5 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:30, height:30, borderRadius:7, background:`${NT[selected.type].color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>
                {NT[selected.type].icon}
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:800, color:NT[selected.type].color }}>{NT[selected.type].label}</div>
                <div style={{ fontSize:10, color:'var(--muted)' }}>Configure step · ID: {selected.id}</div>
              </div>
            </div>
          </div>
          <div style={{ padding:14 }}>
            <ConfigPanel node={selected} onUpdate={updateConfig} />
            <div style={{ marginTop:16, paddingTop:14, borderTop:'1px solid var(--border)', display:'flex', gap:7 }}>
              <button className="btn btn-ghost btn-xs" style={{ flex:1, justifyContent:'center' }}
                onClick={() => setNodes(prev => prev.filter(n => n.id !== selectedId))}>
                🗑 Delete Node
              </button>
              <button className="btn btn-secondary btn-xs" style={{ flex:1, justifyContent:'center' }}
                onClick={() => { const n=nodes.find(x=>x.id===selectedId); if(n){const id=`n${Date.now()}`;setNodes(prev=>[...prev,{...n,id,x:n.x+260,y:n.y}]);setSelId(id)} }}>
                ⎘ Duplicate
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="fb-config" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ textAlign:'center', padding:20 }}>
            <div style={{ fontSize:28, marginBottom:10 }}>⚡</div>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:6 }}>Click a node to configure</div>
            <div style={{ fontSize:11, color:'var(--muted)', lineHeight:1.6 }}>Or click any node type in the library on the left to add it to the canvas.</div>
          </div>
        </div>
      )}
    </div>
  )
}
