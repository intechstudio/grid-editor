import { initLuaFormatter } from "@intechstudio/grid-protocol";
import { test, expect, beforeAll } from "vitest";
import { createZonaVM, DOWN, UP } from "./zona-vm";
import {
  parseZone,
  parseZones,
  zonesToLua,
  zoneToLua,
} from "../config-blocks/touch/zone-parse";
import {
  surfaceIssues,
  validateSurface,
  zoneProblems,
  zoneSendProblem,
} from "../config-blocks/touch/zone-validate";
import {
  zoneMidi,
  zoneMidiAt,
  zoneOutputLabel,
} from "../config-blocks/touch/zone-autos";
import {
  defaultZoneScript,
  uniqueZoneScript,
  withZoneType,
  zoneType,
  zoneTypeLabel,
  addedZone,
  placedCopy,
  zoneCssColor,
  zoneFaceSections,
  zoneOptionSuggestions,
  withOutput,
  zoneOutputText,
  enumOptions,
  optionPlaceholder,
  optionShownText,
  withOption,
} from "../config-blocks/touch/zone-blocks";
import { zoneOptionSchemaFor } from "../config-blocks/touch/zone-model";
import { overlayZones } from "../main/grid-layout/grid-modules/overlays/touch-zones";

beforeAll(async () => {
  await initLuaFormatter();
});

const LIB = `_Z=gr("zona")`;
// a new XY pad and a new button, as the editor writes them: positional, with a
// table per group (geometry, colour, output, range, behaviour, capture)
const XY = (name) =>
  `_Z.zone(self,"${name}",2,{0,0,5,5},{-1,-1,-1},{0,-1,-1,0},{0,1,-1,0,0},{1,1,0})`;
const BTN = (name, x = 5) =>
  `_Z.zone(self,"${name}",3,{${x},0,2,2},{-1,-1,-1},{2,-1,-1,0},{0,1,-1,0,0},{1,1,0})`;

// The editor writes the positional form with every slot defined. The older
// option-table lines still read and are written in the new form.
test.each([
  [
    `_Z.fader(self,"f1",1,0,1,9,{mode="rel",sensitivity=0.5})`,
    `_Z.zone(self,"f1",0,{1,0,1,9},{-1,-1,-1},{0,-1,-1,0},{1,0.5,-1,0,0},{1,1,0})`,
  ],
  [
    `_Z.button(self,"b1",0,0,1,1,{bmo=3,group=2,col={255,128,0,1},cmd="cc"})`,
    `_Z.zone(self,"b1",3,{0,0,1,1},{255,128,0},{0,-1,-1,0},{0,1,-1,3,2},{1,1,0})`,
  ],
  [
    `_Z.fader(self,"p1",0,0,9,9,{dir="xy",fingers=3,ch=3,num=7,rx=1})`,
    `_Z.zone(self,"p1",2,{0,0,9,9},{-1,-1,-1},{0,3,7,1},{0,1,-1,0,0},{3,1,0})`,
  ],
  [
    `_Z.fader(self,"p",0,0,4,4,{dir="xy",msg="mouse"})`,
    `_Z.zone(self,"p",2,{0,0,4,4},{-1,-1,-1},{4,-1,1,0},{0,1,-1,0,0},{1,1,0})`,
  ],
  [
    `_Z.fader(self,"g",0,0,1,9,{msg="pad"})`,
    `_Z.zone(self,"g",0,{0,0,1,9},{-1,-1,-1},{5,-1,-1,0},{0,1,-1,0,0},{1,1,0})`,
  ],
  // the range follows the command
  [
    `_Z.fader(self,"f",0,0,1,9,{cmd="pb"})`,
    `_Z.zone(self,"f",0,{0,0,1,9},{-1,-1,-1},{3,-1,-1,0},{0,1,-1,0,0},{1,1,0})`,
  ],
])("a zone line is written positional and fully defined: %s", (line, full) => {
  expect(zoneToLua(parseZone(line))).toBe(full);
  // and reads back and writes the same
  expect(zoneToLua(parseZone(full))).toBe(full);
});

