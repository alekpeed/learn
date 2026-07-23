/**
 * The seven screen states every screen must define (doc 07 §4).
 * Status is conveyed with text + role, never color alone (doc 11 §4).
 */
import type { ReactNode } from 'react';

export type ScreenStatus =
  'loading' | 'empty' | 'active' | 'success' | 'error' | 'offline' | 'permission_denied';

const MESSAGES: Record<Exclude<ScreenStatus, 'active'>, string> = {
  loading: 'Loading…',
  empty: 'Nothing here yet.',
  success: 'Done.',
  error: 'Something went wrong. Your progress has been saved.',
  offline: 'You are offline. Learning and practice still work.',
  permission_denied: 'You do not have access to this.',
};

export function ScreenState({
  status,
  message,
  children,
}: {
  status: ScreenStatus;
  message?: string;
  children?: ReactNode;
}): JSX.Element {
  if (status === 'active') return <>{children}</>;

  const isError = status === 'error' || status === 'permission_denied';
  return (
    <div
      className="screen-state"
      data-status={status}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      <p>{message ?? MESSAGES[status]}</p>
      {children}
    </div>
  );
}
