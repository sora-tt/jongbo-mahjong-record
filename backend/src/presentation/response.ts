import type { Context } from "hono";

export const ok = <T>(c: Context, data: T, status: 200 | 201 = 200) =>
  c.json({ data }, status);

export const okWithMeta = <T>(
  c: Context,
  data: T,
  meta: Record<string, unknown>,
  status: 200 | 201 = 200,
) => c.json({ data, meta }, status);
