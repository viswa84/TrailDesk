import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log to console in dev — replace with error reporting service in production
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-slate-500 text-sm mb-6">
              We encountered an unexpected error. This has been logged and our team will investigate.
            </p>

            {/* Error details (dev only) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left">
                <p className="text-xs font-mono text-red-600 break-all">{this.state.error.toString()}</p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-400 cursor-pointer hover:text-red-600">Stack trace</summary>
                    <pre className="text-[10px] text-red-400 mt-2 overflow-x-auto whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                  </details>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-center gap-3">
              <button onClick={this.handleReload} className="btn-primary flex items-center gap-2 px-5 py-2.5">
                <RefreshCw className="w-4 h-4" /> Reload Page
              </button>
              <button onClick={this.handleGoHome} className="btn-secondary flex items-center gap-2 px-5 py-2.5">
                <Home className="w-4 h-4" /> Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
