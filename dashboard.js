
// ═══════════════════════════════════════════════════════════════
// WIDGET DEFINITIES
// ═══════════════════════════════════════════════════════════════

const ICONS = {
  layout: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
  activity: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  bolt: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  users: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>',
  server: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
  dollar: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
};

const WIDGETS = [
  {
    id: 'agents',
    title: 'Agent Activiteit',
    icon: ICONS.users,
    tag: '3 actief',
    w: 4, h: 14,
    render: (el) => {
      el.innerHTML = `
        <div class="card"><div class="card-header"><h3>${ICONS.users} Agent Activiteit</h3><span class="tag green">3 actief</span></div>
        <div class="card-body">
          <div class="agent-item"><span class="agent-status active"></span><span class="agent-name">Edgar (hoofdagent)</span><span class="agent-badge main">main</span><span class="agent-meta">gesprek gaande</span></div>
          <div class="agent-item"><span class="agent-status idle"></span><span class="agent-name">Mail Monitor</span><span class="agent-badge sub">sub</span><span class="agent-meta">cron elke 30m</span></div>
          <div class="agent-item"><span class="agent-status idle"></span><span class="agent-name">Briefing Agent</span><span class="agent-badge sub">sub</span><span class="agent-meta">cron 09:00</span></div>
          <div class="agent-item"><span class="agent-status idle"></span><span class="agent-name">Kronkel (Bambu MCP)</span><span class="agent-badge sub">sub</span><span class="agent-meta">idle · 4 tools</span></div>
        </div>
        <div class="card-footer"><span>29 sessies · 1304 berichten</span><span>▲ 3 vandaag</span></div></div>`;
    }
  },
  {
    id: 'tokens',
    title: 'Token Verbruik',
    icon: ICONS.bolt,
    tag: 'vandaag',
    w: 4, h: 14,
    render: (el) => {
      el.innerHTML = `<div class="card"><div class="card-header"><h3>${ICONS.bolt} Token Verbruik</h3><span class="tag">vandaag</span></div><div class="card-body"><div class="chart-wrap"><canvas id="tokenChart"></canvas></div></div><div class="card-footer">DeepSeek dominant: 62% van alle tokens</div></div>`;
    }
  },
  {
    id: 'costs',
    title: 'Kostenverdeling',
    icon: ICONS.dollar,
    tag: 'geschat',
    w: 4, h: 14,
    render: (el) => {
      el.innerHTML = `<div class="card"><div class="card-header"><h3>${ICONS.dollar} Kostenverdeling</h3><span class="tag">geschat</span></div><div class="card-body" style="display:flex;gap:20px;align-items:center"><div style="flex-shrink:0"><canvas id="costChart" width="120" height="120"></canvas></div><div style="flex:1;min-width:0"><table class="comp-table">
        <tr><td style="display:flex;align-items:center;gap:6px;padding:4px 0"><span style="width:8px;height:8px;border-radius:2px;background:#22c55e;display:inline-block"></span>DeepSeek</td><td class="val">€1,42</td><td class="neutral">50%</td></tr>
        <tr><td style="display:flex;align-items:center;gap:6px;padding:4px 0"><span style="width:8px;height:8px;border-radius:2px;background:#3b82f6;display:inline-block"></span>OpenRouter</td><td class="val">€0,85</td><td class="neutral">30%</td></tr>
        <tr><td style="display:flex;align-items:center;gap:6px;padding:4px 0"><span style="width:8px;height:8px;border-radius:2px;background:#f97316;display:inline-block"></span>Gemini</td><td class="val">€0,28</td><td class="neutral">10%</td></tr>
        <tr><td style="display:flex;align-items:center;gap:6px;padding:4px 0"><span style="width:8px;height:8px;border-radius:2px;background:#a855f7;display:inline-block"></span>Overig</td><td class="val">€0,28</td><td class="neutral">10%</td></tr>
      </table></div></div><div class="card-footer">Gem. kost per call: ~€0,001 · 7.200+ calls totaal</div></div>`;
    }
  },
  {
    id: 'providers',
    title: 'Provider Status',
    icon: ICONS.server,
    tag: '3/4 online',
    w: 4, h: 14,
    render: (el) => {
      el.innerHTML = `<div class="card"><div class="card-header"><h3>${ICONS.server} Provider Status</h3><span class="tag green">3/4 online</span></div><div class="card-body">
        <div class="prov-item"><span class="prov-status ok"></span><span class="prov-name">DeepSeek</span><span class="prov-model">deepseek-v4-flash</span><span class="prov-calls">1.855 calls</span></div>
        <div class="prov-item"><span class="prov-status ok"></span><span class="prov-name">OpenRouter</span><span class="prov-model">diverse (z-ai, openai)</span><span class="prov-calls">895 calls</span></div>
        <div class="prov-item"><span class="prov-status warn"></span><span class="prov-name">Gemini</span><span class="prov-model">gemini-3.1-flash-lite</span><span class="prov-calls">224 calls · ⚠️ quota</span></div>
        <div class="prov-item"><span class="prov-status ok"></span><span class="prov-name">Jetson Orin (lokaal)</span><span class="prov-model">gemma-4 / llama32-3b</span><span class="prov-calls">~5 calls · lokaal</span></div>
      </div><div class="card-footer">API keys: 8 geconfigureerd · 4 actief</div></div>`;
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
    tag: '97.5%',
    w: 3, h: 14,
    render: (el) => {
      el.innerHTML = `<div class="card"><div class="card-header"><h3>✅ Succespercentage</h3><span class="tag green">97.5%</span></div><div class="card-body" style="display:flex;align-items:center;justify-content:center;padding:8px 18px"><div class="gauge-wrap"><div class="gauge-ring"><svg width="100" height="100" viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="40"/><circle class="fg" id="successGauge" cx="50" cy="50" r="40" stroke-dasharray="251.2" stroke-dashoffset="251.2"/></svg><div class="gauge-center"><span class="num" id="successPct">97.5</span><span class="lbl">%</span></div></div><div class="gauge-labels"><span><span class="d" style="background:#22c55e"></span>Geslaagd ~7.020</span><span><span class="d" style="background:#ef4444"></span>Mislukt ~180</span></div></div></div><div class="card-footer">700 errors in log · meeste Gemini quota 429</div></div>`;
    }
  },
  {
    id: 'apikeys',
    title: '🔑 API Keys',
    tag: '8 totaal',
    w: 3, h: 14,
    render: (el) => {
      el.innerHTML = `<div class="card"><div class="card-header"><h3>🔑 API Keys</h3><span class="tag">8 totaal</span></div><div class="card-body" style="padding:8px 18px"><table class="comp-table">
        <tr><td class="metric">DeepSeek</td><td class="positive">● OK</td></tr>
        <tr><td class="metric">OpenRouter</td><td class="positive">● OK</td></tr>
        <tr><td class="metric">Anthropic</td><td class="positive">● OK</td></tr>
        <tr><td class="metric">xAI</td><td class="positive">● OK</td></tr>
        <tr><td class="metric">Gemini</td><td class="negative">● Quota overschreden</td></tr>
        <tr><td class="metric">GitHub Copilot</td><td class="positive">● OK</td></tr>
        <tr><td class="metric">Ollama (Jetson)</td><td class="positive">● OK</td></tr>
        <tr><td class="metric">OpenAI Codex</td><td class="positive">● OK</td></tr>
      </table></div></div>`;
    }
  },
  {
    id: 'timeline',
    title: '⏱ Gebruik vandaag',
    tag: 'per uur',
    w: 4, h: 14,
    render: (el) => {
      el.innerHTML = `<div class="card"><div class="card-header"><h3>⏱ Gebruik vandaag</h3><span class="tag">per uur</span></div><div class="card-body"><div class="chart-wrap chart-wrap-lg"><canvas id="timelineChart"></canvas></div></div><div class="card-footer">Piek: 09:00 (briefing) · 15:00 (code werk)</div></div>`;
    }
  },
  {
    id: 'activity',
    title: 'Activiteit Log',
    icon: ICONS.activity,
    tag: 'laatste events',
    w: 10, h: 14,
    render: (el) => {
      el.innerHTML = `<div class="card"><div class="card-header"><h3>${ICONS.activity} Activiteit Log</h3><span class="tag">laatste events</span></div><div class="card-body" style="max-height:240px;overflow-y:auto">
        <div class="activity-item"><span class="activity-dot success"></span><span class="activity-text">Hermes Dashboard v0.3 · chart rendering gefixt</span><span class="activity-time">19:56</span></div>
        <div class="activity-item"><span class="activity-dot success"></span><span class="activity-text">Dashboard ontwerp afgerond · Bambubuddy stijl</span><span class="activity-time">23:51</span></div>
        <div class="activity-item"><span class="activity-dot info"></span><span class="activity-text"><span class="hl">Edgar</span> → Screenshots geanalyseerd</span><span class="activity-time">23:48</span></div>
        <div class="activity-item"><span class="activity-dot info"></span><span class="activity-text"><span class="hl">Mail Monitor</span> → 3DPets inbox gescand · 0 nieuw</span><span class="activity-time">23:42</span></div>
        <div class="activity-item"><span class="activity-dot success"></span><span class="activity-text"><span class="hl">Kronkel</span> → Bambubuddy MCP verbonden</span><span class="activity-time">23:39</span></div>
        <div class="activity-item"><span class="activity-dot error"></span><span class="activity-text"><span class="hl">Gemini</span> → Quota overschreden · 429</span><span class="activity-time">22:57</span></div>
        <div class="activity-item"><span class="activity-dot success"></span><span class="activity-text"><span class="hl">Briefing Agent</span> → Ochtendrapport</span><span class="activity-time">09:00</span></div>
        <div class="activity-item"><span class="activity-dot info"></span><span class="activity-text"><span class="hl">Hermes</span> → 29 sessies · 1304 berichten</span><span class="activity-time">vandaag</span></div>
      </div><div class="card-footer"><span>agent.log · 1.27 MB</span><span>errors: 700</span></div></div>`;
    }
  }
];

// ═══════════════════════════════════════════════════════════════
// DEFAULT LAYOUT
// ═══════════════════════════════════════════════════════════════

const DEFAULT_LAYOUT = {
  children: [
    // Rij 1: agenten + tokens + kosten
    {w:4,h:14,x:0,y:0,id:'agents'},
    {w:3,h:14,x:4,y:0,id:'tokens'},
    {w:3,h:14,x:7,y:0,id:'costs'},
    // Rij 2: providers + success + apikeys
    {w:4,h:14,x:0,y:1,id:'providers'},
    {w:3,h:14,x:4,y:1,id:'success'},
    {w:3,h:14,x:7,y:1,id:'apikeys'},
    // Rij 3: D2D + W2W + M2M
    {w:3,h:13,x:0,y:2,id:'d2d'},
    {w:3,h:13,x:3,y:2,id:'w2w'},
    {w:4,h:13,x:6,y:2,id:'m2m'},
    // Rij 4: timeline + activity
    {w:4,h:14,x:0,y:3,id:'timeline'},
    {w:6,h:14,x:4,y:3,id:'activity'},
  ]
};

// ═══════════════════════════════════════════════════════════════
// CHART DATA — real values from Sven's Hermes environment
// ═══════════════════════════════════════════════════════════════

const DATA = {
  tokensByProvider: {
    labels: ['DeepSeek','OpenRouter','Gemini','Jetson','Overig'],
    values: [145000, 89200, 22400, 5000, 8200],
    colors: ['#22c55e','#3b82f6','#f97316','#a855f7','#6b7280']
  },
  costs: {
    labels: ['DeepSeek','OpenRouter','Gemini','Overig'],
    values: [1.42, 0.85, 0.28, 0.28],
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
    labels: ['Wk 1','Wk 2','Wk 3','Wk 4'],
    thisMonth: [1200, 1450, 1380, 980],
    lastMonth: [1100, 1520, 1420, 1050]
  },
  timeline: {
    hours: ['06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23'],
    calls: [2,5,18,42,28,15,8,12,22,48,35,20,16,14,10,8,6,3]
  }
};

// ═══════════════════════════════════════════════════════════════
// CHART RENDERER — met ResizeObserver voor zero-size canvas fix
// ═══════════════════════════════════════════════════════════════

let chartInstances = {};
let chartQueue = [];

function observeCanvas(canvas, initFn) {
  // Check if already visible with size
  if (canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
    initFn();
    return;
  }
  // Queue + observe
  const ro = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        ro.disconnect();
        // Korte timeout zodat GridStack klaar is met layout
        requestAnimationFrame(() => initFn());
        break;
      }
    }
  });
  ro.observe(canvas.parentElement);
}

