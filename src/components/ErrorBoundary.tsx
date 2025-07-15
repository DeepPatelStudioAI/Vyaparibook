// src/components/ErrorBoundary.tsx
import React from 'react';

export class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null as any };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div style={{ padding: 20, color: 'red' }}>
        <h3>Something went wrong:</h3>
        <pre>{this.state.error?.toString()}</pre>
      </div>;
    }

    return this.props.children;
  }
}
