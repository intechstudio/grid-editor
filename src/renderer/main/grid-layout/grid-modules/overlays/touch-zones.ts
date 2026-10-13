// What the touch zones overlay draws (RFC 6.3), derived from the touch
// Setup's actions on every change: no store of its own, no write path.

import type { Zone } from "../../../../config-blocks/touch/zone-model";
import { parseZone } from "../../../../config-blocks/touch/zone-parse";
import { surfaceIssues } from "../../../../config-blocks/touch/zone-validate";
import { zoneContext } from "../../../../config-blocks/touch/zone-autos";
import { ZONA_GRID_SIZE, zonaCellEdgePct } from "../devices/zona-grid";

type Action = { id: string; script: string; information: { type: string } };

export type ZoneRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type OverlayZone = {
  zone: Zone;
  actionId: string; // the zone block, for selecting it
  rect: ZoneRect; // percent of the touch surface
  issue?: "error" | "warning"; // the worst surface issue naming the zone
  group?: number; // radio group badge, when > 0
  highlighted: boolean; // its block or a block in its body is selected
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

// The action ids of the zone blocks the selection points at: a selected zone
// block itself, or the zone around a selected block in its body.
function highlightedIds(actions: Action[], selectedIds: string[]): Set<string> {
  const zoneActions = actions.filter((e) => parseZone(e.script) !== null);
  const ids = new Set<string>();
  for (const id of selectedIds) {
    const index = actions.findIndex((e) => e.id === id);
    if (index === -1) {
      continue;
    }
    if (parseZone(actions[index].script) !== null) {
      ids.add(id);
      continue;
    }
    const context = zoneContext(actions, index);
    if (context !== null) {
      ids.add(zoneActions[context.index].id);
    }
  }
  return ids;
}

// The zones of a touch Setup in definition order (later ones are drawn on
// top, as the library resolves cells), unparseable lines skipped.
export function overlayZones(
  actions: Action[],
  selectedIds: string[] = [],
): OverlayZone[] {
  const issues = surfaceIssues(actions.map((e) => e.script));
  const highlighted = highlightedIds(actions, selectedIds);
  const zones: OverlayZone[] = [];
  for (const action of actions) {
    const zone = parseZone(action.script);
    if (zone === null) {
      continue;
    }
    const levels = issues
      .filter((e) => e.zone === zone.name)
      .map((e) => e.level);
    const group = Number(zone.opt.group ?? 0);
    zones.push({
      zone,
      actionId: action.id,
      rect: zoneRect(zone),
      issue: levels.includes("error")
        ? "error"
        : levels.includes("warning")
          ? "warning"
          : undefined,
      group: group > 0 ? group : undefined,
      highlighted: highlighted.has(action.id),
    });
  }
  return zones;
}
