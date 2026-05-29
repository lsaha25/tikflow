export const initialContacts = [
  { id:1,  name:'Sarah Chen',    handle:'@sarahchen_',   avatar:'#FE2C55', trigger:'Comment Keyword', tags:['interested','lead'],     email:'sarah.chen@gmail.com',    phone:'+1 555 0101', date:'2026-05-28', flow:'Comment → DM', enrolled:true },
  { id:2,  name:'Marcus Lee',    handle:'@marcuslee99',  avatar:'#3B82F6', trigger:'Live Comment',    tags:['buyer','vip'],           email:'marcus@example.com',      phone:'+1 555 0102', date:'2026-05-27', flow:'Live Stream',  enrolled:true },
  { id:3,  name:'Priya Patel',   handle:'@priyafit',     avatar:'#22C55E', trigger:'New Follower',    tags:['lead'],                  email:'priya.patel@gmail.com',   phone:'',            date:'2026-05-27', flow:'Welcome DM',   enrolled:false },
  { id:4,  name:'Jake Torres',   handle:'@jake_torres',  avatar:'#F59E0B', trigger:'Comment Keyword', tags:['interested'],            email:'jake@torres.io',          phone:'+1 555 0104', date:'2026-05-26', flow:'Comment → DM', enrolled:true },
  { id:5,  name:'Lily Wang',     handle:'@lilywang',     avatar:'#EC4899', trigger:'Story Reply',     tags:['buyer','repeat'],        email:'lily@wangco.com',         phone:'+1 555 0105', date:'2026-05-26', flow:'Story Reply',  enrolled:true },
  { id:6,  name:'Devon Brooks',  handle:'@devonfit',     avatar:'#8B5CF6', trigger:'Comment Keyword', tags:['lead','interested'],     email:'devon.brooks@email.com',  phone:'',            date:'2026-05-25', flow:'Comment → DM', enrolled:true },
  { id:7,  name:'Aisha Rahman',  handle:'@aisharahman',  avatar:'#25F4EE', trigger:'Live Comment',    tags:['vip'],                   email:'aisha@example.com',       phone:'+1 555 0107', date:'2026-05-25', flow:'Live Stream',  enrolled:true },
  { id:8,  name:'Tom Wilson',    handle:'@tomwilson_',   avatar:'#F97316', trigger:'New Follower',    tags:['lead'],                  email:'tom.wilson@gmail.com',    phone:'',            date:'2026-05-24', flow:'Welcome DM',   enrolled:false },
  { id:9,  name:'Nina Gomez',    handle:'@ninagomez',    avatar:'#14B8A6', trigger:'Comment Keyword', tags:['interested','buyer'],    email:'nina.gomez@company.com',  phone:'+1 555 0109', date:'2026-05-24', flow:'Comment → DM', enrolled:true },
  { id:10, name:'Chris Park',    handle:'@chrispark_',   avatar:'#6366F1', trigger:'Video Mention',   tags:['partner'],               email:'chris@park.dev',          phone:'+1 555 0110', date:'2026-05-23', flow:'Mention → DM', enrolled:false },
  { id:11, name:'Emma Scott',    handle:'@emmascott',    avatar:'#FE2C55', trigger:'Comment Keyword', tags:['lead'],                  email:'emma.scott@gmail.com',    phone:'',            date:'2026-05-23', flow:'Comment → DM', enrolled:true },
  { id:12, name:'Ryan Kim',      handle:'@ryankim99',    avatar:'#3B82F6', trigger:'Ref URL',         tags:['buyer'],                 email:'ryan.kim@startup.io',     phone:'+1 555 0112', date:'2026-05-22', flow:'Ref URL Flow', enrolled:true },
];