test("a positional line may end a table early, and the rest is the default", () => {
  // cells, colour, output, behaviour, capture
  const zone = parseZone(`_Z.zone(self,"f1",1,{0,0,3,1},{},{0},{1},{})`);
  expect(zone.kind).toBe("fader");
  expect(zone.opt).toEqual({ dir: "h", msg: "midi", cmd: "cc", mode: "rel" });
  // the type by name, as an earlier build wrote it, still reads
  expect(
    parseZone(`_Z.zone(self,"f1","h",{0,0,3,1},{},{},{},{})`).opt.dir,
  ).toBe("h");
  expect(parseZone(`_Z.zone(self,"f1",3,{0,0,3,1},{},{},{},{})`).kind).toBe(
    "button",
  );
  // wrong shapes are not zone lines
  for (const bad of [
    `_Z.zone(self,"f1",9,{0,0,3,1},{},{},{},{})`,
    `_Z.zone(self,"f1",0,{0,0,3},{},{},{},{})`,
    `_Z.zone(self,"f1",0,{0,0,3,1},{1,2,3,4,5},{},{},{})`,
    `_Z.zone(self,"f1",0,{0,0,3,1},{},{},{})`,
    `_Z.zone(self,"f1",0,{0,0,3,1},{},{0,1,2,3,4,5,6},{},{})`,
    `_Z.zone(self,"f1",0,{0,0,3,1},{},{msg="midi"},{},{})`,
  ]) {
    expect(parseZone(bad)).toBe(null);
  }
});

test("a range in an older line is dropped: it follows the command", () => {
  // the six-table layout of an earlier build, with {min, max} after the output
  const old = parseZone(
    `_Z.zone(self,"f1",0,{0,0,1,9},{},{0,-1,-1,0},{10,100},{0,1,-1,0,0},{1,1,0})`,
  );
  expect(old.opt).not.toHaveProperty("min");
  expect(old.opt).not.toHaveProperty("max");
  expect(old.opt.mode).toBe("abs");
  expect(zoneToLua(old)).not.toContain("{10,100}");
  // the option-table form: min and max are dropped, not kept as unknown
  const legacy = parseZone(`_Z.fader(self,"f",0,0,1,9,{min=10,max=100,ch=2})`);
  expect(legacy.opt).toEqual({ ch: 2 });
  expect(legacy.unknown).toBeUndefined();
  expect(zoneToLua(legacy)).not.toMatch(/min|100/);
});

test("a colour is written like Simple Color, and the old hex text still reads", () => {
  expect(
    parseZone(`_Z.button(self,"b",0,0,1,1,{col={-1,64,255,0.5}})`).opt.col,
  ).toBe("-1,64,255");
  const old = parseZone(`_Z.button(self,"b",0,0,1,1,{col="ff8000"})`);
  expect(zoneToLua(old)).toContain(`{255,128,0}`);
  expect(
    issues([LIB, `_Z.button(self,"b",0,0,1,1,{col={300,0,0,1}})`]).length,
  ).toBe(1);
});

test("an old line with a body is not a zone line", () => {
  expect(parseZone(`_Z.fader("f1",0,0,1,9,{},function(self)`)).toBe(null);
  expect(parseZone("end)")).toBe(null);
});

test("an option the editor doesn't know is kept as written", () => {
  const line = `_Z.fader(self,"f",0,0,1,9,{glow=2,shape={1,2},tag="x"})`;
  // kept in a last table, as written
  expect(zoneToLua(parseZone(line))).toMatch(
    /,\{glow=2,shape=\{1,2\},tag="x"\}\)$/,
  );
  expect(parseZone(zoneToLua(parseZone(line))).unknown).toBe(
    `glow=2,shape={1,2},tag="x"`,
  );
});

test("an option at its default is still written", () => {
  const zone = {
    name: "b",
    kind: "button",
    x: 0,
    y: 0,
    w: 1,
    h: 1,
    opt: { bmo: 1, msg: "midi", cmd: "note", ch: -1, num: -1, rx: 0 },
  };
  expect(zoneToLua(zone)).toBe(
    `_Z.zone(self,"b",3,{0,0,1,1},{-1,-1,-1},{2,-1,-1,0},{0,1,-1,1,0},{1,1,0})`,
  );
});

