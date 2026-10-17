import { GridScript, initLuaFormatter } from "@intechstudio/grid-protocol";
import { test, expect, describe, beforeAll } from "vitest";
import {
  parseZone,
  zoneToLua,
  parseZoneTick,
  zoneTickToLua,
  ZONE_END_SCRIPT,
  ZONE_START_SCRIPT,
} from "../config-blocks/touch/zone-parse";
import {
  zoneOptionSchema,
  zoneKindList,
} from "../config-blocks/touch/zone-model";
import { validateSurface } from "../config-blocks/touch/zone-validate";
import { parseLibraryScript } from "../libraries/library-script";

beforeAll(async () => {
  await initLuaFormatter();
});

const LIB = `local p=string.format("/%02X/",gpc())Z=require(p.."zona")`;

// Canonical, as the editor writes it (RFC 6.5).
const editorWritten = [
  // defaults
  `Z.fader("f1",0,0,1,9,{},function(self)`,
  `Z.button("b1",2,0,2,2,{},function(self)`,
  `Z.xy("pad",4,0,5,5,{},function(self)`,
  `Z.fader("f2",0,0,1,9,{led=0},function(self)`,
  // every option type: enum, integer, number, negative, min/max
  `Z.fader("f3",1,0,1,9,{res=10,mode="glide",speed=0.5,ease=0.25},function(self)`,
  `Z.fader("f4",0,0,9,1,{dir="h",res=14,min=-100,max=100},function(self)`,
  `Z.fader("f5",0,0,1,9,{min=0},function(self)`,
  `Z.button("b3",0,0,1,1,{bmo=3,group=2,grab="live"},function(self)`,
  // options cut in zona 0.8.0 are unknown: kept as they are
  `Z.fader("f6",0,0,1,9,{contact="move",sens="l"},function(self)`,
  `Z.fader("f7",0,0,1,9,{res=8,db=0,sm=0,rt=0},function(self)`,
  `Z.button("b2",0,0,1,1,{leave=0,release="fade"},function(self)`,
  `Z.fader("f8",0,0,1,9,{read="gate"},function(self)`,
  // unknown options, after the known ones in the order found
  `Z.fader("f9",0,0,1,9,{res=8,glow=2,shape={1,2},tag="x"},function(self)`,
  `Z.fader("f10",0,0,1,9,{future=true},function(self)`,
  // number forms at the edges
  `Z.fader("f11",0,0,1,9,{min=-5,max=100000,speed=0.01,ease=1e-7},function(self)`,
];

const ticksWritten = [
  `Z.tick(self,{})`,
  `Z.tick(self,{ms=10})`,
  // options cut in zona 0.8.0 are unknown
  `Z.tick(self,{ms=40,led=2,win=500})`,
  `Z.tick(self,{led=3,later=1})`,
];

