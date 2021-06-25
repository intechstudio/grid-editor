// meta: *--[[@ + code]]* -> config identifier
// must match naming conventions of grid-protocol.json
export const config_collection = [

    {category: ["Locals"],             name: "Button",                    configs: "--[[@l]] local num, val = self:ind(), self:bva()"},
    {category: ["Locals"],             name: "Potmeter / Fader",          configs: "--[[@l]] local num, val = self:ind(), self:pva()"},
    {category: ["Locals"],             name: "Encoder",                   configs: "--[[@l]] local num, val = self:ind(), self:eva()"},

    {category: ["Lookup"],             name: "MIDI Assignment",           configs: "--[[@glut]] glut(param1,36,0,37,1)"},

    {category: ["Code Block"],         name: 'Default',                    configs: "--[[@cb]] "}, // <-- imporant to let a space there!
    
    {category: ["Element Settings"],   name: 'Encoder Modes',               configs: "--[[@sec]] self:emo(0)"}, 
    {category: ["Element Settings"],   name: 'Button Modes',               configs: "--[[@sbc]] self:bmo(0)"}, 

    {category: ["LED", "Value"],       name: "Blank",                       configs: "--[[@glp]] glp(,,)" },

    {category: ["LED", "Color"],       name: "Blank",                      configs: "--[[@glc]] glc(,,,,)"},

    {category: ["MIDI"],               name: "Blank",                       configs: "--[[@gms]] gms(,,,)"},
    
    {category: ["Macro"],              name: "Default",                    configs: "--[[@gks]] gks()"},

    {category: ["Condition"],          name: "If",                         configs: "--[[@if]] if  then --[[@en]] end" },
    {category: ["Condition"],          name: "Else",                       configs: "--[[@el]] else" },
    {category: ["Condition"],          name: "Else If",                    configs: "--[[@ei]] else if  then" },

];


