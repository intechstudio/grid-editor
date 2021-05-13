<script context="module">
  // config descriptor parameters
  export const information = {
    short: 'gms',
    groupType: 'standard',
    desc: 'MIDI'
  }
</script>

<script>

  import { onMount, beforeUpdate, afterUpdate, createEventDispatcher } from 'svelte';
  import AtomicInput from '../main/user-interface/AtomicInput.svelte';

  import _utils from '../runtime/_utils.js';
  import { localDefinitions } from '../runtime/runtime.store';

  export let config = ''
  export let index;

  const dispatch = createEventDispatcher();

  const parameterNames = ['Channel', 'Command', 'Parameter 1', 'Parameter 2'];

  let scriptSegments = [];

  // config.script cannot be undefined
  $: if(config.script){
    scriptSegments = _utils.scriptToSegments({human: config.human,short: config.short, script: config.script});
  };

  function sendData(e, index){
    scriptSegments[index] = e;
    const script = _utils.segmentsToScript({human: config.human, short: config.short, array: scriptSegments});  // important to set the function name
    dispatch('output', {short: config.short, script: script})
  }
  

  const channels = (length) => {
    let arr = [];
    for (let i = 0; i < length; i++) {
      arr[i] = {value: i, info: `Channel ${i}`};
    }
    return arr;
  }

  const _suggestions = [
    // channels
      [...channels(15)],
    // commands
      [
        {value: '176', info: 'Control Change', key: 'control_change_messages'}, 
        {value: '144', info: 'Note On', key: 'note_on_event'},
        {value: '128', info: 'Note Off', key: 'note_off_event'},
        {value: '192', info: 'Program Change', key: 'program_change_messages'}
      ],
    // param 1
      { 
        control_change_messages: 
          [
            {
              "value": 0,
              "info": "Bank Select"
            },
            {
              "value": 1,
              "info": "Modulation Wheel or Lever"
            },
            {
              "value": 2,
              "info": "Breath Controller"
            },
            {
              "value": 3,
              "info": "Undefined"
            },
            {
              "value": 4,
              "info": "Foot Controller"
            },
            {
              "value": 5,
              "info": "Portamento Time"
            },
            {
              "value": 6,
              "info": "Data Entry MSB"
            },
            {
              "value": 7,
              "info": "Channel Volume (formerly Main Volume)"
            },
            {
              "value": 8,
              "info": "Balance"
            },
            {
              "value": 9,
              "info": "Undefined"
            },
            {
              "value": 10,
              "info": "Pan"
            },
            {
              "value": 11,
              "info": "Expression Controller"
            },
            {
              "value": 12,
              "info": "Effect Control 1"
            },
            {
              "value": 13,
              "info": "Effect Control 2"
            },
            {
              "value": 14,
              "info": "Undefined"
            },
            {
              "value": 15,
              "info": "Undefined"
            },
            {
              "value": 16,
              "info": "General Purpose Controller 1"
            },
            {
              "value": 17,
              "info": "General Purpose Controller 2"
            },
            {
              "value": 18,
              "info": "General Purpose Controller 3"
            },
            {
              "value": 19,
              "info": "General Purpose Controller 4"
            },
            {
              "value": 20,
              "info": "Undefined"
            },
            {
              "value": 21,
              "info": "Undefined"
            },
            {
              "value": 22,
              "info": "Undefined"
            },
            {
              "value": 23,
              "info": "Undefined"
            },
            {
              "value": 24,
              "info": "Undefined"
            },
            {
              "value": 25,
              "info": "Undefined"
            },
            {
              "value": 26,
              "info": "Undefined"
            },
            {
              "value": 27,
              "info": "Undefined"
            },
            {
              "value": 28,
              "info": "Undefined"
            },
            {
              "value": 29,
              "info": "Undefined"
            },
            {
              "value": 30,
              "info": "Undefined"
            },
            {
              "value": 31,
              "info": "Undefined"
            },
            {
              "value": 32,
              "info": "LSB for Control 0 (Bank Select)"
            },
            {
              "value": 33,
              "info": "LSB for Control 1 (Modulation Wheel or Lever)"
            },
            {
              "value": 34,
              "info": "LSB for Control 2 (Breath Controller)"
            },
            {
              "value": 35,
              "info": "LSB for Control 3 (Undefined)"
            },
            {
              "value": 36,
              "info": "LSB for Control 4 (Foot Controller)"
            },
            {
              "value": 37,
              "info": "LSB for Control 5 (Portamento Time)"
            },
            {
              "value": 38,
              "info": "LSB for Control 6 (Data Entry)"
            },
            {
              "value": 39,
              "info": "LSB for Control 7 (Channel Volume, formerly Main Volume)"
            },
            {
              "value": 40,
              "info": "LSB for Control 8 (Balance)"
            },
            {
              "value": 41,
              "info": "LSB for Control 9 (Undefined)"
            },
            {
              "value": 42,
              "info": "LSB for Control 10 (Pan)"
            },
            {
              "value": 43,
              "info": "LSB for Control 11 (Expression Controller)"
            },
            {
              "value": 44,
              "info": "LSB for Control 12 (Effect control 1)"
            },
            {
              "value": 45,
              "info": "LSB for Control 13 (Effect control 2)"
            },
            {
              "value": 46,
              "info": "LSB for Control 14 (Undefined)"
            },
            {
              "value": 47,
              "info": "LSB for Control 15 (Undefined)"
            },
            {
              "value": 48,
              "info": "LSB for Control 16 (General Purpose Controller 1)"
            },
            {
              "value": 49,
              "info": "LSB for Control 17 (General Purpose Controller 2)"
            },
            {
              "value": 50,
              "info": "LSB for Control 18 (General Purpose Controller 3)"
            },
            {
              "value": 51,
              "info": "LSB for Control 19 (General Purpose Controller 4)"
            },
            {
              "value": 52,
              "info": "LSB for Control 20 (Undefined)"
            },
            {
              "value": 53,
              "info": "LSB for Control 21 (Undefined)"
            },
            {
              "value": 54,
              "info": "LSB for Control 22 (Undefined)"
            },
            {
              "value": 55,
              "info": "LSB for Control 23 (Undefined)"
            },
            {
              "value": 56,
              "info": "LSB for Control 24 (Undefined)"
            },
            {
              "value": 57,
              "info": "LSB for Control 25 (Undefined)"
            },
            {
              "value": 58,
              "info": "LSB for Control 26 (Undefined)"
            },
            {
              "value": 59,
              "info": "LSB for Control 27 (Undefined)"
            },
            {
              "value": 60,
              "info": "LSB for Control 28 (Undefined)"
            },
            {
              "value": 61,
              "info": "LSB for Control 29 (Undefined)"
            },
            {
              "value": 62,
              "info": "LSB for Control 30 (Undefined)"
            },
            {
              "value": 63,
              "info": "LSB for Control 31 (Undefined)"
            },
            {
              "value": 64,
              "info": "Damper Pedal on/off (Sustain)"
            },
            {
              "value": 65,
              "info": "Portamento On/Off"
            },
            {
              "value": 66,
              "info": "Sostenuto On/Off"
            },
            {
              "value": 67,
              "info": "Soft Pedal On/Off"
            },
            {
              "value": 68,
              "info": "Legato Footswitch"
            },
            {
              "value": 69,
              "info": "Hold 2"
            },
            {
              "value": 70,
              "info": "Sound Controller 1 (default: Sound Variation)"
            },
            {
              "value": 71,
              "info": "Sound Controller 2 (default: Timbre/Harmonic Intens.)"
            },
            {
              "value": 72,
              "info": "Sound Controller 3 (default: Release Time)"
            },
            {
              "value": 73,
              "info": "Sound Controller 4 (default: Attack Time)"
            },
            {
              "value": 74,
              "info": "Sound Controller 5 (default: Brightness)"
            },
            {
              "value": 75,
              "info": "Sound Controller 6 (default: Decay Time - see MMA RP-021)"
            },
            {
              "value": 76,
              "info": "Sound Controller 7 (default: Vibrato Rate - see MMA RP-021)"
            },
            {
              "value": 77,
              "info": "Sound Controller 8 (default: Vibrato Depth - see MMA RP-021)"
            },
            {
              "value": 78,
              "info": "Sound Controller 9 (default: Vibrato Delay - see MMA RP-021)"
            },
            {
              "value": 79,
              "info": "Sound Controller 10 (default undefined - see MMA RP-021)"
            },
            {
              "value": 80,
              "info": "General Purpose Controller 5"
            },
            {
              "value": 81,
              "info": "General Purpose Controller 6"
            },
            {
              "value": 82,
              "info": "General Purpose Controller 7"
            },
            {
              "value": 83,
              "info": "General Purpose Controller 8"
            },
            {
              "value": 84,
              "info": "Portamento Control"
            },
            {
              "value": 85,
              "info": "Undefined"
            },
            {
              "value": 86,
              "info": "Undefined"
            },
            {
              "value": 87,
              "info": "Undefined"
            },
            {
              "value": 88,
              "info": "High Resolution Velocity Prefix"
            },
            {
              "value": 89,
              "info": "Undefined"
            },
            {
              "value": 90,
              "info": "Undefined"
            },
            {
              "value": 91,
              "info": "Effects 1 Depth \n(default: Reverb Send Level - see MMA RP-023) \n(formerly External Effects Depth)"
            },
            {
              "value": 92,
              "info": "Effects 2 Depth (formerly Tremolo Depth)"
            },
            {
              "value": 93,
              "info": "Effects 3 Depth \n(default: Chorus Send Level - see MMA RP-023) \n(formerly Chorus Depth)"
            },
            {
              "value": 94,
              "info": "Effects 4 Depth (formerly Celeste [Detune] Depth)"
            },
            {
              "value": 95,
              "info": "Effects 5 Depth (formerly Phaser Depth)"
            },
            {
              "value": 96,
              "info": "Data Increment (Data Entry +1) (see MMA RP-018)"
            },
            {
              "value": 97,
              "info": "Data Decrement (Data Entry -1) (see MMA RP-018)"
            },
            {
              "value": 98,
              "info": "Non-Registered Parameter Number (NRPN) - LSB"
            },
            {
              "value": 99,
              "info": "Non-Registered Parameter Number (NRPN) - MSB"
            },
            {
              "value": 100,
              "info": "Registered Parameter Number (RPN) - LSB*"
            },
            {
              "value": 101,
              "info": "Registered Parameter Number (RPN) - MSB*"
            },
            {
              "value": 102,
              "info": "Undefined"
            },
            {
              "value": 103,
              "info": "Undefined"
            },
            {
              "value": 104,
              "info": "Undefined"
            },
            {
              "value": 105,
              "info": "Undefined"
            },
            {
              "value": 106,
              "info": "Undefined"
            },
            {
              "value": 107,
              "info": "Undefined"
            },
            {
              "value": 108,
              "info": "Undefined"
            },
            {
              "value": 109,
              "info": "Undefined"
            },
            {
              "value": 110,
              "info": "Undefined"
            },
            {
              "value": 111,
              "info": "Undefined"
            },
            {
              "value": 112,
              "info": "Undefined"
            },
            {
              "value": 113,
              "info": "Undefined"
            },
            {
              "value": 114,
              "info": "Undefined"
            },
            {
              "value": 115,
              "info": "Undefined"
            },
            {
              "value": 116,
              "info": "Undefined"
            },
            {
              "value": 117,
              "info": "Undefined"
            },
            {
              "value": 118,
              "info": "Undefined"
            },
            {
              "value": 119,
              "info": "Undefined"
            },
            {
              "value": 120,
              "info": "[Channel Mode Message] All Sound Off"
            },
            {
              "value": 121,
              "info": "[Channel Mode Message] Reset All Controllers \n(See MMA RP-015)"
            },
            {
              "value": 122,
              "info": "[Channel Mode Message] Local Control On/Off"
            },
            {
              "value": 123,
              "info": "[Channel Mode Message] All Notes Off"
            },
            {
              "value": 124,
              "info": "[Channel Mode Message] Omni Mode Off (+ all notes off)"
            },
            {
              "value": 125,
              "info": "[Channel Mode Message] Omni Mode On (+ all notes off)"
            },
            {
              "value": 126,
              "info": "[Channel Mode Message] Mono Mode On (+ poly off, + all notes off)"
            },
            {
              "value": 127,
              "info": "[Channel Mode Message] Poly Mode On (+ mono off, +all notes off)"
            }
          ]
      },
    // param 2
      [
        {value: 'to do...', info: 'to do...'}
      ]
  ];

  let suggestions = [];

  function renderSuggestions(){
    // removed ?. as terser didn't work
    let selectedCommand = _suggestions[1].find(s => s.value == scriptSegments[1]);
    if(selectedCommand){
      selectedCommand = selectedCommand;
    } else {
      selectedCommand = 'control_change_messages';
    }
    
    try {
      let param_1 = _suggestions[2][selectedCommand];
      suggestions = [_suggestions[0], _suggestions[1], (param_1 || []), _suggestions[3]];
    } catch (error) {
      console.warn('error while creating midi suggetions');
      suggestions = _suggestions;
  }}

  $: if(scriptSegments[1] || $localDefinitions){
    renderSuggestions();
    suggestions = suggestions.map(s => [...$localDefinitions, ...s])
  }

  onMount(()=>{
    renderSuggestions();
  })

</script>

<action-midi class="flex w-full p-2">
  {#each scriptSegments as script, i}
    <div class={'w-1/'+scriptSegments.length + ' atomicInput'}>
      <div class="text-gray-500 text-sm pb-1">{parameterNames[i]}</div>
      <AtomicInput inputValue={script} {index} suggestions={suggestions[i]} on:change={(e)=>{sendData(e.detail,i)}}/>
    </div>
  {/each}
</action-midi>

<style>

  .atomicInput{
    padding-right:0.5rem;
  }

  .atomicInput:first-child{
    padding-left: 0.5rem;
  }
  
</style>