describe("zone opening line", () => {
  test.each(editorWritten)("round-trips %s", (script) => {
    expect(zoneToLua(parseZone(script))).toBe(script);
  });

  test("parses the fields", () => {
    expect(
      parseZone(
        `Z.fader("f1",1,0,1,9,{res=10,mode="glide",speed=0.5,glow=2},function(self)`,
      ),
    ).toEqual({
      name: "f1",
      kind: "fader",
      x: 1,
      y: 0,
      w: 1,
      h: 9,
      opt: { res: 10, mode: "glide", speed: 0.5 },
      unknown: "glow=2",
    });
  });

  test("covers every kind and every option", () => {
    const kinds = new Set(editorWritten.map((e) => parseZone(e).kind));
    expect([...kinds].sort()).toEqual([...zoneKindList].sort());
    const keys = new Set(
      editorWritten.flatMap((e) => Object.keys(parseZone(e).opt)),
    );
    expect([...keys].sort()).toEqual(zoneOptionSchema.map((e) => e.key).sort());
  });

  test("defaults are left out", () => {
    const zone = {
      name: "b",
      kind: "button",
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      opt: { res: 7, led: 1, bmo: 1 },
    };
    expect(zoneToLua(zone)).toBe(`Z.button("b",0,0,1,1,{bmo=1},function(self)`);
    expect(zoneToLua({ ...zone, kind: "xy", opt: { grab: "focus" } })).toBe(
      `Z.xy("b",0,0,1,1,{},function(self)`,
    );
  });

  test("numbers in shortest form", () => {
    const zone = parseZone(`Z.fader("f",0,0,1,9,{},function(self)`);
    zone.opt = { speed: 2.0, ease: 0.1, min: -0, max: 1e3 };
    expect(zoneToLua(zone)).toBe(
      `Z.fader("f",0,0,1,9,{min=0,max=1000,speed=2,ease=0.1},function(self)`,
    );
  });

  test("an option key the schema doesn't know must stay in unknown", () => {
    const zone = parseZone(`Z.fader("f",0,0,1,9,{},function(self)`);
    zone.opt = { glow: 1 };
    expect(() => zoneToLua(zone)).toThrow();
  });

  // what the parser reads back: an enum as a string, a number as a number
  test.each([
    ["enum", { mode: 1 }],
    ["enum", { grab: true }],
    ["integer", { led: "1" }],
    ["integer", { res: "10" }],
    ["number", { speed: "0.5" }],
  ])("a %s option of the wrong type is not written: %j", (_, opt) => {
    const zone = parseZone(`Z.fader("f",0,0,1,9,{},function(self)`);
    expect(() => zoneToLua({ ...zone, opt })).toThrow();
  });

  test("a tick option of the wrong type is not written", () => {
    expect(() => zoneTickToLua({ opt: { ms: "10" } })).toThrow();
  });

  test("a name that can't be a plain string is not written", () => {
    const zone = parseZone(`Z.fader("f",0,0,1,9,{},function(self)`);
    expect(() => zoneToLua({ ...zone, name: 'a"b' })).toThrow();
    expect(() => zoneToLua({ ...zone, name: "a\\b" })).toThrow();
    expect(() => zoneToLua({ ...zone, x: NaN })).toThrow();
  });
});

// Hand-written: spaces, other option order, single quotes. Each writes back
// canonical.
const handWritten = [
  [
    `Z.fader( "f1", 1, 0, 1, 9, { mode = "glide", res = 10 }, function (self)`,
    `Z.fader("f1",1,0,1,9,{res=10,mode="glide"},function(self)`,
  ],
  [
    `  Z . button ('b1',2,0,2,2,{group=1;bmo=1;},function( self )  `,
    `Z.button("b1",2,0,2,2,{bmo=1,group=1},function(self)`,
  ],
  [
    `Z.xy("pad",4,0,5,5,{led=1,mode='glide'},function(self)`,
    `Z.xy("pad",4,0,5,5,{mode="glide"},function(self)`,
  ],
  [
    `Z.fader("f",0,0,1,9,{tag = 'x', res=8, speed=.50, max=0x10},function(self)`,
    `Z.fader("f",0,0,1,9,{res=8,max=16,speed=0.5,tag='x'},function(self)`,
  ],
  [
    `Z.fader("f",0,0,1,9,{min=- 1,led=1},function(self)`,
    `Z.fader("f",0,0,1,9,{min=-1},function(self)`,
  ],
];

describe("hand-written zone lines", () => {
  test.each(handWritten)("%s writes back canonical", (script, expected) => {
    expect(zoneToLua(parseZone(script))).toBe(expected);
  });
});