function initCharts() {
  Chart.defaults.color = '#9ca3af';
  Chart.defaults.borderColor = '#242424';
  Chart.defaults.font.family = "'Inter','-apple-system','BlinkMacSystemFont','Segoe UI',sans-serif";

  // Token usage — horizontale bars
  const tokenCanvas = document.getElementById('tokenChart');
  if (tokenCanvas) {
    observeCanvas(tokenCanvas, () => {
      chartInstances.token = new Chart(tokenCanvas, {
        type: 'bar',
        data: { labels: DATA.tokensByProvider.labels, datasets: [{ data: DATA.tokensByProvider.values, backgroundColor: DATA.tokensByProvider.colors, borderRadius: 4, borderSkipped: false }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: '#1e1e1e' }, ticks: { callback: v => (v/1000)+'K' } }, y: { grid: { display: false } } } }
      });
    });
  }

  // Cost donut
  const costCanvas = document.getElementById('costChart');
  if (costCanvas) {
    observeCanvas(costCanvas, () => {
      chartInstances.cost = new Chart(costCanvas, {
        type: 'doughnut',
        data: { labels: DATA.costs.labels, datasets: [{ data: DATA.costs.values, backgroundColor: DATA.costs.colors, borderWidth: 0, spacing: 4 }] },
        options: { responsive: true, maintainAspectRatio: true, cutout: '72%', plugins: { legend: { display: false } } }
      });
    });
  }

  // Comparison bars — D2D, W2W, M2M
  function mkBar(id, labels, d1, d2) {
    const el = document.getElementById(id);
    if (!el) return;
    const c1 = id === 'd2dChart' ? '#22c55e' : id === 'w2wChart' ? '#3b82f6' : '#f97316';
    observeCanvas(el, () => {
      chartInstances[id] = new Chart(el, {
        type: 'bar',
        data: { labels, datasets: [
          { label: 'Vorige', data: d2, backgroundColor: '#242424', borderRadius: 3, borderSkipped: false },
          { label: 'Huidige', data: d1, backgroundColor: c1, borderRadius: 3, borderSkipped: false }
        ]},
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { font: { size: 10 } } }, y: { grid: { color: '#1e1e1e' }, beginAtZero: true, ticks: { font: { size: 10 } } } } }
      });
    });
  }
  mkBar('d2dChart', DATA.d2d.labels, DATA.d2d.today, DATA.d2d.yesterday);
  mkBar('w2wChart', DATA.w2w.labels, DATA.w2w.thisWeek, DATA.w2w.lastWeek);
  mkBar('m2mChart', DATA.m2m.labels, DATA.m2m.thisMonth, DATA.m2m.lastMonth);

  // Timeline
  const tlCanvas = document.getElementById('timelineChart');
  if (tlCanvas) {
    observeCanvas(tlCanvas, () => {
      chartInstances.timeline = new Chart(tlCanvas, {
        type: 'line',
        data: { labels: DATA.timeline.hours, datasets: [{ data: DATA.timeline.calls, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.08)', fill: true, tension: 0.35, pointRadius: 2, pointHoverRadius: 5, pointBackgroundColor: '#22c55e', borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { font: { size: 9 } } }, y: { grid: { color: '#1e1e1e' }, beginAtZero: true, ticks: { font: { size: 9 } } } }, interaction: { intersect: false, mode: 'index' } }
      });
    });
  }

  // Success gauge (geen ResizeObserver nodig — SVG)
  requestAnimationFrame(() => {
    const g = document.getElementById('successGauge');
    if (g) {
      const offset = 251.2 - (251.2 * 97.5 / 100);
      setTimeout(() => { g.style.strokeDashoffset = offset; }, 400);
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// GRIDSTACK SETUP
// ═══════════════════════════════════════════════════════════════

const STORAGE_KEY = 'hermes_dashboard_layout_v2';
let grid = null;

function getSavedLayout() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return null;
}

function saveLayout(g) {
  const serialized = g.save(false);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
}

function initGrid() {
  const g = GridStack.init({
    column: 10,
    minWidth: 768,
    cellHeight: 18,
    margin: 8,
    float: false,
    draggable: { handle: '.card-header', scroll: true },
    resizable: { handles: 'se, sw' },
    disableOneColumnMode: false,
    animate: true,
  }, document.getElementById('widgetGrid'));

  const saved = getSavedLayout();
  const layout = saved || DEFAULT_LAYOUT;

  const items = [];
  (layout.children || []).forEach(cfg => {
    const def = WIDGETS.find(w => w.id === cfg.id);
    if (!def) return;
    items.push({
      x: cfg.x || 0, y: cfg.y || 0,
      w: cfg.w || def.w, h: cfg.h || def.h,
      id: def.id,
      content: ''
    });
  });

  g.load(items);

  // Render content — moet na load, want gridstack escapt HTML in content string
  requestAnimationFrame(() => {
    document.querySelectorAll('.grid-stack-item[gs-id]').forEach(item => {
      const id = item.getAttribute('gs-id');
      const def = WIDGETS.find(w => w.id === id);
      if (!def) return;
      const contentDiv = item.querySelector('.grid-stack-item-content');
      if (contentDiv) {
        const wrap = document.createElement('div');
        def.render(wrap);
        contentDiv.innerHTML = wrap.innerHTML;
      }
    });
    // Start charts zodra content in DOM zit
    initCharts();
  });

  g.on('change', () => saveLayout(g));
  return g;
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

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
    });
  });
  grid = initGrid();
});
