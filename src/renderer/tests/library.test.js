import {
  EventType,
  GridScript,
  initLuaFormatter,
} from "@intechstudio/grid-protocol";
import { test, expect, describe, beforeAll, beforeEach, vi } from "vitest";

vi.mock("../runtime/runtime", () => ({}));
vi.mock("../main/panels/FileManager/FileManager", async (importOriginal) => ({
  ...(await importOriginal()),
  createDir: vi.fn(),
  fetchDirEntries: vi.fn(),
  fetchFileHead: vi.fn(),
  invalidateLuaModule: vi.fn(),
  writeFileContent: vi.fn(),
}));

import {
  createDir,
  fetchDirEntries,
  fetchFileHead,
  invalidateLuaModule,
  writeFileContent,
} from "../main/panels/FileManager/FileManager";
import {
  findBundledLibrary,
  globalForFile,
  globalsLoadedBefore,
  installLibrary,
  isLibraryPlace,
  libraryRowStatus,
  librarySuggestions,
  libraryScriptToLua,
  parseLibraryHeader,
  parseLibraryScript,
  readPageLibraries,
} from "../lib/library";

beforeAll(async () => {
  await initLuaFormatter();
});

const rows = [{ global: "_Test", file: "test" }];
const test1 = findBundledLibrary("test");

describe("Library script", () => {
  test("round-trips the rows", () => {
    const script = libraryScriptToLua(rows);
    expect(script).toBe(`_Test=gr("test")`);
    expect(parseLibraryScript(script)).toEqual(rows);
    expect(parseLibraryScript("")).toEqual([]);
  });

  test("the module gets the script as the editor writes it", () => {
    const two = [...rows, { global: "_util", file: "util" }];
    for (const script of [
      libraryScriptToLua([]),
      libraryScriptToLua(rows),
      libraryScriptToLua(two),
    ]) {
      expect(GridScript.compressScript(script)).toBe(script);
    }
  });

  test("loads user libraries under an underscore global", () => {
    expect(parseLibraryScript(`_util=gr("util")`)).toEqual([
      { global: "_util", file: "util" },
    ]);
  });

  test.each([
    `print("hi")`,
    `local p=string.format("/%02X/",gpc())_Test=require(p.."test")`,
    `local _Test=gr("test")`,
    `_Test=gr("test") print(_Test)`,
    `Util=gr("util")`,
    `_Test=gr("test")_Test=gr("test")`,
    `_Test=gr("test")_Test=gr("other")`,
  ])("other scripts are not a Library block: %j", (script) => {
    expect(parseLibraryScript(script)).toBeNull();
  });
});

describe("parseLibraryHeader", () => {
  const header = { name: "_Test", version: "1.0.0" };

  test("reads the two lines at the top, also after compression", () => {
    const source = `local LIB_NAME = "_Test"\nlocal LIB_VERSION = "1.0.0"\nreturn {}`;
    expect(parseLibraryHeader(source)).toEqual(header);
    expect(parseLibraryHeader(GridScript.compressScript(source))).toEqual(
      header,
    );
  });

  test.each([
    `return {}`,
    `-- a comment\nlocal LIB_NAME = "_Test"\nlocal LIB_VERSION = "1.0.0"`,
    `local LIB_NAME = "Test"\nlocal LIB_VERSION = "1.0.0"`,
    `local LIB_NAME = "_Test"\nlocal LIB_VERSION = "v1"`,
    `local LIB_VERSION = "1.0.0"\nlocal LIB_NAME = "_Test"`,
  ])("no header: %j", (source) => {
    expect(parseLibraryHeader(source)).toBeNull();
  });
});

describe("isLibraryPlace", () => {
  test("any Setup, never a function body", () => {
    expect(isLibraryPlace(EventType.SETUP, false)).toBe(true);
    expect(isLibraryPlace(EventType.SETUP, true)).toBe(false);
    expect(isLibraryPlace(EventType.TIMER, false)).toBe(false);
  });
});

