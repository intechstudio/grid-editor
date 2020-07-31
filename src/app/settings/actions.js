export const ACTIONS = {
  /**
    "GRID_CLASS_MIDIRELATIVE_CABLECOMMAND_offset": "5",
    "GRID_CLASS_MIDIRELATIVE_CABLECOMMAND_length": "2",
    "GRID_CLASS_MIDIRELATIVE_COMMANDCHANNEL_offset": "7",
    "GRID_CLASS_MIDIRELATIVE_COMMANDCHANNEL_length": "2",
    "GRID_CLASS_MIDIRELATIVE_PARAM1_offset": "9",
    "GRID_CLASS_MIDIRELATIVE_PARAM1_length": "2",
    "GRID_CLASS_MIDIRELATIVE_PARAM2_offset": "11",
    "GRID_CLASS_MIDIRELATIVE_PARAM2_length": "2",
  */
  MIDIRELATIVE : [
    [{value: '0xB0', info_1: 'Control Change'}, {value: '0x90', info_1: 'Note On'}, {value: '0x80', info_1: 'Note Off'}],
    [{value: 'a0', info_1: 'Pitch', info_2: 'This control element.'}, {value: 'a1', info_1: 'Pitch', info_2: 'Reversed control element.'}],
    [{value: 'a2', info_1: 'Velocity', info_2: '7-bit value.'},]
  ],

  LED_COLOR : [
    [{}],
    [{}]
  ],

  LED_INTENSITY: [
    [{}],
    [{}]
  ]
}