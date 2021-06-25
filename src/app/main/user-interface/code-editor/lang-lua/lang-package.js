import {parser} from "./syntax.grammar";
import {LezerLanguage, LanguageSupport, indentNodeProp, foldNodeProp, foldInside, delimitedIndent} from "@codemirror/language";
import {completeFromList} from "@codemirror/autocomplete"
import {styleTags, tags as t} from "@codemirror/highlight";

export const lua_language = LezerLanguage.define({
  parser: parser.configure({
    props: [
      indentNodeProp.add({
        Block: delimitedIndent({closing: ")", align: false})
      }),
      foldNodeProp.add({
        Block: foldInside
      }),
      styleTags({
        "if then else elseif end": [t.strong, t.processingInstruction],
        GridLed: t.special(t.variableName),
        GridMidi: [t.special(t.string)],
        Element: t.string,
        'self': t.function(t.variableName),
        kw: t.keyword,
        ArithOp: t.arithmeticOperator,
        CompareOp: t.compareOperator,
        String: t.string,
        Number: t.number,
        Comment: t.comment,
        "( )": t.paren
      })
    ]
  }),
  languageData: {
    commentTokens: {line: "--", block: {open: "--[[", close: "]]--"}}
  }
});

export const lua_completion = lua_language.data.of({
  autocomplete: completeFromList([
    {label: "local", type: "keyword"},
    {label: "led_default_red()", type: "function"},
    {label: "led_default_green()", type: "function"},
    {label: "led_default_blue()", type: "function"},
    {label: "this.button_value()", type: "function"},
    {label: "led_value(number,layer,value)", type: "function"}
  ])
})

export function lua() {
  return new LanguageSupport(lua_language, [lua_completion])
}