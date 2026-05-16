export type ErrorCode =
  | "unauthorized"
  | "forbidden"
  | "validation"
  | "conflict"
  | "rate_limited"
  | "not_found"
  | "unknown";

export type ActionError = {
  code: ErrorCode;
  message: string;
  fields?: Record<string, string[]>;
};

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError };

export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });
export const fail = (error: ActionError): ActionResult<never> => ({
  ok: false,
  error,
});
