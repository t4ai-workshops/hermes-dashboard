import { Component } from 'react';

/**
 * Error Boundary — catches React rendering errors and shows a fallback UI.
 * Prevents the entire dashboard from going blank when a single widget fails.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Dashboard error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <span className="error-icon">⚠</span>
            <h2>Something went wrong</h2>
            <p>{this.state.error?.message || 'An unexpected error occurred.'}</p>
            <button
              className="error-retry-btn"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
