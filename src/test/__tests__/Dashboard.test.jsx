import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import Dashboard from '../../components/Dashboard';
import { useMock } from '../../services/api';

useMock(true);

// Mock GridStack dynamic import
vi.mock('gridstack', () => ({
  GridStack: {
    init: vi.fn(() => ({
      removeAll: vi.fn(),
      addWidget: vi.fn(),
      batchUpdate: vi.fn(),
      commit: vi.fn(),
      destroy: vi.fn(),
      on: vi.fn(),
      load: vi.fn(),
      save: vi.fn(() => []),
    })),
  },
}));

describe('Dashboard', () => {
  it('renders the sidebar with navigation', async () => {
    await act(async () => {
      render(<Dashboard />);
      await new Promise(r => setTimeout(r, 200));
    });
    const overviewButtons = screen.getAllByText('Overview');
    expect(overviewButtons.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Printers')).toBeInTheDocument();
  });

  it('renders the header', async () => {
    await act(async () => {
      render(<Dashboard />);
      await new Promise(r => setTimeout(r, 200));
    });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders the main content area', async () => {
    let container;
    await act(async () => {
      const result = render(<Dashboard />);
      container = result.container;
      await new Promise(r => setTimeout(r, 200));
    });
    expect(container.querySelector('.dashboard-main')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    const { container } = render(<Dashboard />);
    expect(container.querySelector('.dashboard-loading')).toBeInTheDocument();
  });

  it('switches views when sidebar nav is clicked', async () => {
    await act(async () => {
      render(<Dashboard />);
      await new Promise(r => setTimeout(r, 200));
    });
    const systemBtn = screen.getByText('System');
    await act(async () => {
      systemBtn.click();
      await new Promise(r => setTimeout(r, 50));
    });
    // Sidebar should still show all items, just System now active
    expect(systemBtn.closest('.nav-item')).toHaveClass('active');
  });
});
