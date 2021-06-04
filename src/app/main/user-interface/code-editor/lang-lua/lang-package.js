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
        GridAction: t.special(t.variableName),
        GridSetter: [t.special(t.string)],
        GridGetter: t.function(t.variableName),
        GridVariable: t.keyword,
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
    {label: "midi", type: "keyword"}
  ])
})

export function lua() {
  return new LanguageSupport(lua_language, [lua_completion])
}