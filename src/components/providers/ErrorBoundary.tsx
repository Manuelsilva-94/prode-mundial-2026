'use client'

import React from 'react'
import { ErrorMessage } from '@/components/ui/error-message'
import { Button } from '@/components/ui/button'
import { Home, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const Fallback = this.props.fallback
        return <Fallback error={this.state.error} reset={this.handleReset} />
      }

      return (
        <div className="container mx-auto space-y-6 px-4 py-8">
          <ErrorMessage
            title="Algo salió mal"
            message="Ocurrió un error inesperado. Por favor, intenta recargar la página."
            type="error"
            onRetry={this.handleReset}
          />
          <div className="flex gap-3">
            <Button asChild variant="outline" className="min-h-[44px]">
              <Link href="/home">
                <Home className="mr-2 h-4 w-4" />
                Ir al Inicio
              </Link>
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="default"
              className="min-h-[44px]"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Recargar Página
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
