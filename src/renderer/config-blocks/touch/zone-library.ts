import { EventType, NumberToEventType } from "@intechstudio/grid-protocol";
import type { GridElement, GridEvent, GridPage } from "../../runtime/runtime";
import { ZONA_GLOBAL } from "./zone-parse";
import type { ZoneIssue } from "./zone-validate";

const ZONA_FILE = "zona";

// Tells the user the zones need zona: a Library block that runs before the
// zones loads it (docs/zona-touch-zones.md, Block face). `globals` are the ones those blocks load.
export function libraryIssue(globals: Set<string>): ZoneIssue | undefined {
  return globals.has(ZONA_GLOBAL)
    ? undefined
    : {
        level: "warning",
        message: `Add a Library block that loads ${ZONA_FILE} (${ZONA_GLOBAL}) above the zones or in the System Setup`,
      };
}

// Loads the Setups the module runs before this one (System first, then the
// elements), where a Library block may load zona for the page.
export async function loadSetupsBefore(event: GridEvent): Promise<void> {
  const element = event.parent as GridElement;
  const page = element.parent as GridPage;
  await Promise.all(
    page.control_elements
      .filter(
        (e) => e.elementIndex === 255 || e.elementIndex < element.elementIndex,
      )
      .flatMap((e) =>
        e.events.filter(
          (s) => NumberToEventType(s.type) === EventType.SETUP && !s.isLoaded(),
        ),
      )
      .map((e) => e.load()),
  );
}
