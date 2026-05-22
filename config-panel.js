(function() {
'use strict';

async function loadConfigPanel() {
  let d;
  try {
    const r = await fetch('data.json?t=' + Date.now());
    d = await r.json();
  } catch(e) { d = null; }

  // Server info
  const srv = d?.server || {};
  document.getElementById('serverInfoBody').innerHTML = srv.hostname ? `
    <div class="info-row"><span class="key">Hostname</span><span class="val">${srv.hostname}</span></div>
    <div class="info-row"><span class="key">Besturingssysteem</span><span class="val">${srv.os||'?'}</span></div>
    <div class="info-row"><span class="key">Python</span><span class="val">${srv.python||'?'}</span></div>
    <div class="info-row"><span class="key">Uptime</span><span class="val">${srv.uptime_days||'?'} dagen</span></div>
    <div class="info-row"><span class="key">Geheugen</span><span class="val">${srv.mem_used_pct||'?'}% gebruikt</span></div>
    <div class="info-row"><span class="key">Load</span><span class="val">${srv.load_1m||'?'} / ${srv.load_5m||'?'} / ${srv.load_15m||'?'}</span></div>
    <div class="info-row"><span class="key">Processen</span><span class="val">${srv.processes||'?'} totaal (${srv.python_processes||'?'} python)</span></div>
    <div class="info-row"><span class="key">Gateway default</span><span class="val" style="color:${(d?.gateway?.default||'')==='active'?'var(--accent)':'var(--danger)'}">${d?.gateway?.default||'?'}</span></div>
    <div class="info-row"><span class="key">Gateway webdesigner</span><span class="val" style="color:${(d?.gateway?.webdesigner||'')==='active'?'var(--accent)':'var(--danger)'}">${d?.gateway?.webdesigner||'?'}</span></div>
    <div class="info-row"><span class="key">Data verzameld</span><span class="val" style="font-size:11px;color:var(--muted)">${new Date(d?.collected_at||Date.now()).toLocaleTimeString('nl-NL')}</span></div>
  ` : '<div class="loading">⏳ Server data wordt verzameld...<br><small>De data collector draait elke 15 minuten via cron.</small></div>';

  // Credentials
  const creds = d?.auth?.credentials || [];
  const envKeys = d?.auth?.env_keys_found || [];
  document.getElementById('credsBody').innerHTML = creds.length ? `
    <table class="creds-table">
      <tr><th>Provider</th><th>Type</th><th>Status</th></tr>
      ${creds.map(c => `<tr><td><span class="status-dot ${c.status==='ok'?'ok':'err'}"></span>${c.provider}</td><td style="color:var(--text2)">${c.type}</td><td style="text-align:right;color:${c.status==='ok'?'var(--accent)':'var(--danger)'}">${c.status==='ok'?'✓ Actief':c.last_error||'⚠ Error'}</td></tr>`).join('')}
    </table>
    <div style="margin-top:12px;font-size:12px;color:var(--text2)">Gedetecteerde API keys in .env: ${envKeys.join(', ')||'geen'}</div>
  ` : '<div class="loading">⏳ Credentials data wordt verzameld...</div>';

  // Preferences form
  const prefs = d?.preferences || { theme:'dark', language:'nl', refresh_interval:15, accent_color:'#22c55e' };
  document.getElementById('prefsForm').innerHTML = `
    <label>Thema <select id="prefTheme"><option ${prefs.theme==='dark'?'selected':''} value="dark">Donker</option><option ${prefs.theme==='light'?'selected':''} value="light">Licht</option></select></label>
    <label>Taal <select id="prefLang"><option ${prefs.language==='nl'?'selected':''} value="nl">Nederlands</option><option ${prefs.language==='en'?'selected':''} value="en">English</option></select></label>
    <label>Ververs interval <select id="prefInterval"><option ${prefs.refresh_interval===5?'selected':''} value="5">5 min</option><option ${prefs.refresh_interval===15?'selected':''} value="15">15 min</option><option ${prefs.refresh_interval===30?'selected':''} value="30">30 min</option><option ${prefs.refresh_interval===60?'selected':''} value="60">60 min</option></select></label>
    <label>Accent kleur <input type="color" id="prefAccent" value="${prefs.accent_color}"></label>
    <button class="btn" type="button" id="savePrefs">Opslaan</button>
    <span id="prefStatus" style="font-size:12px;color:var(--accent);display:none">✅ Opgeslagen</span>
  `;
  document.getElementById('savePrefs').addEventListener('click', () => {
    const p = {
      theme: document.getElementById('prefTheme').value,
      language: document.getElementById('prefLang').value,
      refresh_interval: parseInt(document.getElementById('prefInterval').value),
      accent_color: document.getElementById('prefAccent').value
    };
    localStorage.setItem('hermes_prefs', JSON.stringify(p));
    // Pas thema aan
    if (p.theme === 'light') {
      document.documentElement.style.setProperty('--bg', '#f8fafc');
      document.documentElement.style.setProperty('--text', '#1e293b');
    }
    document.getElementById('prefStatus').style.display = 'inline';
    setTimeout(() => document.getElementById('prefStatus').style.display = 'none', 2000);
  });
}

// Nav toggle
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      const panel = item.dataset.panel;
      document.getElementById('panelDashboard').classList.toggle('hidden', panel !== 'dashboard');
      document.getElementById('panelConfig').classList.toggle('hidden', panel !== 'config');
      document.getElementById('pageTitle').textContent = panel === 'dashboard' ? 'Dashboard' : 'Configuratie';
      if (panel === 'config') loadConfigPanel();
      if (panel === 'dashboard' && typeof init === 'function') init();
    });
  });
});

})();
