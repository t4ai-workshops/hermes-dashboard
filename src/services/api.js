/**
 * API Service — Hermes Dashboard data layer.
 *
 * Connects to:
 *   - /api/metrics/*         → System metrics server (metrics_server.py, port 9192)
 *   - /api/hermes/*          → Hermes Web Dashboard API (port 9119, proxied)
 *   - /api/v1/*              → Hermes API Server (port 8642, proxied)
 *   - /api/metrics SSE       → Server-Sent Events real-time stream
 *
 * Config:
 *   MOCK_MODE = false → real backend
 *   MOCK_MODE = true  → fallback mock data for offline development
 */

import {
  generateMetrics,
  generateHistory,
  generatePrinters,
  generateStats,
  generateJobs,
} from './mock-data';

// ── Configuration ─────────────────────────────────────────────────────────

let MOCK_MODE = false;
const MOCK_DELAY_MS = 80;
const METRICS_BASE = '/api/metrics';
const HERMES_BASE = '/api/hermes';

// Polling intervals (ms) per parent task t_8d03b59b recommendations
const POLL_INTERVALS = {
  metrics: 5000,   // 5s — status/metrics
  printers: 10000, // 10s — printer status
  config: 30000,   // 30s — configuration
  analytics: 60000, // 60s — analytics/history
};

// Hermes session token — fetched from the web dashboard page
let sessionToken = null;

// ── Utilities ─────────────────────────────────────────────────────────────

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch the Hermes session token from the dashboard HTML.
 * The token is injected into the page as window.__HERMES_SESSION_TOKEN__.
 */
export async function fetchSessionToken() {
  try {
    // Try fetching from the proxied Hermes dashboard
    const res = await fetch(`${HERMES_BASE}`, { redirect: 'manual' });
    const html = await res.text();
    const match = html.match(/__HERMES_SESSION_TOKEN__\s*=\s*"([^"]+)"/);
    if (match) {
      sessionToken = match[1];
      return sessionToken;
    }
  } catch (err) {
    console.warn('[api] Could not fetch session token:', err.message);
  }
  return null;
}

/**
 * Build headers for Hermes API requests.
 */
function hermesHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (sessionToken) {
    headers['X-Hermes-Session-Token'] = sessionToken;
  }
  return headers;
}

// ── Error handling ────────────────────────────────────────────────────────

class ApiError extends Error {
  constructor(message, status, endpoint) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.endpoint = endpoint;
  }
}

/**
 * Wrapper around fetch with timeout, retry, and error normalization.
 */
async function fetchWithRetry(url, options = {}, retries = 2, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const fetchOptions = { ...options, signal: controller.signal };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, fetchOptions);
      clearTimeout(timer);

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new ApiError(
          body || `HTTP ${res.status}`,
          res.status,
          url
        );
      }

      return await res.json();
    } catch (err) {
      clearTimeout(timer);

      if (err instanceof ApiError) throw err;

      const isLastAttempt = attempt === retries;
      if (isLastAttempt) {
        throw new ApiError(
          `Failed after ${retries + 1} attempts: ${err.message}`,
          0,
          url
        );
      }

      // Exponential backoff
      await delay(Math.pow(2, attempt) * 300);
    }
  }
}

// ── Mock fallback ─────────────────────────────────────────────────────────

async function mockFetch(fn) {
  await delay(MOCK_DELAY_MS);
  return fn();
}

// ── Public API — Switch mode ──────────────────────────────────────────────

export function useMock(enabled) {
  MOCK_MODE = enabled;
}

export function isMockMode() {
  return MOCK_MODE;
}

export function getSessionToken() {
  return sessionToken;
}

// ── Metrics API ───────────────────────────────────────────────────────────

/**
 * Fetch current system metrics: CPU, memory, disk, temperature, uptime, network.
 */
export async function fetchMetrics() {
  if (MOCK_MODE) return mockFetch(generateMetrics);
  try {
    return await fetchWithRetry(`${METRICS_BASE}/`);
  } catch (err) {
    console.warn('[api] Metrics fetch failed, falling back to mock:', err.message);
    return mockFetch(generateMetrics);
  }
}

/**
 * Fetch historical metric data for charting.
 */
export async function fetchHistory(metric) {
  if (MOCK_MODE) return mockFetch(() => generateHistory(metric));
  try {
    const data = await fetchWithRetry(`${METRICS_BASE}/history/${encodeURIComponent(metric)}`);
    return data; // { labels, values }
  } catch (err) {
    console.warn(`[api] History fetch failed for ${metric}, falling back to mock:`, err.message);
    return mockFetch(() => generateHistory(metric));
  }
}

