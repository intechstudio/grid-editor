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

beforeAll(async () => {
  await initLuaFormatter();
});

const lib = { ...findLibraryById("test"), version: "1.2.3" };

describe("compareVersions", () => {
  test.each([
    ["1.2.3", "1.2.3", 0],
    ["1.2.10", "1.2.9", 1],
    ["0.9.9", "1.0.0", -1],
  ])("%s vs %s", (a, b, sign) => {
    expect(Math.sign(compareVersions(a, b))).toBe(sign);
  });

  test("an unparsable version does not compare", () => {
    expect(compareVersions("v1.2.3", "1.2.3")).toBeUndefined();
  });
});

describe("readLibraryVersion", () => {
  test("reads VERSION, skipping commented ones", () => {
    expect(readLibraryVersion(`Util.VERSION="10.0.1"`)).toBe("10.0.1");
    expect(
      readLibraryVersion(
        `--[[ Test.VERSION = "0.0.1" ]]\nlocal Test={}\nTest.VERSION = "1.2.3"`,
      ),
    ).toBe("1.2.3");
    expect(readLibraryVersion(`-- Test.VERSION = "1.2.3"`)).toBeUndefined();
  });

  test("the uploaded test library still reads as the bundled version", () => {
    const testLib = findLibraryById("test");
    expect(readLibraryVersion(GridScript.compressScript(testLib.source))).toBe(
      testLib.version,
    );
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
  ])("%j → %s for a registry library", (status, action) => {
    expect(libraryAction(status, lib)).toBe(action);
  });

  test("files outside the registry can only be reloaded", () => {
    expect(libraryAction({ kind: "not loaded" })).toBe("reload");
    expect(libraryAction({ kind: "missing" })).toBeUndefined();
    expect(libraryAction({ kind: "present" })).toBeUndefined();
  });
});
