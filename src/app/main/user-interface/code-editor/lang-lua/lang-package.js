
import {LezerLanguage, LanguageSupport, indentNodeProp, foldNodeProp, foldInside, delimitedIndent} from "@codemirror/language";
import {completeFromList} from "@codemirror/autocomplete"
import {styleTags, tags as t} from "@codemirror/highlight";

import grid from "../../../../protocol/grid-protocol"

import {parser} from "./syntax.grammar";

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
        GridGlobal: t.string,
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




// Generate code mirror compatible highlight based on the function definitions in the grid protocol.
// If parameter eventtype is provided then only the element specific and the global functions are included.
export function lua_highlight(elementtype) {


  let grid_specific = []

  if (elementtype === undefined){

    grid_specific = [...grid.properties.LUA_AUTOCOMPLETE]

  }
  else{

    for (let i=0; i<grid.properties.LUA_AUTOCOMPLETE.length; i++){

      const item = grid.properties.LUA_AUTOCOMPLETE[i]

      if (item.elementtype === undefined || item.elementtype === elementtype){
        grid_specific.push(item)
      }
    }

  }

  const lua_completion = lua_language.data.of({
    autocomplete: completeFromList([
  
      ...grid_specific,
      {label: "print", type: "function"}
  
    ])
  })

  return new LanguageSupport(lua_language, [lua_completion])
}