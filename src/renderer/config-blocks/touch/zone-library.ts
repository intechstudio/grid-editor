import { ZONA_GLOBAL } from "./zone-parse";
import type { ZoneIssue } from "./zone-validate";

const ZONA_FILE = "zona";

// Tells the user the zones need zona: a Library block that runs before Touch
// Start loads it (RFC 6.1). `globals` are the ones those blocks load.
export function libraryIssue(globals: Set<string>): ZoneIssue | undefined {
  return globals.has(ZONA_GLOBAL)
    ? undefined
    : {
        level: "warning",
        message: `Add a Library block that loads ${ZONA_FILE} (${ZONA_GLOBAL}) above this block or in the System Setup`,
      };
}
