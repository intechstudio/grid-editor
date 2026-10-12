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
  RESERVED_GLOBALS,
} from "../libraries/library-script";
import {
  bundledLibraries,
  findLibraryById,
  findLibraryByFile,
  readLibraryVersion,
} from "../libraries/registry";
import zonaSource from "../libraries/zona/zona.lua?raw";

beforeAll(async () => {
  await initLuaFormatter();
});

const PREFIX = `local p=string.format("/%02X/",gpc())`;

// Human and short firmware names: compressScript rewrites the former, the
// latter are firmware functions.
const FIRMWARE_NAMES = ["led_value", "page_current", "glp", "gms"];

// Canonical, as the editor writes it: no spaces between statements, the same
// line compressScript produces.
const editorWritten = [
  PREFIX,
  `${PREFIX}Z=require(p.."zona")`,
  `${PREFIX}Z=require(p.."zona")L=require(p.."layout")`,
  `${PREFIX}_lib2=require(p.."my_lib2")`,
];

// One space between statements, as in the RFC text or written by hand.
const spaced = [
  [`${PREFIX} Z=require(p.."zona")`, editorWritten[1]],
  [`${PREFIX} Z=require(p.."zona") L=require(p.."layout")`, editorWritten[2]],
  [`${PREFIX} _lib2=require(p.."my_lib2")`, editorWritten[3]],
];

describe("Library script format", () => {
  test.each(editorWritten)("round-trips %s", (script) => {
    expect(libraryScriptToLua(parseLibraryScript(script))).toBe(script);
  });

  test.each(spaced)("spaced %s writes back compressed", (script, expected) => {
    expect(libraryScriptToLua(parseLibraryScript(script))).toBe(expected);
  });

  test("parses rows", () => {
    expect(
      parseLibraryScript(
        `${PREFIX} Z=require(p.."zona") L=require(p.."layout")`,
      ),
    ).toEqual([
      { global: "Z", file: "zona" },
      { global: "L", file: "layout" },
    ]);
  });

  test("zero rows is the prefix alone", () => {
    expect(parseLibraryScript(PREFIX)).toEqual([]);
    expect(libraryScriptToLua([])).toBe(PREFIX);
  });

  test.each([
    "",
    `print("hi")`,
    `local p=string.format("/%02X/",page_current()) Z=require(p.."zona")`,
    `local p = string.format("/%02X/", gpc()) Z=require(p.."zona")`,
    `${PREFIX}  Z=require(p.."zona")`,
    `${PREFIX} Z=require(p.."zona") `,
    `${PREFIX}\nZ=require(p.."zona")`,
    `${PREFIX} local Z=require(p.."zona")`,
    `${PREFIX} Z=require("/01/zona")`,
    `${PREFIX} Z=require(p.."zona") print(Z)`,
    `${PREFIX} Z=require(p.."zona.lua")`,
    `${PREFIX} Z=require(p.."sub/zona")`,
    `${PREFIX} end=require(p.."zona")`,
    `${PREFIX} p=require(p.."zona")`,
    `${PREFIX} self=require(p.."zona")`,
    `${PREFIX}_efn=require(p.."zona")`,
    `${PREFIX}require=require(p.."zona")`,
    `${PREFIX} string=require(p.."zona")`,
    `${PREFIX}gpc=require(p.."zona")`,
    `${PREFIX}_ENV=require(p.."zona")`,
    `${PREFIX} Z=require(p..'zona')`,
    `${PREFIX}Z=require(p.."a-b")`,
    `${PREFIX}Z=require(p.."a--b")`,
    ...FIRMWARE_NAMES.flatMap((name) => [
      `${PREFIX}${name}=require(p.."zona")`,
      `${PREFIX}Z=require(p.."${name}")`,
    ]),
  ])("rejects non-canonical script %j", (script) => {
    expect(parseLibraryScript(script)).toBeNull();
  });

  test("serializing invalid rows throws", () => {
    expect(() =>
      libraryScriptToLua([{ global: "1Z", file: "zona" }]),
    ).toThrow();
    expect(() =>
      libraryScriptToLua([{ global: "Z", file: "zona.lua" }]),
    ).toThrow();
  });
});

