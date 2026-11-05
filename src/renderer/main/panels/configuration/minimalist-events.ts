// The events minimalist mode lists for an element: no Timer, and no Setup
// unless the element has nothing else (a touch element has only its Setup).
export function minimalistEvents<T extends { getName(): string }>(
  events: T[],
): T[] {
  const withoutTimer = events.filter((e) => e.getName() !== "Timer");
  const others = withoutTimer.filter((e) => e.getName() !== "Setup");
  return others.length > 0 ? others : withoutTimer;
}
