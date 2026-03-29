/**
 * Error boundary tổng cho ứng dụng.
 */
import React, { type ErrorInfo, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      message: '',
    }
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Đã xảy ra lỗi không mong muốn.',
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  private handleReload = (): void => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <h1 className="font-sora text-2xl font-bold text-foreground">Ứng dụng gặp sự cố</h1>
            <p className="mt-2 text-sm text-muted-foreground">{this.state.message}</p>
            <div className="mt-6">
              <Button type="button" onClick={this.handleReload} aria-label="Tải lại toàn bộ trang">
                Tải lại trang
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

