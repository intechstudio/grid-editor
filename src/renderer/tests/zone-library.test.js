import { test, expect, vi } from "vitest";

// library.ts reaches the module through these; libraryIssue needs neither.
vi.mock("../runtime/runtime", () => ({}));
vi.mock("../main/panels/FileManager/FileManager", () => ({}));
const { libraryIssue } = await import("../config-blocks/touch/zone-library");

const PREFIX = `local p=string.format("/%02X/",gpc())`;

test.each([
  ["no Library block", ["print(1)"]],
  ["a Library block without zona", [`${PREFIX}_Test=require(p.."test")`]],
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
      `${PREFIX}_Test=require(p.."test")_Z=require(p.."zona")`,
    ]),
  ).toBeUndefined();
});
