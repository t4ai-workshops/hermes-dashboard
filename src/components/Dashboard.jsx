import { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import Sidebar from './Sidebar';
import StatWidget from './widgets/StatWidget';
import GaugeWidget from './widgets/GaugeWidget';
import ChartWidget from './widgets/ChartWidget';
import ProgressWidget from './widgets/ProgressWidget';
import PrinterWidget from './widgets/PrinterWidget';
import ErrorBoundary from './ErrorBoundary';
import {
  fetchMetrics,
  fetchHistory,
  fetchPrinters,
  fetchStats,
  subscribeMetrics,
  useMock,
  isMockMode,
} from '../services/api';
import widgetConfigs from '../services/widget-configs';
import './Dashboard.css';

const POLL_INTERVAL = 5000;

/**
 * Format metric value based on formatter type.
 */
function formatMetric(metrics, metric, formatter) {
  if (!metrics) return 0;
  const raw = metrics[metric];

  switch (formatter) {
    case 'uptime':
      return typeof raw === 'number' ? Math.round(raw) : 0;
    case 'network-rx':
      return raw?.rx != null ? formatBytes(raw.rx) : '—';
    case 'network-tx':
      return raw?.tx != null ? formatBytes(raw.tx) : '—';
    case 'activeJobs':
      return raw?.activeJobs ?? 0;
    case 'completedJobs':
      return raw?.completedJobs ?? 0;
    case 'printTime':
      return raw?.totalPrintTime != null ? `${raw.totalPrintTime}h` : '—';
    case 'filament':
      return raw?.filamentUsed != null ? `${raw.filamentUsed}kg` : '—';
    default:
      return raw != null ? raw : 0;
  }
}

function formatBytes(bytesPerSec) {
  if (bytesPerSec >= 1048576) return `${(bytesPerSec / 1048576).toFixed(1)} MB/s`;
  if (bytesPerSec >= 1024) return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
  return `${bytesPerSec} B/s`;
}

/**
 * Get the numeric display value for a widget.
 */
function getWidgetValue(metrics, cfg) {
  if (!metrics) return 0;
  const raw = metrics[cfg.metric];

  if (cfg.formatter) {
    switch (cfg.formatter) {
      case 'network-rx': return raw?.rx ?? 0;
      case 'network-tx': return raw?.tx ?? 0;
      case 'activeJobs': return raw?.activeJobs ?? 0;
      case 'completedJobs': return raw?.completedJobs ?? 0;
      case 'uptime': return typeof raw === 'number' ? Math.round(raw) : 0;
      default: return raw ?? 0;
    }
  }
  return typeof raw === 'number' ? raw : 0;
}

// ── Widget Content ──────────────────────────────────────────────────────

function WidgetContent({ cfg, metrics, history, printers, stats }) {
  switch (cfg.type) {
    case 'gauge': {
      const val = getWidgetValue(metrics, cfg);
      return (
        <GaugeWidget
          value={val}
          min={0}
          max={100}
          label={cfg.title}
          warning={cfg.warning}
          critical={cfg.critical}
        />
      );
    }
    case 'chart': {
      const h = history[cfg.metric];
      return <ChartWidget title={cfg.title} data={h || undefined} loading={!h && !metrics} />;
    }
    case 'stat': {
      const formatted = formatMetric(metrics, cfg.metric, cfg.formatter);
      const numericVal = getWidgetValue(metrics, cfg);
      const isNumeric = typeof formatted === 'number';
      return (
        <StatWidget
          value={isNumeric ? formatted : undefined}
          displayValue={!isNumeric ? String(formatted) : undefined}
          label={cfg.title}
          suffix={isNumeric && cfg.suffix ? cfg.suffix : ''}
          warning={isNumeric ? cfg.warning : undefined}
          critical={isNumeric ? cfg.critical : undefined}
        />
      );
    }
    case 'progress': {
      const val = getWidgetValue(metrics, cfg);
      return (
        <ProgressWidget
          value={val}
          max={100}
          label={cfg.title}
          warning={cfg.warning}
          critical={cfg.critical}
        />
      );
    }
    case 'printer': {
      return <PrinterWidget printer={printers[cfg.printerIndex] || null} />;
    }
    default:
      return <div className="widget-unknown">Unknown: {cfg.type}</div>;
  }
}

// ── Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [currentView, setCurrentView] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'online' | 'offline' | 'connecting'
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState({});
  const [printers, setPrinters] = useState([]);
  const [stats, setStats] = useState(null);
  const gridRef = useRef(null);
  const gridInstance = useRef(null);
  const widgetRoots = useRef({});
  const sseClose = useRef(null);

  // ── Data loading (initial + fallback) ─────────────────────────────────

  const loadInitialData = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      const [m, p, s] = await Promise.all([
        fetchMetrics(),
        fetchPrinters(),
        fetchStats(),
      ]);
      setMetrics(m);
      setPrinters(p);
      setStats(s);
      setConnectionStatus('online');
      setError(null);
    } catch (err) {
      console.error('[dashboard] Initial data fetch failed:', err);
      setError('Failed to load dashboard data. Check if metrics server is running.');
      setConnectionStatus('offline');
      // Still allow UI to render — widgets will show fallback state
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(
    async (metric) => {
      if (history[metric]) return;
      try {
        const h = await fetchHistory(metric);
        setHistory((prev) => ({ ...prev, [metric]: h }));
      } catch (err) {
        console.error(`[dashboard] History fetch failed for ${metric}:`, err);
        // Set empty history to avoid repeated retries
        setHistory((prev) => ({ ...prev, [metric]: { labels: [], values: [] } }));
      }
    },
    [history]
  );

  // ── Real-time updates (SSE or polling) ─────────────────────────────────

  useEffect(() => {
    // Only use SSE when not in mock mode and EventSource is available
    const canUseSSE = !isMockMode() && typeof EventSource !== 'undefined';

    if (canUseSSE) {
      const { close } = subscribeMetrics(
        (data) => {
          setMetrics(data);
          setConnectionStatus('online');
          setError(null);
        },
        (err) => {
          console.warn('[dashboard] SSE error, falling back to polling:', err);
          setConnectionStatus('offline');
        }
      );
      sseClose.current = close;
      return () => {
        if (sseClose.current) sseClose.current();
      };
    }

    // Fallback: polling
    let active = true;
    const poll = async () => {
      if (!active) return;
      try {
        const m = await fetchMetrics();
        if (active) {
          setMetrics(m);
          setConnectionStatus('online');
          setError(null);
        }
      } catch (err) {
        // Silently handle — mock mode already returns data
      }
      if (active) {
        setTimeout(poll, POLL_INTERVAL);
      }
    };

    // Initial poll after initial load settles
    const timer = setTimeout(poll, POLL_INTERVAL);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  // ── Initial load ──────────────────────────────────────────────────────

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // ── History loading on view change ────────────────────────────────────

  useEffect(() => {
    const currentWidgets = widgetConfigs[currentView] || [];
    currentWidgets.forEach((w) => {
      if (w.type === 'chart' && w.metric) loadHistory(w.metric);
    });
  }, [currentView, loadHistory]);

  // ── Initialize GridStack once ─────────────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined' || !gridRef.current) return;
    let cancelled = false;

    import('gridstack').then(({ GridStack }) => {
      if (cancelled || !gridRef.current) return;
      const grid = GridStack.init(
        {
          column: 10,
          cellHeight: 80,
          margin: 8,
          float: true,
          animate: false,
          disableResize: false,
          disableDrag: false,
        },
        gridRef.current
      );
      gridInstance.current = grid;
    });

    return () => {
      cancelled = true;
      if (gridInstance.current) {
        gridInstance.current.destroy(false);
        gridInstance.current = null;
      }
      Object.values(widgetRoots.current).forEach((r) => r.unmount());
      widgetRoots.current = {};
    };
  }, []);

  // ── Rebuild grid when view/data changes ───────────────────────────────

  useEffect(() => {
    const grid = gridInstance.current;
    if (!grid) return;

    // Unmount existing widget roots
    Object.values(widgetRoots.current).forEach((r) => r.unmount());
    widgetRoots.current = {};

    // Remove all existing widgets
    grid.removeAll();

    const currentWidgets = widgetConfigs[currentView] || [];

    // Build grid items
    const items = currentWidgets.map((cfg) => {
      const el = document.createElement('div');
      el.className = 'grid-stack-item';
      const content = document.createElement('div');
      content.className = 'grid-stack-item-content';
      content.setAttribute('data-widget-id', cfg.id);
      el.appendChild(content);

      // Render React widget into content div
      const root = createRoot(content);
      root.render(
        <WidgetContent
          cfg={cfg}
          metrics={metrics}
          history={history}
          printers={printers}
          stats={stats}
        />
      );
      widgetRoots.current[cfg.id] = root;

      return { el, x: cfg.x, y: cfg.y, w: cfg.w, h: cfg.h };
    });

    if (items.length > 0) {
      grid.batchUpdate();
      items.forEach(({ el, x, y, w, h }) => {
        grid.addWidget(el, { x, y, w, h });
      });
      grid.commit();
    }
  }, [currentView, metrics, history, printers, stats]);

  // ── Render ────────────────────────────────────────────────────────────

  const currentWidgets = widgetConfigs[currentView] || [];

  return (
    <ErrorBoundary>
      <div className="dashboard">
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        />
        <main className="dashboard-main">
          <header className="dashboard-header">
            <div className="dashboard-header-left">
              <h1 className="dashboard-title">Dashboard</h1>
              <span className="dashboard-subtitle">
                {currentView.charAt(0).toUpperCase() + currentView.slice(1)}
              </span>
            </div>
            <div className={`connection-status status-${connectionStatus}`}>
              <span className="connection-dot" />
              <span className="connection-label">
                {connectionStatus === 'online'
                  ? 'Live'
                  : connectionStatus === 'connecting'
                    ? 'Connecting...'
                    : 'Offline'}
              </span>
            </div>
          </header>

          {error && (
            <div className="dashboard-error">
              <span className="error-icon">⚠</span>
              <span>{error}</span>
              <button
                className="error-retry-btn"
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  loadInitialData();
                }}
              >
                Retry
              </button>
            </div>
          )}

          {loading && currentWidgets.length > 0 ? (
            <div className="dashboard-loading">
              <div className="loading-spinner" />
              <span>Loading dashboard...</span>
            </div>
          ) : (
            <div className="dashboard-grid" ref={gridRef} />
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}
