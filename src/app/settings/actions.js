import { GRID_PROTOCOL } from '../serialport/GridProtocol.js';

const GRID = GRID_PROTOCOL;
GRID.initialize();

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
        {value: '0xb0', info: 'CC'}, 
        {value: '0x90', info: 'Note On'}, 
        {value: '0x80', info: 'Note Off'}
      ],
      [
        {value: 'A0', info: 'This // Pitch'}, 
        {value: 'A1', info: 'REV This // Pitch'}
      ],
      [
        {value: 'A2', info: '7-bit // Velocity'}
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

  LED_INTENSITY: [
    [
      {value: '?', info: 'Layer Number'}, 
    ],
    [
      {value: '?', info: 'LED Number'}, 
    ],
    [
      {value: '?', info: 'Phase'}
    ]
  ],


  optionList: function(name){
    if(name == 'LED Intensity'){
      return this.LED_INTENSITY;
    }
  },

  encode: function(data){
    let endodedParameters;
    if(data.name == 'MIDI Relative'){
      endodedParameters = this.MIDIRELATIVE_encoder(data.parameters);
    }
    if(data.name == 'LED Intensity'){
      endodedParameters = this.LEDINTENSITY_encoder(data.parameters);
    }
    return endodedParameters;
  },

  LEDINTENSITY_encoder: function(parameters){
    let encodedParameters = [];
    for (let i = 0; i < parameters.length; i++) {
      const key = parameters[i].gridProtocolName;
      encodedParameters.push({key: parameters[i].value});
    }
    return encodedParameters;
  },

  MIDIRELATIVE_encoder: function(parameters){
    //0xb0//controlchange -> [0,b,b,0]; [cable, command, command, channel]
    //0x90//noteon -> [0,9,9,0]
    //0x80//noteoff -> [0,8,8,0]

    let encodedParameters = [];
    const COMMAND = parameters[0].value[2];
    
    encodedParameters = [
      {'CABLECOMMAND': [0,COMMAND] },
      {'COMMANDCHANNEL': [COMMAND,0] },
      {'PARAM1': parameters[1].value},
      {'PARAM1': parameters[2].value}
    ];

    return encodedParameters;
  },
}