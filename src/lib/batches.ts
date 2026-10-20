// Helpers for queries whose size grows with the business's history, so they
// never hit URL-length limits or PostgREST's default row cap (1000).

/** Splits a list into chunks of at most `size`. */
export function chunk<T>(list: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

/** Ids per `.in("id", …)` request: about 3.7KB of URL with UUIDs. */
export const IDS_PER_REQUEST = 100;

/** Rows per page when reading everything; at or below PostgREST's default cap. */
export const PAGE_SIZE = 1000;

type Page<T> = PromiseLike<{ data: T[] | null; error: unknown }>;

/** Runs `query(from, to)` page by page until a short page comes back, and returns every row. */
export async function readAll<T>(query: (from: number, to: number) => Page<T>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await query(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

/** Runs `query(ids)` once per chunk of ids and returns every row. */
export async function readByIds<T>(ids: readonly string[], query: (ids: string[]) => Page<T>): Promise<T[]> {
  const pages = await Promise.all(chunk(ids, IDS_PER_REQUEST).map((part) => query(part)));
  return pages.flatMap(({ data, error }) => {
    if (error) throw error;
    return data ?? [];
  });
}
