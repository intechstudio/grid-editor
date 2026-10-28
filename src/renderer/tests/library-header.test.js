import { GridScript, initLuaFormatter } from "@intechstudio/grid-protocol";
import { test, expect, describe, beforeAll, vi } from "vitest";

vi.mock("../runtime/runtime", () => ({}));

import {
  LIB_NAME_RULE,
  LIB_VERSION_RULE,
  bundledLibraries,
  parseLibraryHeader,
} from "../lib/library";

// Every Lua file the editor ships as a library, so none can skip the check.
const sources = import.meta.glob("../../content/libraries/*.lua", {
  query: "?raw",
  import: "default",
  eager: true,
});

const HEADER =
  /^local LIB_NAME = "([^"]*)"\r?\nlocal LIB_VERSION = "([^"]*)"\r?\n/;

beforeAll(async () => {
  await initLuaFormatter();
});

describe("bundled library headers", () => {
  test("there are bundled libraries to check", () => {
    expect(Object.keys(sources).length).toBeGreaterThan(0);
  });

  test.each(Object.entries(sources))(
    "%s starts with LIB_NAME and LIB_VERSION",
    (path, source) => {
      const match = HEADER.exec(source);
      expect(match, "first two lines are the header").not.toBeNull();
      expect(match[1]).toMatch(LIB_NAME_RULE);
      expect(match[2]).toMatch(LIB_VERSION_RULE);
      expect(
        parseLibraryHeader(GridScript.compressScript(source)),
        "header survives compression",
      ).toEqual({ name: match[1], version: match[2] });
      const file = path.split("/").pop().slice(0, -".lua".length);
      expect(
        bundledLibraries.find((e) => e.source === source)?.file,
        "listed in bundledLibraries",
      ).toBe(file);
    },
  );

  test("each bundled library binds its own global", () => {
    const globals = bundledLibraries.map((e) => e.global);
    expect(new Set(globals).size).toBe(globals.length);
  });
});
