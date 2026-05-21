
// ═══════════════════════════════════════════════════════════════
// WIDGET DEFINITIONS — elk item: id, title, icon, content, w, h
// ═══════════════════════════════════════════════════════════════
const WIDGETS = [
  {
    id: 'agents',
    title: 'Agent Activiteit',
    icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>',
    tag: '3 actief',
    w: 4, h: 14,
    render: (el) => {
      el.innerHTML = `
        <div class="card"><div class="card-header"><h3>${WIDGETS[0].icon} ${WIDGETS[0].title}</h3><span class="tag green">3 actief</span></div>
        <div class="card-body">
          <div class="agent-item"><span class="agent-status active"></span><span class="agent-name">Edgar (hoofdagent)</span><span class="agent-badge main">main</span><span class="agent-meta">3 actieve subagents</span></div>
          <div class="agent-item"><span class="agent-status busy"></span><span class="agent-name">Codex CLI</span><span class="agent-badge sub">sub</span><span class="agent-meta">build in progress · 12s</span></div>
          <div class="agent-item"><span class="agent-status busy"></span><span class="agent-name">Kronkel (Bambu MCP)</span><span class="agent-badge sub">sub</span><span class="agent-meta">execute_tool · 8s</span></div>
          <div class="agent-item"><span class="agent-status idle"></span><span class="agent-name">Mail Monitor</span><span class="agent-badge sub">sub</span><span class="agent-meta">wacht op cron · 30m</span></div>
          <div class="agent-item"><span class="agent-status idle"></span><span class="agent-name">Briefing Agent</span><span class="agent-badge sub">sub</span><span class="agent-meta">wacht op cron · 09:00</span></div>
        </div>
        <div class="card-footer"><span>8 agents totaal · 2 geblokkeerd</span><span>▲ 3 meer dan gisteren</span></div></div>`;
    }
  },
  {
    id: 'tokens',
    title: 'Token Verbruik',
    icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    tag: 'vandaag',
    w: 4, h: 14,
    render: (el) => {
      el.innerHTML = `<div class="card"><div class="card-header"><h3>${WIDGETS[1].icon} ${WIDGETS[1].title}</h3><span class="tag">vandaag</span></div><div class="card-body"><div class="chart-wrap"><canvas id="tokenChart"></canvas></div></div><div class="card-footer">DeepSeek dominant: 62% van alle tokens vandaag</div></div>`;
    }
  },
  {
    id: 'costs',
    title: 'Kostenverdeling',
    icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    tag: '€2,84 totaal',
    w: 4, h: 14,
    render: (el) => {
      el.innerHTML = `<div class="card"><div class="card-header"><h3>${WIDGETS[2].icon} ${WIDGETS[2].title}</h3><span class="tag">€2,84 totaal</span></div><div class="card-body" style="display:flex;gap:20px;align-items:center"><div style="flex-shrink:0"><canvas id="costChart" width="120" height="120"></canvas></div><div style="flex:1;min-width:0"><table class="comp-table"><tr><td style="display:flex;align-items:center;gap:6px;padding:4px 0"><span style="width:8px;height:8px;border-radius:2px;background:#22c55e;display:inline-block"></span>DeepSeek</td><td class="val">€1,42</td><td class="neutral">50%</td></tr><tr><td style="display:flex;align-items:center;gap:6px;padding:4px 0"><span style="width:8px;height:8px;border-radius:2px;background:#3b82f6;display:inline-block"></span>OpenRouter</td><td class="val">€0,85</td><td class="neutral">30%</td></tr><tr><td style="display:flex;align-items:center;gap:6px;padding:4px 0"><span style="width:8px;height:8px;border-radius:2px;background:#f97316;display:inline-block"></span>Gemini</td><td class="val">€0,57</td><td class="neutral">20%</td></tr><tr><td style="display:flex;align-items:center;gap:6px;padding:4px 0"><span style="width:8px;height:8px;border-radius:2px;background:#a855f7;display:inline-block"></span>Jetson (lokaal)</td><td class="val">€0,00</td><td class="neutral">gratis</td></tr></table></div></div><div class="card-footer">Gemiddelde kost per call: €0,0008 · 2.844 calls totaal</div></div>`;
    }
  },
  {
    id: 'providers',
    title: 'Provider Status',
    icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
    tag: '3/4 online',
    w: 4, h: 14,
    render: (el) => {
      el.innerHTML = `<div class="card"><div class="card-header"><h3>${WIDGETS[3].icon} ${WIDGETS[3].title}</h3><span class="tag green">3/4 online</span></div><div class="card-body">
        <div class="prov-item"><span class="prov-status ok"></span><span class="prov-name">DeepSeek</span><span class="prov-model">deepseek-v4-flash</span><span class="prov-calls">1.174 calls</span></div>
        <div class="prov-item"><span class="prov-status ok"></span><span class="prov-name">OpenRouter</span><span class="prov-model">z-ai / diverse</span><span class="prov-calls">891 calls</span></div>
        <div class="prov-item"><span class="prov-status warn"></span><span class="prov-name">Gemini</span><span class="prov-model">gemini-3.1-flash-lite</span><span class="prov-calls">224 calls · quota overschreden</span></div>
        <div class="prov-item"><span class="prov-status ok"></span><span class="prov-name">Jetson Orin Nano</span><span class="prov-model">gemma-4-E4B / llama32-3b</span><span class="prov-calls">lokaal · gratis</span></div>
      </div><div class="card-footer">API keys: 10 geconfigureerd · 4 actief in gebruik</div></div>`;
    }
  },
  {
    id: 'd2d',
    title: '📅 Dag vs Dag',
    tag: 'vandaag',
    w: 3, h: 13,
    render: (el) => {
      el.innerHTML = `<div class="card"><div class="card-header"><h3>📅 Dag vs Dag</h3><span class="tag">vandaag</span></div><div class="card-body"><div class="chart-wrap chart-wrap-sm"><canvas id="d2dChart"></canvas></div></div><div class="card-footer"><span class="delta up" style="font-size:.75rem">▲ 12%</span> meer tokens dan gisteren</div></div>`;
    }
  },
  {
    id: 'w2w',
    title: '📊 Week vs Week',
    tag: 'deze week',
    w: 3, h: 13,
    render: (el) => {
      el.innerHTML = `<div class="card"><div class="card-header"><h3>📊 Week vs Week</h3><span class="tag">deze week</span></div><div class="card-body"><div class="chart-wrap chart-wrap-sm"><canvas id="w2wChart"></canvas></div></div><div class="card-footer"><span class="delta up" style="font-size:.75rem">▲ 8%</span> meer dan vorige week</div></div>`;
    }
  },
  {
    id: 'm2m',
    title: '📈 Maand vs Maand',
    tag: 'mei 2026',
    w: 3, h: 13,
    render: (el) => {
      el.innerHTML = `<div class="card"><div class="card-header"><h3>📈 Maand vs Maand</h3><span class="tag">mei 2026</span></div><div class="card-body"><div class="chart-wrap chart-wrap-sm"><canvas id="m2mChart"></canvas></div></div><div class="card-footer"><span class="delta down" style="font-size:.75rem">▼ 3%</span> minder dan april</div></div>`;
    }
  },
  {
    id: 'success',
    title: '✅ Succespercentage',
    tag: '98.2%',
    w: 3, h: 14,
    render: (el) => {
      el.innerHTML = `<div class="card"><div class="card-header"><h3>✅ Succespercentage</h3><span class="tag green">98.2%</span></div><div class="card-body" style="display:flex;align-items:center;justify-content:center;padding:8px 18px"><div class="gauge-wrap"><div class="gauge-ring"><svg width="100" height="100" viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="40"/><circle class="fg" id="successGauge" cx="50" cy="50" r="40" stroke-dasharray="251.2" stroke-dashoffset="251.2"/></svg><div class="gauge-center"><span class="num" id="successPct">98.2</span><span class="lbl">%</span></div></div><div class="gauge-labels"><span><span class="d" style="background:#22c55e"></span>Geslaagd 2.791</span><span><span class="d" style="background:#ef4444"></span>Mislukt 53</span></div></div></div><div class="card-footer">Laatste fout: Gemini quota (22:57) · 0 errors vandaag</div></div>`;
    }
  },
  {
    id: 'apikeys',
    title: '🔑 API Keys',
    tag: '10 totaal',
    w: 3, h: 14,
    render: (el) => {
      el.innerHTML = `<div class="card"><div class="card-header"><h3>🔑 API Keys</h3><span class="tag">10 totaal</span></div><div class="card-body" style="padding:8px 18px"><table class="comp-table">
        <tr><td class="metric">DeepSeek</td><td class="positive">● OK</td></tr>
        <tr><td class="metric">OpenRouter</td><td class="positive">● OK</td></tr>
        <tr><td class="metric">Anthropic</td><td class="positive">● OK</td></tr>
        <tr><td class="metric">OpenAI</td><td class="positive">● OK</td></tr>
        <tr><td class="metric">Gemini</td><td class="negative">● Quota</td></tr>
        <tr><td class="metric">GitHub (Copilot)</td><td class="positive">● OK</td></tr>
        <tr><td class="metric">xAI</td><td class="positive">● OK</td></tr>
        <tr><td class="metric">Groq</td><td class="positive">● OK</td></tr>
        <tr><td class="metric">Jetson (lokaal)</td><td class="positive">● OK</td></tr>
        <tr><td class="metric">Ollama</td><td class="positive">● OK</td></tr>
      </table></div></div>`;
    }
  },
  {
    id: 'timeline',
    title: '⏱ Gebruik vandaag',
    tag: 'per uur',
    w: 4, h: 14,
    render: (el) => {
      el.innerHTML = `<div class="card"><div class="card-header"><h3>⏱ Gebruik vandaag</h3><span class="tag">per uur</span></div><div class="card-body"><div class="chart-wrap chart-wrap-lg"><canvas id="timelineChart"></canvas></div></div><div class="card-footer">Piek om 09:00 (briefing) en 15:00 (code werk)</div></div>`;
    }
  },
  {
    id: 'activity',
    title: 'Activiteit Log',
    icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    tag: 'laatste events',
    w: 6, h: 14,
    render: (el) => {
      el.innerHTML = `<div class="card"><div class="card-header"><h3>${'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'} Activiteit Log</h3><span class="tag">laatste events</span></div><div class="card-body" id="activityFeed" style="max-height:240px;overflow-y:auto">
        <div class="activity-item"><span class="activity-dot success"></span><span class="activity-text">Dashboard ontwerp afgerond · Hermes Bambubuddy stijl</span><span class="activity-time">23:51</span></div>
        <div class="activity-item"><span class="activity-dot info"></span><span class="activity-text"><span class="hl">Edgar</span> → Screenshots geanalyseerd van Bambubuddy interface</span><span class="activity-time">23:48</span></div>
        <div class="activity-item"><span class="activity-dot info"></span><span class="activity-text"><span class="hl">Mail Monitor</span> → 3DPets inbox gescand · 0 nieuwe mails</span><span class="activity-time">23:42</span></div>
        <div class="activity-item"><span class="activity-dot success"></span><span class="activity-text"><span class="hl">Kronkel</span> → Bambubuddy MCP verbonden · 4 tools actief</span><span class="activity-time">23:39</span></div>
        <div class="activity-item"><span class="activity-dot error"></span><span class="activity-text"><span class="hl">Gemini</span> → Quota overschreden · 429 error · 3 retries</span><span class="activity-time">22:57</span></div>
        <div class="activity-item"><span class="activity-dot info"></span><span class="activity-text"><span class="hl">Codex CLI</span> → Nieuwe PR aangemaakt · dashboard-bambu-stijl</span><span class="activity-time">22:12</span></div>
        <div class="activity-item"><span class="activity-dot success"></span><span class="activity-text"><span class="hl">Briefing Agent</span> → Ochtendrapport geleverd · 3 acties vandaag</span><span class="activity-time">09:00</span></div>
        <div class="activity-item"><span class="activity-dot warn"></span><span class="activity-text"><span class="hl">Honcho</span> → Memory sync voltooid · 12 nieuwe conclusies</span><span class="activity-time">08:45</span></div>
      </div><div class="card-footer"><span>Log level: INFO</span><span>agent.log · 1.27 MB</span></div></div>`;
    }
  }
];

