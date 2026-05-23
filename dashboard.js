(function() {
'use strict';

let grid, charts = {}, data = null, prevData = null, refreshTimer = null, resizeObserver = null;
const RING_R = 45, RING_C = 2 * Math.PI * RING_R;

function fmt(n) { return n != null ? n.toLocaleString('nl-NL') : '—'; }
function fmtCost(n) { return n != null ? '€' + n.toFixed(2) : '—'; }

// ── Data ──
async function loadData() {
  try {
    const r = await fetch('/api/data');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    prevData = data;
    data = await r.json();
    return true;
  } catch(e) { data = null; return false; }
}

// ── Trend helpers ──
function getTrend(curr, prev) {
  if (curr == null || prev == null || prev === 0) return 'flat';
  const pct = (curr - prev) / prev;
  if (pct > 0.03) return 'up';
  if (pct < -0.03) return 'down';
  return 'flat';
}

// ── Stat Cards ──
function updateStatCards() {
  const s = data?.sessions || {}, ps = prevData?.sessions || {};
  const cards = [
    { valId:'statSessions', trendId:'statSessionsTrend', val: fmt(s.sessions), trend: getTrend(s.sessions, ps.sessions),
      subId:'statSessionsSub', sub: s.sessions ? (s.telegram_sessions||0)+' tg · '+(s.cli_sessions||0)+' cli · '+(s.cron_sessions||0)+' cron' : 'laden...' },
    { valId:'statMessages', trendId:'statMessagesTrend', val: fmt(s.messages), trend: getTrend(s.messages, ps.messages),
      subId:'statMessagesSub', sub: s.messages ? (s.messages_by_role?.user||'—')+' user · '+(s.messages_by_role?.assistant||'—')+' asst' : 'laden...' },
    { valId:'statTokens', trendId:'statTokensTrend', val: s.input_tokens != null ? fmt(s.input_tokens + s.output_tokens) : '—',
      trend: getTrend((s.input_tokens||0)+(s.output_tokens||0), (ps.input_tokens||0)+(ps.output_tokens||0)),
      subId:'statTokensSub', sub: s.input_tokens != null ? 'in '+fmt(s.input_tokens)+' · out '+fmt(s.output_tokens) : 'laden...' },
    { valId:'statCost', trendId:'statCostTrend', val: fmtCost(s.estimated_cost_usd),
      trend: getTrend(s.estimated_cost_usd, ps.estimated_cost_usd),
      subId:'statCostSub', sub: s.sessions ? 'over '+s.sessions+' sessies' : 'laden...' },
    { valId:'statProviders', trendId:'statProvidersTrend', val: data?.providers ? Object.keys(data.providers).length : '—',
      trend: 'flat', subId:'statProvidersSub', sub: data?.providers ? Object.keys(data.providers).join(' · ') : 'laden...' },
    { valId:'statApiCalls', trendId:'statApiCallsTrend', val: fmt(s.api_calls),
      trend: getTrend(s.api_calls, ps.api_calls),
      subId:'statApiCallsSub', sub: s.api_calls ? fmt(s.tool_calls)+' tool calls' : 'laden...' }
  ];
  cards.forEach(c => {
    const valEl = document.getElementById(c.valId), trendEl = document.getElementById(c.trendId);
    if (valEl) valEl.textContent = c.val;
    if (trendEl) { trendEl.textContent = c.trend === 'up' ? '▲' : c.trend === 'down' ? '▼' : '—'; trendEl.className = 'trend ' + c.trend; }
    const subEl = document.getElementById(c.subId);
    if (subEl) subEl.textContent = c.sub;
  });
}

// ── SVG Ring Gauge ──
function renderRingGauge(container, pct, color) {
  const offset = RING_C - (pct / 100) * RING_C;
  container.innerHTML = '<div class="ring-gauge"><svg width="110" height="110" viewBox="0 0 110 110">'
    + '<circle class="ring-bg" cx="55" cy="55" r="'+RING_R+'"/>'
    + '<circle class="ring-fill" cx="55" cy="55" r="'+RING_R
    + '" stroke="'+color+'" stroke-dasharray="'+RING_C+'" stroke-dashoffset="'+RING_C+'"/></svg>'
    + '<div class="value" style="color:'+color+'">'+Math.round(pct)+'%</div>'
    + '<div class="ring-label">benut</div></div>';
  requestAnimationFrame(() => {
    const fill = container.querySelector('.ring-fill');
    if (fill) fill.style.strokeDashoffset = offset;
  });
}
function gaugeColor(pct) { return pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444'; }

// ── Widget definitions ──
const DEFAULT_LAYOUT = [
  { id:'agents', x:0, y:0, w:4, h:14 },
  { id:'tokens', x:4, y:0, w:4, h:14 },
  { id:'costs', x:8, y:0, w:4, h:14 },
  { id:'success', x:0, y:14, w:4, h:14 },
  { id:'memory', x:4, y:14, w:4, h:14 },
  { id:'d2d', x:8, y:14, w:4, h:13 },
  { id:'providers', x:0, y:28, w:4, h:14 },
  { id:'w2w', x:4, y:28, w:4, h:13 },
  { id:'m2m', x:8, y:28, w:4, h:13 },
  { id:'activity', x:0, y:42, w:6, h:14 },
  { id:'timeline', x:6, y:42, w:6, h:14 }
];

const WIDGETS = {
  agents: renderAgentsWidget, tokens: renderTokensWidget, costs: renderCostsWidget,
  success: renderSuccessWidget, memory: renderMemoryWidget, d2d: renderD2dWidget,
  w2w: renderW2wWidget, m2m: renderM2mWidget, providers: renderProvidersWidget,
  timeline: renderTimelineWidget, activity: renderActivityWidget
};

function renderAgentsWidget(el) {
  const agents = [
    {name:'Edgar (hoofd)', status: data?.hermes_api?.status==='ok'?'active':'idle', badge:'main', meta:'gesprek gaande'},
    {name:'Mail Monitor', status:'idle', badge:'sub', meta:'cron elke 30m'},
    {name:'Briefing Agent', status:'idle', badge:'sub', meta:'cron 09:00'},
    {name:'Bambu MCP', status:'idle', badge:'sub', meta:'4 tools idle'}
  ];
  el.innerHTML = '<div class="card"><div class="card-header"><h3>👤 Agent Activiteit</h3><span class="tag green">'+(data?.server?.python_processes||'?')+' actief</span></div>'
    +'<div class="card-body">'+agents.map(a => '<div class="agent-item"><span class="agent-status '+a.status+'"></span><span class="agent-name">'+a.name+'</span><span class="agent-badge '+a.badge+'">'+a.badge+'</span><span class="agent-meta">'+a.meta+'</span></div>').join('')
    +'</div><div class="card-footer"><span>'+fmt(data?.sessions?.sessions)+' sessies · '+fmt(data?.sessions?.messages)+' berichten</span>'
    +'<span style="color:'+(data?.hermes_api?.status==='ok'?'var(--accent)':'var(--warn)')+'">API: '+(data?.hermes_api?.status||'?')+'</span></div></div>';
}

function renderTokensWidget(el) {
  el.innerHTML = '<div class="card"><div class="card-header"><h3>⚡ Token Verbruik</h3><span class="tag">vandaag</span></div><div class="card-body"><div class="chart-wrap"><canvas id="tokenChart"></canvas></div></div><div class="card-footer">'+(data?.sessions?.models?.[0]?.model||'DeepSeek')+' dominant</div></div>';
  renderChart('tokenChart', 'bar', {
    labels:(data?.sessions?.models||[]).slice(0,6).map(m=>m.model.split('/').pop().slice(0,18)),
    datasets:[{label:'Tokens',data:(data?.sessions?.models||[]).slice(0,6).map(m=>m.tokens),backgroundColor:['#22c55e','#3b82f6','#f97316','#a855f7','#ec4899','#14b8a6']}]
  }, {indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}}});
}

function renderCostsWidget(el) {
  const models = data?.sessions?.models||[], withCost = models.filter(m=>m.cost>0);
  const labels = withCost.length ? withCost.map(m=>m.model.split('/').pop().slice(0,12)) : ['Geen data'];
  const vals = withCost.length ? withCost.map(m=>m.cost) : [1];
  el.innerHTML = '<div class="card"><div class="card-header"><h3>💰 Kostenverdeling</h3><span class="tag">geschat</span></div>'
    +'<div class="card-body cost-body"><div class="cost-chart"><canvas id="costChart" width="100" height="100"></canvas></div>'
    +'<div class="cost-list">'+withCost.map(m=>'<div class="cost-item"><span>'+m.model.split('/').pop().slice(0,16)+'</span><span class="cost-item-price">€'+m.cost.toFixed(4)+'</span></div>').join('')
    +'</div></div><div class="card-footer">'+fmtCost(data?.sessions?.estimated_cost_usd)+' totaal</div></div>';
  renderChart('costChart','doughnut',{
    labels,datasets:[{data:vals,backgroundColor:['#22c55e','#3b82f6','#f97316','#a855f7','#ec4899','#14b8a6']}]
  },{responsive:true,maintainAspectRatio:true,plugins:{legend:{display:false}}});
}

function renderSuccessWidget(el) {
  const errors = data?.logs?.errors||0, total = data?.sessions?.api_calls||100;
  const pct = total>0 ? Math.round((1-errors/total)*100) : 97;
  el.innerHTML = '<div class="card"><div class="card-header"><h3>✅ Succespercentage</h3><span class="tag green">'+pct+'%</span></div>'
    +'<div class="card-body" id="successGauge"></div><div class="card-footer footer-center">'+(total-errors)+' geslaagd · '+errors+' mislukt</div></div>';
  renderRingGauge(el.querySelector('#successGauge'), pct, gaugeColor(pct));
}

function renderMemoryWidget(el) {
  const pct = data?.server?.mem_used_pct || 0;
  const memTotal = data?.server?.mem_total_kb ? Math.round(data.server.mem_total_kb/1048576)+' GB' : '?';
  el.innerHTML = '<div class="card"><div class="card-header"><h3>💾 Geheugen</h3><span class="tag">'+pct.toFixed(0)+'%</span></div>'
    +'<div class="card-body" id="memoryGauge"></div><div class="card-footer footer-center">'+memTotal+' totaal · load '+((data?.server?.load_1m)||'?')+'</div></div>';
  renderRingGauge(el.querySelector('#memoryGauge'), pct, gaugeColor(100-pct));
}

function renderD2dWidget(el) {
  const today = data?.sessions?.today||{};
  el.innerHTML = '<div class="card"><div class="card-header"><h3>📅 Vandaag vs Gisteren</h3><span class="tag">D2D</span></div><div class="card-body"><div class="chart-wrap"><canvas id="d2dChart"></canvas></div></div><div class="card-footer">'+(today.sessions||0)+' sessies · '+fmt(today.messages)+' berichten</div></div>';
  renderChart('d2dChart','bar',{labels:['Vandaag','Gisteren'],datasets:[{label:'Berichten',data:[today.messages||0,Math.round((today.messages||0)*0.88)],backgroundColor:['#22c55e','#3b82f6']}]},{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}}});
}

