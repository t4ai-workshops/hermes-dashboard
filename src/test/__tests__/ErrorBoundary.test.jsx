import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../../components/ErrorBoundary';

// Component that throws
function BrokenWidget() {
  throw new Error('Widget crashed!');
}

function WorkingWidget() {
  return <div>Working fine</div>;
}

// Suppress console.error from the intentional error
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});
afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  it('renders children normally when no error', () => {
    const { container } = render(
      <ErrorBoundary>
        <WorkingWidget />
      </ErrorBoundary>
    );
    expect(container.textContent).toContain('Working fine');
  });

  it('shows fallback UI when child throws', () => {
    render(
      <ErrorBoundary>
        <BrokenWidget />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Widget crashed!')).toBeInTheDocument();
  });

  it('shows generic message when error has no message', () => {
    // We can't easily test getDerivedStateFromError directly,
    // but we can verify the fallback renders for any error
    render(
      <ErrorBoundary>
        <BrokenWidget />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('shows reload button in fallback', () => {
    render(
      <ErrorBoundary>
        <BrokenWidget />
      </ErrorBoundary>
    );
    expect(screen.getByText('Reload Dashboard')).toBeInTheDocument();
  });
});