// A touch Setup as [script], with its zones parsed the way the overlay does.
function issues(scripts) {
  const zones = scripts.map(parseZone).filter((e) => e !== null);
  return validateSurface(zones);
}
const fader = (name, x, opt = "") =>
  `_Z.fader(self,"${name}",${x},0,1,9,{${opt}})`;

test("a complete Setup has no issues", () => {
  expect(issues([LIB, fader("a", 0), fader("b", 1)])).toEqual([]);
});

test("two zones with the same name are an error", () => {
  expect(issues([LIB, fader("a", 0), fader("a", 1)])).toEqual([
    { zone: "a", level: "error", message: `Another zone is also named "a"` },
  ]);
});

test("an option out of range is an error on its zone", () => {
  expect(issues([LIB, fader("a", 0, 'mode="rel",sensitivity=20')])).toEqual([
    { zone: "a", level: "error", message: "Use 0.01 to 10" },
  ]);
});

test("the CC and channel the editor shows are what the library sends", async () => {
  // module at 1,2 on page 1: channel (2*4+1)%16 = 9, CCs from 32+16
  const lines = [
    `_Z.fader(self,"f1",0,0,1,9,{})`,
    `_Z.button(self,"b1",1,0,2,2,{})`,
    `_Z.fader(self,"p1",3,0,4,4,{dir="xy"})`,
    `_Z.fader(self,"f2",8,0,1,9,{})`,
  ];
  const zones = lines.map(parseZone);
  const vm = await createZonaVM({ gmx: 1, gmy: 2, gpc: 1 });
  vm.setup(lines.join(" "));
  // a touch in each zone, and the first message it sends
  const sent = [
    [50, 0],
    [200, 100],
    [796, 0],
    [960, 0],
  ].map(([x, y]) => {
    vm.clear();
    vm.touch([0, DOWN, x, y], [0, UP, x, y]);
    return vm.midi()[0];
  });
  const shown = zones.map((_, i) =>
    zoneMidi(zones, i, { dx: 1, dy: 2, page: 1 }),
  );
  expect(sent).toEqual(
    shown.map((m) => [m.ch, m.type === "note" ? 144 : 176, m.nums[0], 127]),
  );
  expect(shown.map((m) => m.nums)).toEqual([[48], [49], [50, 51], [52]]);
});

test("the library treats a fully defined line like the short one", async () => {
  const lines = [
    `_Z.fader(self,"f1",0,0,1,9,{})`,
    `_Z.button(self,"b1",1,0,2,2,{})`,
    `_Z.fader(self,"p1",3,0,4,4,{dir="xy",cmd="cc14",ch=2})`,
    `_Z.fader(self,"f2",8,0,1,9,{cmd="pb",spring=50})`,
    `_Z.button(self,"b2",1,3,2,2,{msg="mouse",bmo=1})`,
    `_Z.fader(self,"g1",7,0,1,9,{msg="pad",col={255,0,0,1}})`,
  ];
  const run = async (setup) => {
    const vm = await createZonaVM({ gmx: 1, gmy: 2, gpc: 1 });
    vm.setup(setup.join(" "));
    const led = ["gln", "gld", "glx", "glp"].map((fn) => vm.calls(fn));
    const touches = [
      [50, 0],
      [200, 100],
      [796, 0],
      [960, 0],
      [200, 400],
      [900, 500],
    ].map(([x, y]) => {
      vm.clear();
      vm.touch([0, DOWN, x, y], [0, UP, x, y]);
      return [vm.midi(), vm.calls("gmbs"), vm.calls("ggms")];
    });
    return { led, touches };
  };
  const full = lines.map((e) => zoneToLua(parseZone(e)));
  expect(full[0]).not.toBe(lines[0]);
  expect(await run(full)).toEqual(await run(lines));
});

