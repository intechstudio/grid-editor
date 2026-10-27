import { GridScript, initLuaFormatter } from "@intechstudio/grid-protocol";
import { test, expect, describe, beforeAll } from "vitest";
import {
  defaultZoneName,
  defaultZoneScript,
  zoneHeaderText,
  zoneFaceSections,
  optionPlaceholder,
  parseOptionText,
  withOption,
  withField,
  zoneBlockShort,
  enumOptions,
} from "../config-blocks/touch/zone-blocks";
import { SyntaxPreprocessor } from "../config-blocks/ActionBlockInformation";
import {
  zoneBlockInformation,
  zoneEndInformation,
  touchStartInformation,
  touchTickInformation,
} from "../config-blocks/touch/zone-block-info";
import {
  zoneOptionSchema,
  zoneTickSchema,
} from "../config-blocks/touch/zone-model";
import { parseZone, zoneToLua } from "../config-blocks/touch/zone-parse";
import { isAllowedIn } from "../main/panels/configuration/components/ActionPickerFilter";

beforeAll(async () => {
  await initLuaFormatter(); // checkSyntax needs it
});

const schema = (key) => zoneOptionSchema.find((e) => e.key === key);

describe("default zone", () => {
  test.each([
    ["fader", `_Z.fader("f1",0,0,1,9,{},function(self)`],
    ["button", `_Z.button("b1",0,0,2,2,{},function(self)`],
    ["xy", `_Z.xy("p1",0,0,4,4,{},function(self)`],
  ])("%s in an empty Setup: %s", (kind, script) => {
    expect(defaultZoneScript(kind, [])).toBe(script);
  });

  test("the next free number among the Setup's zones", () => {
    const setup = [
      `local p=string.format("/%02X/",gpc())local function r(n)local ok,m=pcall(require,p..n)if ok then return m end print(p..n..".lua missing")end _Z=r("zona")`,
      `_Z.fader("f1",0,0,1,9,{},function(self)`,
      "print(1)",
      "end)",
      `_Z.fader("f3",1,0,1,9,{},function(self)`,
      `_Z.button("f2",2,0,1,1,{},function(self)`, // any kind's name counts
      "_Z.start(self)",
    ];
    expect(defaultZoneName("fader", setup)).toBe("f4");
    expect(defaultZoneName("button", setup)).toBe("b1");
  });
});

test("header text, with what the zone sends", () => {
  const zone = parseZone(`_Z.fader("f1",0,0,1,9,{res=10},function(self)`);
  expect(zoneHeaderText(zone)).toBe("f1 · 0,0 1×9");
  expect(zoneHeaderText(zone, "CC 0/32 ch 1")).toBe(
    "f1 · 0,0 1×9 · CC 0/32 ch 1",
  );
});

describe("face sections", () => {
  test("geometry, MIDI, resolution and LED open, the rest collapsed", () => {
    expect(zoneFaceSections("fader").map((e) => [e.section, e.open])).toEqual([
      ["geometry", true],
      ["midi", true],
      ["resolution", true],
      ["led", true],
      ["behaviour", false],
      ["capture", false],
    ]);
  });

  test("msg offers the kind's values", () => {
    const msg = (kind) =>
      zoneFaceSections(kind)
        .flatMap((e) => e.options)
        .find((o) => o.key === "msg").values;
    expect(msg("fader")).toEqual(["cc", "pb", "none"]);
    expect(msg("button")).toEqual(["note", "cc", "none"]);
    expect(msg("xy")).toEqual(["cc", "none"]);
  });

  test("only the kind's options", () => {
    const keys = (kind) =>
      zoneFaceSections(kind).flatMap((e) => e.options.map((o) => o.key));
    expect(keys("fader")).toContain("dir");
    expect(keys("fader")).not.toContain("bmo");
    expect(keys("button")).toEqual(
      expect.arrayContaining(["bmo", "group", "res", "led"]),
    );
    expect(keys("button")).not.toContain("mode");
    expect(keys("button")).not.toContain("spring");
    expect(keys("fader")).toContain("spring");
    expect(keys("xy")).toContain("spring");
    expect(keys("xy")).toContain("fingers");
    expect(keys("fader")).not.toContain("fingers");
    expect(keys("xy")).not.toContain("dir");
    // `read` comes from the kind: no face shows it
    for (const kind of ["fader", "button", "xy"]) {
      expect(keys(kind)).not.toContain("read");
      expect(keys(kind)).toContain("led");
    }
  });
});

describe("enum select entries", () => {
  test("default first, then the schema's values", () => {
    expect(enumOptions(schema("mode"), "", "abs")).toEqual([
      { title: "default (abs)", value: "" },
      { title: "abs", value: "abs" },
      { title: "rel", value: "rel" },
      { title: "glide", value: "glide" },
    ]);
  });

  test("a value the schema doesn't know is listed, so it stays selected", () => {
    const options = enumOptions(schema("mode"), "spring", "abs");
    expect(options.at(-1)).toEqual({
      title: "spring (unknown)",
      value: "spring",
    });
    expect(options.filter((e) => e.value === "spring")).toHaveLength(1);
    expect(enumOptions(schema("mode"), "rel", "abs").at(-1).value).toBe(
      "glide",
    );
  });

  test("not for numbers", () => {
    expect(enumOptions(schema("res"), "10", "7")).toEqual([]);
  });
});

