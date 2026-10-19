import { type BundledLibrary, compareVersions } from "./registry";

// What a row's global holds on the device, as Setup left it.
export type LibraryBinding =
  | { bound: false } // nil or not a table: Setup didn't bind it (yet)
  | { bound: true; version?: string }; // a table; version when it sets VERSION

export type LibraryStatus =
  | { kind: "unknown" } // offline, virtual or the check failed
  | { kind: "missing" }
  | { kind: "not loaded" } // in the folder, but the global isn't bound
  | { kind: "present"; version?: string }
  | { kind: "older" | "newer"; version: string; bundled: string };

// Presence comes from the folder listing; whether and which version is in use
// comes from the global Setup bound, never from loading the file in the
// editor's own probe. The version shown is the one in use, which can differ
// from the file if it changed after Setup ran. Install, Update and Reload
// re-run Setup with the block's modules dropped from package.loaded, so they
// load the file as it is now; so does changing page.
export function deriveLibraryStatus(
  file: string,
  folderFiles: readonly string[] | undefined,
  binding: LibraryBinding | undefined,
  bundled?: BundledLibrary,
): LibraryStatus {
  if (typeof folderFiles === "undefined") {
    return { kind: "unknown" };
  }
  if (!folderFiles.includes(file)) {
    return { kind: "missing" };
  }
  if (typeof binding === "undefined") {
    return { kind: "unknown" };
  }
  if (!binding.bound) {
    return { kind: "not loaded" };
  }

  const version = binding.version;
  if (typeof bundled !== "undefined" && typeof version !== "undefined") {
    const order = compareVersions(version, bundled.version);
    if (typeof order !== "undefined" && order !== 0) {
      return {
        kind: order < 0 ? "older" : "newer",
        version,
        bundled: bundled.version,
      };
    }
  }
  return { kind: "present", version };
}

// The button a row offers. Install and Update write the bundled source, so
// they are for registry libraries only, and a newer file is never
// downgraded. A registry global without a version isn't the bundled library,
// so it can be replaced too. Reload re-runs Setup and works for any file; if
// the file is broken, the Setup error says why.
export function libraryAction(
  status: LibraryStatus,
  bundled?: BundledLibrary,
): "install" | "update" | "reload" | undefined {
  if (status.kind === "not loaded") {
    return "reload";
  }
  if (typeof bundled === "undefined") {
    return undefined;
  }
  switch (status.kind) {
    case "missing":
      return "install";
    case "older":
      return "update";
    case "present":
      return typeof status.version === "undefined" ? "update" : undefined;
    default:
      return undefined;
  }
}
