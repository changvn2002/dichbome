/**
 * Kế hoạch xoá thuần: tách danh sách thành phần còn lại và phần bị xoá,
 * giữ nguyên thứ tự gốc ở cả hai phía (để hoàn tác khôi phục đúng vị trí tương đối).
 */
export function planDelete<T extends { id: string }>(
  items: readonly T[],
  ids: ReadonlySet<string>,
): { remaining: T[]; removed: T[] } {
  const remaining: T[] = [];
  const removed: T[] = [];
  for (const item of items) {
    if (ids.has(item.id)) {
      removed.push(item);
    } else {
      remaining.push(item);
    }
  }
  return { remaining, removed };
}