// ═══════════════════════════════════════════════════════════════
// DEFAULT LAYOUT — fallback als localStorage leeg is (3 rijen)
// ═══════════════════════════════════════════════════════════════
const DEFAULT_LAYOUT = {
  children: [
    // Rij 1: agenten + tokens
    {w:4,h:14,x:0,y:0,id:'agents'},
    {w:4,h:14,x:4,y:0,id:'tokens'},
    // Rij 2: kosten + providers
    {w:4,h:14,x:0,y:0,id:'costs'},
    {w:4,h:14,x:4,y:0,id:'providers'},
    // Rij 3: vergelijkingen D2D + W2W + M2M
    {w:3,h:13,x:0,y:0,id:'d2d'},
    {w:3,h:13,x:3,y:0,id:'w2w'},
    {w:3,h:13,x:6,y:0,id:'m2m'},
    // Rij 4: success + apikeys + timeline
    {w:3,h:14,x:0,y:0,id:'success'},
    {w:3,h:14,x:3,y:0,id:'apikeys'},
    {w:4,h:14,x:6,y:0,id:'timeline'},
    // Rij 5: activity log
    {w:10,h:14,x:0,y:0,id:'activity'},
  ]
};

// ═══════════════════════════════════════════════════════════════
// INIT GRIDSTACK
// ═══════════════════════════════════════════════════════════════
const STORAGE_KEY = 'hermes_dashboard_layout_v2';