export const initialFlows = [
  { id:1, name:'Comment → Lead → Sequence',   desc:'Keywords: link, send it, price',    icon:'💬', color:'#FE2C55', status:'active', sent:1204, nodes:9,  trigger:'comment'  },
  { id:2, name:'TikTok Live Comment Trigger',  desc:'Auto-DM during live streams',       icon:'🔴', color:'#FF3C00', status:'active', sent:432,  nodes:5,  trigger:'live'     },
  { id:3, name:'New Follower Welcome',         desc:'Welcome DM on follow',              icon:'🔔', color:'#6366F1', status:'active', sent:567,  nodes:4,  trigger:'follow'   },
  { id:4, name:'Story Reply Automation',       desc:'Story reply → DM + sequence',       icon:'📸', color:'#22C55E', status:'active', sent:198,  nodes:6,  trigger:'story'    },
  { id:5, name:'Video Mention Auto-Reply',     desc:'@mention → auto-engage',            icon:'🎯', color:'#F59E0B', status:'draft',  sent:0,    nodes:3,  trigger:'mention'  },
  { id:6, name:'Black Friday Broadcast',       desc:'Mass DM to 4.2k recent engagers',  icon:'📣', color:'#EC4899', status:'paused', sent:4210, nodes:2,  trigger:'broadcast'},
  { id:7, name:'7-Day Nurture Sequence',       desc:'Drip DM campaign after capture',   icon:'📆', color:'#A78BFA', status:'active', sent:189,  nodes:12, trigger:'sequence' },
];

export const initialBroadcasts = [
  { id:1, name:'Summer Sale — 40% Off',         time:'Sent June 15',        recipients:4210, opened:3891, clicks:924,  ctr:'22%', status:'sent'      },
  { id:2, name:'Flash Sale — 3 Hours Only',     time:'Scheduled tomorrow 9am', recipients:2850, opened:0, clicks:0, ctr:'—', status:'scheduled' },
  { id:3, name:'New Product Launch',            time:'Draft · 2 days ago',  recipients:0,    opened:0,    clicks:0,   ctr:'—',  status:'draft'     },
];

export const initialSequences = [
  {
    id:1, name:'7-Day Nurture', status:'active', enrolled:189,
    steps:[
      { day:'Immediately', label:'Welcome + Free Guide', preview:'Hey! Thanks for reaching out 👋 Here\'s your free guide 👇', type:'message' },
      { day:'Day 3',       label:'Value-Add Follow-up',  preview:'Hope the guide was helpful! Here\'s a bonus tip…',          type:'message' },
      { day:'Day 5',       label:'Social Proof DM',      preview:'Here\'s what others are saying after trying this 🙌',       type:'message' },
      { day:'Day 7',       label:'Offer Close',          preview:'Last chance to grab the deal before it expires tonight 🔥', type:'message' },
    ]
  },
  {
    id:2, name:'Live Stream Follow-up', status:'active', enrolled:67,
    steps:[
      { day:'During Live', label:'Comment Auto-DM',   preview:'Thanks for watching live! Here\'s the link I mentioned 🔗', type:'message' },
      { day:'+2 Hours',    label:'Replay Link',       preview:'The replay is up! In case you missed anything 👇',          type:'message' },
      { day:'Day 2',       label:'Exclusive Offer',   preview:'As a live viewer, here\'s a special deal just for you 🎁',  type:'message' },
    ]
  },
];

export const analyticsData = {
  weekly: [
    { day:'Mon', dms:320, opens:271, clicks:48 },
    { day:'Tue', dms:480, opens:412, clicks:71 },
    { day:'Wed', dms:390, opens:340, clicks:52 },
    { day:'Thu', dms:620, opens:558, clicks:99 },
    { day:'Fri', dms:510, opens:445, clicks:76 },
    { day:'Sat', dms:720, opens:648, clicks:118 },
    { day:'Sun', dms:807, opens:727, clicks:134 },
  ],
  triggers: [
    { name:'Comment Trigger', pct:42, color:'#FE2C55' },
    { name:'Broadcast',       pct:22, color:'#F59E0B' },
    { name:'Live Trigger',    pct:18, color:'#25F4EE' },
    { name:'Sequence',        pct:14, color:'#A78BFA' },
    { name:'Story Reply',     pct:4,  color:'#22C55E' },
  ]
};
