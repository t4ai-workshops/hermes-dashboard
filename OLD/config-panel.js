export class ConfigPanel {
  constructor(container) { this.container = container; }

  showSpinner() {
    const el = document.createElement('div');
    el.className = 'spinner';
    this.container.appendChild(el);
  }
  hideSpinner() {
    const el = this.container.querySelector('.spinner');
    if (el) el.remove();
  }

  showToast(msg, type) {
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    this.container.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  _el(tag, cls, attrs) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (attrs) Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  _section(title) {
    const s = this._el('section'), h = this._el('h3');
    h.textContent = title;
    s.appendChild(h);
    this.container.appendChild(s);
    return s;
  }

  renderAPIConnection() {
    const s = this._section('API Connection');
    const u = this._el('input', '', { type: 'url', id: 'api-url', placeholder: 'API URL' });
    const k = this._el('input', '', { type: 'password', id: 'api-key', placeholder: 'API Key' });
    const b = this._el('button', 'btn-test-connection');
    b.textContent = 'Test Connection';
    b.addEventListener('click', () => this.testConnection());
    s.append(u, k, b);
    return s;
  }

  async testConnection() {
    const u = this.container.querySelector('#api-url').getAttribute('value') || '';
    const k = this.container.querySelector('#api-key').getAttribute('value') || '';
    try {
      const r = await fetch(u, { headers: { Authorization: `Bearer ${k}` } });
      this.showToast(r.ok ? 'Connection successful' : `Connection failed (${r.status})`, r.ok ? 'success' : 'error');
    } catch { this.showToast('Connection error', 'error'); }
  }

  renderCredentialsOverview(creds) {
    const s = this._section('Credentials');
    if (!creds || !creds.length) {
      const p = this._el('p');
      p.textContent = 'No credentials configured.';
      s.appendChild(p);
    } else for (const c of creds) {
      const r = this._el('div', 'credential-row');
      const n = this._el('span');
      n.textContent = c.name;
      const b = this._el('span', `status-badge ${c.status}`);
      b.textContent = c.status;
      r.append(n, b);
      s.appendChild(r);
    }
    return s;
  }

  renderServerInfo(info) {
    const s = this._section('Server Info');
    if (info) for (const [k, v] of Object.entries(info)) {
      const r = this._el('div', 'info-row');
      r.textContent = `${k}: ${v}`;
      s.appendChild(r);
    }
    return s;
  }

  renderPreferences(prefs = {}) {
    const s = this._section('Preferences');

    const slider = this._el('input', '', { type: 'range', id: 'refresh-interval', min: '5', max: '60' });
    slider.setAttribute('value', String(prefs.refreshInterval || 30));
    const sl = this._el('label');
    sl.textContent = 'Refresh Interval (s)';
    s.append(sl, slider);

    const toggle = this._el('input', '', { type: 'checkbox', id: 'theme-toggle' });
    if (prefs.theme === 'dark') toggle.setAttribute('checked', '');
    const tl = this._el('label');
    tl.textContent = 'Dark Theme';
    s.append(tl, toggle);

    const lang = this._el('select', '', { id: 'language-selector' });
    ['nl', 'en', 'fr', 'de'].forEach(l => {
      const o = this._el('option');
      o.textContent = l;
      o.setAttribute('value', l);
      if (l === (prefs.language || 'nl')) o.setAttribute('selected', '');
      lang.appendChild(o);
    });
    const ll = this._el('label');
    ll.textContent = 'Language';
    s.append(ll, lang);

    const save = this._el('button', 'btn-save-preferences');
    save.textContent = 'Save Preferences';
    save.addEventListener('click', () => this.handleSavePreferences());
    s.appendChild(save);
    return s;
  }

  async handleSavePreferences() {
    const v = (id) => this.container.querySelector(id).getAttribute('value') || '';
    const body = {
      refreshInterval: parseInt(v('#refresh-interval') || '30'),
      theme: this.container.querySelector('#theme-toggle').getAttribute('checked') !== null ? 'dark' : 'light',
      language: v('#language-selector') || 'nl',
    };
    try {
      const r = await fetch('/api/preferences', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      this.showToast(r.ok ? 'Preferences saved' : 'Save failed', r.ok ? 'success' : 'error');
    } catch { this.showToast('Save error', 'error'); }
  }

  async init() {
    this.showSpinner();
    try {
      const r = await fetch('/api/data');
      const d = await r.json();
      this.hideSpinner();
      this.renderAPIConnection();
      this.renderCredentialsOverview(d.credentials || []);
      this.renderServerInfo(d.serverinfo || {});
      this.renderPreferences(d.preferences || {});
    } catch {
      this.hideSpinner();
      this.showToast('Failed to load config data', 'error');
    }
  }
}
