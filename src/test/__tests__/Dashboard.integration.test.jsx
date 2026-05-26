import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import Dashboard from '../../components/Dashboard';
import { useMock } from '../../services/api';

useMock(true);

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

describe('Dashboard Integration', () => {
  it('loads and transitions between all views', async () => {
    await act(async () => {
      render(<Dashboard />);
      await new Promise(r => setTimeout(r, 250));
    });

    // Should show header
    expect(screen.getByText('Dashboard')).toBeInTheDocument();

    const views = ['Printers', 'System', 'Jobs', 'Settings', 'Overview'];
    for (const view of views) {
      await act(async () => {
        fireEvent.click(screen.getByText(view));
        await new Promise(r => setTimeout(r, 50));
      });
      // Just verify it doesn't crash — the view switched
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    }
  });

  it('renders without crashing', async () => {
    await act(async () => {
      render(<Dashboard />);
      await new Promise(r => setTimeout(r, 250));
    });
    expect(document.querySelector('.dashboard')).toBeInTheDocument();
  });

  it('shows sidebar with all navigation items', async () => {
    await act(async () => {
      render(<Dashboard />);
      await new Promise(r => setTimeout(r, 250));
    });
    const navItems = screen.getAllByRole('button');
    const labels = navItems.map(b => b.textContent).filter(t => t !== '◀');
    expect(labels.some(l => l.includes('Overview'))).toBe(true);
    expect(labels.some(l => l.includes('Printers'))).toBe(true);
    expect(labels.some(l => l.includes('System'))).toBe(true);
    expect(labels.some(l => l.includes('Jobs'))).toBe(true);
    expect(labels.some(l => l.includes('Settings'))).toBe(true);
  });
});
