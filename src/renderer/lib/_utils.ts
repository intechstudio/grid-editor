import { checkVariableName } from "../validators/local_validator.mjs";
import { parenthesis } from "../config-blocks/_validators";
import { find_forbidden_identifiers } from "../runtime/monaco-helper";
import { grid } from "@intechstudio/grid-protocol";

export namespace Grid {
  export function toFirstCase(value: string) {
    return value[0].toUpperCase() + value.slice(1, value.length);
  }

  export function isParenthesisClosed(value: string) {
    const pairs = [
      { start: "(", end: ")" },
      { start: "[", end: "]" },
    ];
    const stacks = new Map();

    // Initialize stacks for each pair
    pairs.forEach((pair) => {
      stacks.set(pair, []);
    });

    // Process each character in the input value
    for (const char of value) {
      // Find the corresponding pair for the current character
      const pair = pairs.find((e) => e.start === char || e.end === char);

      // If no pair is found (invalid character), continue
      if (!pair) continue;

      // Check if the character is a start or end bracket for the pair
      switch (char) {
        case pair.start:
          stacks.get(pair).push(char); // Push to the stack of the corresponding pair
          break;
        case pair.end:
          // Check if there's a corresponding start, and pop from the stack
          if (stacks.get(pair).length === 0) {
            return false; // Unmatched closing bracket
          }
          stacks.get(pair).pop();
          break;
      }
    }

    // Check if all stacks are empty, meaning all parentheses are closed correctly
    return [...stacks.values()].every((stack) => stack.length === 0);
  }

  export function getClosestEvent(events: number[], event: number) {
    if (events.map((e) => Number(e)).includes(Number(event))) {
      return event;
    }

    //Select closest event type if incoming device does not have the corrently selected event type
    const closestEvent = Math.min(
      ...events.map((e) => Number(e)).filter((e) => e > 0)
    );

    return closestEvent !== Infinity ? closestEvent : 0;
  }

  export namespace VariableBlock {
    export type Error = {
      value: boolean;
      text: string;
    };

    export type ScriptSegment = { variable: string; value: string };

    export function localArrayToScript(arr: ScriptSegment[]) {
      let script = [
        "local ",
        arr.map((e) => e.variable).join(","),
        "=",
        arr.map((e) => e.value).join(","),
      ].join("");
      return script;
    }

    export function getError(scriptSegments: ScriptSegment[]): Error {
      let variableNameValidity = [];
      scriptSegments.forEach((s) => {
        variableNameValidity.push(checkVariableName(s.variable));
      });

      const script = localArrayToScript(scriptSegments);

      if (variableNameValidity.includes(false)) {
        return { value: true, text: "Invalid variable name!" };
      }

      if (!parenthesis(script)) {
        return { value: true, text: "Parenthesis must be closed!" };
      }

      let forbiddenList = find_forbidden_identifiers(script);

      if (forbiddenList.length > 0) {
        const uniqueForbiddenList = [...new Set(forbiddenList)];
        const readable = uniqueForbiddenList.toString().replace(",", ", ");
        return {
          value: true,
          text: "Reserved identifiers [" + readable + "] cannot be used!",
        };
      }

      return { value: false, text: "OK" };
    }
  }

  export namespace Protocol {
    export const scriptStart = "<?lua ";
    export const scriptEnd = " ?>";
    export const maxScriptLength =
      grid.getProperty("CONFIG_LENGTH") - scriptEnd.length - scriptStart.length;
  }
}
