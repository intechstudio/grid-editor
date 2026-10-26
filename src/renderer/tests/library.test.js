import {
  ElementType,
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
  invalidateLuaModule: vi.fn(),
  writeFileContent: vi.fn(),
}));

import {
  createDir,
  fetchDirEntries,
  invalidateLuaModule,
  writeFileContent,
} from "../main/panels/FileManager/FileManager";
import {
  areValidRows,
  bundledLibraries,
  findBundledLibrary,
  installLibrary,
  isLibraryPlace,
  isUserGlobal,
  isValidFile,
  isValidGlobal,
  libraryScriptToLua,
  parseLibraryScript,
} from "../libraries/library";

beforeAll(async () => {
  await initLuaFormatter();
});

const PREFIX = `local p=string.format("/%02X/",gpc())`;
const rows = [
  { global: "_Test", file: "test" },
  { global: "Util", file: "util" },
];

describe("Library script", () => {
  test("round-trips the rows", () => {
    const script = libraryScriptToLua(rows);
    expect(script).toBe(
      `${PREFIX}_Test=require(p.."test")Util=require(p.."util")`,
    );
    expect(parseLibraryScript(script)).toEqual(rows);
    expect(parseLibraryScript(PREFIX)).toEqual([]);
  });

  test("survives compression on the way to the module", () => {
    const script = libraryScriptToLua(rows);
    expect(GridScript.compressScript(script)).toBe(script);
    expect(parseLibraryScript(`${PREFIX} _Test=require(p.."test")`)).toEqual([
      rows[0],
    ]);
  });

  test.each([
    `print("hi")`,
    `${PREFIX} local Util=require(p.."util")`,
    `${PREFIX} Util=require(p.."util") print(Util)`,
    `${PREFIX} Util=require(p.."sub/util")`,
  ])("other scripts are not a Library block: %j", (script) => {
    expect(parseLibraryScript(script)).toBeNull();
  });

  test.each(["led_value", "glp", "p", "require", "end"])(
    "%s is rejected as a global and as a file",
    (name) => {
      expect(isValidGlobal(name)).toBe(false);
      expect(isValidFile(name)).toBe(false);
      expect(
        parseLibraryScript(`${PREFIX}Util=require(p.."${name}")`),
      ).toBeNull();
    },
  );

  test("bundled libraries have valid names in the reserved space", () => {
    for (const lib of bundledLibraries) {
      expect(isValidGlobal(lib.global)).toBe(true);
      expect(isUserGlobal(lib.global)).toBe(false);
      expect(isValidFile(lib.file)).toBe(true);
    }
  });

  test.each([
    `${PREFIX}Test=require(p.."test")`,
    `${PREFIX}_Mine=require(p.."util")`,
    `${PREFIX}_Test=require(p.."util")`,
  ])("bundled and user names stay apart: %j", (script) => {
    expect(parseLibraryScript(script)).toBeNull();
  });

  test("a global is loaded only once", () => {
    const twice = [rows[1], { global: "Util", file: "other" }];
    expect(areValidRows(twice)).toBe(false);
    expect(parseLibraryScript(libraryScriptToLua(twice))).toBeNull();
    expect(areValidRows([rows[0], rows[0]])).toBe(false);
  });
});

describe("isLibraryPlace", () => {
  test("only the System element's Setup, never a function body", () => {
    const { SYSTEM, BUTTON } = ElementType;
    expect(isLibraryPlace(SYSTEM, EventType.SETUP, false)).toBe(true);
    expect(isLibraryPlace(SYSTEM, EventType.SETUP, true)).toBe(false);
    expect(isLibraryPlace(SYSTEM, EventType.TIMER, false)).toBe(false);
    expect(isLibraryPlace(BUTTON, EventType.SETUP, false)).toBe(false);
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
    await installLibrary(findBundledLibrary("test"), 2, module);
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
      `run(ele[#ele],"System") for i=0,#ele-1 do run(ele[i],"element "..i) end`,
    );
  });

  test("a failing Setup is reported", async () => {
    fetchDirEntries.mockResolvedValue([{ name: "02", type: "dir" }]);
    module.execLUAImmediateAndEvalaute.mockResolvedValue({
      value: [false, "element 0: boom"],
    });
    await expect(
      installLibrary(findBundledLibrary("test"), 2, module),
    ).rejects.toThrow("Setup failed on element 0: boom");
    expect(createDir).not.toHaveBeenCalled();
  });
});
