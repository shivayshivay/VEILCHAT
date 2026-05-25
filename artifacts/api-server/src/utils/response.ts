export interface ApiResponse<T = unknown> {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function ok<T>(data: T, meta?: Record<string, unknown>): ApiResponse<T> {
  return { ok: true, data, ...(meta ? { meta } : {}) };
}

export function created<T>(data: T): ApiResponse<T> {
  return { ok: true, data };
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): ApiResponse<T[]> {
  return {
    ok: true,
    data,
    meta: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
    },
  };
}
