import { writable, get } from 'svelte/store';

import * as grid_protocol from '../../external/grid-protocol/grid_protocol_bot.json'

import { monaco_languages, monaco_editor } from '../lib/CustomMonaco';

export const monaco_elementtype = writable()


/**
$: if(get(monaco_elementtype)){
	initialize_highlight()
}
 */

let monaco_disposables = []


let hoverTips = {};
let hoverDisposable = undefined;

export const language_config = {
	comments: {
	  lineComment: "--",
	  blockComment: ["--[[", "]]"]
	},
	brackets: [
	  ["{", "}"],
	  ["[", "]"],
	  ["(", ")"]
	],
	autoClosingPairs: [
	  { open: "{", close: "}" },
	  { open: "[", close: "]" },
	  { open: "(", close: ")" },
	  { open: '"', close: '"' },
	  { open: "'", close: "'" }
	],
	surroundingPairs: [
	  { open: "{", close: "}" },
	  { open: "[", close: "]" },
	  { open: "(", close: ")" },
	  { open: '"', close: '"' },
	  { open: "'", close: "'" }
	]
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
	  "while"
	],
	functions: [
		"print"
	],
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
		"tanh"
	],
	variables: [
		"self",
		"element",
		"math"
	],
	forbiddens: [
	],
	brackets: [
	  { token: "delimiter.bracket", open: "{", close: "}" },
	  { token: "delimiter.array", open: "[", close: "]" },
	  { token: "delimiter.parenthesis", open: "(", close: ")" }
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
	  "..."
	],
	symbols: /[=><!~?:&|+\-*\/\^%]+/,
	escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
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
			  "@default": "identifier"
			}
		  }
		],
		{ include: "@whitespace" },
		[/(,)(\s*)([a-zA-Z_]\w*)(\s*)(:)(?!:)/, ["delimiter", "", "key", "", "delimiter"]],
		[/({)(\s*)([a-zA-Z_]\w*)(\s*)(:)(?!:)/, ["@brackets", "", "key", "", "delimiter"]],
		[/[{}()\[\]]/, "@brackets"],
		[
		  /@symbols/,
		  {
			cases: {
			  "@operators": "delimiter",
			  "@default": ""
			}
		  }
		],
		[/\d*\.\d+([eE][\-+]?\d+)?/, "number.float"],
		[/0[xX][0-9a-fA-F_]*[0-9a-fA-F]/, "number.hex"],
		[/\d+?/, "number"],
		[/[;,.]/, "delimiter"],
		[/"([^"\\]|\\.)*$/, "string.invalid"],
		[/'([^'\\]|\\.)*$/, "string.invalid"],
		[/"/, "string", '@string."'],
		[/'/, "string", "@string.'"]
	  ],
	  whitespace: [
		[/[ \t\r\n]+/, ""],
		[/--\[([=]*)\[/, "comment", "@comment.$1"],
		[/--.*$/, "comment"]
	  ],
	  comment: [
		[/[^\]]+/, "comment"],
		[
		  /\]([=]*)\]/,
		  {
			cases: {
			  "$1==$S2": { token: "comment", next: "@pop" },
			  "@default": "comment"
			}
		  }
		],
		[/./, "comment"]
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
			  "@default": "string"
			}
		  }
		]
	  ]
	}
};


function initialize_language(){
	monaco_languages.register({ id: 'intech_lua' });
}


export function initialize_theme(){

	monaco_editor.defineTheme('my-theme', {
		base: 'vs-dark',
		inherit: true,
		rules: [
		  { 
			token: 'customClass', 
			foreground: 'ffa500',
			fontStyle: 'italic underline'
		  },
		  { token: 'function', foreground: 'dee4b1'},
		  { token: 'variable', foreground: '549cd0'},
		  { token: 'forbidden', foreground: '990000'},
		],
		colors: {
		  'editor.background': '#2a343900',
		}
	  });
  
	  
	  let monaco_block = document.createElement('div');

	  let editor = monaco_editor.create(monaco_block, {
		value: '',
		language: 'intech_lua',
		theme: "my-theme"
	  });

	  editor.dispose()

}

