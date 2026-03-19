// Worker setup — must be imported before any monaco-editor usage
import "./monaco-workers";

import {
  editor as monaco_editor,
  languages as monaco_languages,
  Position,
  Range,
} from "monaco-editor";
import { TabFocus } from "monaco-editor/esm/vs/editor/browser/config/tabFocus.js";
import { ElementType, grid } from "@intechstudio/grid-protocol";
import { initLuaLSP } from "./monaco-luals-client";

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

const createLangDef = () => ({
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

const lua = createLangDef();
const intech_lua = createLangDef();

// Module-level luadocs from grid-protocol
const luadocs = grid.get_luadocs();

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

  // Register luadocs-based completion provider for intech_lua
  monaco_languages.registerCompletionItemProvider("intech_lua", {
    triggerCharacters: [":"],
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      // Detect if the user typed "self:" or "element[x]:" before the current word
      const lineContent = model.getLineContent(position.lineNumber);
      const textBeforeWord = lineContent.substring(0, word.startColumn - 1);
      const isMemberAccess = /\b(self|element(\[\d+\])?)\s*:\s*$/.test(
        textBeforeWord,
      );

      // Find the editor's restrictScope (element type) for context-aware suggestions
      let elementType: string | undefined;
      const editors = monaco_editor.getEditors();
      for (const ed of editors) {
        if (ed.getModel() === model) {
          elementType = (ed as MonacoEditor.CustomCodeEditor).restrictScope;
          break;
        }
      }

      // Map fader to potmeter since luadocs has no separate fader category
      const resolvedType =
        elementType === ElementType.FADER ? ElementType.POTMETER : elementType;

      const suggestions = [];

      if (isMemberAccess) {
        // After "self:" or "element[x]:", only show element methods for the current element type
        const categories = resolvedType
          ? { [resolvedType]: (luadocs.elements ?? {})[resolvedType] ?? [] }
          : (luadocs.elements ?? {});

        for (const [cat, fns] of Object.entries(categories)) {
          for (const fn of fns as any[]) {
            const label = fn.name || fn.short;
            suggestions.push({
              label,
              kind: monaco_languages.CompletionItemKind.Method,
              insertText: label + "()",
              detail: `[${cat}]${fn.short ? ` short: ${fn.short}` : ""}`,
              documentation: fn.usage || "",
              filterText: `${fn.name} ${fn.short}`,
              range,
            });
          }
        }
      } else {
        // Include Lua keywords
        for (const kw of intech_lua.keywords) {
          suggestions.push({
            label: kw,
            kind: monaco_languages.CompletionItemKind.Keyword,
            insertText: kw,
            range,
          });
        }

        // Include math functions
        for (const mf of intech_lua.mathfunctions) {
          suggestions.push({
            label: "math." + mf,
            kind: monaco_languages.CompletionItemKind.Function,
            insertText: "math." + mf,
            range,
          });
        }

        // Global functions from luadocs
        for (const fn of luadocs.globals ?? []) {
          const label = fn.name || fn.short;
          suggestions.push({
            label,
            kind: monaco_languages.CompletionItemKind.Function,
            insertText: label + "()",
            detail: fn.short ? `short: ${fn.short}` : "",
            documentation: fn.usage || "",
            filterText: `${fn.name} ${fn.short}`,
            range,
          });
        }

        // Element methods (prefixed with self: when not in member access context)
        const elemCategories = resolvedType
          ? { [resolvedType]: (luadocs.elements ?? {})[resolvedType] ?? [] }
          : (luadocs.elements ?? {});

        for (const [cat, fns] of Object.entries(elemCategories)) {
          for (const fn of fns as any[]) {
            const funcName = fn.name || fn.short;
            const label =
              resolvedType === ElementType.SYSTEM || !resolvedType
                ? `element[0]:${funcName}`
                : `self:${funcName}`;
            suggestions.push({
              label,
              kind: monaco_languages.CompletionItemKind.Method,
              insertText: label + "()",
              detail: `[${cat}]${fn.short ? ` short: ${fn.short}` : ""}`,
              documentation: fn.usage || "",
              filterText: `${fn.name} ${fn.short} ${label}`,
              range,
            });
          }
        }

        // Additional functions from intech_lua highlight (includes human-mapped names)
        for (const funcName of intech_lua.functions) {
          if (
            suggestions.some(
              (s) => s.label === funcName || s.label === `self:${funcName}`,
            )
          ) {
            continue;
          }
          suggestions.push({
            label: funcName,
            kind: monaco_languages.CompletionItemKind.Function,
            insertText: funcName + "()",
            range,
          });
        }
      }

      return { suggestions };
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
  // Register hover provider for intech_lua using luadocs from grid-protocol
  monaco_languages.registerHoverProvider("intech_lua", {
    provideHover(model, position) {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const allFns = [
        ...(luadocs.globals ?? []),
        ...Object.values(luadocs.elements ?? {}).flat(),
      ];

      const match = allFns.find(
        (fn: any) => fn.name === word.word || fn.short === word.word,
      );

      if (!match) return null;

      return {
        range: new Range(
          position.lineNumber,
          word.startColumn,
          position.lineNumber,
          word.endColumn,
        ),
        contents: [
          { value: `**${match.name}** (\`${match.short}\`)` },
          { value: match.usage || "No documentation available." },
        ],
      };
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

  // Connect to LuaLS via WebSocket (non-blocking, logs on failure)
  initLuaLSP().catch((err) =>
    console.warn("[LuaLS] Init failed (server may not be running):", err),
  );

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
      // Enable semantic highlighting so LuaLS semantic tokens (function colors,
      // global variable colors, etc.) are applied on top of Monarch tokenizer.
      "semanticHighlighting.enabled": true,
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