describe("field input", () => {
  test("placeholders show what the zone uses without the option", () => {
    expect(optionPlaceholder("fader", "res")).toBe("7");
    expect(optionPlaceholder("xy", "led")).toBe("1");
    expect(optionPlaceholder("button", "grab")).toBe("focus");
    expect(optionPlaceholder("fader", "min")).toBe("0");
  });

  test.each([
    ["res", "10", { value: 10 }],
    ["speed", " 0.5 ", { value: 0.5 }],
    ["mode", "glide", { value: "glide" }],
    ["res", "", {}],
    ["res", "ten", { error: "Enter a number" }],
  ])("%s %j", (key, text, result) => {
    expect(parseOptionText(schema(key), text)).toEqual(result);
  });

  const fader = parseZone(
    `_Z.fader("f1",0,0,1,9,{mode="glide"},function(self)`,
  );

  test("setting an option writes the line", () => {
    const { next } = withOption(fader, schema("res"), "14");
    expect(zoneToLua(next)).toBe(
      `_Z.fader("f1",0,0,1,9,{res=14,mode="glide"},function(self)`,
    );
  });

  test("an empty field leaves the option out", () => {
    const { next } = withOption(fader, schema("mode"), "");
    expect(zoneToLua(next)).toBe(`_Z.fader("f1",0,0,1,9,{},function(self)`);
  });

  test("text that isn't a number is an error, nothing to write", () => {
    expect(withOption(fader, schema("res"), "x")).toEqual({
      error: "Enter a number",
    });
    expect(withField(fader, "w", "")).toEqual({ error: "Enter a number" });
    expect(withField(fader, "name", 'a"b')).toEqual({
      error: "No quotes or backslashes",
    });
  });

  test("an out-of-range value is written; the validator rejects it", () => {
    const { next } = withOption(fader, schema("res"), "20");
    expect(zoneToLua(next)).toBe(
      `_Z.fader("f1",0,0,1,9,{res=20,mode="glide"},function(self)`,
    );
  });

  test("geometry and name fields", () => {
    expect(zoneToLua(withField(fader, "x", "3").next)).toBe(
      `_Z.fader("f1",3,0,1,9,{mode="glide"},function(self)`,
    );
    expect(withField(fader, "name", "vol").next.name).toBe("vol");
  });

  test("works for tick options", () => {
    const { next } = withOption({ opt: {} }, zoneTickSchema[0], "40");
    expect(next).toEqual({ opt: { ms: 40 } });
  });
});

describe("block information", () => {
  const TOUCH_SETUP = {
    elementType: "touch",
    eventType: "setup",
    isVirtual: false,
    moduleType: "ZONA",
  };

  test.each(["fader", "button", "xy"])(
    "%s inserts the zone line and the end, no MIDI child",
    (kind) => {
      const info = zoneBlockInformation(kind);
      expect(info.short).toBe(zoneBlockShort[kind]);
      expect(info.type).toBe("composite_open");
      expect(info.category).toBe("touch");
      expect(
        info.defaultLuaIn([`_Z.fader("f1",0,0,1,9,{},function(self)`]),
      ).toBe(
        defaultZoneScript(kind, [`_Z.fader("f1",0,0,1,9,{},function(self)`]),
      );
      expect(info.compositeLua).toEqual([{ short: "zen", script: "end)" }]);
      expect(isAllowedIn(info, TOUCH_SETUP)).toBe(true);
      expect(isAllowedIn(info, { ...TOUCH_SETUP, eventType: "timer" })).toBe(
        false,
      );
      expect(isAllowedIn(info, { ...TOUCH_SETUP, elementType: "button" })).toBe(
        false,
      );
      expect(isAllowedIn(info, { ...TOUCH_SETUP, isVirtual: true })).toBe(
        false,
      );
      expect(isAllowedIn(info, { ...TOUCH_SETUP, moduleType: "EN16" })).toBe(
        false,
      );
    },
  );

  test("the syntax check closes the line, so a bad unknown option fails", () => {
    const pre = zoneBlockInformation("fader").syntaxPreprocessor;
    expect(
      GridScript.checkSyntax(
        pre.generate(`_Z.fader("f1",0,0,1,9,{res=10},function(self)`),
      ),
    ).toBe(true);
    expect(
      GridScript.checkSyntax(
        pre.generate(`_Z.fader("f1",0,0,1,9,{glow=1 tag=2},function(self)`),
      ),
    ).toBe(false);
    expect(
      GridScript.checkSyntax(
        pre.generate(`_Z.fader("f1",0,0,1,9,{end=1},function(self)`),
      ),
    ).toBe(false);
  });

  test("every Touch block is for the ZONA only", () => {
    for (const info of [
      ...["fader", "button", "xy"].map(zoneBlockInformation),
      touchStartInformation,
      touchTickInformation,
    ]) {
      expect(info.moduleTypes).toEqual(["ZONA"]);
      expect(info.category).toBe("touch");
    }
  });

  test("Touch End is not offered in the picker", () => {
    expect(zoneEndInformation.category).toBeNull();
    expect(zoneEndInformation.type).toBe("composite_close");
  });
});

// GridAction.updateData checks the brackets of this text.
describe("bracket check text", () => {
  test("a zone line is checked closed by its Touch End", () => {
    const pre = zoneBlockInformation("fader").syntaxPreprocessor;
    expect(
      pre.bracketCheckText(`_Z.fader("f1",0,0,1,9,{},function(self)`),
    ).toBe(`_Z.fader("f1",0,0,1,9,{},function(self) end)`);
  });

  test('"" (close blocks, raw) checks the script itself', () => {
    expect(new SyntaxPreprocessor("").bracketCheckText("f((x)")).toBe("f((x)");
  });

  test('"$SCRIPT$ end" wraps without adding brackets', () => {
    expect(
      new SyntaxPreprocessor("$SCRIPT$ end").bracketCheckText("x = function()"),
    ).toBe("x = function() end");
  });
});
