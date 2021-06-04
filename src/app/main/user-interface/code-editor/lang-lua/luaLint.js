import {Diagnostic} from "@codemirror/lint"
import {Text} from "@codemirror/state"
import {EditorView} from "@codemirror/view"
import {lua_language} from "./lang-package"

const lua = require('luaparse');


/// Connects an [lualint](https://lualint.org/) linter to CodeMirror's
/// [lint](#lint) integration. `lualint` should be an instance of the
/// [`Linter`](https://lualint.org/docs/developer-guide/nodejs-api#linter)
/// class, and `config` an optional lualint configuration. The return
/// value of this function can be passed to [`linter`](#lint.linter)
/// to create a JavaScript linting extension.
///
/// Note that lualint targets node, and is tricky to run in the
/// browser. The [lualint4b](https://github.com/mysticatea/lualint4b)
/// and
/// [lualint4b-prebuilt](https://github.com/marijnh/lualint4b-prebuilt/)
/// packages may help with that.
export function luaLint(lualint, config) {
  if (!config) {
    config = {
      parserOptions: {ecmaVersion: 2019, sourceType: "module"},
      env: {browser: true, node: true, es6: true, es2015: true, es2017: true, es2020: true},
      rules: {}
    }
    /**
    lualint.getRules().forEach((desc, name) => {
      if (desc.meta.docs.recommended) config.rules[name] = 2
    })
     */
  }

  return (view) => {
    let {state} = view, found = []
    for (let {from, to} of lua_language.findRegions(state)) {
      let fromLine = state.doc.lineAt(from), offset = {line: fromLine.number - 1, col: from - fromLine.from, pos: from}
      
      let code = state.doc.text.join('\n');
      console.log(code)
      console.log(lua.parse(code))
      //for (let d of lualint.verify(state.sliceDoc(from, to), config))
      found.push(translateDiagnostic(state.doc, offset))
    }
    return found
  }
}

function mapPos(line, col, doc, offset) {
  return doc.line(line + offset.line).from + col + (line == 1 ? offset.col - 1 : -1)
}

function translateDiagnostic(input, doc, offset) {
  let start = mapPos(input.line, input.column, doc, offset)
  let result = {
    from: start,
    to: input.endLine != null && input.endColumn != 1 ? mapPos(input.endLine, input.endColumn, doc, offset) : start,
    message: input.message,
    source: input.ruleId ? "jshint:" + input.ruleId : "jshint",
    severity: input.severity == 1 ? "warning" : "error",
  }
  if (input.fix) {
    let {range, text} = input.fix, from = range[0] + offset.pos - start, to = range[1] + offset.pos - start
    result.actions = [{
      name: "fix",
      apply(view, start) {
        view.dispatch({changes: {from: start + from, to: start + to, insert: text}, scrollIntoView: true})
      }
    }]
  }
  return result
}