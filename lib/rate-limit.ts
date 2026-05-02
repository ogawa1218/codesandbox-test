import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasUpstash ? Redis.fromEnv() : null;

type LimitFn = (id: string) => Promise<{ success: boolean; remaining: number; reset?: number }>;

function build(prefix: string, limitN: number, windowSec: number): { limit: LimitFn } {
  if (!redis) {
    return {
      limit: async () => ({ success: true, remaining: limitN, reset: 0 }),
    };
  }
  const rl = new Ratelimit({
    redis,
    prefix,
    limiter: Ratelimit.slidingWindow(limitN, `${windowSec} s`),
    analytics: false,
  });
  return { limit: (id) => rl.limit(id) };
}

export const limits = {
  login: build("rl:login", 10, 60),
  write: build("rl:write", 30, 60),
  upload: build("rl:upload", 10, 60),
};

export type LimiterKey = keyof typeof limits;

export async function check(key: LimiterKey, identifier: string) {
  const r = await limits[key].limit(identifier);
  return { ok: r.success, remaining: r.remaining };
}
