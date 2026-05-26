import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../../components/Sidebar';

describe('Sidebar mobileOpen prop', () => {
  it('has sidebar-open class when mobileOpen is true', () => {
    const { container } = render(
      <Sidebar
        currentView="overview"
        onNavigate={() => {}}
        mobileOpen={true}
      />
    );
    const sidebar = container.querySelector('.sidebar');
    expect(sidebar).toHaveClass('sidebar-open');
  });

  it('does not have sidebar-open class when mobileOpen is false', () => {
    const { container } = render(
      <Sidebar
        currentView="overview"
        onNavigate={() => {}}
        mobileOpen={false}
      />
    );
    const sidebar = container.querySelector('.sidebar');
    expect(sidebar).not.toHaveClass('sidebar-open');
  });

  it('does not have sidebar-open by default', () => {
    const { container } = render(
      <Sidebar currentView="overview" onNavigate={() => {}} />
    );
    const sidebar = container.querySelector('.sidebar');
    expect(sidebar).not.toHaveClass('sidebar-open');
  });

  it('calls onNavigate when clicking a nav item', () => {
    let navigated = null;
    render(
      <Sidebar
        currentView="overview"
        onNavigate={(view) => { navigated = view; }}
        mobileOpen={true}
      />
    );
    fireEvent.click(screen.getByText('System'));
    expect(navigated).toBe('system');
  });
});
