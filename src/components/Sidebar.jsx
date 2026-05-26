import './Sidebar.css';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: '◉' },
  { id: 'printers', label: 'Printers', icon: '🖨' },
  { id: 'system', label: 'System', icon: '⚙' },
  { id: 'jobs', label: 'Jobs', icon: '📋' },
  { id: 'settings', label: 'Settings', icon: '⛭' },
];

export default function Sidebar({ currentView, onNavigate, collapsed = false, onToggleCollapse, mobileOpen = false }) {
  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-logo">
        <span className="logo-icon">◆</span>
        {!collapsed && <span className="logo-text">Hermes</span>}
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            title={collapsed ? item.label : undefined}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className={`nav-label ${collapsed ? 'sr-only' : ''}`}>{item.label}</span>
          </button>
        ))}
      </nav>

      {onToggleCollapse && (
        <button
          className="sidebar-collapse-btn"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      )}
    </aside>
  );
}