function getSavedLayout() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return null;
}

function saveLayout(grid) {
  const serialized = grid.save(false); // false = include x,y
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
}

function initGrid() {
  const grid = GridStack.init({
    column: 10,
    minWidth: 768,
    cellHeight: 18,
    margin: 8,
    float: true,
    draggable: { handle: '.card-header', scroll: true },
    resizable: { handles: 'se, sw' },
    disableOneColumnMode: false,
    animate: true,
  }, document.getElementById('widgetGrid'));

  // Bepaal layout: saved of default
  let saved = getSavedLayout();
  let layout = saved || DEFAULT_LAYOUT;
  
  // Bouw layout zonder content (gridstack escapt strings)
  const items = [];
  (layout.children || []).forEach(cfg => {
    const def = WIDGETS.find(w => w.id === cfg.id);
    if (!def) return;
    items.push({
      x: cfg.x || 0,
      y: cfg.y || 0,
      w: cfg.w || def.w,
      h: cfg.h || def.h,
      id: def.id,
      content: ''  // leeg — renderen we zelf na load
    });
  });

  grid.load(items);

  // Render elke widget direct op de grid-stack-item-content div
  // (grid.load met content-string escapt HTML, dus we zetten het achteraf)
  setTimeout(() => {
    document.querySelectorAll('.grid-stack-item[gs-id]').forEach(item => {
      const id = item.getAttribute('gs-id');
      const def = WIDGETS.find(w => w.id === id);
      if (!def) return;
      const contentDiv = item.querySelector('.grid-stack-item-content');
      if (contentDiv) {
        const innerDiv = document.createElement('div');
        def.render(innerDiv);
        contentDiv.innerHTML = innerDiv.innerHTML;
      }
    });
    // Init charts na DOM
    setTimeout(initCharts, 50);
  }, 50);

  // Save bij elke change
  grid.on('change', () => {
    saveLayout(grid);
  });

  return grid;
}

