// What the touch zones overlay draws (docs/zona-touch-zones.md, Overlay), derived from the touch
// Setup's actions on every change: no store of its own, no write path.

import type { Zone } from "../../../../config-blocks/touch/zone-model";
import { parseZones } from "../../../../config-blocks/touch/zone-parse";
import { surfaceIssues } from "../../../../config-blocks/touch/zone-validate";
import { ZONA_GRID_SIZE, zonaCellEdgePct } from "../devices/zona-grid";

type Action = { id: string; script: string };

export type ZoneRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type OverlayZone = {
  zone: Zone;
  actionId: string; // the zone block, for selecting it
  index: number; // the zone's place in its block, which may define several
  rect: ZoneRect; // percent of the touch surface
  issue?: "error" | "warning"; // the worst surface issue naming the zone
  group?: number; // radio group badge, when > 0
  highlighted: boolean; // its block is selected
};

// A zone's cells as percent of the 9×9 surface. Cells outside the grid are
// clipped, so a zone with a geometry problem still shows what it covers.
export function zoneRect(zone: Zone): ZoneRect {
  const clip = (v: number) => Math.max(0, Math.min(ZONA_GRID_SIZE, v));
  const left = clip(zone.x);
  const top = clip(zone.y);
  const right = clip(zone.x + zone.w);
  const bottom = clip(zone.y + zone.h);
  return {
    left: zonaCellEdgePct(left),
    top: zonaCellEdgePct(top),
    width: zonaCellEdgePct(Math.max(right - left, 0)),
    height: zonaCellEdgePct(Math.max(bottom - top, 0)),
  };
}

// The zones of a touch Setup in definition order (later ones are drawn on
// top, as the library resolves cells), unparseable lines skipped.
export function overlayZones(
  actions: Action[],
  selectedIds: string[] = [],
): OverlayZone[] {
  const issues = surfaceIssues(actions.map((e) => e.script));
  const zones: OverlayZone[] = [];
  for (const action of actions) {
    (parseZones(action.script) ?? []).forEach((zone, index) => {
      const levels = issues
        .filter((e) => e.zone === zone.name)
        .map((e) => e.level);
      const group = Number(zone.opt.group ?? 0);
      zones.push({
        zone,
        actionId: action.id,
        index,
        rect: zoneRect(zone),
        issue: levels.includes("error")
          ? "error"
          : levels.includes("warning")
            ? "warning"
            : undefined,
        group: group > 0 ? group : undefined,
        highlighted: selectedIds.includes(action.id),
      });
    });
  }
  return zones;
}