test("the gamepad axes and buttons the editor shows are what the library sends", async () => {
  const lines = [
    `_Z.fader(self,"f1",0,0,1,9,{msg="pad"})`,
    `_Z.button(self,"b1",1,0,2,2,{msg="pad"})`,
    `_Z.fader(self,"p1",3,0,4,4,{dir="xy",msg="pad"})`,
    `_Z.fader(self,"f2",8,0,1,9,{msg="pad"})`,
  ];
  const zones = lines.map(parseZone);
  const vm = await createZonaVM();
  vm.setup(lines.join(" "));
  // a touch in each zone, and the targets it sends
  const sent = [
    [50, 0],
    [200, 100],
    [796, 0],
    [960, 0],
  ].map(([x, y]) => {
    vm.clear();
    vm.touch([0, DOWN, x, y]);
    const press = [...vm.calls("ggms"), ...vm.calls("ggbs")];
    vm.touch([0, UP, x, y]);
    return press.map((e) => e.args[0]);
  });
  const shown = zones.map((_, i) =>
    zoneMidi(zones, i, { dx: 0, dy: 0, page: 0 }),
  );
  expect(sent).toEqual(shown.map((m) => m.nums));
  expect(sent).toEqual([[0], [0], [1, 2], [3]]);
  expect(zones.map((z, i) => zoneOutputLabel(z, shown[i]))).toEqual([
    "Gamepad X",
    "Gamepad button 0",
    "Gamepad Y, Z",
    "Gamepad RX",
  ]);
});

test("zone lines become rectangles on the overlay, in order", () => {
  const setup = [
    LIB,
    `_Z.fader(self,"f1",0,0,1,9,{})`,
    `_Z.fader(self,"p1",3,0,4,4,{dir="xy"})`,
  ].map((script, i) => ({ id: `a${i}`, script }));
  // percent of the surface, rounded
  expect(
    overlayZones(setup).map(({ zone, rect }) => [
      zone.name,
      ...[rect.left, rect.top, rect.width, rect.height].map(Math.round),
    ]),
  ).toEqual([
    ["f1", 0, 0, 11, 100],
    ["p1", 33, 0, 44, 44],
  ]);
});

// The face's option keys of a zone line, in display order.
const fields = (line) =>
  zoneFaceSections(parseZone(line)).flatMap((e) => e.options.map((o) => o.key));

test("a mouse zone's face shows only the fields mouse uses", () => {
  expect(fields(`_Z.fader(self,"p1",0,0,4,4,{dir="xy",msg="mouse"})`)).toEqual([
    "dir",
    "col",
    "out",
    "tap",
    "sensitivity",
    "grab",
  ]);
  expect(fields(`_Z.button(self,"b1",0,0,2,2,{msg="mouse"})`)).toEqual([
    "col",
    "out",
    "num",
    "bmo",
    "group",
    "grab",
  ]);
});

test("a gamepad zone's face shows its target and the value behaviour", () => {
  expect(fields(`_Z.fader(self,"f1",0,0,1,9,{msg="pad"})`)).toEqual([
    "dir",
    "col",
    "out",
    "num",
    "mode",
    "spring",
    "grab",
  ]);
});

test("sensitivity shows in relative mode, and always for the mouse", () => {
  // absolute mode takes the finger's position as it is
  expect(fields(`_Z.fader(self,"f1",0,0,1,9,{})`)).not.toContain("sensitivity");
  expect(fields(`_Z.fader(self,"f1",0,0,1,9,{mode="rel"})`)).toContain(
    "sensitivity",
  );
  expect(
    fields(`_Z.fader(self,"p1",0,0,4,4,{dir="xy",msg="mouse"})`),
  ).toContain("sensitivity");
});

test("the header names the mouse output", () => {
  const label = (line) => zoneOutputLabel(parseZone(line), null);
  expect(label(`_Z.fader(self,"p1",0,0,4,4,{dir="xy",msg="mouse"})`)).toBe(
    "Mouse",
  );
  expect(label(`_Z.fader(self,"f1",0,0,1,9,{msg="mouse"})`)).toBe(
    "Mouse wheel",
  );
  expect(label(`_Z.button(self,"b1",0,0,2,2,{msg="mouse"})`)).toBe(
    "Mouse Left",
  );
  expect(label(`_Z.button(self,"b1",0,0,2,2,{msg="mouse",num=2})`)).toBe(
    "Mouse Right",
  );
});

test("an XY pad is a fader with the XY Pad direction", () => {
  const line = `_Z.fader(self,"p1",0,0,4,4,{dir="xy"})`;
  expect(fields(line)).toContain("fingers");
  expect(fields(`_Z.fader(self,"f1",0,0,1,9,{})`)).not.toContain("fingers");
  // an XY pad sends CCs only, 7 or 14 bit
  expect(
    issues([LIB, `_Z.fader(self,"p",0,0,4,4,{dir="xy",cmd="pb"})`]),
  ).toEqual([{ zone: "p", level: "error", message: "Use one of cc, cc14" }]);
});

