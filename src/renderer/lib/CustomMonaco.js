import {
  editor as monaco_editor,
  languages as monaco_languages,
} from "monaco-editor";

import { grid } from "@intechstudio/grid-protocol";

import { writable, get } from "svelte/store";

let hoverTips = {};
export const monaco_elementtype = writable();

const language_config = {
  comments: {
    lineComment: "--",
    blockComment: ["--[[", "]]"],
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

export const language = {
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
};

function initialize_language() {
  monaco_languages.register({ id: "intech_lua" });
}

function initialize_theme() {
  monaco_editor.defineTheme("my-theme", {
    base: "vs-dark",
    inherit: true,
    rules: [
      {
        token: "customClass",
        foreground: "ffa500",
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

  monaco_editor.defineTheme("my-theme-disabled", {
    base: "vs-dark",
    inherit: true,
    rules: [
      {
        token: "customClass",
        foreground: "A8A8A8",
        fontStyle: "italic underline",
      },
      { token: "function", foreground: "A8A8A8" },
      { token: "variable", foreground: "A8A8A8" },
      { token: "forbidden", foreground: "A8A8A8" },
    ],
    colors: {
      "editor.background": "#2a343900",
    },
  });

  let monaco_block = document.createElement("div");

  let editor = monaco_editor.create(monaco_block, {
    value: "",
    language: "intech_lua",
    theme: "my-theme",
  });

  editor.dispose();
}

function initialize_autocomplete() {
  (function init_autocomplete() {
    function createProposals(range, model, position, prefix) {
      let proposalList = [];
      language.functions = ["print"];

      // Handle other general cases (mathfunctions, keywords, etc.)
      for (const element of language.mathfunctions) {
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

      for (const element of language.keywords) {
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

      const elementtype = get(monaco_elementtype);
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
          (elementtype === elementTypeMapping[keyPrefix] ||
            elementtype === undefined)
        ) {
          proposalItem.label = isInsideSelfOrElement ? value : `self:${value}`;
          proposalItem.insertText = `${value}()`;
        } else if (elementtype === "system" || !elementtype) {
          if (!proposalList.some((e) => e.label === `element[0]:${value}`)) {
            proposalItem.label = isInsideSelfOrElement
              ? value
              : `element[0]:${value}`;
            proposalItem.insertText = `${value}()`;
          }
        } else {
          proposalItem.label = value;
          proposalItem.insertText = `${value}()`;
        }

        proposalList.push(proposalItem);

        const helperText = grid.get_lua_function_helper(key);
        if (typeof helperText !== "undefined") {
          hoverTips[value] = helperText;
        }
      }

      for (const element of language.functions) {
        if (proposalList.find((e) => e.label === element)) {
          continue;
        }

        let proposalItem = {
          label: "",
          kind: monaco_languages.CompletionItemKind.Function,
          documentation: "Documentation",
          insertText: "",
          range: range,
          label: element,
          insertText: element + "()",
        };

        proposalList.push(proposalItem);
      }

      return proposalList;
    }

    let disposable = monaco_languages.registerCompletionItemProvider(
      "intech_lua",
      {
        provideCompletionItems: function (model, position) {
          var word = model.getWordUntilPosition(position);
          var lineContent = model.getLineContent(position.lineNumber);
          var range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          // Check for 'self:' or 'element[x]:'
          const selfIndex = lineContent.lastIndexOf(
            "self:",
            position.column - 1,
          );
          const elementIndex = lineContent.lastIndexOf(
            "element[",
            position.column - 1,
          );

          // If 'self:' or 'element[x]:' is found, adjust the prefix
          let prefix = "";
          if (selfIndex !== -1 && selfIndex + 5 <= word.startColumn) {
            prefix = "self:";
          } else if (
            elementIndex !== -1 &&
            elementIndex + 8 <= word.startColumn
          ) {
            prefix = lineContent.slice(elementIndex, position.column); // 'element[x]:'
          }

          return {
            suggestions: createProposals(range, model, position, prefix),
          };
        },
      },
    );
  })();
}

function initialize_highlight() {
  grid.lua_function_to_human_map().forEach((value, key) => {
    //AUTOCOMPLETE FUNCTIONS
    language.functions.push(value);
  });

  grid.lua_function_forbiddens().forEach((value) => {
    //FORBIDDEN IDENTIFIERS
    language.forbiddens.push(value);
  });

  initialize_grammar(); // update highlighting
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
  console.log(language);
  monaco_languages.setMonarchTokensProvider("intech_lua", language);
  monaco_languages.setLanguageConfiguration("intech_lua", language_config);
}

initialize_autocomplete();
initialize_theme();
initialize_language();
initialize_grammar();
initialize_hover();
initialize_highlight();

export { monaco_editor, monaco_languages };