// ── Hermes Status API ────────────────────────────────────────────────────

/**
 * Fetch Hermes Agent system status (version, gateway state, platforms).
 */
export async function fetchHermesStatus() {
  if (MOCK_MODE) return { version: 'mock', gateway_state: 'running', active_sessions: 0 };
  try {
    return await fetchWithRetry(`${HERMES_BASE}/status`);
  } catch (err) {
    console.warn('[api] Hermes status fetch failed:', err.message);
    return { version: 'unknown', gateway_state: 'unknown', active_sessions: 0 };
  }
}

/**
 * Fetch active sessions.
 */
export async function fetchSessions() {
  if (MOCK_MODE) return [];
  try {
    return await fetchWithRetry(`${HERMES_BASE}/sessions`, {
      headers: hermesHeaders(),
    });
  } catch (err) {
    console.warn('[api] Sessions fetch failed:', err.message);
    return [];
  }
}

// ── Printers API ──────────────────────────────────────────────────────────

/**
 * Fetch printer status from Bambuddy MCP or Hermes integration.
 * Falls back to mock data when unavailable.
 */
export async function fetchPrinters() {
  if (MOCK_MODE) return mockFetch(generatePrinters);
  try {
    return await fetchWithRetry(`${HERMES_BASE}/printers`, {
      headers: hermesHeaders(),
    });
  } catch (err) {
    console.warn('[api] Printers fetch failed, falling back to mock:', err.message);
    return mockFetch(generatePrinters);
  }
}

// ── Stats / Jobs API ─────────────────────────────────────────────────────

export async function fetchStats() {
  if (MOCK_MODE) return mockFetch(generateStats);
  try {
    return await fetchWithRetry(`${HERMES_BASE}/jobs/stats`, {
      headers: hermesHeaders(),
    });
  } catch (err) {
    console.warn('[api] Stats fetch failed, falling back to mock:', err.message);
    return mockFetch(generateStats);
  }
}

export async function fetchJobs() {
  if (MOCK_MODE) return mockFetch(generateJobs);
  try {
    return await fetchWithRetry(`${HERMES_BASE}/jobs`, {
      headers: hermesHeaders(),
    });
  } catch (err) {
    console.warn('[api] Jobs fetch failed, falling back to mock:', err.message);
    return mockFetch(generateJobs);
  }
}

// ── SSE — Real-time metrics stream ────────────────────────────────────────

/**
 * Subscribe to Server-Sent Events for real-time metrics updates.
 * Returns an EventSource and a cleanup function.
 *
 * Usage:
 *   const { eventSource, close } = subscribeMetrics((data) => {
 *     setMetrics(data);
 *   });
 *   // Later: close();
 */
export function subscribeMetrics(onData, onError) {
  // SSE stream from the metrics server
  const url = `${METRICS_BASE}/`;

  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onData(data);
    } catch (err) {
      console.warn('[sse] Failed to parse metrics event:', err);
    }
  };

  eventSource.onerror = (err) => {
    console.warn('[sse] Metrics stream error:', err);
    if (onError) onError(err);
    // EventSource auto-reconnects, so we don't close here
  };

  const close = () => {
    eventSource.close();
  };

  return { eventSource, close };
}

// ── Polling helpers ───────────────────────────────────────────────────────

/**
 * Create a polling interval that automatically fetches data.
 * Returns a cleanup function.
 */
export function createPolling(fetchFn, intervalMs, onData, onError) {
  let active = true;

  const poll = async () => {
    if (!active) return;
    try {
      const data = await fetchFn();
      if (active) onData(data);
    } catch (err) {
      if (onError && active) onError(err);
    }
    if (active) {
      setTimeout(poll, intervalMs);
    }
  };

  // Initial fetch
  poll();

  return () => {
    active = false;
  };
}

// ── Export ─────────────────────────────────────────────────────────────────

export const api = {
  useMock,
  isMockMode,
  getSessionToken,
  fetchSessionToken,
  fetchMetrics,
  fetchHistory,
  fetchHermesStatus,
  fetchSessions,
  fetchPrinters,
  fetchStats,
  fetchJobs,
  subscribeMetrics,
  createPolling,
  POLL_INTERVALS,
};

export default api;
