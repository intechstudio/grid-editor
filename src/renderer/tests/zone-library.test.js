import { test, expect } from "vitest";
import { libraryIssue } from "../config-blocks/touch/zone-library";

test.each([
  ["no library", []],
  ["other libraries only", ["_Test"]],
])("%s before Touch Start: warning", (_, globals) => {
  expect(libraryIssue(new Set(globals))).toEqual({
    level: "warning",
    message:
      "Add a Library block that loads zona (_Z) above this block or in the System Setup",
  });
});

test("zona loaded next to other libraries: no warning", () => {
  expect(libraryIssue(new Set(["_Test", "_Z"]))).toBeUndefined();
});
