import { parseLibraryScript } from "../../libraries/library";
import { ZONA_GLOBAL } from "./zone-parse";
import type { ZoneIssue } from "./zone-validate";

const ZONA_FILE = "zona";

// Tells the user the zones need zona: a Library block in the System Setup
// that loads it (RFC 6.1). `systemSetup` holds that event's action scripts.
export function libraryIssue(systemSetup: string[]): ZoneIssue | undefined {
  const loaded = systemSetup.some((script) =>
    (parseLibraryScript(script) ?? []).some(
      (e) => e.global === ZONA_GLOBAL && e.file === ZONA_FILE,
    ),
  );
  return loaded
    ? undefined
    : {
        level: "warning",
        message: `Add a Library block to the System Setup that loads ${ZONA_FILE} (${ZONA_GLOBAL})`,
      };
}
