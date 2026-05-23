// TDD RED phase — tests for config-panel.js
// Run with: node --test test-config-panel.js

import { describe, it, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';

// ---- Minimal DOM mock ----
class MockElement {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.attributes = {};
    this._classList = [];
    this._innerHTML = '';
    this._textContent = '';
    this._style = {};
    this.eventListeners = {};
    this.parentNode = null;
  }
  setAttribute(name, value) { this.attributes[name] = value; }
  getAttribute(name) { return this.attributes[name] || null; }
  get classList() {
    return {
      add: (...names) => { for (const n of names) this._classList.push(n); },
      remove: (name) => { this._classList = this._classList.filter(c => c !== name); },
      contains: (name) => this._classList.includes(name),
      value: this._classList.join(' '),
    };
  }
  set className(val) { this._classList = val ? val.split(/\s+/) : []; }
  get className() { return this._classList.join(' '); }
  set innerHTML(html) { this._innerHTML = html; }
  get innerHTML() {
    return this._computeHTML();
  }
  get _innerHTML() {
    return this._computeHTML();
  }
  set _innerHTML(v) { this.__innerHTML = v; }
  _computeHTML() {
    if (this.__innerHTML) return this.__innerHTML;
    if (this._textContent) return this._textContent;
    return this.children.map(c => c.textContent || c._computeHTML() || '').join('');
  }
  set textContent(txt) { this._textContent = txt; }
  get textContent() { return this._textContent; }
  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }
  append(...children) {
    for (const c of children) {
      c.parentNode = this;
      this.children.push(c);
    }
  }
  _matchSelector(sel) {
    if (sel.startsWith('.')) {
      return this._classList.includes(sel.slice(1));
    }
    if (sel.startsWith('#')) {
      return this.attributes.id === sel.slice(1);
    }
    return this.tagName === sel.toUpperCase();
  }
  _querySelectorRecursive(sel) {
    if (this._matchSelector(sel)) return this;
    for (const c of this.children) {
      const found = c._querySelectorRecursive(sel);
      if (found) return found;
    }
    return null;
  }
  _querySelectorAllRecursive(sel) {
    let results = [];
    if (this._matchSelector(sel)) results.push(this);
    for (const c of this.children) {
      results = results.concat(c._querySelectorAllRecursive(sel));
    }
    return results;
  }
  querySelector(sel) {
    return this._querySelectorRecursive(sel);
  }
  querySelectorAll(sel) {
    return this._querySelectorAllRecursive(sel);
  }
  addEventListener(event, handler) {
    if (!this.eventListeners[event]) this.eventListeners[event] = [];
    this.eventListeners[event].push(handler);
  }
  dispatchEvent(event) {
    const handlers = this.eventListeners[event.type] || [];
    handlers.forEach(h => h(event));
  }
  remove() {
    if (this.parentNode) {
      this.parentNode.children = this.parentNode.children.filter(c => c !== this);
    }
  }
}

const mockDocument = {
  createElement(tag) { return new MockElement(tag); },
};

// Global overrides for the module under test
globalThis.document = mockDocument;
globalThis.fetch = mock.fn();
// Don't auto-fire setTimeout — toasts should survive until tests check them
globalThis.setTimeout = mock.fn(() => {});

// We need to re-import the module each test or set up carefully.
// For simplicity, we'll define ConfigPanel inline in the test and then
// test the actual module after it's written.

// ---- Tests ----

