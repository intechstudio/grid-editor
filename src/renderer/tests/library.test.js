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
  libraryScriptToLua,
  parseLibraryScript,
} from "../libraries/library";

beforeAll(async () => {
  await initLuaFormatter();
});

const PREFIX = `local p=string.format("/%02X/",gpc())`;
const rows = [{ global: "_Test", file: "test" }];
const firmwareNames = new Set(
  GridScript.validator.lookup.flatMap((e) => [e.human, e.short]),
);

describe("Library script", () => {
  test("round-trips the rows", () => {
    const script = libraryScriptToLua(rows);
    expect(script).toBe(`${PREFIX}_Test=require(p.."test")`);
    expect(parseLibraryScript(script)).toEqual(rows);
    expect(parseLibraryScript(PREFIX)).toEqual([]);
    expect(parseLibraryScript(`${PREFIX} _Test=require(p.."test")`)).toEqual(
      rows,
    );
  });

  test("bundled libraries survive the send path and stay out of user names", () => {
    const script = libraryScriptToLua(bundledLibraries);
    expect(GridScript.compressScript(script)).toBe(script);
    for (const lib of bundledLibraries) {
      expect(lib.global).toMatch(/^_[A-Z][A-Za-z0-9_]*$/);
      expect(lib.file).toMatch(/^[A-Za-z0-9_]+$/);
      expect(firmwareNames.has(lib.global)).toBe(false);
      expect(firmwareNames.has(lib.file)).toBe(false);
    }
  });

  test.each([
    `print("hi")`,
    `${PREFIX} local _Test=require(p.."test")`,
    `${PREFIX} _Test=require(p.."test") print(_Test)`,
    `${PREFIX}Util=require(p.."util")`,
    `${PREFIX}Test=require(p.."test")`,
    `${PREFIX}_Test=require(p.."util")`,
  ])("other scripts are not a Library block: %j", (script) => {
    expect(parseLibraryScript(script)).toBeNull();
  });

  test("a library is loaded only once", () => {
    expect(areValidRows([rows[0], rows[0]])).toBe(false);
    expect(
      parseLibraryScript(libraryScriptToLua([rows[0], rows[0]])),
    ).toBeNull();
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
      `run(ele[#ele],-1) for i=0,#ele-1 do run(ele[i],i) end`,
    );
  });

  test("a failing Setup is reported", async () => {
    fetchDirEntries.mockResolvedValue([{ name: "02", type: "dir" }]);
    module.execLUAImmediateAndEvalaute.mockResolvedValue({
      value: [false, 0, "boom"],
    });
    await expect(
      installLibrary(findBundledLibrary("test"), 2, module),
    ).rejects.toThrow("Setup failed on element 0: boom");
    expect(createDir).not.toHaveBeenCalled();
  });
});
