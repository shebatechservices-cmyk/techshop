import React from 'react';

function isChunkLoadError(error) {
  const msg = String(error?.message || error || '');
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Expected a JavaScript-or-Wasm module script') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('Loading chunk')
  );
}

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    if (isChunkLoadError(error)) {
      const lastReload = Number(window.sessionStorage.getItem('last_chunk_reload') || '0');
      const now = Date.now();
      if (now - lastReload > 10000) {
        window.sessionStorage.setItem('last_chunk_reload', String(now));
        window.location.reload();
      }
    }
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    if (isChunkLoadError(error)) {
      const lastReload = Number(window.sessionStorage.getItem('last_chunk_reload') || '0');
      const now = Date.now();
      if (now - lastReload > 10000) {
        window.sessionStorage.setItem('last_chunk_reload', String(now));
        window.location.reload();
      }
    }
  }

  handleReload = () => {
    try {
      sessionStorage.removeItem('last_chunk_reload');
    } catch {}
    window.location.reload();
  };

  handleReset = () => {
    try {
      sessionStorage.removeItem('last_chunk_reload');
    } catch {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.hash = '';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800 p-6">
          <div className="max-w-lg w-full bg-white border border-gray-200 rounded-2xl p-8 shadow-xl text-center">
            <div className="text-4xl mb-4">🛡️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              An Unexpected Error Occurred
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              Other parts of the system remain safe and intact. You can reload the page or reset the view below.
            </p>

            {this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 mb-6 text-left text-xs text-red-700 font-mono overflow-x-auto max-h-32">
                <strong>Error:</strong> {this.state.error?.message || String(this.state.error)}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                🔄 Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
              >
                🏠 Try Recovering
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
