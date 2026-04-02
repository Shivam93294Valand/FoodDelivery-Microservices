import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-rose-50 p-4">
          <div className="max-w-lg w-full rounded-2xl bg-white ring-1 ring-rose-200 p-6">
            <h1 className="text-2xl font-semibold text-rose-700 mb-2">Something went wrong</h1>
            <p className="text-sm text-black/60 mb-4">
              The application encountered an error. Please refresh the page.
            </p>
            <details className="text-xs text-black/60 mb-4">
              <summary className="cursor-pointer font-medium text-black/80 mb-2">Error details</summary>
              <pre className="bg-black/5 p-3 rounded-lg overflow-auto">
                {this.state.error?.toString()}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-xl bg-black text-white px-4 py-2 text-sm font-medium hover:bg-black/90"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
