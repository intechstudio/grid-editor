import { language } from "$lib/CustomMonaco";
import stringManipulation from "../main/user-interface/_string-operations";
import * as luamin from "lua-format";

export function find_forbidden_identifiers(str) {
  const identifier_match_expr = /[a-zA-Z0-9_]+/g;

  const identifiers = str.match(identifier_match_expr);

  let forbiddenCount = 0;
  let forbiddenList = [];

  if (identifiers !== undefined && identifiers !== null) {
    identifiers.forEach((element) => {
      if (language.forbiddens.find((e) => e == element)) {
        forbiddenCount++;
        forbiddenList.push(element);
      }
    });
  }

  return forbiddenList;
}

const luaminOptions = {
  RenameVariables: false, // Should it change the variable names? (L_1_, L_2_, ...)
  RenameGlobals: false, // Not safe, rename global variables? (G_1_, G_2_, ...) (only works if RenameVariables is set to true)
  SolveMath: false, // Solve math? (local a = 1 + 1 => local a = 2, etc.)
};

export function checkForbiddenIdentifiers(code) {
  // test for forbidden identifiers
  let forbiddenList = find_forbidden_identifiers(code);

  if (forbiddenList.length > 0) {
    const uniqueForbiddenList = [...new Set(forbiddenList)];
    const readable = uniqueForbiddenList.toString().replaceAll(",", ", ");
    throw "Reserved identifiers [" + readable + "] cannot be used!";
  }
}
