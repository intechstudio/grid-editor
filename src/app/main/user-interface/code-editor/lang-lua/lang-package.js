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

    {label: "self:button_value()", type: "function"},

    {label: "led_default_red()", type: "function"},
    {label: "led_default_green()", type: "function"},
    {label: "led_default_blue()", type: "function"},
    {label: "led_value(number,layer,value)", type: "function"},
    {label: "led_timeout(number,layer,timeout)", type: "function"},
    {label: "led_color_min(number,layer,red,green,blue)", type: "function"},
    {label: "led_color_mid(number,layer,red,green,blue)", type: "function"},
    {label: "led_color_max(number,layer,red,green,blue)", type: "function"},
    {label: "led_color(number,layer,red,green,blue)", type: "function"},
    {label: "led_animation_rate(number,layer,frequency)", type: "function"},
    {label: "led_animation_type(number,layer,shape)", type: "function"},
    {label: "led_animation_phase_rate_type(number,layer,phase,frequency,shape)", type: "function"},

    {label: "midi_send(ch,cmd,p1,p2)", type: "function"},

    {label: "keyboard_send(def_delay,is_modifier,keystate,key_code)", type: "function"},

    {label: "random()", type: "function"},
    {label: "hardware_configuration()", type: "function"},
    {label: "version_major()", type: "function"},
    {label: "version_minor()", type: "function"},
    {label: "version_patch()", type: "function"},
    {label: "module_position_x()", type: "function"},
    {label: "module_position_y()", type: "function"},
    {label: "module_rotation()", type: "function"},

    {label: "page_next()", type: "function"},
    {label: "page_previous()", type: "function"},
    {label: "page_current()", type: "function"},
    {label: "page_load(page_number)", type: "function"},

    {label: "lookup(source,input,output)", type: "function"},

    {label: "limit()", type: "function"},

    {label: "print()", type: "function"},
    
  ])
})

export function lua() {
  return new LanguageSupport(lua_language, [lua_completion])
}