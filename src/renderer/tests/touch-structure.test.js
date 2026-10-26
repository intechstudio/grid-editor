import { initLuaFormatter } from "@intechstudio/grid-protocol";
import { test, expect, describe, beforeAll } from "vitest";
import {
  insertRewrites,
  uniqueScripts,
} from "../config-blocks/ActionBlockInformation";
import { uniqueZoneScript } from "../config-blocks/touch/zone-blocks";
import {
  zoneBlockInformation,
  zoneEndInformation,
  zoneBodyRule,
  touchStartInformation,
  touchTickInformation,
} from "../config-blocks/touch/zone-block-info";
import {
  surfaceIssues,
  zoneSendProblem,
} from "../config-blocks/touch/zone-validate";
import {
  bodyRulesAt,
  isAllowedIn,
  isAllowedInBodies,
  pickerInsertIndex,
} from "../main/panels/configuration/components/ActionPickerFilter";

beforeAll(async () => {
  await initLuaFormatter();
});

const LIB = `local p=string.format("/%02X/",gpc())_Z=require(p.."zona")`;
const fader = (name, x = 0) =>
  `_Z.fader("${name}",${x},0,1,9,{},function(self)`;
const button = (name) => `_Z.button("${name}",2,0,2,2,{},function(self)`;
const BODY = "print(1)";

describe("pasted zones get unique names", () => {
  const zoneItem = (script) => ({ script, uniqueIn: uniqueZoneScript });

  test("a paste batch: against the event and the zones pasted before", () => {
    const event = [LIB, fader("f1"), BODY, "end)", "_Z.start(self)"];
    expect(
      uniqueScripts(event, [
        zoneItem(fader("f1")),
        { script: BODY },
        { script: "end)" },
        zoneItem(fader("f1", 1)),
        zoneItem(button("b1")),
        zoneItem(button("b1")),
      ]),
    ).toEqual([
      fader("f2"),
      BODY,
      "end)",
      fader("f3", 1),
      button("b1"),
      button("b2"),
    ]);
  });

  test("a name used by another kind counts too", () => {
    expect(uniqueZoneScript(fader("b1"), [button("b1")])).toBe(fader("f1"));
  });

  test("a free name is kept as written", () => {
    const handWritten = `_Z.fader( "vol", 0,0,1,9, {}, function(self)`;
    expect(uniqueZoneScript(handWritten, [fader("f1")])).toBe(handWritten);
  });

  test("only changed scripts are rewritten (a moved action keeps its synced script)", () => {
    const event = [LIB, fader("f1"), BODY, "end)"];
    expect(
      insertRewrites(event, [
        zoneItem(fader("f1")),
        { script: BODY },
        zoneItem(fader("f9")),
        { script: "end)" },
      ]),
    ).toEqual([[0, fader("f2")]]);
    // a move inside the event: the moved zone was removed first, nothing changes
    expect(
      insertRewrites([LIB, BODY], [zoneItem(fader("f1")), { script: BODY }]),
    ).toEqual([]);
  });

  test("lines that aren't zones are left alone", () => {
    expect(uniqueZoneScript(BODY, [BODY])).toBe(BODY);
    expect(uniqueScripts([BODY], [{ script: BODY }])).toEqual([BODY]);
  });

  test("zone blocks declare it", () => {
    for (const kind of ["fader", "button", "xy"]) {
      expect(zoneBlockInformation(kind).uniqueIn).toBe(uniqueZoneScript);
    }
  });
});

describe("which issues stop the send", () => {
  const setup = (...lines) => [LIB, ...lines, "_Z.start(self)"];

  test("a duplicate name: both zones", () => {
    const event = setup(
      fader("f1"),
      BODY,
      "end)",
      fader("f1", 1),
      BODY,
      "end)",
    );
    expect(zoneSendProblem(fader("f1"), event)).toBe(
      `Another zone is also named "f1"`,
    );
    expect(zoneSendProblem(fader("f1", 1), event)).toBeDefined();
  });

  // Forward compatibility: a Setup from the module or a profile stays
  // sendable; the problem shows on the zone's face.
  test.each([
    ["outside the grid", `_Z.fader("f1",8,0,2,9,{},function(self)`],
    [
      "an LED value this editor doesn't know",
      `_Z.fader("f1",0,0,1,9,{led=2},function(self)`,
    ],
    ["a value out of range", `_Z.fader("f1",0,0,1,9,{res=20},function(self)`],
  ])("a zone problem doesn't block: %s", (_, line) => {
    const event = setup(line, BODY, "end)");
    expect(surfaceIssues(event).some((e) => e.level === "error")).toBe(true);
    expect(zoneSendProblem(line, event)).toBeUndefined();
  });

  test("a duplicate blocks even when written differently", () => {
    const hand = `_Z.button( 'f1', 2,0,1,1, {}, function(self)`;
    const event = setup(fader("f1"), BODY, "end)", hand, BODY, "end)");
    expect(zoneSendProblem(hand, event)).toBe(
      `Another zone is also named "f1"`,
    );
  });

  test("order warnings only show", () => {
    const event = [fader("f1"), BODY, "end)"]; // no Touch Start
    expect(surfaceIssues(event).map((e) => e.level)).toEqual(["warning"]);
    expect(zoneSendProblem(fader("f1"), event)).toBeUndefined();
  });

  test("a valid Setup, and a line that isn't a zone", () => {
    const event = setup(fader("f1"), BODY, "end)", button("b1"), BODY, "end)");
    expect(zoneSendProblem(fader("f1"), event)).toBeUndefined();
    expect(zoneSendProblem(BODY, event)).toBeUndefined();
  });

  test("zone blocks declare it", () => {
    expect(zoneBlockInformation("xy").contextProblem).toBe(zoneSendProblem);
  });
});

