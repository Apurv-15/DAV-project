import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ProductionErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GLOBAL INSIGHT] Uncaught application exception:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleResetCache = () => {
    try {
      localStorage.removeItem('global_insight_datasets_v2');
      localStorage.removeItem('global_insight_active_id_v2');
      localStorage.removeItem('global_insight_chat_threads_v2');
    } catch {
      // ignore storage cleanup errors
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8F8F9] text-[#09090B] flex items-center justify-center p-6 font-sans">
          <div className="max-w-lg w-full bg-white border border-[#E4E4E7] rounded-2xl p-8 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-[#09090B] text-white flex items-center justify-center mb-6">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#71717A] mb-2">
              Runtime Guardrail Triggered
            </p>
            <h1 className="text-2xl font-serif tracking-tight text-[#09090B] mb-3">
              Analytical Workspace Recovery
            </h1>
            <p className="text-sm text-[#52525B] leading-relaxed mb-6">
              An unexpected data or rendering exception occurred while processing the active telemetry state. Your core dataset definitions are protected.
            </p>
            {this.state.error && (
              <div className="bg-[#F4F4F5] border border-[#E4E4E7] rounded-xl p-4 mb-6 overflow-x-auto">
                <p className="text-xs font-mono text-[#09090B] break-words">
                  {this.state.error.message || 'Unknown rendering error'}
                </p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#09090B] text-white text-xs font-medium hover:bg-[#27272A] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Render
              </button>
              <button
                onClick={this.handleResetCache}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E4E4E7] text-[#09090B] text-xs font-medium hover:bg-[#F4F4F5] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Workspace Cache & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
