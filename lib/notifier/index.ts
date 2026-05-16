/**
 * Abstract notification channel. Today the implementation is a URL scheme
 * (LINE share) and a Postgres outbox row; later we can swap in a Messaging
 * API client without changing callers.
 */
export interface Notifier {
  /** Build a deep-link URL for the user to share (current implementation). */
  buildShareUrl(message: string): string;
  /** Persist a pending notification record (read by a worker later). */
  enqueue(input: { userId: string; payload: unknown }): Promise<void>;
}
