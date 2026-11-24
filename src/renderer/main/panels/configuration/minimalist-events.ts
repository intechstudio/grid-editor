// The events minimalist mode lists for an element: everything except Timer.
// Setup is always shown.
export function minimalistEvents<T extends { getName(): string }>(
  events: T[],
): T[] {
  return events.filter((e) => e.getName() !== "Timer");
}
