---@meta

---Sends a standard MIDI message.
---@param channel integer MIDI channel (0–15)
---@param command integer MIDI status byte — e.g. 176 (CC), 144 (Note On)
---@param parameter1 integer First data byte (0–127)
---@param parameter2 integer Second data byte (0–127)
function midi_send(channel, command, parameter1, parameter2) end
