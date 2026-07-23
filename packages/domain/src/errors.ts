/**
 * Classified application errors (doc 14 §5): every error is classified, carries
 * actionable internal context, exposes no secrets, and yields a user-facing message.
 */
export type ErrorCategory =
  'validation' | 'persistence' | 'content_load' | 'not_found' | 'ai_gateway' | 'unexpected';

export interface AppErrorOptions {
  category: ErrorCategory;
  /** Safe, plain-language message suitable for display to the learner. */
  userMessage: string;
  /** Internal diagnostic detail. Never rendered to the user; must not contain secrets. */
  detail?: string;
  cause?: unknown;
}

export class AppError extends Error {
  readonly category: ErrorCategory;
  readonly userMessage: string;
  readonly detail?: string;

  constructor(options: AppErrorOptions) {
    super(options.userMessage, { cause: options.cause });
    this.name = 'AppError';
    this.category = options.category;
    this.userMessage = options.userMessage;
    this.detail = options.detail;
  }
}

export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  return new AppError({
    category: 'unexpected',
    userMessage: 'Something went wrong. Your progress has been saved.',
    detail: err instanceof Error ? err.message : String(err),
    cause: err,
  });
}