// Not a zone opening line: the block shows it as code.
const notZones = [
  // other globals and functions
  `L.fader("f",0,0,1,9,{},function(self)`,
  `zona.fader("f",0,0,1,9,{},function(self)`,
  `Zz.fader("f",0,0,1,9,{},function(self)`,
  `Z.slider("f",0,0,1,9,{},function(self)`,
  `Z.zone("f",0,0,1,9,{},function(self)`,
  // the knob, cut in zona 0.8.0: an unknown block
  `Z.knob("k",0,0,3,3,{},function(self)`,
  `Z.fader("f",0,0,1,9,{},function(s)`,
  // missing or extra parts
  `Z.fader("f",0,0,1,9,{})`,
  `Z.fader("f",0,0,1,9,{},function(self) end)`,
  `Z.fader("f",0,0,1,9,function(self)`,
  `Z.fader("f",0,0,1,9,nil,function(self)`,
  `Z.fader(0,0,1,9,{},function(self)`,
  `Z.fader("f",0,0,1,{},function(self)`,
  `Z.fader("f",0,0,1,9,{},function(self)--note`,
  // geometry that isn't a number
  `Z.fader("f",a,0,1,9,{},function(self)`,
  `Z.fader("f",0,0,1+1,9,{},function(self)`,
  `Z.fader("f",0,0,1,"9",{},function(self)`,
  `Z.fader("f",0,0,1,9-,{},function(self)`,
  // tables
  `Z.fader("f",0,0,1,9,{res=10,function(self)`,
  `Z.fader("f",0,0,1,9,{res=10,mode="glide",function(self)`,
  `Z.fader("f",0,0,1,9,{shape={1,2},function(self)`,
  `Z.fader("f",0,0,1,9,{tag="a},function(self)`,
  `Z.fader("f",0,0,1,9,{10},function(self)`,
  `Z.fader("f",0,0,1,9,{["res"]=10},function(self)`,
  `Z.fader("f",0,0,1,9,{res=},function(self)`,
  `Z.fader("f",0,0,1,9,{res=8,res=9},function(self)`,
  `Z.fader("f",0,0,1,9,{res==8},function(self)`,
  `Z.fader("f",0,0,1,9,{tag=1--[[x]]},function(self)`,
  // known options that aren't plain literals of their type
  `Z.fader("f",0,0,1,9,{res="10"},function(self)`,
  `Z.fader("f",0,0,1,9,{res=7+3},function(self)`,
  `Z.fader("f",0,0,1,9,{mode=glide},function(self)`,
  // led is 0 or 1 since zona 0.8.0: a painter name is code
  `Z.fader("f",0,0,1,9,{led="fill"},function(self)`,
  // names that can't be written back as a plain string
  `Z.fader("a\\"b",0,0,1,9,{},function(self)`,
  `Z.fader('a"b',0,0,1,9,{},function(self)`,
  ``,
];

describe("not a zone line", () => {
  test.each(notZones)("%s is null", (script) => {
    expect(parseZone(script)).toBeNull();
  });

  test("other touch lines are not zones", () => {
    expect(parseZone(ZONE_START_SCRIPT)).toBeNull();
    expect(parseZone(ZONE_END_SCRIPT)).toBeNull();
    expect(parseZone(LIB)).toBeNull();
    expect(parseZone(`Z.group(1,{})`)).toBeNull();
  });

  test("out-of-range values parse, the validator rejects them", () => {
    expect(
      parseZone(`Z.fader("led_value",8,8,2,0.5,{res=20,led=5},function(self)`),
    ).toEqual({
      name: "led_value",
      kind: "fader",
      x: 8,
      y: 8,
      w: 2,
      h: 0.5,
      opt: { res: 20, led: 5 },
    });
  });
});