test("a new Touch Zone is a 5x5 XY pad and a new button is 2x2", () => {
  expect(defaultZoneScript("fader", [])).toBe(`${LIB} ${XY("f1")}`);
  expect(defaultZoneScript("button", [])).toBe(`${LIB} ${BTN("b1", 0)}`);
});

test("the Type select resets every setting but the position, size and colour", () => {
  const pad = parseZone(
    `_Z.fader(self,"f1",2,1,5,4,{dir="xy",tap=0,cmd="cc14",ch=2,spring=50,col={255,128,0,1}})`,
  );
  expect(zoneType(pad)).toBe("xy");
  expect(zoneTypeLabel(pad)).toBe("XY Pad");
  const opts = (zone) => parseZone(zoneToLua(zone)).opt;
  const button = withZoneType(pad, "button", [
    `_Z.button(self,"b1",0,0,1,1,{})`,
  ]);
  // a default name follows the kind; position, size and colour stay
  expect([button.name, button.kind]).toEqual(["b2", "button"]);
  expect([button.x, button.y, button.w, button.h]).toEqual([2, 1, 5, 4]);
  expect(button.opt).toEqual({ col: "255,128,0" });
  expect(zoneType(button)).toBe("button");
  // the settings are the button's defaults, and the block has no problems
  expect(opts(button)).toEqual({
    col: "255,128,0",
    msg: "midi",
    cmd: "note",
    ch: -1,
    num: -1,
    rx: 0,
    bmo: 0,
    group: 0,
    grab: "focus",
  });
  expect(zoneProblems(parseZone(zoneToLua(button)))).toEqual([]);
  // another type: again only the type, position, size and colour
  const back = withZoneType(button, "h", []);
  expect(back.name).toBe("f1");
  expect(back.opt).toEqual({ col: "255,128,0", dir: "h" });
  expect(opts(back)).toMatchObject({ dir: "h", cmd: "cc", ch: -1, spring: -1 });
  // a type between faders resets too
  const edited = parseZone(
    `_Z.fader(self,"f1",0,0,2,2,{dir="h",cmd="pb",ch=3})`,
  );
  expect(withZoneType(edited, "xy", []).opt).toEqual({ dir: "xy" });
  // the same type changes nothing
  expect(withZoneType(edited, "h", [])).toBe(edited);
});

const TWO = `${XY("f1")} ${BTN("b1")}`;

test("one block defines several zones, read and written in order", () => {
  const zones = parseZones(TWO);
  expect(zones.map((e) => [e.name, e.kind])).toEqual([
    ["f1", "fader"],
    ["b1", "button"],
  ]);
  // the block's script starts with the call that loads the library
  expect(zonesToLua(zones)).toBe(`_Z=gr("zona") ${TWO}`);
  // the call is optional on reading, so older scripts still parse
  expect(parseZones(`_Z=gr("zona") ${TWO}`).length).toBe(2);
  expect(parseZones(`_Z=gr("zona")${TWO}`).length).toBe(2);
  expect(parseZones(`_Z=gr("other") ${TWO}`)).toBe(null);
  // compressed scripts carry no space between the lines
  expect(parseZones(TWO.replace(") _Z", ")_Z")).length).toBe(2);
  expect(parseZones(`${TWO} end`)).toBe(null);
  expect(parseZones("")).toBe(null);
});

test("zone names are unique across a block and the Setup", () => {
  const dup = `_Z.fader(self,"a",0,0,1,1,{}) _Z.fader(self,"a",1,0,1,1,{})`;
  expect(surfaceIssues([dup]).map((e) => e.message)).toEqual([
    `Another zone is also named "a"`,
  ]);
  expect(zoneSendProblem(dup, [dup])).toBe(`Another zone is also named "a"`);
  expect(zoneSendProblem(TWO, [TWO])).toBeUndefined();
  expect(zoneSendProblem(TWO, [TWO, `_Z.fader(self,"b1",0,0,1,1,{})`])).toBe(
    `Another zone is also named "b1"`,
  );
  // a pasted block renames each zone that collides
  expect(uniqueZoneScript(TWO, [TWO])).toBe(`${LIB} ${XY("f2")} ${BTN("b2")}`);
});