// ═══════════════════════════════════════════════════════════════
// CHARTS
// ═══════════════════════════════════════════════════════════════
const DATA = {
  tokensByProvider: {
    labels: ['DeepSeek','OpenRouter','Gemini','OpenAI','Jetson'],
    values: [145000, 89200, 32100, 12800, 5600],
    colors: ['#22c55e','#3b82f6','#f97316','#a855f7','#6b7280']
  },
  costs: {
    labels: ['DeepSeek','OpenRouter','Gemini','Jetson (lokaal)'],
    values: [1.42, 0.85, 0.57, 0],
    colors: ['#22c55e','#3b82f6','#f97316','#6b7280']
  },
  d2d: {
    labels: ['06','08','10','12','14','16','18','20','22'],
    today:  [12, 45, 78, 52, 63, 89, 71, 44, 28],
    yesterday: [8, 32, 65, 48, 55, 72, 60, 38, 22]
  },
  w2w: {
    labels: ['Ma','Di','Wo','Do','Vr','Za','Zo'],
    thisWeek:  [284, 320, 290, 310, 275, 180, 95],
    lastWeek:  [260, 295, 270, 285, 250, 165, 85]
  },
  m2m: {
    labels: ['Week 1','Week 2','Week 3','Week 4'],
    thisMonth: [1200, 1450, 1380, 980],
    lastMonth: [1100, 1520, 1420, 1050]
  },
  timeline: {
    hours: ['06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23'],
    calls: [2,5,18,42,28,15,8,12,22,48,35,20,16,14,10,8,6,3]
  }
};