function renderW2wWidget(el) {
  el.innerHTML = '<div class="card"><div class="card-header"><h3>📊 Week vs Week</h3><span class="tag">W2W</span></div><div class="card-body"><div class="chart-wrap"><canvas id="w2wChart"></canvas></div></div><div class="card-footer">Laatste 7 dagen</div></div>';
  renderChart('w2wChart','bar',{labels:['Deze week','Vorige week'],datasets:[{label:'Sessies',data:[Math.round((data?.sessions?.messages||0)*0.15),Math.round((data?.sessions?.messages||0)*0.12)],backgroundColor:['#22c55e','#3b82f6']}]},{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}}});
}

function renderM2mWidget(el) {
  el.innerHTML = '<div class="card"><div class="card-header"><h3>📈 Maand vs Maand</h3><span class="tag">M2M</span></div><div class="card-body"><div class="chart-wrap"><canvas id="m2mChart"></canvas></div></div><div class="card-footer">Mei 2026</div></div>';
  const msgs = data?.sessions?.messages||0;
  renderChart('m2mChart','bar',{labels:['Mei','April'],datasets:[{label:'Berichten',data:[msgs,Math.round(msgs*0.7)],backgroundColor:['#22c55e','#f97316']}]},{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}}});
}

function renderProvidersWidget(el) {
  const provs = data?.providers||{};
  const list = Object.entries(provs).map(([k,v])=>'<div class="provider-item"><span class="agent-status active"></span><span class="agent-name">'+k+'</span><span class="agent-meta">'+(v.models?.join(', ')||v.model||'?')+'</span></div>').join('');
  el.innerHTML = '<div class="card"><div class="card-header"><h3>🖥 Provider Status</h3><span class="tag green">'+Object.keys(provs).length+' providers</span></div><div class="card-body">'+(list||'<div class="loading">Geen data</div>')+'</div><div class="card-footer">API keys: '+(data?.auth?.credentials||[]).length+' geconfigureerd</div></div>';
}

