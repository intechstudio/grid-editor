// meta: *--[[@ + code]]* -> config identifier
// must match naming conventions of grid-protocol.json
export const config_collection = [
    {category: ["Local"],       name: "midi to do",       config: "--[[@l]] local x = 1 local y = 2 local z = 3"},
    {category: ["MIDI"],        name: "midi to do",       config: "--[[@gsm]] gsm(,,,)"},
    {category: ["LED Value"],   name: "led value to do",  config: "--[[@glp]] glp(,,)" },
    {category: ["LED Color"],   name: "led color to do",  config: "--[[@glc]] glc(this.ind(),1,255,255,255)" },
    {category: ["Code Block"],  name: "code block stuff", config: "--[[@cb]] local nice = 1" },
    {category: ["Condition"],   name: "test cond",        config: "--[[@if]] if x==1 then --[[@gsk]] gsk() --[[@en]] end"},
    {category: ["Else"],        name: "test cond",        config: "--[[@el]] else"},
    {category: ["Else If"],     name: "test cond",        config: "--[[@ei]] else if y==2"}
    /**
    {category: ["Basic", "MIDI"],           name: "midi to do", configs: ["--[[@l]] local x = 1 local y = 2 local z = 3"]},
    {category: ["Basic", "LED Value"],      name: "led value to do", configs: ["--[[@glp]] glp(,,)"] },
    {category: ["Basic", "LED Color"],      name: "led color stuff", configs: ["--[[@glsc]] glsc(,,,,)"]},
    {category: ["Basic", "LED Color"],      name: "another led color stuff", configs: ["--[[@glsc]] glsc(,,,,)"]},
    {category: ["User", "Processing"],      name: "if cond", configs: ["to do 1...", "to do 2..."]},
    {category: ["User", "Ableton Live"],    name: "my first group", configs: ['first', "second", "third"]}
     */
];