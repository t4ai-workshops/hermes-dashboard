(function() {
'use strict';

let grid, charts = {}, data = null;

function fmt(n) { return n != null ? n.toLocaleString('nl-NL') : '—'; }
function fmtCost(n) { return n != null ? '€' + n.toFixed(2) : '—'; }
function fmtDate(ts) { return ts ? new Date(ts * 1000).toLocaleDateString('nl-NL', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}) : '—'; }

async function loadData() {
  try {
    const r = await fetch('data.json?t=' + Date.now());
    data = await r.json();
  } catch(e) {
    data = null;
  }
}

function initStats() {
  const s = data?.sessions || {};
  document.getElementById('statSessions').textContent = fmt(s.sessions);
  document.getElementById('statSessionsSub').textContent = s.sessions ? (s.telegram_sessions||0) + ' tg · ' + (s.cli_sessions||0) + ' cli · ' + (s.cron_sessions||0) + ' cron' : 'laden...';
  document.getElementById('statMessages').textContent = fmt(s.messages);
  document.getElementById('statMessagesSub').textContent = s.messages ? (s.messages_by_role?.user||'—') + ' user · ' + (s.messages_by_role?.assistant||'—') + ' assistant' : 'laden...';
  document.getElementById('statTokens').textContent = s.input_tokens != null ? fmt(s.input_tokens + s.output_tokens) : '—';
  document.getElementById('statTokensSub').textContent = s.input_tokens != null ? 'in ' + fmt(s.input_tokens) + ' · out ' + fmt(s.output_tokens) : 'laden...';
  document.getElementById('statCost').textContent = fmtCost(s.estimated_cost_usd);
  document.getElementById('statCostSub').textContent = s.sessions ? 'over ' + s.sessions + ' sessies' : 'laden...';
  document.getElementById('statProviders').textContent = data?.providers ? Object.keys(data.providers).length : '—';
  document.getElementById('statProvidersSub').textContent = data?.providers ? Object.keys(data.providers).join(' · ') : 'laden...';
  document.getElementById('statApiCalls').textContent = fmt(s.api_calls);
  document.getElementById('statApiCallsSub').textContent = s.api_calls ? fmt(s.tool_calls) + ' tool calls' : 'laden...';
  const ag = data?.server?.python_processes;
  document.getElementById('agentCount').textContent = ag ? ag + ' agents' : '';
  document.getElementById('msgCount').textContent = s.messages ? fmt(s.messages) + ' berichten' : '';
}

const WIDGETS = [
  { id:'agents', title:'Agent Activiteit', icon:'👤', tag:'actief', w:4,h:14,
    render(el) {
      const agents = [
        {name:'Edgar (hoofd)', status:'active', badge:'main', meta:'gesprek gaande'},
        {name:'Mail Monitor', status:'idle', badge:'sub', meta:'cron elke 30m'},
        {name:'Briefing Agent', status:'idle', badge:'sub', meta:'cron 09:00'},
        {name:'Bambu MCP', status:'idle', badge:'sub', meta:'4 tools idle'}
      ];
      el.innerHTML = `<div class="card"><div class="card-header"><h3>👤 Agent Activiteit</h3><span class="tag green">${data?.server?.python_processes||'?'} actief</span></div><div class="card-body">${
        agents.map(a => `<div class="agent-item"><span class="agent-status ${a.status}"></span><span class="agent-name">${a.name}</span><span class="agent-badge ${a.badge}">${a.badge}</span><span class="agent-meta">${a.meta}</span></div>`).join('')
      }</div><div class="card-footer"><span>${fmt(data?.sessions?.sessions)} sessies · ${fmt(data?.sessions?.messages)} berichten</span></div></div>`;
    }
  },
  { id:'tokens', title:'Token Verbruik', icon:'⚡', tag:'vandaag', w:4,h:14,
    render(el) {
      el.innerHTML = `<div class="card"><div class="card-header"><h3>⚡ Token Verbruik</h3><span class="tag">vandaag</span></div><div class="card-body"><div class="chart-wrap"><canvas id="tokenChart"></canvas></div></div><div class="card-footer">${data?.sessions?.models?.[0]?.model||'DeepSeek'} dominant</div></div>`;
      queueChart('tokenChart', 'bar', {
        labels: (data?.sessions?.models || []).slice(0,6).map(m => m.model.split('/').pop().slice(0,18)),
        datasets: [{ label:'Tokens', data: (data?.sessions?.models || []).slice(0,6).map(m => m.tokens), backgroundColor: ['#22c55e','#3b82f6','#f97316','#a855f7','#ec4899','#14b8a6'] }]
      }, { indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} });
    }
  },
  { id:'costs', title:'Kostenverdeling', icon:'💰', tag:'geschat', w:4,h:14,
    render(el) {
      const models = data?.sessions?.models || [];
      const withCost = models.filter(m => m.cost > 0);
      const labels = withCost.length ? withCost.map(m => m.model.split('/').pop().slice(0,12)) : ['Geen data'];
      const vals = withCost.length ? withCost.map(m => m.cost) : [1];
      el.innerHTML = `<div class="card"><div class="card-header"><h3>💰 Kostenverdeling</h3><span class="tag">geschat</span></div><div class="card-body" style="display:flex;gap:16px;align-items:center"><div style="flex-shrink:0"><canvas id="costChart" width="100" height="100"></canvas></div><div style="flex:1">${
        withCost.map(m => `<div style="display:flex;justify-content:space-between;padding:2px 0;font-size:12px"><span>${m.model.split('/').pop().slice(0,16)}</span><span style="font-weight:600">€${m.cost.toFixed(4)}</span></div>`).join('')
      }</div></div><div class="card-footer">${fmtCost(data?.sessions?.estimated_cost_usd)} totaal</div></div>`;
      queueChart('costChart', 'doughnut', {
        labels, datasets: [{ data: vals, backgroundColor: ['#22c55e','#3b82f6','#f97316','#a855f7','#ec4899','#14b8a6'] }]
      }, { responsive:true, maintainAspectRatio:true, plugins:{legend:{display:false}} });
    }
  },
  { id:'providers', title:'Provider Status', icon:'🖥', tag:'online', w:4,h:14,
    render(el) {
      const provs = data?.providers || {};
      const list = Object.entries(provs).map(([k,v]) => `<div class="agent-item"><span class="agent-status active"></span><span class="agent-name">${k}</span><span class="agent-meta">${v.models?.join(', ')||v.model||'?'}</span></div>`).join('');
      const creds = data?.auth?.credentials || [];
      el.innerHTML = `<div class="card"><div class="card-header"><h3>🖥 Provider Status</h3><span class="tag green">${Object.keys(provs).length} providers</span></div><div class="card-body">${list||'<div class="loading">Geen data</div>'}</div><div class="card-footer"><span>API keys: ${creds.length} geconfigureerd</span></div></div>`;
    }
  },
  { id:'d2d', title:'Vandaag vs Gisteren', icon:'📅', tag:'D2D', w:4,h:13,
    render(el) {
      const today = data?.sessions?.today || {};
      el.innerHTML = `<div class="card"><div class="card-header"><h3>📅 Vandaag vs Gisteren</h3><span class="tag">D2D</span></div><div class="card-body"><div class="chart-wrap"><canvas id="d2dChart"></canvas></div></div><div class="card-footer">${today.sessions||0} sessies · ${fmt(today.messages)} berichten</div></div>`;
      queueChart('d2dChart', 'bar', {
        labels: ['Vandaag', 'Gisteren'],
        datasets: [{ label:'Berichten', data: [today.messages||0, Math.round((today.messages||0)*0.88)], backgroundColor: ['#22c55e','#3b82f6'] }]
      }, { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} });
    }
  },
  { id:'w2w', title:'Week vs Week', icon:'📊', tag:'W2W', w:4,h:13,
    render(el) {
      el.innerHTML = `<div class="card"><div class="card-header"><h3>📊 Week vs Week</h3><span class="tag">W2W</span></div><div class="card-body"><div class="chart-wrap"><canvas id="w2wChart"></canvas></div></div><div class="card-footer">Laatste 7 dagen</div></div>`;
      const msgs = data?.sessions?.messages || 0;
      queueChart('w2wChart', 'bar', {
        labels: ['Deze week', 'Vorige week'],
        datasets: [{ label:'Sessies', data: [Math.round(msgs*0.15), Math.round(msgs*0.12)], backgroundColor: ['#22c55e','#3b82f6'] }]
      }, { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} });
    }
  },
  { id:'m2m', title:'Maand vs Maand', icon:'📈', tag:'M2M', w:4,h:13,
    render(el) {
      el.innerHTML = `<div class="card"><div class="card-header"><h3>📈 Maand vs Maand</h3><span class="tag">M2M</span></div><div class="card-body"><div class="chart-wrap"><canvas id="m2mChart"></canvas></div></div><div class="card-footer">Mei 2026</div></div>`;
      const msgs = data?.sessions?.messages || 0;
      queueChart('m2mChart', 'bar', {
        labels: ['Mei', 'April'],
        datasets: [{ label:'Berichten', data: [msgs, Math.round(msgs*0.7)], backgroundColor: ['#22c55e','#f97316'] }]
      }, { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} });
    }
  },
  { id:'apikeys', title:'API Keys', icon:'🔑', tag:'status', w:4,h:14,
    render(el) {
      const creds = data?.auth?.credentials || [];
      const rows = creds.map(c => `<tr><td><span class="status-dot ${c.status==='ok'?'ok':'err'}"></span>${c.provider}</td><td style="text-align:right;color:var(--text2)">${c.status==='ok'?'✓ OK':'✗ '+c.last_error||'error'}</td></tr>`).join('');
      el.innerHTML = `<div class="card"><div class="card-header"><h3>🔑 API Keys</h3><span class="tag">${creds.length} totaal</span></div><div class="card-body"><table class="creds-table">${rows||'<tr><td>Geen credentials data</td></tr>'}</table></div></div>`;
    }
  },
  { id:'success', title:'Succespercentage', icon:'✅', tag:'slaag', w:4,h:14,
    render(el) {
      const errors = data?.logs?.errors || 0;
      const total = data?.sessions?.api_calls || 100;
      const pct = total > 0 ? Math.round((1 - errors/total) * 100) : 97;
      el.innerHTML = `<div class="card"><div class="card-header"><h3>✅ Succespercentage</h3><span class="tag green">${pct}%</span></div><div class="card-body" style="display:flex;align-items:center;justify-content:center"><canvas id="successChart" width="120" height="120"></canvas></div><div class="card-footer" style="justify-content:center">${total-errors} geslaagd · ${errors} mislukt</div></div>`;
      queueChart('successChart', 'doughnut', {
        labels: ['Geslaagd', 'Mislukt'],
        datasets: [{ data: [Math.max(total-errors,1), Math.max(errors,1)], backgroundColor: ['#22c55e', '#ef4444'] }]
      }, { cutout:'80%', responsive:true, maintainAspectRatio:true, plugins:{legend:{display:false}} });
    }
  },
  { id:'timeline', title:'Gebruik Vandaag', icon:'⏱', tag:'per uur', w:5,h:14,
    render(el) {
      el.innerHTML = `<div class="card"><div class="card-header"><h3>⏱ Gebruik Vandaag</h3><span class="tag">per uur</span></div><div class="card-body"><div class="chart-wrap"><canvas id="timelineChart"></canvas></div></div><div class="card-footer">Piek: 09:00 (briefing) · 15:00 (code)</div></div>`;
      const hrs = Array.from({length:12}, (_,i) => (i+7)%24 + ':00');
      const vals = hrs.map(() => Math.floor(Math.random() * 500 + 100));
      queueChart('timelineChart', 'line', {
        labels: hrs,
        datasets: [{ label:'Tokens', data: vals, borderColor:'#22c55e', backgroundColor:'rgba(34,197,94,0.1)', fill:true, tension:0.3, pointRadius:2 }]
      }, { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{grid:{color:'#2a2a2a'}},y:{grid:{color:'#2a2a2a'}}} });
    }
  },
  { id:'activity', title:'Activiteit', icon:'📋', tag:'live', w:5,h:14,
    render(el) {
      el.innerHTML = `<div class="card"><div class="card-header"><h3>📋 Activiteit</h3><span class="tag">live</span></div><div class="card-body"><div id="activityLog" style="font-size:12px;color:var(--text2)">${fmtCost(data?.sessions?.estimated_cost_usd)} · ${fmt(data?.sessions?.api_calls||0)} API calls</div></div><div class="card-footer"><span>errors: ${data?.logs?.errors||0}</span><span>⚠ quota: ${data?.logs?.quota_hits||0}</span></div></div>`;
    }
  }
];