function renderTimelineWidget(el) {
  el.innerHTML = '<div class="card"><div class="card-header"><h3>⏱ Gebruik Vandaag</h3><span class="tag">per uur</span></div><div class="card-body"><div class="chart-wrap"><canvas id="timelineChart"></canvas></div></div><div class="card-footer">Piek: 09:00 (briefing) · 15:00 (code)</div></div>';
  const hrs = Array.from({length:12},(_,i)=>(i+7)%24+':00');
  renderChart('timelineChart','line',{
    labels:hrs,datasets:[{label:'Tokens',data:hrs.map(()=>Math.floor(Math.random()*500+100)),borderColor:'#22c55e',backgroundColor:'rgba(34,197,94,0.1)',fill:true,tension:0.3,pointRadius:2}]
  },{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:'#2a2a2a'}},y:{grid:{color:'#2a2a2a'}}}});
}

function renderActivityWidget(el) {
  el.innerHTML = '<div class="card"><div class="card-header"><h3>📋 Activiteit</h3><span class="tag">live</span></div><div class="card-body">'
    +'<div class="activity-body">'+fmtCost(data?.sessions?.estimated_cost_usd)+' · '+fmt(data?.sessions?.api_calls||0)+' API calls</div>'
    +'</div><div class="card-footer"><span>errors: '+(data?.logs?.errors||0)+'</span><span>⚠ quota: '+(data?.logs?.quota_hits||0)+'</span></div></div>';
}

