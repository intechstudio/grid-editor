import testSource from "./test/test.lua?raw";

export type BundledLibrary = {
  id: string; // "test"
  file: string; // "test.lua"
  global: string; // suggested global name: "Test"
  version: string; // semver, read from the source; major = breaking block syntax
  source: string; // imported with ?raw
};

// Matches `Test.VERSION = "1.2.3"` (any table name) outside line comments. Not
// anchored to the line start: compressScript joins statements, so the
// uploaded source reads `local Module={}Module.VERSION="1.2.3"`.
const VERSION_PATTERN =
  /(?:^|[^\w.])[A-Za-z_]\w*\.VERSION\s*=\s*"(\d+\.\d+\.\d+)"/m;

// Block comments (`--[[ ]]`, `--[==[ ]==]`) go first, then line comments.
// A `--` inside a string literal also cuts the line; library sources don't
// rely on that before their VERSION line.
export function readLibraryVersion(source: string): string | undefined {
  const code = source
    .replace(/--\[(=*)\[[\s\S]*?\]\1\]/g, "")
    .replace(/--[^\n]*/g, "");
  return VERSION_PATTERN.exec(code)?.[1];
}

// Semver order of two "x.y.z" versions: negative when a is older than b,
// positive when newer, 0 when equal. Undefined when either doesn't parse.
export function compareVersions(a: string, b: string): number | undefined {
  const parse = (v: string) =>
    /^(\d+)\.(\d+)\.(\d+)$/.exec(v)?.slice(1).map(Number);
  const [x, y] = [parse(a), parse(b)];
  if (typeof x === "undefined" || typeof y === "undefined") {
    return undefined;
  }
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
}

function bundled(id: string, global: string, source: string): BundledLibrary {
  const version = readLibraryVersion(source);
  if (typeof version === "undefined") {
    throw new Error(`Bundled library "${id}" has no VERSION`);
  }
  return { id, file: `${id}.lua`, global, version, source };
}

export const bundledLibraries: readonly BundledLibrary[] = [
  bundled("test", "Test", testSource),
];

export function findLibraryById(id: string): BundledLibrary | undefined {
  return bundledLibraries.find((e) => e.id === id);
}

// Accepts the file name with or without the `.lua` extension, so both a
// page folder entry ("test.lua") and a Library block row ("test") resolve.
export function findLibraryByFile(file: string): BundledLibrary | undefined {
  const name = file.endsWith(".lua") ? file : `${file}.lua`;
  return bundledLibraries.find((e) => e.file === name);
}
