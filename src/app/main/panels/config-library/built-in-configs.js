// meta: *--[[@ + code]]* -> config identifier
// must match naming conventions of grid-protocol.json
export const config_collection = [

    {category: ["Locals"],             name: "Default",                    configs: "--[[@l]] local x = 1"},

    {category: ["Code Block"],         name: 'Default',                    configs: "--[[@cb]]"},

    {category: ["LED", "Value"],       name: "Encoder",                    configs: "--[[@glp]] glp(this.ind(),2,this.eva())" },
    {category: ["LED", "Value"],       name: "Button",                     configs: "--[[@glp]] glp(this.ind(),2,this.bva())" },
    {category: ["LED", "Value"],       name: "Potmeter",                   configs: "--[[@glp]] glp(this.ind(),2,this.pva())"},

    {category: ["LED", "Color"],       name: "Button / Potmeter",          configs: "--[[@glc]] glc(this.ind(),1,255,255,255)"},
    {category: ["LED", "Color"],       name: "Encoder",                    configs: "--[[@glc]] glc(this.ind(),2,255,255,255)"},

    {category: ["MIDI"],               name: "Encoder",                    configs: "--[[@gms]] gms(0,176,this.ind(),this.eva())"},
    {category: ["MIDI"],               name: "Button",                     configs: "--[[@gms]] gms(0,176,this.ind(),this.bva())"},
    {category: ["MIDI"],               name: "Potmeter",                   configs: "--[[@gms]] gms(0,176,this.ind(),this.pva())"},

    {category: ["Condition"],          name: "If",                         configs: "--[[@if]] if (1) then --[[@en]] end" },
    {category: ["Condition"],          name: "Else",                       configs: "--[[@el]] else" },
    {category: ["Condition"],          name: "Else If",                    configs: "--[[@ei]] else if 1 then" },

];
