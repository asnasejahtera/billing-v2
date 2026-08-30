/*
 * =========================
 * FIND BY ID
 * =========================
 */
export function findById<T extends { id: number }>(items: T[], id: number) {
  return items.find((item) => item.id === id);
}

/*
 * =========================
 * FIND INDEX BY ID
 * =========================
 */
export function findIndexById<T extends { id: number }>(items: T[], id: number) {
  return items.findIndex((item) => item.id === id);
}

/*
 * =========================
 * REMOVE BY ID
 * =========================
 * Menghapus item dari registry tanpa membuat array baru.
 */
export function removeById<T extends { id: number }>(items: T[], id: number) {
  const index = findIndexById(items, id);
  if (index < 0) return false;
  items.splice(index, 1);
  return true;
}