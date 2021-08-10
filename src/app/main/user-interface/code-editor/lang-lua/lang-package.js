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
    {label: "self:", type: "keyword"},

    {label: "self:element_index()", type: "function"},

    {label: "self:button_number()", type: "function"},
    {label: "self:button_value()", type: "function"},
    {label: "self:button_min()", type: "function"},
    {label: "self:button_max()", type: "function"},
    {label: "self:button_mode()", type: "function"},
    {label: "self:button_elapsed_time()", type: "function"},
    {label: "self:button_state()", type: "function"},

    {label: "self:encoder_number()", type: "function"},
    {label: "self:encoder_value()", type: "function"},
    {label: "self:encoder_min()", type: "function"},
    {label: "self:encoder_max()", type: "function"},
    {label: "self:encoder_mode()", type: "function"},
    {label: "self:encoder_elapsed_time()", type: "function"},
    {label: "self:encoder_state()", type: "function"},
    {label: "self:encoder_velocity()", type: "function"},
    
    {label: "self:potmeter_number()", type: "function"},
    {label: "self:potmeter_value()", type: "function"},
    {label: "self:potmeter_min()", type: "function"},
    {label: "self:potmeter_max()", type: "function"},
    {label: "self:potmeter_resolution()", type: "function"},
    {label: "self:potmeter_elapsed_time()", type: "function"},
    {label: "self:potmeter_state()", type: "function"},

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

    {label: "mouse_move_send(position,axis)", type:"function"},
    {label: "mouse_button_send(state,button)", type:"function"},

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

    {label: "self:timer_start()", type: "function"},
    {label: "self:timer_stop()", type: "function"}
    
  ])
})

export function lua() {
  return new LanguageSupport(lua_language, [lua_completion])
}