let chartInstances = {};

function initCharts() {
  Chart.defaults.color = '#9ca3af';
  Chart.defaults.borderColor = '#242424';
  Chart.defaults.font.family = "'Inter','-apple-system','BlinkMacSystemFont','Segoe UI',sans-serif";

  // Token
  const t = document.getElementById('tokenChart');
  if (t) chartInstances.token = new Chart(t, {
    type: 'bar',
    data: { labels: DATA.tokensByProvider.labels, datasets: [{ data: DATA.tokensByProvider.values, backgroundColor: DATA.tokensByProvider.colors, borderRadius: 4, borderSkipped: false }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: '#1e1e1e' }, ticks: { callback: v => (v/1000)+'K' } }, y: { grid: { display: false } } } }
  });

  // Cost donut
  const c = document.getElementById('costChart');
  if (c) chartInstances.cost = new Chart(c, {
    type: 'doughnut',
    data: { labels: DATA.costs.labels, datasets: [{ data: DATA.costs.values, backgroundColor: DATA.costs.colors, borderWidth: 0, spacing: 4 }] },
    options: { responsive: true, maintainAspectRatio: true, cutout: '72%', plugins: { legend: { display: false } } }
  });

  // Comparison bars
  function mkBar(id, labels, d1, d2) {
    const el = document.getElementById(id);
    if (!el) return;
    chartInstances[id] = new Chart(el, {
      type: 'bar',
      data: { labels, datasets: [
        { label: 'Vorige', data: d2, backgroundColor: '#242424', borderRadius: 3, borderSkipped: false },
        { label: 'Huidige', data: d1, backgroundColor: id === 'd2dChart' ? '#22c55e' : id === 'w2wChart' ? '#3b82f6' : '#f97316', borderRadius: 3, borderSkipped: false }
      ]},
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { font: { size: 10 } } }, y: { grid: { color: '#1e1e1e' }, beginAtZero: true, ticks: { font: { size: 10 } } } } }
    });
  }
  mkBar('d2dChart', DATA.d2d.labels, DATA.d2d.today, DATA.d2d.yesterday);
  mkBar('w2wChart', DATA.w2w.labels, DATA.w2w.thisWeek, DATA.w2w.lastWeek);
  mkBar('m2mChart', DATA.m2m.labels, DATA.m2m.thisMonth, DATA.m2m.lastMonth);

  // Timeline
  const tl = document.getElementById('timelineChart');
  if (tl) chartInstances.timeline = new Chart(tl, {
    type: 'line',
    data: { labels: DATA.timeline.hours, datasets: [{ data: DATA.timeline.calls, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.08)', fill: true, tension: 0.35, pointRadius: 2, pointHoverRadius: 5, pointBackgroundColor: '#22c55e', borderWidth: 2 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { font: { size: 9 } } }, y: { grid: { color: '#1e1e1e' }, beginAtZero: true, ticks: { font: { size: 9 } } } }, interaction: { intersect: false, mode: 'index' } }
  });

  // Success gauge
  setTimeout(() => {
    const g = document.getElementById('successGauge');
    if (g) {
      const offset = 251.2 - (251.2 * 98.2 / 100);
      g.style.strokeDashoffset = offset;
    }
  }, 300);
}

// ═══════════════════════════════════════════════════════════════
// RESET LAYOUT
// ═══════════════════════════════════════════════════════════════
function resetLayout() {
  if (!confirm('Widget layout resetten naar standaard?')) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

// ═══════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
  });
});

// ═══════════════════════════════════════════════════════════════
// START — wacht op DOM + GridStack
// ═══════════════════════════════════════════════════════════════
let grid = null;
document.addEventListener('DOMContentLoaded', () => {
  grid = initGrid();
});

