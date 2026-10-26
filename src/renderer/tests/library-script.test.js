import { GridScript, initLuaFormatter } from "@intechstudio/grid-protocol";
import { test, expect, describe, beforeAll } from "vitest";
import {
  parseLibraryScript,
  libraryScriptToLua,
  isValidGlobal,
  isValidFile,
  globalNameProblem,
  fileNameProblem,
  shadowsBuiltinGlobal,
  formatLibraryScript,
} from "../libraries/library-script";
import {
  bundledLibraries,
  findLibraryById,
  findLibraryByFile,
} from "../libraries/registry";

beforeAll(async () => {
  await initLuaFormatter();
});

const PREFIX = `local p=string.format("/%02X/",gpc())`;

// Canonical, as the editor writes it: no spaces between statements, the same
// line compressScript produces.
const editorWritten = [
  PREFIX,
  `${PREFIX}Test=require(p.."test")`,
  `${PREFIX}Test=require(p.."test")Util=require(p.."util")`,
];

describe("Library script format", () => {
  test.each(editorWritten)("round-trips %s", (script) => {
    expect(libraryScriptToLua(parseLibraryScript(script))).toBe(script);
  });

  test("spaced script writes back compressed", () => {
    expect(
      libraryScriptToLua(
        parseLibraryScript(`${PREFIX} Test=require(p.."test")`),
      ),
    ).toBe(editorWritten[1]);
  });

  test("parses rows", () => {
    expect(parseLibraryScript(editorWritten[2])).toEqual([
      { global: "Test", file: "test" },
      { global: "Util", file: "util" },
    ]);
    expect(parseLibraryScript(PREFIX)).toEqual([]);
  });

  test.each([
    "",
    `print("hi")`,
    `local p = string.format("/%02X/", gpc()) Test=require(p.."test")`,
    `${PREFIX} local Test=require(p.."test")`,
    `${PREFIX} Test=require(p.."test") print(Test)`,
    `${PREFIX} Test=require(p.."test.lua")`,
    `${PREFIX} end=require(p.."test")`,
  ])("rejects non-canonical script %j", (script) => {
    expect(parseLibraryScript(script)).toBeNull();
  });

  test("serializing invalid rows throws", () => {
    expect(() =>
      libraryScriptToLua([{ global: "1Z", file: "test" }]),
    ).toThrow();
  });

  test("the unchecked format writes rows that are still being edited", () => {
    expect(formatLibraryScript([{ global: "Test", file: "" }])).toBe(
      `${PREFIX}Test=require(p.."")`,
    );
  });
});

describe("Library names", () => {
  test("globals", () => {
    expect(isValidGlobal("Test")).toBe(true);
    expect(isValidGlobal("_test2")).toBe(true);
    for (const name of ["", "1Z", "Test-1", "end", "p", "self", "led_value"]) {
      expect(isValidGlobal(name)).toBe(false);
    }
  });

  test("files", () => {
    expect(isValidFile("my_lib2")).toBe(true);
    for (const name of ["", "test.lua", "sub/test", "a-b", "led_value"]) {
      expect(isValidFile(name)).toBe(false);
    }
  });

  test("reasons name the cause", () => {
    expect(globalNameProblem("Test")).toBeUndefined();
    expect(globalNameProblem("led_value")).toContain('"glp"');
    expect(globalNameProblem("end")).toContain("keyword");
    expect(fileNameProblem("a-b")).toContain("hyphen");
    expect(fileNameProblem("test.lua")).toContain(".lua");
  });

  test("built-ins are valid but warned about", () => {
    expect(isValidGlobal("print")).toBe(true);
    expect(shadowsBuiltinGlobal("print")).toBe(true);
    expect(shadowsBuiltinGlobal("Test")).toBe(false);
  });
});

// Mirrors the marker regex in GridAction.parse (runtime.ts), which splits a
// whole event script into actions; importing runtime.ts pulls in the app.
function splitActions(script) {
  return [
    ...script
      .replace(/\s{2,10}/g, " ")
      .matchAll(/--\[\[@(.*?)\]\]\s*(.*?)(?=(--\[\[@|$))/gs),
  ].map(([, meta, code]) => ({
    short: meta.split(/#(.*)/)[0],
    script: code.trim(),
  }));
}

test.each(editorWritten)("%s survives a whole compressed event", (line) => {
  const event = GridScript.compressScript(
    `--[[@lib]] ${line} --[[@gms]] self:gms(-1,-1,-1,-1) --[[@cb]] print(1)`,
  );
  const actions = splitActions(event);
  expect(actions.map((e) => e.short)).toEqual(["lib", "gms", "cb"]);
  expect(actions[0].script).toBe(line);
});

describe("Library registry", () => {
  test("the test library", () => {
    const lib = findLibraryById("test");
    expect(lib.global).toBe("Test");
    expect(lib.file).toBe("test.lua");
    expect(lib.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("lookup by file, with or without extension", () => {
    expect(findLibraryByFile("test.lua")?.id).toBe("test");
    expect(findLibraryByFile("test")?.id).toBe("test");
    expect(findLibraryByFile("util.lua")).toBeUndefined();
  });

  test("registry entries are usable as Library block rows", () => {
    for (const lib of bundledLibraries) {
      expect(isValidGlobal(lib.global)).toBe(true);
      expect(isValidFile(lib.file.replace(/\.lua$/, ""))).toBe(true);
    }
  });
});
