import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: (err: Error, reset: () => void) => ReactNode;
  label?: string;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[${this.props.label ?? "ErrorBoundary"}]`, error, info);
  }

  reset = (): void => this.setState({ error: null });

  render(): ReactNode {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error, this.reset);
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center text-xs text-white/70">
          <div className="font-medium text-red-300">Something broke here</div>
          <pre className="max-h-40 max-w-full overflow-auto whitespace-pre-wrap rounded bg-black/40 p-2 text-[10px] text-white/60">
            {this.state.error.message}
          </pre>
          <button
            onClick={this.reset}
            className="rounded bg-accent px-3 py-1 text-white hover:bg-accent/90"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