// Actions as the picker sees them: only their information matters.
const at = (information) => ({ information });
const OPEN = at(zoneBlockInformation("fader"));
const END = at(zoneEndInformation);
const SINGLE = at({ type: "single" });
const IF = at({ type: "composite_open" });
const EN = at({ type: "composite_close" });
const START = at(touchStartInformation);

describe("inside a zone body", () => {
  test("the rules of the enclosing composites", () => {
    // lib, zfd, gms, zen, zst
    const actions = [SINGLE, OPEN, SINGLE, END, START];
    expect(bodyRulesAt(actions, 1)).toEqual([]);
    expect(bodyRulesAt(actions, 2)).toEqual([zoneBodyRule]);
    expect(bodyRulesAt(actions, 3)).toEqual([zoneBodyRule]);
    expect(bodyRulesAt(actions, 4)).toEqual([]);
    expect(bodyRulesAt(actions, 5)).toEqual([]);
  });

  test("an If inside a zone keeps the zone's rule", () => {
    // zfd, if, gms, en, zen
    const actions = [OPEN, IF, SINGLE, EN, END];
    expect(bodyRulesAt(actions, 2)).toEqual([zoneBodyRule]);
    expect(bodyRulesAt(actions, 4)).toEqual([zoneBodyRule]);
    expect(bodyRulesAt(actions, 5)).toEqual([]);
  });

  test("zones after a closed zone are outside", () => {
    const actions = [OPEN, SINGLE, END, OPEN, SINGLE, END];
    expect(bodyRulesAt(actions, 3)).toEqual([]);
    expect(bodyRulesAt(actions, 4)).toEqual([zoneBodyRule]);
  });

  const block = (short, category) => ({ short, category });

  test.each([
    ["gmss", "midi"],
    ["sglc", "led"],
    ["sglp", "led"],
    ["ggms", "hid"],
    ["gmms", "hid"],
    ["gks", "hid"],
    ["cb", "code"],
    ["c", "code"],
    ["if", "condition"],
    ["ei", "condition"],
    ["g", "variables"],
    ["l", "variables"],
    ["glut", "variables"],
  ])("offered inside: %s", (short, category) => {
    expect(isAllowedInBodies(block(short, category), [zoneBodyRule])).toBe(
      true,
    );
  });

  test.each([
    ["gms", "midi"], // the zone sends its own BODY
    ["zfd", "touch"],
    ["ztk", "touch"],
    ["zst", "touch"],
    ["lib", "code"],
    ["sn", "code"],
    ["glat", "led"],
    ["sbc", "element settings"],
    ["gtt", "timer"],
    ["for", "loop"],
    ["fst", "function"],
    ["bst0", "special"],
    ["en", null],
    ["s", "variables"], // self is the zone: self.x=… would shadow its getters
  ])("not offered inside: %s", (short, category) => {
    expect(isAllowedInBodies(block(short, category), [zoneBodyRule])).toBe(
      false,
    );
  });

  test("the picker filter applies the body rules", () => {
    const target = {
      elementType: "touch",
      eventType: "setup",
      isVirtual: false,
      moduleType: "ZONA",
    };
    const zone = zoneBlockInformation("fader");
    expect(isAllowedIn(zone, target)).toBe(true);
    expect(isAllowedIn(zone, { ...target, bodies: [zoneBodyRule] })).toBe(
      false,
    );
    expect(
      isAllowedIn(touchStartInformation, {
        ...target,
        bodies: [zoneBodyRule],
      }),
    ).toBe(false);
    expect(
      isAllowedIn(block("gms", "midi"), { ...target, bodies: [zoneBodyRule] }),
    ).toBe(false);
    expect(
      isAllowedIn(block("ggms", "hid"), { ...target, bodies: [zoneBodyRule] }),
    ).toBe(true);
  });
});

describe("Touch Start stays last, Touch Tick comes along", () => {
  test("the picker inserts before a Touch Start at the end", () => {
    const actions = [SINGLE, OPEN, SINGLE, END, START];
    expect(pickerInsertIndex(actions, 5)).toBe(4);
    expect(pickerInsertIndex(actions, 4)).toBe(4);
    expect(pickerInsertIndex(actions, 1)).toBe(1);
  });

  test("other last blocks don't move the insert", () => {
    expect(pickerInsertIndex([SINGLE, SINGLE], 2)).toBe(2);
    expect(pickerInsertIndex([], 0)).toBe(0);
  });

  test("zone blocks bring Touch Start (Setup) and Touch Tick (Timer)", () => {
    for (const kind of ["fader", "button", "xy"]) {
      expect(zoneBlockInformation(kind).companions).toEqual([
        { eventType: "setup", short: "zst", script: "_Z.start(self)" },
        { eventType: "timer", short: "ztk", script: "_Z.tick(self,{})" },
      ]);
    }
    expect(touchStartInformation.keepLast).toBe(true);
    expect(touchTickInformation.companions).toBeUndefined();
  });
});
