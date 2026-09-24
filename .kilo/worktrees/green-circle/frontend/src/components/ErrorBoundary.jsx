import React from 'react';

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
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.hash = '';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0f1d',
          color: '#f8fafc',
          padding: '24px',
          fontFamily: "'Inter', sans-serif"
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            background: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛡️</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f1f5f9', margin: '0 0 8px 0' }}>
              একটি অপ্রত্যাশিত ত্রুটি ঘটেছে (Unexpected Error)
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 24px 0' }}>
              সিস্টেমের অন্য অংশগুলো নিরাপদে রয়েছে। আপনি নিচের বাটন চেপে পুনরায় লোড করতে পারেন অথবা রিকভার করতে পারেন।
            </p>

            {this.state.error && (
              <div style={{
                background: '#090d16',
                border: '1px solid #374151',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '24px',
                textAlign: 'left',
                fontSize: '0.8rem',
                color: '#f87171',
                fontFamily: 'monospace',
                overflowX: 'auto',
                maxHeight: '120px'
              }}>
                <strong>Error:</strong> {this.state.error?.message || String(this.state.error)}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                }}
              >
                🔄 Reload Page (রিফ্রেশ করুন)
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
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