test("the overlay draws every zone of a block and the autos count them", () => {
  const setup = [{ id: "a", script: TWO }];
  expect(
    overlayZones(setup).map((e) => [e.actionId, e.index, e.zone.name]),
  ).toEqual([
    ["a", 0, "f1"],
    ["a", 1, "b1"],
  ]);
  const pos = { dx: 0, dy: 0, page: 0 };
  // an XY pad takes two CC slots, so the button after it is on the third
  expect(zoneMidiAt([TWO], 0, pos, 0).nums).toEqual([32, 33]);
  expect(zoneMidiAt([TWO], 0, pos, 1).type).toBe("note");
  expect(zoneMidiAt([TWO], 0, pos, 1).nums).toEqual([34]);
  expect(zoneMidiAt([TWO], 0, pos, 2)).toBeUndefined();
});

test("a zone's preview colour is its col, with the module's colour for -1", () => {
  const auto = { red: 10, green: 20, blue: 30 };
  expect(zoneCssColor({ opt: { col: "255,128,0" } }, auto)).toBe(
    "rgb(255,128,0)",
  );
  expect(zoneCssColor({ opt: { col: "-1,64,255,0.5" } }, auto)).toBe(
    "rgb(10,64,255)",
  );
  expect(zoneCssColor({ opt: {} }, auto)).toBe("rgb(10,20,30)");
  expect(zoneCssColor({ opt: {} })).toBeUndefined();
});

test("Add Zone copies the selected zone to its right, else below, else a 1x1 button", () => {
  const z = (name, x, y, w, h, opt = {}) =>
    parseZone(`_Z.fader(self,"${name}",${x},${y},${w},${h},{dir="xy"})`) ?? {
      name,
      kind: "fader",
      x,
      y,
      w,
      h,
      opt,
    };
  const pad = z("f1", 0, 0, 4, 4);
  const right = addedZone(pad, [pad]);
  expect([right.name, right.x, right.y, right.w, right.h]).toEqual([
    "f2",
    4,
    0,
    4,
    4,
  ]);
  expect(right.opt).toEqual({ dir: "xy" });
  // no room on the right: below
  const wide = z("f1", 0, 0, 6, 4);
  const below = addedZone(wide, [wide]);
  expect([below.x, below.y, below.w, below.h]).toEqual([0, 4, 6, 4]);
  // right taken by another zone: below
  const left = z("f1", 0, 0, 4, 4);
  const blocker = z("g", 4, 0, 1, 1);
  expect(addedZone(left, [left, blocker]).y).toBe(4);
  // no room for a copy: a 1x1 button on the first free cell
  const full = z("f1", 0, 0, 9, 8);
  const button = addedZone(full, [full]);
  expect([button.kind, button.x, button.y, button.w, button.h]).toEqual([
    "button",
    0,
    8,
    1,
    1,
  ]);
  expect(button.name).toBe("b1");
  // nothing free at all
  const all = z("f1", 0, 0, 9, 9);
  expect(addedZone(all, [all])).toBeUndefined();
});

test("a pasted zone goes beside the focused one, with no 1x1 fallback", () => {
  const z = (name, x, y, w, h) =>
    parseZone(`_Z.fader(self,"${name}",${x},${y},${w},${h},{dir="xy"})`);
  const copied = z("f9", 0, 0, 3, 3);
  const anchor = z("f1", 3, 3, 3, 3);
  // the copy keeps its size and options, takes a free name, goes to the right
  const right = placedCopy(copied, anchor, [anchor]);
  expect([right.name, right.x, right.y, right.w, right.h]).toEqual([
    "f2",
    6,
    3,
    3,
    3,
  ]);
  // no room on the right: below
  const wideAnchor = z("f1", 5, 0, 4, 3);
  const below = placedCopy(copied, wideAnchor, [wideAnchor]);
  expect([below.x, below.y]).toEqual([5, 3]);
  // no room beside it: nothing, the editor logs a message
  const tall = z("f1", 0, 0, 9, 9);
  expect(placedCopy(copied, tall, [tall])).toBeUndefined();
});

