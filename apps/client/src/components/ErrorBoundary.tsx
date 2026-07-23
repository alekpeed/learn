/**
 * App-level error boundary (doc 14 §5, doc 07 §4). Catches render errors,
 * shows a recoverable, non-generic message, and never exposes internal detail
 * to the user. Local progress is preserved because state lives in the event log.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { toAppError } from '@learn/domain';

interface Props {
  children: ReactNode;
}
interface State {
  message: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { message: null };

  static getDerivedStateFromError(error: unknown): State {
    return { message: toAppError(error).userMessage };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    // Log for observability; never render internal detail to the user (doc 14 §6).
    const appError = toAppError(error);
    console.error('[app-error]', appError.category, appError.detail, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.message) {
      return (
        <div className="screen-state" data-status="error" role="alert">
          <h1>Something went wrong</h1>
          <p>{this.state.message}</p>
          <a href="/">Return to the start</a>
        </div>
      );
    }
    return this.props.children;
  }
}
