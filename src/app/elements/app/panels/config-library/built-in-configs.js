// meta: *--[[@ + code]]* -> config identifier
// must match naming conventions of grid-protocol.json
export const config_collection = [
    {category: ["midi"], name: "midi to do", configs: ["--[[@l]] local x = 1 local y = 2 local z = 3"]},
    {category: ["led", "value"], name: "led value to do", configs: ["--[[@glsp]]glsp(,,)"] },
    {category: ["led", "color"], name: "led color stuff", configs: ["--[[@glsc]]glsc(,,,,)"]},
    {category: ["condition"], name: "if cond", configs: ["to do 1...", "to do 2..."]},
    {category: ["user"], name: "my first group", configs: ['first', "second", "third"]}
];