test("the CC number suggests Auto (-1) for CC, CC 14-bit and Note", () => {
  const nums = (opt) =>
    zoneOptionSuggestions(
      parseZone(`_Z.fader(self,"f1",0,0,1,9,{${opt}})`),
      "num",
      { ch: 0, nums: [32] },
    ).map((e) => e.value);
  expect(nums("")[0]).toBe("-1");
  expect(nums('cmd="note"')[0]).toBe("-1");
  // a 14-bit CC offers the numbers that have a partner 32 above
  const wide = nums('cmd="cc14"');
  expect(wide[0]).toBe("-1");
  expect(wide.length).toBe(33);
  expect(wide.at(-1)).toBe("31");
});

test("a number field is never empty, and shows the default when the line omits it", () => {
  const zone = parseZone(`_Z.fader(self,"f1",0,0,1,9,{})`);
  const schema = (key) => zoneOptionSchemaFor(zone).find((e) => e.key === key);
  // empty text is an error, not "leave the option out"
  for (const key of ["ch", "num", "sensitivity", "spring"]) {
    expect(withOption(zone, schema(key), "  ").error).toBe("Required");
  }
  // an enum or a colour can still be left to its default
  expect(withOption(zone, schema("mode"), "").error).toBeUndefined();
  expect(withOption(zone, schema("col"), "").error).toBeUndefined();
  const shown = (line, key) => {
    const z = parseZone(line);
    return optionShownText(
      z,
      zoneOptionSchemaFor(z).find((e) => e.key === key),
    );
  };
  expect(shown(`_Z.fader(self,"f1",0,0,1,9,{})`, "ch")).toBe("-1");
  expect(shown(`_Z.fader(self,"f1",0,0,1,9,{ch=3})`, "ch")).toBe("3");
  expect(shown(`_Z.fader(self,"f1",0,0,1,9,{})`, "spring")).toBe("-1");
  expect(shown(`_Z.fader(self,"f1",0,0,1,9,{})`, "sensitivity")).toBe("1");
});

test("a colour has no alpha: red, green and blue, and an old fourth value is dropped", () => {
  const colour = (line) => zoneToLua(parseZone(line)).split("},{")[1];
  // three values are written
  expect(colour(`_Z.button(self,"b",0,0,1,1,{col={255,128,0}})`)).toBe(
    "255,128,0",
  );
  // the alpha of an earlier build (in either form) is read and dropped
  expect(colour(`_Z.button(self,"b",0,0,1,1,{col={255,128,0,0.5}})`)).toBe(
    "255,128,0",
  );
  expect(
    parseZone(`_Z.zone(self,"b",3,{0,0,1,1},{1,2,3,0.5},{},{},{},{})`).opt.col,
  ).toBe("1,2,3");
  expect(
    parseZone(`_Z.zone(self,"b",3,{0,0,1,1},{-1,-1,-1},{},{},{},{})`),
  ).not.toBe(null);
  // a channel out of range is still an error
  expect(
    issues([LIB, `_Z.button(self,"b",0,0,1,1,{col={300,0,0}})`]).length,
  ).toBe(1);
});

