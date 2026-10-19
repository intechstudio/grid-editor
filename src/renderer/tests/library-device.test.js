import { GridScript, initLuaFormatter } from "@intechstudio/grid-protocol";
import { test, expect, describe, beforeAll, beforeEach, vi } from "vitest";

// The runtime and the logger store pull in the app; the File Manager calls
// are checked by their arguments rather than by the Lua they send.
vi.mock("../runtime/runtime", () => ({}));
vi.mock("../runtime/runtime.store", () => ({ logger: { set: vi.fn() } }));
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
  installLibrary,
  readBoundLibraries,
  rerunSetup,
} from "../libraries/library-device";
import { findLibraryById } from "../libraries/registry";

beforeAll(async () => {
  await initLuaFormatter();
});

let module;
beforeEach(() => {
  vi.clearAllMocks();
  module = { execLUAImmediateAndEvalaute: vi.fn(), dx: 0, dy: 0 };
});

describe("readBoundLibraries", () => {
  test("decodes one pair per global, padded with false", async () => {
    module.execLUAImmediateAndEvalaute.mockResolvedValue({
      value: [true, false, true, "1.0.0", false, false],
    });
    expect(await readBoundLibraries(["Util", "Test", "Gone"], module)).toEqual({
      Util: { bound: true },
      Test: { bound: true, version: "1.0.0" },
      Gone: { bound: false },
    });
    expect(module.execLUAImmediateAndEvalaute.mock.calls[0][0]).toContain(
      `ipairs({"Util","Test","Gone"})`,
    );
  });

  test("no globals sends nothing", async () => {
    expect(await readBoundLibraries([], module)).toEqual({});
    expect(module.execLUAImmediateAndEvalaute).not.toHaveBeenCalled();
  });
});

describe("rerunSetup", () => {
  const rows = [
    { global: "Test", file: "test" },
    { global: "Util", file: "util" },
  ];

  test("selects the system element as the last entry", async () => {
    module.execLUAImmediateAndEvalaute.mockResolvedValue({ value: [true] });
    await rerunSetup(255, 0, module);
    await rerunSetup(3, 0, module);
    const [system, element] = module.execLUAImmediateAndEvalaute.mock.calls;
    expect(system[0]).toContain("local e=ele[#ele] ");
    expect(element[0]).toContain("local e=ele[3] ");
  });

  test("releases the globals and their modules before Setup", async () => {
    module.execLUAImmediateAndEvalaute.mockResolvedValue({ value: [true] });
    await rerunSetup(0, 2, module, rows);
    const script = module.execLUAImmediateAndEvalaute.mock.calls[0][0];
    expect(script).toContain(`{{"Test","/02/test"},{"Util","/02/util"}}`);
    expect(script).toContain("_G[n]=nil package.loaded[r[2]]=nil");
    expect(script.indexOf("collectgarbage()")).toBeLessThan(
      script.indexOf("pcall(e.ini,e)"),
    );
  });

  test("no Setup throws without the reload hint", async () => {
    module.execLUAImmediateAndEvalaute.mockResolvedValue({
      value: [false, "no Setup"],
    });
    await expect(rerunSetup(0, 0, module, rows)).rejects.toThrow(
      /^Setup failed: no Setup$/,
    );
  });

  test("a failed Setup says how to reload", async () => {
    module.execLUAImmediateAndEvalaute.mockResolvedValue({
      value: [false, "boom"],
    });
    await expect(rerunSetup(0, 0, module, rows)).rejects.toThrow(
      "Setup failed: boom. Change to another page and back to reload it",
    );
  });
});

describe("installLibrary", () => {
  const library = findLibraryById("test");

  test("creates a missing page folder, writes, then invalidates", async () => {
    fetchDirEntries.mockResolvedValue([{ name: "01", type: "dir" }]);
    await installLibrary(library, 0, module);
    expect(createDir).toHaveBeenCalledWith("/00", module);
    expect(writeFileContent).toHaveBeenCalledWith(
      "/00/test.lua",
      GridScript.compressScript(library.source),
      module,
      expect.any(Number),
    );
    expect(invalidateLuaModule).toHaveBeenCalledWith("/00/test", module);
  });

  test("leaves an existing page folder alone", async () => {
    fetchDirEntries.mockResolvedValue([{ name: "00", type: "dir" }]);
    await installLibrary(library, 0, module);
    expect(createDir).not.toHaveBeenCalled();
    expect(writeFileContent).toHaveBeenCalled();
  });
});