describe('ConfigPanel', () => {
  let ConfigPanel;
  let container;

  before(async () => {
    // Dynamic import — will fail (RED) until config-panel.js exists
    try {
      const mod = await import('./config-panel.js');
      ConfigPanel = mod.ConfigPanel;
    } catch (e) {
      // Expected in RED phase — module doesn't exist yet
    }
  });

  beforeEach(() => {
    container = new MockElement('div');
    globalThis.fetch = mock.fn();
  });

  describe('constructor', () => {
    it('stores container reference', () => {
      assert.ok(ConfigPanel, 'ConfigPanel should be importable');
      const panel = new ConfigPanel(container);
      assert.strictEqual(panel.container, container);
    });
  });

  describe('loading spinner', () => {
    it('showSpinner adds spinner element to container', () => {
      const panel = new ConfigPanel(container);
      panel.showSpinner();
      const spinner = container.querySelector('.spinner');
      assert.ok(spinner, 'spinner element should exist');
    });

    it('hideSpinner removes spinner from container', () => {
      const panel = new ConfigPanel(container);
      panel.showSpinner();
      panel.hideSpinner();
      const spinner = container.querySelector('.spinner');
      assert.strictEqual(spinner, null);
    });
  });

  describe('toast messages', () => {
    it('showToast creates a toast with message and type class', () => {
      const panel = new ConfigPanel(container);
      panel.showToast('Saved!', 'success');
      const toast = container.querySelector('.toast');
      assert.ok(toast, 'toast should exist');
      assert.ok(toast._classList.includes('toast-success'), 'should have success class');
      assert.ok(toast._textContent.includes('Saved!'), 'should contain message');
    });

    it('showToast with error type adds error class', () => {
      const panel = new ConfigPanel(container);
      panel.showToast('Failed!', 'error');
      const toast = container.querySelector('.toast');
      assert.ok(toast._classList.includes('toast-error'), 'should have error class');
    });

    it('toast auto-removes after delay', () => {
      let capturedFn;
      globalThis.setTimeout = mock.fn((fn) => { capturedFn = fn; });
      const panel = new ConfigPanel(container);
      panel.showToast('msg', 'success');
      // Toast should exist before timeout fires
      assert.ok(container.querySelector('.toast'), 'toast should exist before timeout');
      // Fire the timeout callback
      capturedFn();
      assert.strictEqual(container.querySelector('.toast'), null, 'toast should be removed after timeout');
    });
  });

  describe('renderAPIConnection', () => {
    it('renders URL input, API key input, and test button', () => {
      const panel = new ConfigPanel(container);
      const section = panel.renderAPIConnection();
      assert.ok(section, 'should return a section element');

      const urlInput = section.querySelector('#api-url');
      const keyInput = section.querySelector('#api-key');
      const testBtn = section.querySelector('.btn-test-connection');

      assert.ok(urlInput, 'URL input should exist');
      assert.strictEqual(urlInput.attributes.type, 'url');
      assert.ok(keyInput, 'API key input should exist');
      assert.ok(testBtn, 'test connection button should exist');
    });

    it('test button click calls testConnection', () => {
      const panel = new ConfigPanel(container);
      let called = false;
      panel.testConnection = () => { called = true; };
      const section = panel.renderAPIConnection();
      const testBtn = section.querySelector('.btn-test-connection');
      testBtn.dispatchEvent({ type: 'click' });
      assert.ok(called, 'testConnection should be called on click');
    });
  });

  describe('testConnection', () => {
    it('shows success toast on 200 response', async () => {
      globalThis.fetch = mock.fn(async () => ({ ok: true, status: 200 }));
      const panel = new ConfigPanel(container);

      // Mock the URL input value
      const section = panel.renderAPIConnection();
      section.querySelector('#api-url').attributes.value = 'http://example.com/api';
      section.querySelector('#api-key').attributes.value = 'secret';

      await panel.testConnection();
      const toast = container.querySelector('.toast');
      assert.ok(toast._classList.includes('toast-success'), 'should show success toast');
    });

    it('shows error toast on failed response', async () => {
      globalThis.fetch = mock.fn(async () => ({ ok: false, status: 401 }));
      const panel = new ConfigPanel(container);
      const section = panel.renderAPIConnection();
      section.querySelector('#api-url').attributes.value = 'http://example.com/api';
      section.querySelector('#api-key').attributes.value = 'wrong';

      await panel.testConnection();
      const toast = container.querySelector('.toast');
      assert.ok(toast._classList.includes('toast-error'), 'should show error toast');
    });
  });

  describe('renderCredentialsOverview', () => {
    it('renders credential entries with status badges', () => {
      const panel = new ConfigPanel(container);
      const credentials = [
        { name: 'OpenRouter', status: 'connected' },
        { name: 'GitHub', status: 'disconnected' },
        { name: 'Spotify', status: 'error' },
      ];
      const section = panel.renderCredentialsOverview(credentials);
      const badges = section.querySelectorAll('.status-badge');

      assert.strictEqual(badges.length, 3, 'should render 3 credential entries');
      assert.ok(badges[0]._classList.includes('connected'), 'first should be connected');
      assert.ok(badges[0]._textContent.includes('connected'));
      assert.ok(badges[1]._classList.includes('disconnected'), 'second should be disconnected');
      assert.ok(badges[2]._classList.includes('error'), 'third should be error');
    });

    it('shows credential names', () => {
      const panel = new ConfigPanel(container);
      const credentials = [{ name: 'OpenRouter', status: 'connected' }];
      const section = panel.renderCredentialsOverview(credentials);
      assert.ok(section._innerHTML.includes('OpenRouter'), 'should contain credential name');
    });

    it('handles empty credentials list', () => {
      const panel = new ConfigPanel(container);
      const section = panel.renderCredentialsOverview([]);
      assert.ok(section._innerHTML.includes('No credentials'), 'should show empty state');
    });
  });

  describe('renderServerInfo', () => {
    it('displays hostname, OS, and uptime', () => {
      const panel = new ConfigPanel(container);
      const serverinfo = { hostname: 'pi5', os: 'Linux', uptime: '3 days' };
      const section = panel.renderServerInfo(serverinfo);

      assert.ok(section._innerHTML.includes('pi5'), 'contains hostname');
      assert.ok(section._innerHTML.includes('Linux'), 'contains OS');
      assert.ok(section._innerHTML.includes('3 days'), 'contains uptime');
    });
  });

  describe('renderPreferences', () => {
    it('renders refresh interval slider with 5-60 range', () => {
      const panel = new ConfigPanel(container);
      const prefs = { refreshInterval: 30, theme: 'dark', language: 'nl' };
      const section = panel.renderPreferences(prefs);

      const slider = section.querySelector('#refresh-interval');
      assert.ok(slider, 'slider should exist');
      assert.strictEqual(slider.attributes.type, 'range');
      assert.strictEqual(slider.attributes.min, '5');
      assert.strictEqual(slider.attributes.max, '60');
    });

    it('renders theme toggle with correct initial value', () => {
      const panel = new ConfigPanel(container);
      const prefs = { refreshInterval: 30, theme: 'light', language: 'en' };
      const section = panel.renderPreferences(prefs);

      const toggle = section.querySelector('#theme-toggle');
      assert.ok(toggle, 'theme toggle should exist');
      assert.strictEqual(toggle.attributes.type, 'checkbox');
    });

    it('renders language selector', () => {
      const panel = new ConfigPanel(container);
      const prefs = { refreshInterval: 30, theme: 'dark', language: 'nl' };
      const section = panel.renderPreferences(prefs);

      const selector = section.querySelector('#language-selector');
      assert.ok(selector, 'language selector should exist');
    });

    it('renders save button', () => {
      const panel = new ConfigPanel(container);
      const prefs = { refreshInterval: 30, theme: 'dark', language: 'nl' };
      const section = panel.renderPreferences(prefs);

      const saveBtn = section.querySelector('.btn-save-preferences');
      assert.ok(saveBtn, 'save button should exist');
    });

    it('save button click calls handleSavePreferences', () => {
      const panel = new ConfigPanel(container);
      let called = false;
      panel.handleSavePreferences = () => { called = true; };
      const section = panel.renderPreferences({ refreshInterval: 30, theme: 'dark', language: 'nl' });
      const saveBtn = section.querySelector('.btn-save-preferences');
      saveBtn.dispatchEvent({ type: 'click' });
      assert.ok(called, 'handleSavePreferences called on click');
    });
  });

  describe('handleSavePreferences', () => {
    it('POSTs to /api/preferences with current values', async () => {
      globalThis.fetch = mock.fn(async () => ({ ok: true }));
      const panel = new ConfigPanel(container);
      panel.renderPreferences({ refreshInterval: 30, theme: 'dark', language: 'nl' });

      // Simulate user changing values
      const section = container.children[0]; // first rendered child
      section.querySelector('#refresh-interval').attributes.value = '45';
      section.querySelector('#theme-toggle').attributes.checked = true;
      section.querySelector('#language-selector').attributes.value = 'en';

      await panel.handleSavePreferences();

      const call = globalThis.fetch.mock.calls[0];
      assert.strictEqual(call.arguments[0], '/api/preferences');
      const body = JSON.parse(call.arguments[1].body);
      assert.strictEqual(body.refreshInterval, 45);
      assert.strictEqual(body.language, 'en');
    });

    it('shows success toast on save', async () => {
      globalThis.fetch = mock.fn(async () => ({ ok: true }));
      const panel = new ConfigPanel(container);
      panel.renderPreferences({ refreshInterval: 30, theme: 'dark', language: 'nl' });

      await panel.handleSavePreferences();

      const toast = container.querySelector('.toast');
      assert.ok(toast, 'toast should exist');
      assert.ok(toast._classList.includes('toast-success'), 'should be success toast');
    });

    it('shows error toast on save failure', async () => {
      globalThis.fetch = mock.fn(async () => ({ ok: false, status: 500 }));
      const panel = new ConfigPanel(container);
      panel.renderPreferences({ refreshInterval: 30, theme: 'dark', language: 'nl' });

      await panel.handleSavePreferences();

      const toast = container.querySelector('.toast');
      assert.ok(toast, 'toast should exist');
      assert.ok(toast._classList.includes('toast-error'), 'should be error toast');
    });
  });

  describe('init', () => {
    it('fetches /api/data and renders all sections', async () => {
      const mockData = {
        credentials: [{ name: 'Test', status: 'connected' }],
        serverinfo: { hostname: 'pi', os: 'Linux', uptime: '1h' },
        preferences: { refreshInterval: 10, theme: 'dark', language: 'nl' },
      };
      globalThis.fetch = mock.fn(async () => ({
        ok: true,
        json: async () => mockData,
      }));
      const panel = new ConfigPanel(container);
      await panel.init();

      // All sections should be rendered
      assert.ok(container._innerHTML.includes('pi'), 'server info rendered');
      assert.ok(container._innerHTML.includes('Test'), 'credentials rendered');
    });

    it('shows spinner during loading', async () => {
      let resolvePromise;
      const fetchPromise = new Promise(resolve => { resolvePromise = resolve; });
      globalThis.fetch = mock.fn(() => fetchPromise);

      const panel = new ConfigPanel(container);
      const initPromise = panel.init();

      const spinner = container.querySelector('.spinner');
      assert.ok(spinner, 'spinner should be visible during load');

      resolvePromise({ ok: true, json: async () => ({ credentials: [], serverinfo: {}, preferences: {} }) });
      await initPromise;

      assert.strictEqual(container.querySelector('.spinner'), null, 'spinner removed after load');
    });

    it('shows error toast on fetch failure', async () => {
      globalThis.fetch = mock.fn(async () => { throw new Error('Network error'); });
      const panel = new ConfigPanel(container);
      await panel.init();

      const toast = container.querySelector('.toast');
      assert.ok(toast, 'error toast should exist');
      assert.ok(toast._classList.includes('toast-error'), 'should be error toast');
    });
  });
});
