// meta: *--[[@ + code]]* -> config identifier
// must match naming conventions of grid-protocol.json
export const config_collection = [

    {category: ["Locals"],             name: "Button",                    configs: "--[[@l]] local num, val = self:ind(), self:bva()"},
    {category: ["Locals"],             name: "Potmeter / Fader",          configs: "--[[@l]] local num, val = self:ind(), self:pva()"},
    {category: ["Locals"],             name: "Encoder",                   configs: "--[[@l]] local num, val = self:ind(), self:eva()"},

    {category: ["Lookup"],             name: "MIDI Assignment",           configs: "--[[@glut]] glut(param1,36,0,37,1)"},
    

    {category: ["Code Block"],         name: 'Default',                   configs: "--[[@cb]] "}, // <-- imporant to let a space there!
    
    {category: ["Element Settings"],   name: 'Encoder Settings',          configs: "--[[@sec]] self:emo(0) self:ev0(100)"}, 
    {category: ["Element Settings"],   name: 'Button Settings',           configs: "--[[@sbc]] self:bmo(0)"}, 

    {category: ["LED Value"],           name: "Change LED intensity",     configs: "--[[@glp]] glp(,,)" },

    {category: ["LED Color"],           name: "Change LED color",         configs: "--[[@glc]] glc(,,,,)"},

    {category: ["MIDI"],               name: "Generic MIDI settings",                       configs: "--[[@gms]] gms(,,,)"},
    
    {category: ["Macro"],              name: "Keyboard ",                    configs: "--[[@gks]] gks()"},

    {category: ["Condition"],          name: "If",                         configs: "--[[@if]] if  then --[[@en]] end" },
    {category: ["Condition"],          name: "Else",                       configs: "--[[@el]] else" },
    {category: ["Condition"],          name: "Else If",                    configs: "--[[@ei]] else if  then" },

];

export const quick_action_collection = [
    { name: "Timer Start",           configs: "--[[@gtt]] gtt()" },
    { name: "Timer Stop",            configs: "--[[@gtp]] gtp()" },
]

