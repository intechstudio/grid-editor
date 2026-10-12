import { GridScript, initLuaFormatter } from "@intechstudio/grid-protocol";
import { test, expect, describe, beforeAll } from "vitest";
import {
  compareVersions,
  findLibraryById,
  readLibraryVersion,
} from "../libraries/registry";
import {
  deriveLibraryStatus,
  libraryAction,
} from "../libraries/library-status";
import zonaSource from "../libraries/zona/zona.lua?raw";

beforeAll(async () => {
  await initLuaFormatter();
});

const zona = { ...findLibraryById("zona"), version: "1.2.3" };

describe("compareVersions", () => {
  test.each([
    ["1.2.3", "1.2.3", 0],
    ["1.2.2", "1.2.3", -1],
    ["1.2.10", "1.2.9", 1],
    ["1.10.0", "1.9.9", 1],
    ["0.9.9", "1.0.0", -1], // major bump
    ["2.0.0", "1.99.99", 1], // major bump
  ])("%s vs %s", (a, b, sign) => {
    expect(Math.sign(compareVersions(a, b))).toBe(sign);
  });

  test.each(["1.2", "v1.2.3", "1.2.3-beta", ""])("%j does not parse", (v) => {
    expect(compareVersions(v, "1.2.3")).toBeUndefined();
    expect(compareVersions("1.2.3", v)).toBeUndefined();
  });
});

describe("deriveLibraryStatus", () => {
  const bound = (version) => ({ bound: true, version });

  test("no folder listing or no read-back is unknown", () => {
    expect(
      deriveLibraryStatus("zona", undefined, bound("1.2.3"), zona),
    ).toEqual({ kind: "unknown" });
    expect(deriveLibraryStatus("zona", ["zona"], undefined, zona)).toEqual({
      kind: "unknown",
    });
  });

  test("a file not in the folder is missing, even if the global is bound", () => {
    expect(
      deriveLibraryStatus("zona", ["layout"], bound("1.2.3"), zona),
    ).toEqual({ kind: "missing" });
  });

  test("listed but not bound is not loaded", () => {
    expect(
      deriveLibraryStatus("zona", ["zona"], { bound: false }, zona),
    ).toEqual({ kind: "not loaded" });
    expect(deriveLibraryStatus("mine", ["mine"], { bound: false })).toEqual({
      kind: "not loaded",
    });
  });

  test("registry versions compare with the bundled one", () => {
    const at = (version) =>
      deriveLibraryStatus("zona", ["zona"], bound(version), zona);
    expect(at("1.2.3")).toEqual({ kind: "present", version: "1.2.3" });
    expect(at("1.2.0")).toEqual({
      kind: "older",
      version: "1.2.0",
      bundled: "1.2.3",
    });
    expect(at("2.0.0")).toEqual({
      kind: "newer",
      version: "2.0.0",
      bundled: "1.2.3",
    });
    expect(at("garbage")).toEqual({ kind: "present", version: "garbage" });
  });

  test("bound without a version", () => {
    expect(
      deriveLibraryStatus("zona", ["zona"], { bound: true }, zona),
    ).toEqual({ kind: "present", version: undefined });
  });

  test("non-registry files never compare", () => {
    expect(deriveLibraryStatus("mine", ["mine"], bound("0.0.1"))).toEqual({
      kind: "present",
      version: "0.0.1",
    });
  });
});

describe("libraryAction", () => {
  test.each([
    [{ kind: "missing" }, "install"],
    [{ kind: "not loaded" }, "reload"],
    [{ kind: "older", version: "1.0.0", bundled: "1.2.3" }, "update"],
    [{ kind: "present" }, "update"],
    [{ kind: "present", version: "1.2.3" }, undefined],
    [{ kind: "newer", version: "2.0.0", bundled: "1.2.3" }, undefined],
    [{ kind: "unknown" }, undefined],
  ])("%j → %s for a registry library", (status, action) => {
    expect(libraryAction(status, zona)).toBe(action);
  });

  test("files outside the registry can only be reloaded", () => {
    expect(libraryAction({ kind: "not loaded" })).toBe("reload");
    expect(libraryAction({ kind: "missing" })).toBeUndefined();
    expect(libraryAction({ kind: "older" })).toBeUndefined();
    expect(libraryAction({ kind: "present" })).toBeUndefined();
  });
});

describe("readLibraryVersion comments", () => {
  test.each([
    `--[[ usage:\nZ.VERSION = "0.0.1"\n]]\nlocal Z={}\nZ.VERSION = "1.2.3"`,
    `--[==[ example ]] Z.VERSION = "0.0.1"\n]==]\nZ.VERSION = "1.2.3"`,
    `-- Z.VERSION = "0.0.1"\nlocal Z={}Z.VERSION="1.2.3" return Z`,
  ])("a decoy VERSION in a comment is skipped: %j", (source) => {
    expect(readLibraryVersion(source)).toBe("1.2.3");
  });

  test("only a commented VERSION reads as none", () => {
    expect(readLibraryVersion(`--[[ Z.VERSION = "1.2.3" ]]`)).toBeUndefined();
  });
});

describe("Library source on upload", () => {
  const compressed = () => GridScript.compressScript(zonaSource);
  const literals = (src) => src.match(/"[^"\n]*"/g) ?? [];

  test("the compressed source still reads as the bundled version", () => {
    expect(readLibraryVersion(compressed())).toBe(
      findLibraryById("zona").version,
    );
  });

  test("compression rewrites no string literal", () => {
    // shortify rewrites firmware human names even inside strings.
    const code = (src) => src.replace(/--[^\n]*/g, "");
    expect(literals(code(compressed()))).toEqual(literals(code(zonaSource)));
  });

  test("the source uses no firmware human name as a word", () => {
    const code = zonaSource.replace(/--[^\n]*/g, "");
    const words = new Set(code.match(/[A-Za-z_]\w*/g));
    const rewritten = GridScript.validator.lookup
      .filter((e) => e.human && e.short && e.human !== e.short)
      .map((e) => e.human)
      .filter((human) => words.has(human));
    expect(rewritten).toEqual([]);
  });
});