describe("rows and the page folder", () => {
  const files = new Map([
    ["test", { name: "_Test", version: "0.9.0" }],
    ["util", { name: "_util", version: "2.1.0" }],
    ["notes", null],
  ]);

  test("suggests bundled libraries and the module's libraries", () => {
    expect(librarySuggestions(new Map())).toEqual([
      { value: "test", info: "_Test 1.0.0 · bundled" },
    ]);
    expect(librarySuggestions(files)).toEqual([
      { value: "test", info: "_Test 0.9.0 · on module" },
      { value: "util", info: "_util 2.1.0 · on module" },
    ]);
    expect(librarySuggestions(undefined)).toEqual([
      { value: "test", info: "_Test 1.0.0 · bundled" },
    ]);
  });

  test("a picked file loads under its own header's global", () => {
    expect(globalForFile("util", files)).toBe("_util");
    expect(globalForFile("test", new Map())).toBe("_Test");
    expect(globalForFile("notes", files)).toBeUndefined();
    expect(globalForFile("other", files)).toBeUndefined();
  });

  test("shows the module file's version and the bundled one when it differs", () => {
    expect(libraryRowStatus(rows[0], files, "/01/")).toEqual({
      kind: "present",
      version: "0.9.0",
      bundledVersion: "1.0.0",
    });
    const same = new Map([["test", { name: "_Test", version: "1.0.0" }]]);
    expect(libraryRowStatus(rows[0], same, "/01/")).toEqual({
      kind: "present",
      version: "1.0.0",
      bundledVersion: undefined,
    });
  });

  test("a missing bundled library can be installed", () => {
    expect(libraryRowStatus(rows[0], new Map(), "/01/")).toEqual({
      kind: "missing",
      library: test1,
    });
  });

  test("a missing user library has no install", () => {
    const status = libraryRowStatus({ global: "_x", file: "x" }, files, "/01/");
    expect(status).toEqual({
      kind: "unavailable",
      message: "x.lua is missing in /01/ and the editor has no copy to install",
    });
  });

  test("a file that doesn't export the row's global is an error", () => {
    const row = { global: "_other", file: "util" };
    expect(libraryRowStatus(row, files, "/01/").kind).toBe("error");
    const notes = { global: "_notes", file: "notes" };
    expect(libraryRowStatus(notes, files, "/01/").kind).toBe("error");
  });

  test("without the module, only the bundled version", () => {
    expect(libraryRowStatus(rows[0], undefined, "/01/")).toEqual({
      kind: "unknown",
      version: "1.0.0",
    });
  });
});

describe("globalsLoadedBefore", () => {
  const setup = (actions) => ({
    type: 0,
    isLoaded: () => true,
    config: actions,
  });
  const lib = (script) => ({ short: "lib", script });

  test("counts loaded Setups in the module's run order", () => {
    const fromSystem = lib(libraryScriptToLua(rows));
    const fromElement0 = lib(
      libraryScriptToLua([{ global: "_util", file: "util" }]),
    );
    const target = lib(libraryScriptToLua([]));
    const notLoaded = {
      type: 0,
      isLoaded: () => false,
      config: [lib(libraryScriptToLua([{ global: "_x", file: "x" }]))],
    };
    const element = (elementIndex, events) => ({ elementIndex, events });
    const page = {
      control_elements: [
        element(1, [setup([target])]),
        element(0, [setup([fromElement0])]),
        element(2, [notLoaded]),
        element(255, [setup([fromSystem])]),
      ],
    };
    const event = { parent: page.control_elements[0] };
    page.control_elements[0].parent = page;
    target.parent = event;
    expect(globalsLoadedBefore(target)).toEqual(new Set(["_Test", "_util"]));
  });
});

describe("readPageLibraries", () => {
  const module = { id: "m1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("reads the header at the top of each Lua file once", async () => {
    fetchDirEntries.mockImplementation(async (path) =>
      path === "/"
        ? [{ name: "01", type: "dir" }]
        : [
            { name: "test.lua", type: "file" },
            { name: "notes.lua", type: "file" },
            { name: "image.bin", type: "file" },
          ],
    );
    fetchFileHead.mockImplementation(async (path) =>
      path === "/01/test.lua"
        ? `local LIB_NAME="_Test" local LIB_VERSION="1.0.0" local M={}`
        : `print("hi")`,
    );
    const [a, b] = await Promise.all([
      readPageLibraries(1, module),
      readPageLibraries(1, module),
    ]);
    expect(a).toBe(b);
    expect(a).toEqual(
      new Map([
        ["test", { name: "_Test", version: "1.0.0" }],
        ["notes", null],
      ]),
    );
    expect(fetchFileHead).toHaveBeenCalledTimes(2);
  });

  test("undefined when the module can't be asked", async () => {
    fetchDirEntries.mockRejectedValue(new Error("offline"));
    expect(await readPageLibraries(2, module)).toBeUndefined();
  });
});

describe("installLibrary", () => {
  let module;
  beforeEach(() => {
    vi.clearAllMocks();
    module = {
      execLUAImmediateAndEvalaute: vi.fn().mockResolvedValue({ value: [true] }),
    };
  });

  test("writes the file into a new page folder, then runs Setup", async () => {
    fetchDirEntries.mockResolvedValue([]);
    await installLibrary(test1, 2, module);
    expect(createDir).toHaveBeenCalledWith("/02", module);
    expect(writeFileContent).toHaveBeenCalledWith(
      "/02/test.lua",
      expect.any(String),
      module,
      expect.any(Number),
    );
    expect(invalidateLuaModule).toHaveBeenCalledWith("/02/test", module);
    const lua = module.execLUAImmediateAndEvalaute.mock.calls[0][0];
    expect(lua).toContain(`_G["_Test"]=nil`);
    expect(lua).toContain(
      `run(ele[#ele],-1) for i=0,#ele-1 do run(ele[i],i) end`,
    );
  });

  test("a failing Setup is reported", async () => {
    fetchDirEntries.mockResolvedValue([{ name: "02", type: "dir" }]);
    module.execLUAImmediateAndEvalaute.mockResolvedValue({
      value: [false, 0, "boom"],
    });
    await expect(installLibrary(test1, 2, module)).rejects.toThrow(
      "Setup failed on element 0: boom",
    );
    expect(createDir).not.toHaveBeenCalled();
  });
});