function initialize_autocomplete(){



	(function init_autocomplete(){


		function createProposals(range) {

			const elementtype = get(monaco_elementtype);

			let proposalList = []


			for (const element of language.functions){

				let proposalItem = {
					label: '',
					kind: monaco_languages.CompletionItemKind.Function,
					documentation: 'Documentation',
					insertText: '',
					range: range
				}				


				proposalItem.label = element
				proposalItem.insertText = element

				proposalList.push(proposalItem)
			}
			for (const element of language.mathfunctions){

				let proposalItem = {
					label: '',
					kind: monaco_languages.CompletionItemKind.Function,
					documentation: 'Documentation',
					insertText: '',
					range: range
					}				


				proposalItem.label = "math."+ element
				proposalItem.insertText = "math."+ element

				proposalList.push(proposalItem)
			}

			for (const element of language.keywords){

				let proposalItem = {
					label: '',
					kind: monaco_languages.CompletionItemKind.Keyword,
					documentation: 'Documentation',
					insertText: '',
					range: range
					}				


				proposalItem.label = element
				proposalItem.insertText = element

				proposalList.push(proposalItem)
			}


			for (const key in grid_protocol) {
				if(typeof grid_protocol[key] !== 'object'){

					let proposalItem = {
						label: '',
						kind: monaco_languages.CompletionItemKind.Function,
						documentation: 'Documentation',
						insertText: '',
						range: range
					}					
					
					if(key.startsWith('GRID_LUA_FNC_E') && key.endsWith("_human")){

						if (elementtype === 'encoder' || elementtype === undefined){
							proposalItem.label = "self:" + grid_protocol[key]
							proposalItem.insertText = "self:" + grid_protocol[key] + "()"
						}
						else if (elementtype === 'system'){
							proposalItem.label = "element[0]:" + grid_protocol[key]
							proposalItem.insertText = "element[0]:" + grid_protocol[key] + "()"
						}
					}            

					if(key.startsWith('GRID_LUA_FNC_B') && key.endsWith("_human")){


						if (elementtype === 'button' || elementtype === undefined){
							proposalItem.label = "self:" + grid_protocol[key]
							proposalItem.insertText = "self:" + grid_protocol[key] + "()"
						}
					}

					if(key.startsWith('GRID_LUA_FNC_P') && key.endsWith("_human")){

						if (elementtype === 'potentiometer' || elementtype === undefined){
							proposalItem.label = "self:" + grid_protocol[key]
							proposalItem.insertText = "self:" + grid_protocol[key] + "()"
						}
						else if (elementtype === 'system'){
							proposalItem.label = "element[0]:" + grid_protocol[key]
							proposalItem.insertText = "element[0]:" + grid_protocol[key] + "()"
						}
					}

					proposalList.push(proposalItem)
				}
			}

			// returning a static list of proposals, not even looking at the prefix (filtering is done by the Monaco editor),
			// here you could do a server side lookup
			return [... proposalList];
		}

		console.log('sup');

		let disposable = monaco_languages.registerCompletionItemProvider('intech_lua', {
			provideCompletionItems: function (model, position) {
			// find out if we are completing a property in the 'dependencies' object.
			var textUntilPosition = model.getValueInRange({
				startLineNumber: 1,
				startColumn: 1,
				endLineNumber: position.lineNumber,
				endColumn: position.column
			});

			var word = model.getWordUntilPosition(position);
			var range = {
				startLineNumber: position.lineNumber,
				endLineNumber: position.lineNumber,
				startColumn: word.startColumn,
				endColumn: word.endColumn
			};
			return {
				suggestions: createProposals(range)
			};
			}
		});

		monaco_disposables.push(disposable);



		})()  
}

function initialize_highlight(){

	const elementtype = get(monaco_elementtype);


	for (const key in grid_protocol) {
		if(typeof grid_protocol[key] !== 'object'){

			// AUTOCOMPLETE FUNCTIONS
			if(key.startsWith('GRID_LUA_FNC_G') && key.endsWith("_human")){
				
				language.functions.push(grid_protocol[key])
				hoverTips[grid_protocol[key]] = "Global function named " + grid_protocol[key]
			
			}        
			
			
			if(key.startsWith('GRID_LUA_FNC_E') && key.endsWith("_human")){


				language.functions.push(grid_protocol[key])
				hoverTips[grid_protocol[key]] = "Encoder function named " + grid_protocol[key]

			}            

			if(key.startsWith('GRID_LUA_FNC_B') && key.endsWith("_human")){


				language.functions.push(grid_protocol[key])
				hoverTips[grid_protocol[key]] = "Button function named " + grid_protocol[key]

			}

			if(key.startsWith('GRID_LUA_FNC_P') && key.endsWith("_human")){

				language.functions.push(grid_protocol[key])
				hoverTips[grid_protocol[key]] = "Potmeter function named " + grid_protocol[key]

			}

			if (key.endsWith("_short")){
				//console.log("SHORT: "+grid_protocol[key])
				language.forbiddens.push(grid_protocol[key])
			}

		}
	}

	initialize_grammar(); // update highlighting
}


function initialize_hover(){

	monaco_languages.registerHoverProvider('intech_lua', {
		provideHover: function(model, position) { 

		if (model.getWordAtPosition(position) !== null){

			const word = model.getWordAtPosition(position).word;

			if (hoverTips[word] !== undefined)

			return {				
			contents: [
				{ value: '**SOURCE**' },
				{ value: '```html\n' + hoverTips[word] + '\n```' }
			]
			}

		}

		}
	})

}

function initialize_grammar(){

	monaco_languages.setMonarchTokensProvider('intech_lua', language);
	monaco_languages.setLanguageConfiguration('intech_lua', language_config)

}

initialize_theme();
initialize_language();
initialize_grammar();
initialize_hover();
initialize_autocomplete();
initialize_highlight();

export function find_forbidden_identifiers(str){

	const identifier_match_expr = /[a-zA-Z0-9_]+/g

	const identifiers = str.match(identifier_match_expr)

	let forbiddenCount = 0;
	let forbiddenList = [];

	if (identifiers !== undefined && identifiers !== null){

		identifiers.forEach(element => {
		
			if (language.forbiddens.find(e => e==element)){
				forbiddenCount++;
				forbiddenList.push(element);
			}

		});
	}

	return forbiddenList;

}