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
import testSource from "../libraries/test/test.lua?raw";

beforeAll(async () => {
  await initLuaFormatter();
});

const lib = { ...findLibraryById("test"), version: "1.2.3" };

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
    expect(deriveLibraryStatus("test", undefined, bound("1.2.3"), lib)).toEqual(
      { kind: "unknown" },
    );
    expect(deriveLibraryStatus("test", ["test"], undefined, lib)).toEqual({
      kind: "unknown",
    });
  });

  test("a file not in the folder is missing, even if the global is bound", () => {
    expect(deriveLibraryStatus("test", ["util"], bound("1.2.3"), lib)).toEqual({
      kind: "missing",
    });
  });

  test("listed but not bound is not loaded", () => {
    expect(
      deriveLibraryStatus("test", ["test"], { bound: false }, lib),
    ).toEqual({ kind: "not loaded" });
    expect(deriveLibraryStatus("mine", ["mine"], { bound: false })).toEqual({
      kind: "not loaded",
    });
  });

  test("registry versions compare with the bundled one", () => {
    const at = (version) =>
      deriveLibraryStatus("test", ["test"], bound(version), lib);
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
    expect(deriveLibraryStatus("test", ["test"], { bound: true }, lib)).toEqual(
      { kind: "present", version: undefined },
    );
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
    expect(libraryAction(status, lib)).toBe(action);
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
    `--[[ usage:\nTest.VERSION = "0.0.1"\n]]\nlocal Test={}\nTest.VERSION = "1.2.3"`,
    `--[==[ example ]] Test.VERSION = "0.0.1"\n]==]\nTest.VERSION = "1.2.3"`,
    `-- Test.VERSION = "0.0.1"\nlocal Test={}Test.VERSION="1.2.3" return Test`,
  ])("a decoy VERSION in a comment is skipped: %j", (source) => {
    expect(readLibraryVersion(source)).toBe("1.2.3");
  });

  test("only a commented VERSION reads as none", () => {
    expect(
      readLibraryVersion(`--[[ Test.VERSION = "1.2.3" ]]`),
    ).toBeUndefined();
  });
});

describe("Library source on upload", () => {
  const compressed = () => GridScript.compressScript(testSource);
  const literals = (src) => src.match(/"[^"\n]*"/g) ?? [];

  test("the compressed source still reads as the bundled version", () => {
    expect(readLibraryVersion(compressed())).toBe(
      findLibraryById("test").version,
    );
  });

  test("compression rewrites no string literal", () => {
    // shortify rewrites firmware human names even inside strings.
    const code = (src) => src.replace(/--[^\n]*/g, "");
    expect(literals(code(compressed()))).toEqual(literals(code(testSource)));
  });

  test("comments survive compression word for word", () => {
    // shortify rewrites human names in comments too ("limit" -> "glim").
    const words = (src) =>
      (src.match(/--[^\n]*/g) ?? []).join(" ").match(/[A-Za-z_]\w*/g);
    expect(words(compressed())).toEqual(words(testSource));
  });

  test("the source uses no firmware human name as a word", () => {
    const code = testSource.replace(/--[^\n]*/g, "");
    const words = new Set(code.match(/[A-Za-z_]\w*/g));
    const rewritten = GridScript.validator.lookup
      .filter((e) => e.human && e.short && e.human !== e.short)
      .map((e) => e.human)
      .filter((human) => words.has(human));
    expect(rewritten).toEqual([]);
  });
});
