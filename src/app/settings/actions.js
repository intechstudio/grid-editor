import { GRID_PROTOCOL } from '../serialport/GridProtocol.js';

const GRID = GRID_PROTOCOL;
GRID.initialize();
const TEMPLATE_PARAMETERS = GRID.PROTOCOL.PARAMETERS;

export const ACTIONS = {

  ELEMENTS: {
    button: ['AV7'],
    button_led: ['AV8'],
    encoder: ['DV7'],
    encoder_led: ['DV8'],
    potentiometer: ['AV7'],
    potentiometer_led: ['AV8']
  },

  CNUMBER: [

  ],

  DAVALUE:{

  },

  MIDIRELATIVE : {
    CC: [
          [
            {value: '0xb0', info: 'Control Change'}, 
            {value: '0x90', info: 'Note On'}, 
            {value: '0x80', info: 'Note Off'}
          ],
          [
            {value: 'A0', info: 'This control element'}, 
            {value: 'A1', info: 'Reversed control element'}
          ],[
            {value: 'A2', info: '7-bit value'}
          ]
    ],
    NOTE: [
      [
        {value: '0xb0', info: 'Control Change'}, 
        {value: '0x90', info: 'Note On'}, 
        {value: '0x80', info: 'Note Off'}
      ],
      [
        {value: 'A0', info: 'This control element'}, 
        {value: 'A1', info: 'Reversed control element'}
      ],
      [
        {value: 'A2', info: '7-bit value'}
      ],
    ],

    optionList: function(parameter){
      let options = [];
      if(parameter == '0xb0'){
        options = this.CC;
      }else{ // this is also the default;
        options = this.NOTE;
      }
      return options;
    }
  },

  LED_COLOR : [
    [{}],
    [{}]
  ],

  LED_INTENSITY: [
    [{}],
    [{}]
  ],

  encode: function(data){
    let endodedParameters;
    if(data.name == 'MIDI Relative'){
      endodedParameters = this.MIDIRELATIVE_encoder(data.parameters);
    }
    return endodedParameters;
  },

  MIDIRELATIVE_encoder: function(parameters){
    console.log(TEMPLATE_PARAMETERS);
    //0xb0//controlchange -> [0,b,b,0]; [cable, command, command, channel]
    //0x90//noteon -> [0,9,9,0]
    //0x80//noteoff -> [0,8,8,0]

    console.log(parameters);


    let encodedParameters = [];
    const COMMAND = parameters[0][2];
    
    encodedParameters = [
      {'CABLECOMMAND': [0,COMMAND] },
      {'COMMANDCHANNEL': [COMMAND,0] },
      {'PARAM1': parameters[1]},
      {'PARAM1': parameters[2]}
    ];
    return encodedParameters;
  },
}