import { Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 32, fontFamily: 'monospace', fontSize: 13, maxWidth: 700, margin: '0 auto' }}>
        <h2 style={{ color: '#dc2626', marginBottom: 8 }}>Error de aplicación</h2>
        <pre style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: 16, borderRadius: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {this.state.error?.message}{'\n\n'}{this.state.error?.stack}
        </pre>
        <button
          onClick={() => window.location.reload()}
          style={{ marginTop: 16, background: '#1e40af', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
          Recargar
        </button>
      </div>
    )
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
