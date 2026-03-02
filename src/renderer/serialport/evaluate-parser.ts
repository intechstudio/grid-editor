import { writable } from "svelte/store";

// Lua type constants (from Lua's lobject.h)
const LUA_TNIL = 0;
const LUA_TBOOLEAN = 1;
const LUA_TNUMBER = 3;
const LUA_TSTRING = 4;
const LUA_TTABLE = 5;

export type LuaValue = null | boolean | number | string | LuaTable;
export type LuaTable = { [key: string | number]: LuaValue };

// Read `length` ASCII chars from raw starting at pos and parse as hex integer
function readHex(raw: number[], pos: number, length: number): number {
  let str = "";
  for (let i = 0; i < length; i++) {
    str += String.fromCharCode(raw[pos + i]);
  }
  return parseInt(str, 16);
}

// Read `length` ASCII chars from raw starting at pos as a plain string
function readStr(raw: number[], pos: number, length: number): string {
  let str = "";
  for (let i = 0; i < length; i++) {
    str += String.fromCharCode(raw[pos + i]);
  }
  return str;
}

// Decode the \xNN escape sequences the firmware uses for non-printable chars
function decodeString(s: string): string {
  return s.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
}

// Parse `count` Lua values from raw[] starting at pos.
// Returns the decoded values and the new position in raw[].
function parseElements(
  raw: number[],
  pos: number,
  count: number,
): [LuaValue[], number] {
  const results: LuaValue[] = [];

  for (let i = 0; i < count; i++) {
    const type = readHex(raw, pos, 2);
    pos += 2;

    if (type === LUA_TNIL) {
      results.push(null);
      continue; // nil has no SIZE or DATA
    }

    const size = readHex(raw, pos, 4);
    pos += 4;

    switch (type) {
      case LUA_TBOOLEAN: {
        results.push(readStr(raw, pos, size) === "ff");
        pos += size;
        break;
      }
      case LUA_TNUMBER: {
        // Integers are formatted as "%lld", floats as "%.7f"
        results.push(Number(readStr(raw, pos, size)));
        pos += size;
        break;
      }
      case LUA_TSTRING: {
        results.push(decodeString(readStr(raw, pos, size)));
        pos += size;
        break;
      }
      case LUA_TTABLE: {
        // size = number of key-value pairs; read size*2 elements recursively
        const [pairs, newPos] = parseElements(raw, pos, size * 2);
        const table: LuaTable = {};
        for (let j = 0; j < pairs.length; j += 2) {
          table[pairs[j] as string | number] = pairs[j + 1];
        }
        results.push(table);
        pos = newPos;
        break;
      }
    }
  }

  return [results, pos];
}

// Entry point: parse the variable-length element payload from an EVALUATE response.
// raw[6..7] = ELEMENTS count (2 hex chars), raw[8+] = element data.
export function parseEvaluateResponse(class_descr: any): LuaValue[] {
  const count = readHex(class_descr.raw, 6, 2);
  const [values] = parseElements(class_descr.raw, 8, count);
  return values;
}
