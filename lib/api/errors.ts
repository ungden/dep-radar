/**
 * The sentence a screen shows for a failed database call. Kept out of the
 * "use server" files, which may only export actions.
 */
export const GENERIC = "Có lỗi xảy ra, vui lòng thử lại."

/** Postgres messages from our RPCs are written for the user; the rest are not. */
export function messageFor(error: { message?: string; code?: string } | null): string {
  const raw = error?.message?.trim()
  if (!raw) return GENERIC
  if (/^(duplicate key|permission denied|JWT|new row violates|invalid input)/i.test(raw)) return GENERIC
  // Anything our own functions raise is already a sentence in Vietnamese.
  return /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩậắằẵặẹẻẽếềểệỉịọỏốồổộớờởợụủứừửữựỳỵỷỹ]/i.test(raw) ? raw : GENERIC
}

/**
 * The web can reach production before a migration does (or be rolled back
 * after one). A select naming a column that is not there fails whole -- which
 * once blanked the feed -- so on "undefined column" (42703) read again with
 * fewer columns: the new features stay empty, the rest of the site keeps
 * working.
 *
 * `run` is called with how many generations of columns to leave out: 0 for
 * everything, 1 for the newest missing, and so on up to `oldest`. What a
 * generation is belongs to each query; the snapshot's say so where they are.
 */
export async function orLegacy<T extends { error: { code?: string } | null }>(
  run: (legacy: number) => PromiseLike<T>,
  oldest = 1,
): Promise<T> {
  let result = await run(0)
  for (let legacy = 1; legacy <= oldest && result.error?.code === "42703"; legacy++) {
    console.warn(`read again without ${legacy} generation(s) of columns (migrations not applied?)`)
    result = await run(legacy)
  }
  return result
}
