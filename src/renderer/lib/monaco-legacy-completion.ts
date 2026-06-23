import {
  editor as monaco_editor,
  languages as monaco_languages,
} from "monaco-editor";
import type { IRange, Position } from "monaco-editor";
import { intech_lua, MonacoEditor } from "./monaco";
import { ElementType, grid } from "@intechstudio/grid-protocol";

let hoverTips: {[key: string]: string} = {};

function populateLegacyHoverTips() {
  for (const [key, value] of grid.lua_function_to_human_map()) {
    const helperText = grid.get_lua_function_helper(key);
    if (typeof helperText !== "undefined") {
      hoverTips[value] = helperText;
    }
  }
}

export function legacy_initialize_hover() {
  populateLegacyHoverTips();
  monaco_languages.registerHoverProvider("intech_lua", {
    provideHover: function (model, position) {
        const wordAtPosition = model.getWordAtPosition(position);
        if (!wordAtPosition) return;
        const word = wordAtPosition.word;

        if (hoverTips[word] !== undefined){
          return {
            contents: [
              { value: "**SOURCE**" },
              { value: "```html\n" + hoverTips[word] + "\n```" },
            ],
          };
        }
    },
  });
}

export function legacy_initialize_autocomplete() {

  function isCustomCodeEditor(
    editor: monaco_editor.ICodeEditor,
  ): editor is MonacoEditor.CustomCodeEditor {
    return "restrictScope" in editor;
  }

  function createLegacyIntechLuaProposals(
    range: IRange,
    model: monaco_editor.ITextModel,
    position: Position,
    prefix: string,
  ) {
    const instance = monaco_editor
    .getEditors()
    .find(
        (e): e is MonacoEditor.CustomCodeEditor =>
        isCustomCodeEditor(e) &&
        e.getModel()?.uri.toString() === model.uri.toString(),
    );

    // typesafe scope check
    const restrictScope = instance?.restrictScope;
    const scope =
      restrictScope === ElementType.FADER
        ? ElementType.POTMETER
        : restrictScope;
    const normalizedScope = scope?.toString();

    let proposalList = [];
    intech_lua.functions = ["print"];

    // Handle other general cases (mathfunctions, keywords, etc.)
    for (const element of intech_lua.mathfunctions) {
      let proposalItem = {
        label: "",
        kind: monaco_languages.CompletionItemKind.Function,
        documentation: "Documentation",
        insertText: "",
        range: range,
      };

      proposalItem.label = "math." + element;
      proposalItem.insertText = "math." + element;
      proposalList.push(proposalItem);
    }

    for (const element of intech_lua.keywords) {
      let proposalItem = {
        label: "",
        kind: monaco_languages.CompletionItemKind.Keyword,
        documentation: "Documentation",
        insertText: "",
        range: range,
      };

      proposalItem.label = element;
      proposalItem.insertText = element;

      proposalList.push(proposalItem);
    }

    for (const item of grid.lua_function_to_human_map()) {
      let proposalItem = {
        label: "",
        kind: monaco_languages.CompletionItemKind.Function,
        documentation: "Documentation",
        insertText: "",
        range: range,
      };

      const key = item[0];
      const value = item[1];
      const elementTypeMapping: {[key: string]: string} = {
        GRID_LUA_FNC_EP: "endless",
        GRID_LUA_FNC_E: "encoder",
        GRID_LUA_FNC_B: "button",
        GRID_LUA_FNC_P: "potmeter",
        GRID_LUA_FNC_L: "lcd",
      };

      const lineContent = model.getLineContent(range.startLineNumber);
      const isInsideSelfOrElement =
        lineContent.includes("self:") || lineContent.includes("element[");
      const keyPrefix = Object.keys(elementTypeMapping).find((prefix) =>
        key.startsWith(prefix),
      );

      if (
        keyPrefix &&
        (normalizedScope === elementTypeMapping[keyPrefix] ||
          normalizedScope === undefined)
      ) {
        proposalItem.label = isInsideSelfOrElement ? value : `self:${value}`;
        proposalItem.insertText = `${proposalItem.label}()`;
      } else if (scope === ElementType.SYSTEM || !scope) {
        if (!proposalList.some((e) => e.label === `element[0]:${value}`)) {
          proposalItem.label = isInsideSelfOrElement
            ? value
            : `element[0]:${value}`;
          proposalItem.insertText = `${proposalItem.label}()`;
        }
      } else if (!keyPrefix) {
        proposalItem.label = value;
        proposalItem.insertText = `${value}()`;
      }

      // Only push items that were actually populated — Monaco 0.55+
      // rejects completion items with empty labels.
      if (proposalItem.label !== "") {
        proposalList.push(proposalItem);
      }

      const helperText = grid.get_lua_function_helper(key);
      if (typeof helperText !== "undefined") {
        hoverTips[value] = helperText;
      }
    }

    for (const element of intech_lua.functions) {
      if (proposalList.find((e) => e.label === element)) {
        continue;
      }

      let proposalItem = {
        kind: monaco_languages.CompletionItemKind.Function,
        documentation: "Documentation",
        range: range,
        label: element,
        insertText: element + "()",
      };

      proposalList.push(proposalItem);
    }

    return proposalList;
  }

  monaco_languages.registerCompletionItemProvider("intech_lua", {
    provideCompletionItems: function (model, position) {
      const word = model.getWordUntilPosition(position);
      const lineContent = model.getLineContent(position.lineNumber);
      const range: IRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      // Check for 'self:' or 'element[x]:'
      const selfIndex = lineContent.lastIndexOf("self:", position.column - 1);
      const elementIndex = lineContent.lastIndexOf(
        "element[",
        position.column - 1,
      );

      // If 'self:' or 'element[x]:' is found, adjust the prefix
      let prefix = "";
      if (selfIndex !== -1 && selfIndex + 5 <= word.startColumn) {
        prefix = "self:";
      } else if (elementIndex !== -1 && elementIndex + 8 <= word.startColumn) {
        prefix = lineContent.slice(elementIndex, position.column); // 'element[x]:'
      }

      return {
        suggestions: createLegacyIntechLuaProposals(range, model, position, prefix),
      };
    },
  });

  // monaco_languages.registerCompletionItemProvider("lua", {
  //   provideCompletionItems: function (model, position) {
  //     const word = model.getWordUntilPosition(position);
  //     const range: Range = {
  //       startLineNumber: position.lineNumber,
  //       endLineNumber: position.lineNumber,
  //       startColumn: word.startColumn,
  //       endColumn: word.endColumn,
  //     };

  //     return {
  //       suggestions: createLuaProposals(range),
  //     };
  //   },
  // });
}