describe("Library names", () => {
  test.each(["Z", "L", "_", "_zona", "Zona2", "layout_v2"])(
    "valid global %s",
    (name) => {
      expect(isValidGlobal(name)).toBe(true);
    },
  );

  test.each([
    "",
    "1Z",
    "Z-1",
    "Z.x",
    "end",
    "local",
    "nil",
    "goto",
    "p",
    "self",
    "_efn",
    "require",
    "string",
    "gpc",
    "_ENV",
    "Ä",
    ...FIRMWARE_NAMES,
  ])("invalid global %j", (name) => {
    expect(isValidGlobal(name)).toBe(false);
  });

  test.each(["zona", "layout", "my_lib2", "V2"])("valid file %s", (name) => {
    expect(isValidFile(name)).toBe(true);
  });

  test.each([
    "",
    "zona.lua",
    "a.b",
    "/01/zona",
    "sub/zona",
    'zo"na',
    "zo na",
    "a-b",
    "a--b",
    ...FIRMWARE_NAMES,
  ])("invalid file %j", (name) => {
    expect(isValidFile(name)).toBe(false);
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

describe("Compression", () => {
  test.each(editorWritten)("compressScript leaves %s unchanged", (script) => {
    expect(GridScript.compressScript(script)).toBe(script);
    expect(GridScript.compressScript(`--[[@lib]] ${script}`)).toBe(
      `--[[@lib]]${script}`,
    );
  });

  test.each(spaced)(
    "compressed %s reads back canonical",
    (script, expected) => {
      const compressed = GridScript.compressScript(`--[[@lib]] ${script}`);
      const [lib] = splitActions(compressed);
      expect(lib.script).toBe(expected);
      expect(libraryScriptToLua(parseLibraryScript(lib.script))).toBe(expected);
    },
  );

  test.each(editorWritten)("%s survives a whole compressed event", (line) => {
    const event = GridScript.compressScript(
      `--[[@lib]] ${line} --[[@gms]] self:gms(-1,-1,-1,-1) --[[@zst]] Z.start(self)`,
    );
    const actions = splitActions(event);
    expect(actions.map((e) => e.short)).toEqual(["lib", "gms", "zst"]);
    expect(actions[0].script).toBe(line);
    expect(parseLibraryScript(actions[0].script)).toEqual(
      parseLibraryScript(line),
    );
  });

  test("whole-event read-back gives the rows", () => {
    const event = GridScript.compressScript(
      `--[[@lib]] ${editorWritten[2]} --[[@zst]] Z.start(self)`,
    );
    expect(parseLibraryScript(splitActions(event)[0].script)).toEqual([
      { global: "Z", file: "zona" },
      { global: "L", file: "layout" },
    ]);
  });

  test("compressScript rewrites firmware names and hyphens, even in strings", () => {
    // Why isValidGlobal and isValidFile reject them.
    expect(
      GridScript.compressScript(`${PREFIX}led_value=require(p.."zona")`),
    ).toBe(`${PREFIX}glp=require(p.."zona")`);
    expect(
      GridScript.compressScript(`${PREFIX}Z=require(p.."led_value")`),
    ).toBe(`${PREFIX}Z=require(p.."glp")`);
    expect(GridScript.compressScript(`${PREFIX}Z=require(p.."a--b")`)).not.toBe(
      `${PREFIX}Z=require(p.."a--b")`,
    );
  });
});

describe("Library registry", () => {
  test("zona version is read from the source", () => {
    const zona = findLibraryById("zona");
    expect(zona).toBeDefined();
    expect(zona.version).toBe(/Z\.VERSION = "([^"]+)"/.exec(zonaSource)[1]);
    expect(zona.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(zona.source).toBe(zonaSource);
    expect(zona.global).toBe("Z");
    expect(zona.file).toBe("zona.lua");
  });

  test("lookup by file, with or without extension", () => {
    expect(findLibraryByFile("zona.lua")?.id).toBe("zona");
    expect(findLibraryByFile("zona")?.id).toBe("zona");
    expect(findLibraryByFile("layout.lua")).toBeUndefined();
    expect(findLibraryById("layout")).toBeUndefined();
  });

  test("registry entries are usable as Library block rows", () => {
    for (const lib of bundledLibraries) {
      expect(isValidGlobal(lib.global)).toBe(true);
      expect(isValidFile(lib.file.replace(/\.lua$/, ""))).toBe(true);
    }
  });

  test("readLibraryVersion", () => {
    expect(
      readLibraryVersion(`local Z={}\nZ.VERSION = "1.2.3"\nreturn Z`),
    ).toBe("1.2.3");
    expect(readLibraryVersion(`L.VERSION="10.0.1"`)).toBe("10.0.1");
    expect(readLibraryVersion(`-- Z.VERSION = "1.2.3"`)).toBeUndefined();
    expect(readLibraryVersion(`Z.VERSION = "1.2"`)).toBeUndefined();
  });
});

describe("Library row messages", () => {
  const globals = [
    "Z",
    "",
    "1Z",
    "end",
    "p",
    "self",
    "string",
    "led_value",
    "glp",
    "print",
  ];
  const files = [
    "zona",
    "",
    "zona.lua",
    "sub/zona",
    "a-b",
    "zo na",
    "led_value",
    "gms",
  ];

  test.each(globals)(
    "globalNameProblem agrees with isValidGlobal for %j",
    (name) => {
      expect(typeof globalNameProblem(name) === "undefined").toBe(
        isValidGlobal(name),
      );
    },
  );

  test.each(files)("fileNameProblem agrees with isValidFile for %j", (name) => {
    expect(typeof fileNameProblem(name) === "undefined").toBe(
      isValidFile(name),
    );
  });

  test("reasons name the cause", () => {
    expect(globalNameProblem("led_value")).toContain('"glp"');
    expect(globalNameProblem("gms")).toContain("firmware");
    expect(globalNameProblem("end")).toContain("keyword");
    expect(globalNameProblem("self")).toContain("local");
    expect(fileNameProblem("led_value")).toContain('"glp"');
    expect(fileNameProblem("a-b")).toContain("hyphen");
    expect(fileNameProblem("zona.lua")).toContain(".lua");
  });
});

describe("Built-in shadowing", () => {
  test.each(["print", "table", "math", "_G", "pairs", "EFN", "dirent"])(
    "%s shadows a built-in",
    (name) => {
      expect(shadowsBuiltinGlobal(name)).toBe(true);
      expect(isValidGlobal(name)).toBe(true);
    },
  );

  // Hard-rejected names are invalid, not shadowing warnings.
  test.each(["Z", "L", "zona", "string", "require", "ele", "self", "glp"])(
    "%s is not a shadowing warning",
    (name) => {
      expect(shadowsBuiltinGlobal(name)).toBe(false);
    },
  );
});

describe("Unchecked format", () => {
  test("matches libraryScriptToLua for valid rows", () => {
    const rows = [
      { global: "Z", file: "zona" },
      { global: "L", file: "layout" },
    ];
    expect(formatLibraryScript(rows)).toBe(libraryScriptToLua(rows));
    expect(formatLibraryScript([])).toBe(libraryScriptToLua([]));
  });

  test("writes rows that are still being edited", () => {
    expect(formatLibraryScript([{ global: "Z", file: "" }])).toBe(
      `${PREFIX}Z=require(p.."")`,
    );
  });
});

describe("Reserved globals", () => {
  test.each([...RESERVED_GLOBALS])("%s is rejected with a reason", (name) => {
    expect(isValidGlobal(name)).toBe(false);
    expect(globalNameProblem(name)).toEqual(expect.any(String));
    expect(
      parseLibraryScript(`${PREFIX}${name}=require(p.."zona")`),
    ).toBeNull();
  });
});
