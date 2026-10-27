import { test, expect, vi } from "vitest";

// library.ts reaches the module through these; libraryIssue needs neither.
vi.mock("../runtime/runtime", () => ({}));
vi.mock("../main/panels/FileManager/FileManager", () => ({}));
const { libraryIssue } = await import("../config-blocks/touch/zone-library");
const { libraryScriptToLua } = await import("../lib/library");

test.each([
  ["no Library block", ["print(1)"]],
  [
    "a Library block without zona",
    [libraryScriptToLua([{ global: "_Test", file: "test" }])],
  ],
  ["an empty System Setup", []],
])("%s in the System Setup: warning", (_, systemSetup) => {
  expect(libraryIssue(systemSetup)).toEqual({
    level: "warning",
    message: "Add a Library block to the System Setup that loads zona (_Z)",
  });
});

test("zona loaded next to other libraries: no warning", () => {
  expect(
    libraryIssue([
      "print(1)",
      libraryScriptToLua([
        { global: "_Test", file: "test" },
        { global: "_Z", file: "zona" },
      ]),
    ]),
  ).toBeUndefined();
});
