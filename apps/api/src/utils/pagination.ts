import { type SQL, sql } from 'drizzle-orm';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Normalizes and validates pagination parameters.
 * Clamps page to >= 1 and limit to 1–100.
 */
export function parsePaginationParams(params: PaginationParams): {
  page: number;
  limit: number;
  offset: number;
} {
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const limit = Math.min(100, Math.max(1, Math.floor(params.limit ?? 20)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * Builds pagination metadata from result counts.
 *
 * @param total - Total number of records matching the query
 * @param page - Current page number
 * @param limit - Items per page
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Wraps a data array with pagination metadata.
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  return {
    data,
    meta: buildPaginationMeta(total, page, limit),
  };
}

/**
 * Builds a Drizzle-compatible count query fragment.
 * Usage: const [{ count }] = await db.select({ count: countAll() }).from(table);
 */
export function countAll(): SQL<number> {
  return sql<number>`cast(count(*) as integer)`;
}