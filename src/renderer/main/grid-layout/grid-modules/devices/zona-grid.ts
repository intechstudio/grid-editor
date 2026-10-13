// The ZONA's 9×9 cell grid as percentages of the touch surface, shared by the
// device drawing (ZONA.svelte) and the touch zones overlay.

export const ZONA_GRID_SIZE = 9;

// Left (or top) edge of cell i, in percent.
export function zonaCellEdgePct(i: number): number {
  return (i / ZONA_GRID_SIZE) * 100;
}

// Centre of cell i, in percent.
export function zonaCellCenterPct(i: number): number {
  return ((i + 0.5) / ZONA_GRID_SIZE) * 100;
}
