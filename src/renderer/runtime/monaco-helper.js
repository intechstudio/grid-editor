import { language } from "$lib/CustomMonaco";

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

export function checkForbiddenIdentifiers(code) {
  // test for forbidden identifiers
  let forbiddenList = find_forbidden_identifiers(code);

  if (forbiddenList.length > 0) {
    const uniqueForbiddenList = [...new Set(forbiddenList)];
    const readable = uniqueForbiddenList.toString().replaceAll(",", ", ");
    throw "Reserved identifiers [" + readable + "] cannot be used!";
  }
}