describe("Touch Tick", () => {
  test.each(ticksWritten)("round-trips %s", (script) => {
    expect(zoneTickToLua(parseZoneTick(script))).toBe(script);
  });

  test.each([
    [`Z.tick(self)`, `Z.tick(self,{})`],
    [`Z.tick(self,{ms=20})`, `Z.tick(self,{})`],
    [`Z.tick(self,{ms=20,led=1,win=300})`, `Z.tick(self,{led=1,win=300})`],
    [`Z.tick( self, {win=500, ms=10} )`, `Z.tick(self,{ms=10,win=500})`],
  ])("%s writes back %s", (script, expected) => {
    expect(zoneTickToLua(parseZoneTick(script))).toBe(expected);
  });

  test.each([
    // the pre-0.6.0 Timer line: the library re-arms the timer now
    `Z.tick(self,{ms=20})gtt(0,20)`,
    `Z.tick(el,{})`,
    `Z.tick(self,{ms=a})`,
    `Z.tick(self,{ms=10}`,
  ])("%s is null", (script) => {
    expect(parseZoneTick(script)).toBeNull();
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

describe("a whole touch Setup through compressScript (RFC 6.5)", () => {
  // As the editor writes them: [short, script].
  const setup = [
    ["lib", LIB],
    [
      "zfd",
      `Z.fader("f1",0,0,1,9,{res=10,mode="glide",speed=0.5},function(self)`,
    ],
    ["gms", "self:gms(-1,-1,-1,-1)"],
    ["gms", "self:gms(-1,144,60,self:g()*127)"],
    ["zen", ZONE_END_SCRIPT],
    ["zbt", `Z.button("b1",1,0,2,2,{bmo=1,group=1,tag={1,2}},function(self)`],
    ["gms", "self:gms(-1,-1,-1,-1)"],
    ["zen", ZONE_END_SCRIPT],
    ["zst", ZONE_START_SCRIPT],
  ];
  const toLua = (actions) =>
    actions.map(([short, script]) => `--[[@${short}]] ${script}`).join("");

  test("every editor-written block comes back unchanged", () => {
    const actions = splitActions(GridScript.compressScript(toLua(setup)));
    expect(actions.map((e) => [e.short, e.script])).toEqual(setup);
    expect(zoneToLua(parseZone(actions[1].script))).toBe(setup[1][1]);
    expect(zoneToLua(parseZone(actions[5].script))).toBe(setup[5][1]);
    expect(parseLibraryScript(actions[0].script)).toEqual([
      { global: "Z", file: "zona" },
    ]);
  });

  test.each(editorWritten)("zone line %s comes back unchanged", (line) => {
    const zone = [
      ["zfd", line],
      ["gms", "self:gms(-1,-1,-1,-1)"],
      ["zen", ZONE_END_SCRIPT],
    ];
    const actions = splitActions(GridScript.compressScript(toLua(zone)));
    expect(actions.map((e) => [e.short, e.script])).toEqual(zone);
  });

  test.each(ticksWritten)("tick line %s comes back unchanged", (line) => {
    const [tick] = splitActions(
      GridScript.compressScript(`--[[@ztk]] ${line}`),
    );
    expect(tick.script).toBe(line);
  });

  test("hand-written lines come back canonical", () => {
    const compressed = GridScript.compressScript(
      toLua([
        [
          "zfd",
          `Z.fader( 'f1', 0, 0, 1, 9, { mode = 'glide' }, function (self)`,
        ],
        ["zen", ZONE_END_SCRIPT],
      ]),
    );
    expect(splitActions(compressed)[0].script).toBe(
      `Z.fader("f1",0,0,1,9,{mode="glide"},function(self)`,
    );
  });

  test("a zone named like a firmware human name is renamed by compress; the validator catches it", () => {
    const named = [
      ["lib", LIB],
      ["zfd", `Z.fader("led_value",0,0,1,9,{},function(self)`],
      ["zen", ZONE_END_SCRIPT],
      ["zst", ZONE_START_SCRIPT],
    ];
    const zone = parseZone(named[1][1]);
    expect(
      validateSurface([zone], {
        actions: named.map(([, script]) => ({ script })),
      }),
    ).toEqual([
      {
        zone: "led_value",
        level: "error",
        message: `"led_value" is a firmware function name, sent to the module as "glp"`,
      },
    ]);
    // shortify rewrites the string: the module stores the short name
    const actions = splitActions(GridScript.compressScript(toLua(named)));
    expect(actions[1].script).toBe(`Z.fader("glp",0,0,1,9,{},function(self)`);
    expect(parseZone(actions[1].script).name).toBe("glp");
  });
});