test("the output, mode and grab are numbers in the line, and the earlier strings still read", () => {
  const out = (opt) =>
    zoneToLua(parseZone(`_Z.fader(self,"f",0,0,1,9,{${opt}})`)).split("},{")[2];
  // 0 CC, 1 CC 14-bit, 2 Note, 3 Pitch bend, 4 Mouse, 5 Gamepad
  expect(out('cmd="cc"')).toBe("0,-1,-1,0");
  expect(out('cmd="cc14"')).toBe("1,-1,-1,0");
  expect(out('cmd="pb"')).toBe("3,-1,-1,0");
  expect(out('msg="mouse"')).toBe("4,-1,1,0");
  expect(out('msg="pad"')).toBe("5,-1,-1,0");
  expect(
    zoneToLua(parseZone(`_Z.button(self,"b",0,0,1,1,{})`)).split("},{")[2],
  ).toBe("2,-1,-1,0");
  // every output reads back as the same msg and command
  for (const opt of ['cmd="cc14"', 'cmd="pb"', 'msg="mouse"', 'msg="pad"']) {
    const zone = parseZone(`_Z.fader(self,"f",0,0,1,9,{${opt}})`);
    const back = parseZone(zoneToLua(zone));
    expect([back.opt.msg, back.opt.cmd]).toEqual([
      zone.opt.msg ?? "midi",
      zone.opt.msg ? undefined : zone.opt.cmd,
    ]);
  }
  // mode and grab by number, and the earlier strings
  const behaviour = parseZone(
    `_Z.zone(self,"f",2,{0,0,4,4},{},{1,2,7,1},{},{1,1},{2,1,1})`,
  );
  expect(behaviour.opt).toMatchObject({
    msg: "midi",
    cmd: "cc14",
    ch: 2,
    num: 7,
    rx: 1,
    mode: "rel",
    sensitivity: 1,
    fingers: 2,
    grab: "live",
  });
  const old = parseZone(
    `_Z.zone(self,"f","xy",{0,0,4,4},{},{"midi","cc14",2,7,1},{},{"rel",1},{2,1,"live"})`,
  );
  expect(zoneToLua(old)).toBe(zoneToLua(behaviour));
  // a number out of range is not a zone line
  expect(parseZone(`_Z.zone(self,"f",0,{0,0,1,9},{},{9},{},{},{})`)).toBe(null);
  expect(parseZone(`_Z.zone(self,"f",0,{0,0,1,9},{},{},{},{2},{})`)).toBe(null);
});

test("Output and Command are one select, listing every output and dimming the ones the zone can't take", () => {
  const out = (line) => {
    const zone = parseZone(line);
    return zoneFaceSections(zone)
      .flatMap((e) => e.options)
      .find((e) => e.key === "out");
  };
  // all six are listed, in the order of the number the line writes
  const all = ["0", "1", "2", "3", "4", "5"];
  expect(out(`_Z.fader(self,"f",0,0,1,9,{})`).values).toEqual(all);
  // what a kind and reader can't take is unavailable: a fader has no note,
  // an XY pad no note or pitch bend, a button no pitch bend
  expect(out(`_Z.fader(self,"f",0,0,1,9,{})`).unavailable).toEqual(["2"]);
  expect(out(`_Z.fader(self,"p",0,0,4,4,{dir="xy"})`).unavailable).toEqual([
    "2",
    "3",
  ]);
  expect(out(`_Z.button(self,"b",0,0,1,1,{})`).unavailable).toEqual(["3"]);
  // no Command field
  expect(fields(`_Z.fader(self,"f",0,0,1,9,{cmd="pb"})`)).not.toContain("cmd");
  // the titles: the commands, the reader's mouse and gamepad; the select gets
  // the unavailable ones as disabled
  const titles = (line, read) =>
    enumOptions(out(line), "0", read).map((e) => [e.title, !!e.disabled]);
  expect(titles(`_Z.fader(self,"f",0,0,1,9,{})`, "axis")).toEqual([
    ["MIDI CC", false],
    ["MIDI 14", false],
    ["MIDI Note", true],
    ["MIDI Pitchbend", false],
    ["Mouse wheel", false],
    ["Gamepad axis", false],
  ]);
  expect(titles(`_Z.button(self,"b",0,0,1,1,{})`, "gate")).toEqual([
    ["MIDI CC", false],
    ["MIDI 14", false],
    ["MIDI Note", false],
    ["MIDI Pitchbend", true],
    ["Mouse button", false],
    ["Gamepad button", false],
  ]);
  // picking one sets msg and command, and a command brings its range
  const zone = parseZone(`_Z.fader(self,"f",0,0,1,9,{ch=3})`);
  expect(zoneOutputText(zone)).toBe("0");
  const wide = withOutput(zone, "3");
  expect(wide.opt).toMatchObject({ msg: "midi", cmd: "pb", ch: 3 });
  const mouse = withOutput(wide, "4");
  expect(mouse.opt.msg).toBe("mouse");
  expect(mouse.opt.cmd).toBeUndefined();
  expect(zoneOutputText(mouse)).toBe("4");
  // back to a command
  expect(withOutput(mouse, "0").opt).toMatchObject({ cmd: "cc", ch: 3 });
  // an output the zone can't take is not set
  expect(withOutput(zone, "2")).toBe(zone);
});
