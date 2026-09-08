// Service initialization — must be imported before any monaco-editor usage.
// monacoReady resolves once all VSCode services are set up.
import { monacoReady } from "./monaco-init";

import {
  editor as monaco_editor,
  languages as monaco_languages,
  KeyMod,
  KeyCode,
} from "monaco-editor";
import { TabFocus } from "monaco-editor/esm/vs/editor/browser/config/tabFocus.js";
import { ElementType, grid } from "@intechstudio/grid-protocol";
import { startLuaLSClient, stopLuaLSClient } from "./monaco-luals-client";
import {
  legacy_initialize_autocomplete,
  legacy_initialize_hover,
} from "./monaco-legacy-completion";
import { Analytics } from "../runtime/analytics";
import { appSettings } from "../runtime/app-helper.store";

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

// exported to be used by legacy completion
export const intech_lua: monaco_languages.IMonarchLanguage = {
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
};

// Monaco's bundled "css" Monarch grammar + language config, for the
// custom-theme editor in Preferences. renderer.vite.config.mjs aliases the
// whole "monaco-editor" package to @codingame/monaco-vscode-editor-api
// (needed for monaco-languageclient), which doesn't ship the
// esm/vs/basic-languages submodules, so importing this from monaco-editor
// directly isn't possible here — it's inlined instead (copied verbatim from
// monaco-editor's own esm/vs/basic-languages/css/css.js) and registered
// through the same `monaco_languages` singleton "intech_lua" uses below.
const css_conf: monaco_languages.LanguageConfiguration = {
  wordPattern: /(#?-?\d*\.\d\w*%?)|((::|[@#.!:])?[\w-?]+%?)|::|[@#.!:]/g,
  comments: {
    blockComment: ["/*", "*/"],
  },
  brackets: [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"],
  ],
  autoClosingPairs: [
    { open: "{", close: "}", notIn: ["string", "comment"] },
    { open: "[", close: "]", notIn: ["string", "comment"] },
    { open: "(", close: ")", notIn: ["string", "comment"] },
    { open: '"', close: '"', notIn: ["string", "comment"] },
    { open: "'", close: "'", notIn: ["string", "comment"] },
  ],
  surroundingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  folding: {
    markers: {
      start: /^\s*\/\*\s*#region\b\s*(.*?)\s*\*\//,
      end: /^\s*\/\*\s*#endregion\b.*\*\//,
    },
  },
};

const css_language: monaco_languages.IMonarchLanguage = {
  defaultToken: "",
  tokenPostfix: ".css",
  ws: "[ \t\n\r\f]*",
  identifier:
    "-?-?([a-zA-Z]|(\\\\(([0-9a-fA-F]{1,6}\\s?)|[^[0-9a-fA-F])))([\\w\\-]|(\\\\(([0-9a-fA-F]{1,6}\\s?)|[^[0-9a-fA-F])))*",
  brackets: [
    { open: "{", close: "}", token: "delimiter.bracket" },
    { open: "[", close: "]", token: "delimiter.bracket" },
    { open: "(", close: ")", token: "delimiter.parenthesis" },
    { open: "<", close: ">", token: "delimiter.angle" },
  ],
  tokenizer: {
    root: [{ include: "@selector" }],
    selector: [
      { include: "@comments" },
      { include: "@import" },
      { include: "@strings" },
      [
        "[@](keyframes|-webkit-keyframes|-moz-keyframes|-o-keyframes)",
        { token: "keyword", next: "@keyframedeclaration" },
      ],
      ["[@](page|content|font-face|-moz-document)", { token: "keyword" }],
      [
        "[@](charset|namespace)",
        { token: "keyword", next: "@declarationbody" },
      ],
      [
        "(url-prefix)(\\()",
        [
          "attribute.value",
          { token: "delimiter.parenthesis", next: "@urldeclaration" },
        ],
      ],
      [
        "(url)(\\()",
        [
          "attribute.value",
          { token: "delimiter.parenthesis", next: "@urldeclaration" },
        ],
      ],
      { include: "@selectorname" },
      ["[\\*]", "tag"],
      ["[>\\+,]", "delimiter"],
      ["\\[", { token: "delimiter.bracket", next: "@selectorattribute" }],
      ["{", { token: "delimiter.bracket", next: "@selectorbody" }],
    ],
    selectorbody: [
      { include: "@comments" },
      [
        "[*_]?@identifier@ws:(?=(\\s|\\d|[^{;}]*[;}]))",
        "attribute.name",
        "@rulevalue",
      ],
      ["}", { token: "delimiter.bracket", next: "@pop" }],
    ],
    selectorname: [["(\\.|#(?=[^{])|%|(@identifier)|:)+", "tag"]],
    selectorattribute: [
      { include: "@term" },
      ["]", { token: "delimiter.bracket", next: "@pop" }],
    ],
    term: [
      { include: "@comments" },
      [
        "(url-prefix)(\\()",
        [
          "attribute.value",
          { token: "delimiter.parenthesis", next: "@urldeclaration" },
        ],
      ],
      [
        "(url)(\\()",
        [
          "attribute.value",
          { token: "delimiter.parenthesis", next: "@urldeclaration" },
        ],
      ],
      { include: "@functioninvocation" },
      { include: "@numbers" },
      { include: "@name" },
      { include: "@strings" },
      ["([<>=\\+\\-\\*\\/\\^\\|\\~,])", "delimiter"],
      [",", "delimiter"],
    ],
    rulevalue: [
      { include: "@comments" },
      { include: "@strings" },
      { include: "@term" },
      ["!important", "keyword"],
      [";", "delimiter", "@pop"],
      ["(?=})", { token: "", next: "@pop" }],
    ],
    warndebug: [
      ["[@](warn|debug)", { token: "keyword", next: "@declarationbody" }],
    ],
    import: [["[@](import)", { token: "keyword", next: "@declarationbody" }]],
    urldeclaration: [
      { include: "@strings" },
      ["[^)\r\n]+", "string"],
      ["\\)", { token: "delimiter.parenthesis", next: "@pop" }],
    ],
    parenthizedterm: [
      { include: "@term" },
      ["\\)", { token: "delimiter.parenthesis", next: "@pop" }],
    ],
    declarationbody: [
      { include: "@term" },
      [";", "delimiter", "@pop"],
      ["(?=})", { token: "", next: "@pop" }],
    ],
    comments: [
      ["\\/\\*", "comment", "@comment"],
      ["\\/\\/+.*", "comment"],
    ],
    comment: [
      ["\\*\\/", "comment", "@pop"],
      [/[^*/]+/, "comment"],
      [/./, "comment"],
    ],
    name: [["@identifier", "attribute.value"]],
    numbers: [
      [
        "-?(\\d*\\.)?\\d+([eE][\\-+]?\\d+)?",
        { token: "attribute.value.number", next: "@units" },
      ],
      ["#[0-9a-fA-F_]+(?!\\w)", "attribute.value.hex"],
    ],
    units: [
      [
        "(em|ex|ch|rem|fr|vmin|vmax|vw|vh|vm|cm|mm|in|px|pt|pc|deg|grad|rad|turn|s|ms|Hz|kHz|%)?",
        "attribute.value.unit",
        "@pop",
      ],
    ],
    keyframedeclaration: [
      ["@identifier", "attribute.value"],
      ["{", { token: "delimiter.bracket", switchTo: "@keyframebody" }],
    ],
    keyframebody: [
      { include: "@term" },
      ["{", { token: "delimiter.bracket", next: "@selectorbody" }],
      ["}", { token: "delimiter.bracket", next: "@pop" }],
    ],
    functioninvocation: [
      [
        "@identifier\\(",
        { token: "attribute.value", next: "@functionarguments" },
      ],
    ],
    functionarguments: [
      ["\\$@identifier@ws:", "attribute.name"],
      ["[,]", "delimiter"],
      { include: "@term" },
      ["\\)", { token: "attribute.value", next: "@pop" }],
    ],
    strings: [
      ['~?"', { token: "string", next: "@stringenddoublequote" }],
      ["~?'", { token: "string", next: "@stringendquote" }],
    ],
    stringenddoublequote: [
      ["\\\\.", "string"],
      ['"', { token: "string", next: "@pop" }],
      [/[^\\"]+/, "string"],
      [".", "string"],
    ],
    stringendquote: [
      ["\\\\.", "string"],
      ["'", { token: "string", next: "@pop" }],
      [/[^\\']+/, "string"],
      [".", "string"],
    ],
  },
};

function initialize_language() {
  monaco_languages.register({ id: "intech_lua" });
  monaco_languages.register({ id: "lua" });
  monaco_languages.register({ id: "css" });
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

function initialize_grammar() {
  // Cast needed: @codingame/monaco-vscode-editor-api has stricter IMonarchLanguage
  // types than standalone monaco-editor, but the tokenizer definition is valid.
  monaco_languages.setMonarchTokensProvider("intech_lua", intech_lua);
  monaco_languages.setLanguageConfiguration("intech_lua", language_config);
  monaco_languages.setMonarchTokensProvider("css", css_language);
  monaco_languages.setLanguageConfiguration("css", css_conf);
}

// Monaco has no built-in color-swatch/colorpicker support for a language —
// that only ever comes from an explicitly registered DocumentColorProvider
// (real VSCode gets one from its CSS language service, which isn't
// installed here). Without this, the custom-theme CSS editor in Preferences
// shows no color decorations at all for its hex values.
function hexToColor(hex: string): monaco_editor.IColor {
  let h = hex.replace("#", "");
  if (h.length === 3 || h.length === 4) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return {
    red: parseInt(h.slice(0, 2), 16) / 255,
    green: parseInt(h.slice(2, 4), 16) / 255,
    blue: parseInt(h.slice(4, 6), 16) / 255,
    alpha: h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
  };
}

function colorToHex(color: monaco_editor.IColor): string {
  const toHex = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");
  const hex = `#${toHex(color.red)}${toHex(color.green)}${toHex(color.blue)}`;
  return color.alpha < 1 ? `${hex}${toHex(color.alpha)}` : hex;
}

// Resolves a CSS color expression (var(), color-mix(), …) to its computed
// rgb() by letting the browser do the cascade/color math on a live,
// unrendered element, rather than reimplementing CSS color parsing here.
function resolveCssColor(colorExpression: string): string {
  const probe = document.createElement("div");
  probe.style.color = colorExpression;
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved;
}

// ITU-R BT.601 perceived-brightness threshold (0-255 scale). Below 128
// reads as a dark color.
function isColorDark(rgbColor: string): boolean {
  const channels = rgbColor.match(/[\d.]+/g);
  if (!channels || channels.length < 3) return false;
  const [r, g, b] = channels.map(Number);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

function toColorInformation(
  model: monaco_editor.ITextModel,
  offset: number,
  length: number,
  color: monaco_editor.IColor,
): monaco_languages.IColorInformation {
  const start = model.getPositionAt(offset);
  const end = model.getPositionAt(offset + length);
  return {
    range: {
      startLineNumber: start.lineNumber,
      startColumn: start.column,
      endLineNumber: end.lineNumber,
      endColumn: end.column,
    },
    color,
  };
}

const CSS_HEX_COLOR =
  /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/g;
const CSS_RGB_COLOR =
  /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+))?\s*\)/g;

function initialize_color_provider() {
  monaco_languages.registerColorProvider("css", {
    provideDocumentColors(model) {
      const text = model.getValue();
      const results: monaco_languages.IColorInformation[] = [];

      CSS_HEX_COLOR.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = CSS_HEX_COLOR.exec(text))) {
        results.push(
          toColorInformation(
            model,
            match.index,
            match[0].length,
            hexToColor(match[0]),
          ),
        );
      }

      CSS_RGB_COLOR.lastIndex = 0;
      while ((match = CSS_RGB_COLOR.exec(text))) {
        const [full, r, g, b, a] = match;
        results.push(
          toColorInformation(model, match.index, full.length, {
            red: Number(r) / 255,
            green: Number(g) / 255,
            blue: Number(b) / 255,
            alpha: a !== undefined ? Number(a) : 1,
          }),
        );
      }

      return results;
    },
    provideColorPresentations(_model, colorInfo) {
      return [{ label: colorToHex(colorInfo.color) }];
    },
  });
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
    initialize_color_provider();

    // Connect to LuaLS via MonacoLanguageClient (non-blocking, logs on failure)
    startLuaLSClient()
      .then(() => {
        console.info("[LuaLS] Client successfully started.");
        Analytics.track({
          event: "Monaco Completion Mode",
          payload: { status: "luaLS" },
          mandatory: false,
        });
      })
      .catch((err) => {
        console.warn(
          "[LuaLS] Client start failed (server may not be running):",
          err,
        );

        Analytics.track({
          event: "Monaco Completion Mode",
          payload: { status: "legacy" },
          mandatory: false,
        });

        // In case the LuaLS server could not start, fallback to the original autocomplete and hover
        legacy_initialize_autocomplete();
        legacy_initialize_hover();
        appSettings.update((s) => {
          s.legacyCompletionActive = true;
          return s;
        });
      });
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

    // Keep editor-specific shortcuts out of the process-wide dynamic
    // keybinding list so simultaneous Monaco instances cannot hijack them.
    editor.onKeyDown((e) => {
      const clipboardCommand = e.equals(KeyMod.CtrlCmd | KeyCode.KeyC)
        ? "editor.action.clipboardCopyAction"
        : e.equals(KeyMod.CtrlCmd | KeyCode.KeyX)
          ? "editor.action.clipboardCutAction"
          : e.equals(KeyMod.CtrlCmd | KeyCode.KeyV)
            ? "editor.action.clipboardPasteAction"
            : undefined;

      if (clipboardCommand) {
        e.preventDefault();
        e.stopPropagation();
        editor.trigger("keyboard", clipboardCommand, undefined);
        return;
      }

      if (!e.equals(KeyMod.CtrlCmd | KeyCode.KeyS)) return;
      e.preventDefault();
      e.stopPropagation();
      editorDomNode?.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "s",
          code: "KeyS",
          ctrlKey: true,
          metaKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    if (editorDomNode) {
      editorDomNode.addEventListener("mousedown", () => {
        TabFocus.setTabFocusMode(false);
      });
    }

    editor.onDidBlurEditorText(() => {
      TabFocus.setTabFocusMode(true);
    });

    TabFocus.setTabFocusMode(true);

    return editor;
  }

  export function setTheme(value: Theme) {
    monaco_editor.setTheme(value);
  }

  // Picks the predefined Monaco theme that reads correctly against the
  // app's current --foreground color, independent of the active theme's
  // name — a custom theme can be named anything and still pair a light
  // foreground with a dark background (or vice versa), so this reads the
  // actual computed color instead of trusting a "light"/"dark" label.
  export function themeForCurrentPalette(): Theme {
    return isColorDark(resolveCssColor("var(--foreground)"))
      ? Theme.LIGHT
      : Theme.DARK;
  }

  export function colorize(node: HTMLElement, theme: Theme) {
    monaco_editor.colorizeElement(node, {
      theme,
      tabSize: 2,
    });
  }
}
