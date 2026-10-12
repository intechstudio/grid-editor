import zonaSource from "./zona/zona.lua?raw";

export type BundledLibrary = {
  id: string; // "zona"
  file: string; // "zona.lua"
  global: string; // suggested global name: "Z"
  version: string; // semver, read from the source; major = breaking block syntax
  source: string; // imported with ?raw
};

// Matches `Z.VERSION = "1.2.3"` (any table name) in a library source.
const VERSION_PATTERN = /^\s*[A-Za-z_]\w*\.VERSION\s*=\s*"(\d+\.\d+\.\d+)"/m;

export function readLibraryVersion(source: string): string | undefined {
  return VERSION_PATTERN.exec(source)?.[1];
}

function bundled(id: string, global: string, source: string): BundledLibrary {
  const version = readLibraryVersion(source);
  if (typeof version === "undefined") {
    throw new Error(`Bundled library "${id}" has no VERSION`);
  }
  return { id, file: `${id}.lua`, global, version, source };
}

export const bundledLibraries: readonly BundledLibrary[] = [
  bundled("zona", "Z", zonaSource),
];

export function findLibraryById(id: string): BundledLibrary | undefined {
  return bundledLibraries.find((e) => e.id === id);
}

// Accepts the file name with or without the `.lua` extension, so both a
// page folder entry ("zona.lua") and a Library block row ("zona") resolve.
export function findLibraryByFile(file: string): BundledLibrary | undefined {
  const name = file.endsWith(".lua") ? file : `${file}.lua`;
  return bundledLibraries.find((e) => e.file === name);
}
