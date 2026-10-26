import { GridScript, initLuaFormatter } from "@intechstudio/grid-protocol";
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
  findBundledLibrary,
  installLibrary,
  libraryScriptToLua,
  parseLibraryScript,
} from "../libraries/library";

beforeAll(async () => {
  await initLuaFormatter();
});

const PREFIX = `local p=string.format("/%02X/",gpc())`;
const rows = [
  { global: "Test", file: "test" },
  { global: "Util", file: "util" },
];

describe("Library script", () => {
  test("round-trips the rows", () => {
    const script = libraryScriptToLua(rows);
    expect(script).toBe(
      `${PREFIX}Test=require(p.."test")Util=require(p.."util")`,
    );
    expect(parseLibraryScript(script)).toEqual(rows);
    expect(parseLibraryScript(PREFIX)).toEqual([]);
  });

  test("survives compression on the way to the module", () => {
    const script = libraryScriptToLua(rows);
    expect(GridScript.compressScript(script)).toBe(script);
    expect(parseLibraryScript(`${PREFIX} Test=require(p.."test")`)).toEqual([
      rows[0],
    ]);
  });

  test.each([
    `print("hi")`,
    `${PREFIX} local Test=require(p.."test")`,
    `${PREFIX} Test=require(p.."test") print(Test)`,
    `${PREFIX} Test=require(p.."sub/test")`,
  ])("other scripts are not a Library block: %j", (script) => {
    expect(parseLibraryScript(script)).toBeNull();
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
    await installLibrary(findBundledLibrary("test"), 2, 255, module);
    expect(createDir).toHaveBeenCalledWith("/02", module);
    expect(writeFileContent).toHaveBeenCalledWith(
      "/02/test.lua",
      expect.any(String),
      module,
      expect.any(Number),
    );
    expect(invalidateLuaModule).toHaveBeenCalledWith("/02/test", module);
    expect(module.execLUAImmediateAndEvalaute.mock.calls[0][0]).toContain(
      "local e=ele[#ele] ",
    );
  });

  test("a failing Setup is reported", async () => {
    fetchDirEntries.mockResolvedValue([{ name: "02", type: "dir" }]);
    module.execLUAImmediateAndEvalaute.mockResolvedValue({
      value: [false, "boom"],
    });
    await expect(
      installLibrary(findBundledLibrary("test"), 2, 0, module),
    ).rejects.toThrow("Setup failed: boom");
    expect(createDir).not.toHaveBeenCalled();
  });
});
