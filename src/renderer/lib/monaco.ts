// Worker setup — must be imported before any monaco-editor usage
import "./monaco-workers";

import {
  editor as monaco_editor,
  languages as monaco_languages,
  Position,
} from "monaco-editor/esm/vs/editor/editor.api.js";
import { TabFocus } from "monaco-editor/esm/vs/editor/browser/config/tabFocus.js";
import { ElementType, grid } from "@intechstudio/grid-protocol";

let hoverTips = {};

const language_config: monaco_languages.LanguageConfiguration = {
  comments: {
    lineComment: "--",
    blockComment: ["--[[", "]]"] as [string, string],
  },
  brackets: [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"],
  ],
  autoClosingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  surroundingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
};

const [lua, intech_lua] = Array(2).fill({
  defaultToken: "",
  tokenPostfix: ".lua",
  keywords: [
    "and",
    "break",
    "do",
    "else",
    "elseif",
    "end",
    "false",
    "for",
    "function",
    "goto",
    "if",
    "in",
    "local",
    "nil",
    "not",
    "or",
    "repeat",
    "return",
    "then",
    "true",
    "until",
    "while",
  ],
  functions: ["print"],
  mathfunctions: [
    "abs",
    "acos",
    "asin",
    "atan",
    "atan2",
    "ceil",
    "cos",
    "cosh",
    "deg",
    "exp",
    "floor",
    "fmod",
    "frexp",
    "huge",
    "ldexp",
    "log",
    "log10",
    "max",
    "min",
    "modf",
    "pi",
    "pow",
    "rad",
    "random",
    "randomseed",
    "sin",
    "sinh",
    "sqrt",
    "tan",
    "tanh",
  ],
  variables: ["self", "element", "math"],
  forbiddens: [],
  brackets: [
    { token: "delimiter.bracket", open: "{", close: "}" },
    { token: "delimiter.array", open: "[", close: "]" },
    { token: "delimiter.parenthesis", open: "(", close: ")" },
  ],
  operators: [
    "+",
    "-",
    "*",
    "/",
    "%",
    "^",
    "#",
    "==",
    "~=",
    "<=",
    ">=",
    "<",
    ">",
    "=",
    ";",
    ":",
    ",",
    ".",
    "..",
    "...",
  ],
  symbols: /[=><!~?:&|+\-*\/\^%]+/,
  escapes:
    /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
  tokenizer: {
    root: [
      [
        /[a-zA-Z_]\w*/,
        {
          cases: {
            "@keywords": { token: "keyword.$0" },
            "@functions": { token: "function.$0" },
            "@mathfunctions": { token: "function.$0" },
            "@variables": { token: "variable.$0" },
            "@forbiddens": { token: "forbidden.$0" },
            "@default": "identifier",
          },
        },
      ],
      { include: "@whitespace" },
      [
        /(,)(\s*)([a-zA-Z_]\w*)(\s*)(:)(?!:)/,
        ["delimiter", "", "key", "", "delimiter"],
      ],
      [
        /({)(\s*)([a-zA-Z_]\w*)(\s*)(:)(?!:)/,
        ["@brackets", "", "key", "", "delimiter"],
      ],
      [/[{}()\[\]]/, "@brackets"],
      [
        /@symbols/,
        {
          cases: {
            "@operators": "delimiter",
            "@default": "",
          },
        },
      ],
      [/\d*\.\d+([eE][\-+]?\d+)?/, "number.float"],
      [/0[xX][0-9a-fA-F_]*[0-9a-fA-F]/, "number.hex"],
      [/\d+?/, "number"],
      [/[;,.]/, "delimiter"],
      [/"([^"\\]|\\.)*$/, "string.invalid"],
      [/'([^'\\]|\\.)*$/, "string.invalid"],
      [/"/, "string", '@string."'],
      [/'/, "string", "@string.'"],
    ],
    whitespace: [
      [/[ \t\r\n]+/, ""],
      [/--\[([=]*)\[/, "comment", "@comment.$1"],
      [/--.*$/, "comment"],
    ],
    comment: [
      [/[^\]]+/, "comment"],
      [
        /\]([=]*)\]/,
        {
          cases: {
            "$1==$S2": { token: "comment", next: "@pop" },
            "@default": "comment",
          },
        },
      ],
      [/./, "comment"],
    ],
    string: [
      [/[^\\"']+/, "string"],
      [/@escapes/, "string.escape"],
      [/\\./, "string.escape.invalid"],
      [
        /["']/,
        {
          cases: {
            "$#==$S2": { token: "string", next: "@pop" },
            "@default": "string",
          },
        },
      ],
    ],
  },
});

function initialize_language() {
  monaco_languages.register({ id: "intech_lua" });
  monaco_languages.register({ id: "lua" });
}

function initialize_theme() {
  monaco_editor.defineTheme(MonacoEditor.Theme.DARK, {
    base: "vs-dark",
    inherit: true,
    rules: [
      {
        token: "customClass",
        foreground: "ffffff",
        fontStyle: "italic underline",
      },
      { token: "function", foreground: "dee4b1" },
      { token: "variable", foreground: "549cd0" },
      { token: "forbidden", foreground: "990000" },
    ],
    colors: {
      "editor.background": "#2a343900",
    },
  });

  monaco_editor.defineTheme(MonacoEditor.Theme.LIGHT, {
    base: "vs",
    inherit: true,
    rules: [
      {
        token: "customClass",
        foreground: "000000",
        fontStyle: "italic underline",
      },
      { token: "function", foreground: "5a4b00" },
      { token: "variable", foreground: "1a4c7e" },
      { token: "forbidden", foreground: "990000" },
    ],
    colors: {
      "editor.background": "#2a343900",
    },
  });
}

type Range = {
  startLineNumber: number;
  endLineNumber: number;
  startColumn: number;
  endColumn: number;
};

function initialize_autocomplete() {
  function createLuaProposals(range: Range) {
    let proposalList = [];
    lua.functions = ["print"];

    // Handle other general cases (mathfunctions, keywords, etc.)
    for (const element of lua.mathfunctions) {
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

    for (const element of lua.keywords) {
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

    for (const element of lua.functions) {
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

  function createIntechLuaProposals(
    range: Range,
    model: monaco_editor.ITextModel,
    position: Position,
    prefix: string,
  ) {
    const instance: MonacoEditor.CustomCodeEditor = monaco_editor
      .getEditors()
      .find((e) => e.getModel().uri === model.uri);

    const scope =
      instance.restrictScope === ElementType.FADER
        ? ElementType.POTMETER
        : instance.restrictScope;

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
      const elementTypeMapping = {
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
        (scope === elementTypeMapping[keyPrefix] || scope === undefined)
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
      const range: Range = {
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
        suggestions: createIntechLuaProposals(range, model, position, prefix),
      };
    },
  });

  monaco_languages.registerCompletionItemProvider("lua", {
    provideCompletionItems: function (model, position) {
      const word = model.getWordUntilPosition(position);
      const range: Range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      return {
        suggestions: createLuaProposals(range),
      };
    },
  });
}

function initialize_highlight() {
  grid.lua_function_to_human_map().forEach((value, key) => {
    //AUTOCOMPLETE FUNCTIONS
    intech_lua.functions.push(value);
  });

  grid.lua_function_forbiddens().forEach((value) => {
    //FORBIDDEN IDENTIFIERS
    intech_lua.forbiddens.push(value);
  });
}

function initialize_hover() {
  monaco_languages.registerHoverProvider("intech_lua", {
    provideHover: function (model, position) {
      if (model.getWordAtPosition(position) !== null) {
        const word = model.getWordAtPosition(position).word;

        if (hoverTips[word] !== undefined)
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

function initialize_grammar() {
  monaco_languages.setMonarchTokensProvider("intech_lua", intech_lua);
  monaco_languages.setLanguageConfiguration("intech_lua", language_config);
}

export namespace MonacoEditor {
  export enum Theme {
    LIGHT = "monaco-light",
    DARK = "monaco-dark",
  }
  initialize_theme();
  initialize_language();
  initialize_highlight();
  initialize_autocomplete();
  initialize_hover();
  initialize_grammar();

  export type Options = monaco_editor.IStandaloneEditorConstructionOptions;

  //export const fontSize = writable(get(appSettings).persistent.fontSize);

  export type CustomOptions = {
    restrictScope?: ElementType;
  };
  export type CustomCodeEditor = monaco_editor.ICodeEditor & CustomOptions;

  export function create(
    node: HTMLElement,
    options: monaco_editor.IStandaloneEditorConstructionOptions & CustomOptions,
  ) {
    const editor: CustomCodeEditor = monaco_editor.create(node, {
      ...options,
    });

    editor.restrictScope = options.restrictScope;

    const editorDomNode = editor.getDomNode();

    editorDomNode.addEventListener("mousedown", () => {
      TabFocus.setTabFocusMode(false);
    });

    editor.onDidBlurEditorText(() => {
      TabFocus.setTabFocusMode(true);
    });

    TabFocus.setTabFocusMode(true);

    return editor;
  }

  export function setTheme(value: Theme) {
    monaco_editor.setTheme(value);
  }

  export function colorize(node: HTMLElement, theme: Theme) {
    monaco_editor.colorizeElement(node, {
      theme,
      tabSize: 2,
    });
  }
}
