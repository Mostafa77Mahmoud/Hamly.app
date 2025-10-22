
/**
 * Generate unique request IDs for tracing
 */
export function generateRequestId(prefix: string = 'req'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Generate a shorter request ID for inline use
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 8);
}
