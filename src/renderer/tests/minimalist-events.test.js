import { test, expect } from "vitest";
import { minimalistEvents } from "../main/panels/configuration/minimalist-events";

const events = (...names) => names.map((name) => ({ getName: () => name }));
const names = (list) => list.map((e) => e.getName());

test("minimalist mode lists an element's events without Setup and Timer", () => {
  expect(
    names(minimalistEvents(events("Setup", "Init", "Utility", "Timer"))),
  ).toEqual(["Init", "Utility"]);
});

test("a touch element keeps its Setup and loses its Timer", () => {
  expect(names(minimalistEvents(events("Setup", "Timer")))).toEqual(["Setup"]);
  expect(names(minimalistEvents(events("Setup")))).toEqual(["Setup"]);
});
