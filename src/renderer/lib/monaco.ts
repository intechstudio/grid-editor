// Service initialization — must be imported before any monaco-editor usage.
// monacoReady resolves once all VSCode services are set up.
import { monacoReady } from "./monaco-init";

import {
  editor as monaco_editor,
  languages as monaco_languages,
  Position,
  Range,
} from "monaco-editor/esm/vs/editor/editor.api.js";
import { TabFocus } from "monaco-editor/esm/vs/editor/browser/config/tabFocus.js";
import { ElementType, grid } from "@intechstudio/grid-protocol";
import { startLuaLSClient, stopLuaLSClient } from "./monaco-luals-client";

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
    "ceil",
    "cos",
    "deg",
    "exp",
    "floor",
    "fmod",
    "log",
    "max",
    "min",
    "modf",
    "rad",
    "random",
    "randomseed",
    "sin",
    "sqrt",
    "tan",
    "tointeger",
    "type",
    "ult",
  ],
  variables: [
    "self",
    "element",
    "math",
    "huge",
    "maxinteger",
    "mininteger",
    "pi",
  ],
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
    "//",
    "&",
    "|",
    "~",
    "<<",
    ">>",
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

const intech_lua = createLangDef();

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

// Old hand-rolled completion providers removed.
// All completion/hover/signature/diagnostics now handled by MonacoLanguageClient via LuaLS.

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

// Old hand-rolled hover provider removed.
// Hover is now handled by MonacoLanguageClient via LuaLS.

function initialize_grammar() {
  // Cast needed: @codingame/monaco-vscode-editor-api has stricter IMonarchLanguage
  // types than standalone monaco-editor, but the tokenizer definition is valid.
  monaco_languages.setMonarchTokensProvider("intech_lua", intech_lua as any);
  monaco_languages.setLanguageConfiguration("intech_lua", language_config);
}

export namespace MonacoEditor {
  export enum Theme {
    LIGHT = "monaco-light",
    DARK = "monaco-dark",
  }

  // Initialization is deferred until monacoReady resolves.
  // The ready promise is exposed so consumers can await it before creating editors.
  export const ready: Promise<void> = monacoReady.then(() => {
    initialize_theme();
    initialize_language();
    initialize_highlight();
    initialize_grammar();

    // Connect to LuaLS via MonacoLanguageClient (non-blocking, logs on failure)
    startLuaLSClient().catch((err) =>
      console.warn(
        "[LuaLS] Client start failed (server may not be running):",
        err,
      ),
    );
  });

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
