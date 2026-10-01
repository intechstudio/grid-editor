// Shared suggestion list for editing a named Function block's signature
// ("name(params)" or "name") — used by config-blocks/headers/
// FunctionStartFace.svelte (editing an existing fst block) and
// main/modals/AddVirtualEvent.svelte (creating a new one), so both present
// the same callback conventions.
export const functionSuggestions = [
  { value: "foo(bar)", info: "Example function with parameter" },
  {
    value: "self.midirx_cb(self, header, event)",
    info: "MIDI RX callback handler",
  },
  {
    value: "self.sysexrx_cb(self, header, sysex)",
    info: "SysEx RX callback handler",
  },
  {
    value: "self.rtmrx_cb(self, header, rtm)",
    info: "MIDI Real-Time RX callback handler (clock, start, stop, etc.)",
  },
  {
    value: "midi_auto_ch(self)",
    info: "Calculate default MIDI channel (0-15) from grid position",
  },
  {
    value: "midi_auto_cmd(self)",
    info: "Calculate default MIDI command (144=Note On, 176=Control Change)",
  },
  {
    value: "midi_auto_p1(self)",
    info: "Calculate default MIDI parameter 1 (note/CC number 0-127)",
  },
  {
    value: "midi_auto_p2(self)",
    info: "Calculate default MIDI parameter 2 (value from element state)",
  },
  {
    value: "color_curve(c)",
    info: "Calculate three-point intensity response curve (min, mid, max)",
  },
  {
    value: "color_auto_layer(self)",
    info: "Calculate LED layer (1=button/pot, 2=encoder) from event type",
  },
  {
    value: "color_auto_value(self, i)",
    info: "Calculate LED intensity value (0-255) for segment i",
  },
];