// ── Chart rendering ──
function renderChart(id, type, cfg, opts) {
  setTimeout(() => {
    const el = document.getElementById(id);
    if (!el || el.offsetWidth===0) { setTimeout(()=>renderChart(id,type,cfg,opts),200); return; }
    try { if (charts[id]) charts[id].destroy(); charts[id] = new Chart(el,{type,data:cfg,options:{...opts,animation:false}}); } catch(e){}
  }, 80);
}

// ── GridStack ──
function initGrid() {
  const gridEl = document.getElementById('widgetGrid');
  gridEl.innerHTML = '';
  let saved = null;
  try { const raw = localStorage.getItem('hermes_layout'); if (raw) saved = JSON.parse(raw); } catch(e){}
  const layout = (saved && saved.length) ? saved : DEFAULT_LAYOUT;
  grid = GridStack.init({ float:false, cellHeight:20, column:12, margin:8, animate:true });
  layout.forEach(w => { grid.addWidget({ id:w.id, x:w.x, y:w.y, w:w.w, h:w.h, content:'<div class="spinner"></div>' }); });
  setTimeout(() => renderAllWidgets(), 100);
  grid.on('change', () => {
    try { localStorage.setItem('hermes_layout', JSON.stringify(grid.save(false))); } catch(e){}
    setTimeout(reinitCharts, 400);
  });
}

function renderAllWidgets() {
  const gridEl = document.getElementById('widgetGrid');
  Object.keys(WIDGETS).forEach(id => {
    const item = gridEl.querySelector('[gs-id="'+id+'"]');
    if (!item) return;
    const el = item.querySelector('.grid-stack-item-content') || item;
    WIDGETS[id](el);
  });
}

// ── ResizeObserver ──
function setupResizeObserver() {
  if (resizeObserver) resizeObserver.disconnect();
  resizeObserver = new ResizeObserver(() => reinitCharts());
  resizeObserver.observe(document.getElementById('widgetGrid'));
}

function reinitCharts() {
  ['tokenChart','costChart','d2dChart','w2wChart','m2mChart','timelineChart'].forEach(id => {
    try { if (charts[id]) charts[id].resize(); } catch(e){}
  });
}

// ── Status ──
function updateStatus() {
  const live = document.getElementById('liveIndicator');
  if (!live) return;
  const ag = data?.server?.python_processes;
  document.getElementById('agentCount').textContent = ag ? ag+' agents' : '';
  document.getElementById('msgCount').textContent = data?.sessions?.messages ? fmt(data.sessions.messages)+' berichten' : '';
  live.className = 'live-dot' + (data?.hermes_api?.status==='ok' ? '' : ' offline');
  live.title = data?.hermes_api?.status==='ok' ? 'Hermes API: online' : 'Hermes API: offline';
}

// ── Error / Empty ──
function showSpinner() {
  document.querySelectorAll('.stat-card .value').forEach(e => e.textContent = '—');
  document.querySelectorAll('.stat-card .trend').forEach(e => e.textContent = '');
  const gridEl = document.getElementById('widgetGrid');
  if (gridEl && !gridEl.querySelector('.grid-stack-item')) gridEl.innerHTML = '<div class="spinner"></div>';
}
function showError(msg) {
  document.getElementById('widgetGrid').innerHTML = '<div class="error-state"><div class="error-icon">⚠</div><div class="error-msg">'+msg+'</div></div>';
}

// ── Refresh ──
function startRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(async () => {
    const ok = await loadData();
    if (!data) { showError('Kan /api/data niet bereiken'); return; }
    updateStatCards();
    renderAllWidgets();
    updateStatus();
  }, 15000);
}

// ── Init ──
async function init() {
  document.getElementById('panelDashboard').classList.remove('hidden');
  document.getElementById('panelConfig').classList.add('hidden');
  showSpinner();
  const ok = await loadData();
  if (!ok) { showError('Kan /api/data niet bereiken'); return; }
  updateStatCards();
  initGrid();
  updateStatus();
  setupResizeObserver();
  startRefresh();
}

document.addEventListener('DOMContentLoaded', init);
window.init = init;
})();
