import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../../components/Sidebar';

describe('Sidebar', () => {
  it('renders navigation items', () => {
    render(<Sidebar currentView="overview" onNavigate={() => {}} />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Printers')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('highlights the current view', () => {
    const { container } = render(<Sidebar currentView="printers" onNavigate={() => {}} />);
    const active = container.querySelector('.nav-item.active');
    expect(active).toHaveTextContent('Printers');
  });

  it('calls onNavigate when a nav item is clicked', () => {
    const onNavigate = vi.fn();
    render(<Sidebar currentView="overview" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText('System'));
    expect(onNavigate).toHaveBeenCalledWith('system');
  });

  it('can be collapsed to icon-only mode', () => {
    const { container } = render(
      <Sidebar currentView="overview" onNavigate={() => {}} collapsed={true} />
    );
    expect(container.querySelector('.sidebar-collapsed')).toBeInTheDocument();
    // Labels should exist but be visually hidden
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  it('renders a logo/title area', () => {
    const { container } = render(<Sidebar currentView="overview" onNavigate={() => {}} />);
    expect(container.querySelector('.sidebar-logo')).toBeInTheDocument();
  });

  it('shows a collapse toggle button', () => {
    render(
      <Sidebar currentView="overview" onNavigate={() => {}} onToggleCollapse={() => {}} />
    );
    expect(screen.getByRole('button', { name: /collapse/i })).toBeInTheDocument();
  });
});