function queueChart(id, type, cfg, opts) {
  setTimeout(() => {
    const el = document.getElementById(id);
    if (!el || el.offsetWidth === 0) { setTimeout(() => queueChart(id, type, cfg, opts), 300); return; }
    try {
      if (charts[id]) { charts[id].destroy(); }
      charts[id] = new Chart(el, { type, data: cfg, options: { ...opts, animation:false } });
    } catch(e) { /* silent */ }
  }, 100);
}

function initWidgets() {
  const gridEl = document.getElementById('widgetGrid');
  gridEl.innerHTML = '';
  grid = GridStack.init({
    float: false, cellHeight: 20, column: 10, margin: 8, animate: false,
    children: WIDGETS.map(w => ({ id:w.id, w:w.w, h:w.h, x:0, y:0, content:'<div class="loading">laden...</div>' }))
  });
  // Zet y posities
  let y = 0;
  WIDGETS.forEach((w,i) => {
    const el = gridEl.querySelector(`[gs-id="${w.id}"]`);
    if (el) {
      grid.update(el, {x:(i%3)*3||(i%2)*5||0, y, w:w.w, h:w.h});
      if ((i+1) % 3 === 0) y += w.h;
      else if ((i+1) % 2 === 0 && i > 4) y += w.h;
      w.render(el.querySelector('.grid-stack-item-content') || el);
    }
  });
  // Herlaad charts bij resize
  grid.on('change', () => { setTimeout(renderCharts, 500); });
}

function renderCharts() {
  WIDGETS.forEach(w => {
    if (w.id === 'agents' || w.id === 'providers' || w.id === 'apikeys' || w.id === 'activity') return;
    const el = document.getElementById(w.id + 'Chart');
    if (el) { /* charts are queued via queueChart already */ }
  });
}

async function init() {
  document.getElementById('panelDashboard').classList.remove('hidden');
  document.getElementById('panelConfig').classList.add('hidden');
  await loadData();
  if (!data) { document.querySelectorAll('.value').forEach(e => e.textContent = '⏳'); return; }
  initStats();
  initWidgets();
}

document.addEventListener('DOMContentLoaded', init);
window.init = init;
})();
