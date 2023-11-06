<script context="module">
  // Component for the untoggled "header" of the component
  import MidiFace from "./headers/MidiFace.svelte";
  export const header = MidiFace;

  // config descriptor parameters
  export const information = {
    short: "gms",
    name: "Midi",
    rendering: "standard",
    category: "midi",
    desc: "MIDI",
    blockTitle: "MIDI",
    color: "#DA4167",
    defaultLua: "gms(0,176,num,val)",
    icon: `
      <svg width="100%" height="100%" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M0.5 12.5C0.5 5.87294 5.87285 0.5 12.5 0.5C19.1274 0.5 24.5 5.87295 24.5 12.5C24.5 19.1275 19.1273 24.5 12.5 24.5C5.87287 24.5 0.5 19.1275 0.5 12.5ZM14.2071 23.3683L14.1413 22.8877C14.0304 22.0784 13.3373 21.4554 12.5003 21.4554C11.6623 21.4554 10.9695 22.0782 10.8585 22.8874L10.7925 23.3683C11.3489 23.455 11.9192 23.5 12.5 23.5C13.0806 23.5 13.6508 23.455 14.2071 23.3683ZM12.5001 2.46309C6.95685 2.46309 2.46281 6.95713 2.46281 12.5C2.46281 17.1783 5.66475 21.11 9.99693 22.2218C10.3636 21.193 11.3442 20.4554 12.5003 20.4554C13.6558 20.4554 14.6363 21.1933 15.0029 22.2221C19.3352 21.11 22.5371 17.1783 22.5371 12.5C22.537 6.9571 18.0433 2.46309 12.5001 2.46309ZM10.5432 6.33504C10.543 5.2543 11.4194 4.37819 12.5 4.37819C13.5809 4.37819 14.4568 5.25461 14.4568 6.33522C14.4568 7.41632 13.5802 8.29231 12.5001 8.29231C11.4191 8.29231 10.543 7.41615 10.5432 6.33504ZM12.5 5.37819C11.9715 5.37819 11.543 5.80679 11.5432 6.33504C11.543 6.86363 11.9711 7.29231 12.5001 7.29231C13.028 7.29231 13.4568 6.86399 13.4568 6.33522C13.4568 5.80668 13.0284 5.37819 12.5 5.37819ZM6.75623 6.75671C7.52044 5.99251 8.75968 5.99254 9.52391 6.75707C10.2884 7.52134 10.2878 8.76052 9.52415 9.52427C8.75967 10.2887 7.52074 10.2889 6.75643 9.5242C5.99204 8.76001 5.99209 7.52083 6.75623 6.75671ZM8.81667 7.46404C8.44294 7.09017 7.83697 7.09019 7.46333 7.46382C7.0897 7.83745 7.0897 8.44344 7.46353 8.81708C7.83718 9.19091 8.44297 9.19122 8.81703 8.81717C9.19041 8.44374 9.19041 7.83758 8.81667 7.46404ZM15.476 6.75778C16.24 5.9935 17.4794 5.9935 18.2432 6.75767C19.0074 7.52177 19.0074 8.76092 18.243 9.52514C17.4786 10.2898 16.2394 10.2893 15.4755 9.5255C14.711 8.76103 14.7109 7.52204 15.476 6.75778ZM17.536 7.46467C17.1627 7.09118 16.5566 7.0911 16.1831 7.46493C15.8091 7.83848 15.8086 8.44435 16.1826 8.81839C16.556 9.1918 17.162 9.19202 17.5357 8.81817C17.9096 8.44445 17.9095 7.83822 17.536 7.46467ZM4.3767 12.4998C4.3767 11.4193 5.2531 10.5431 6.33377 10.543C7.41486 10.543 8.29092 11.4194 8.29092 12.4998C8.29092 13.5807 7.41486 14.4567 6.33381 14.4567C5.25315 14.4567 4.3767 13.581 4.3767 12.4998ZM6.33381 11.543C5.80519 11.5431 5.3767 11.9718 5.3767 12.4998C5.3767 13.0284 5.80516 13.4567 6.33381 13.4567C6.86264 13.4567 7.29092 13.0283 7.29092 12.4998C7.29092 11.9717 6.86259 11.543 6.33381 11.543ZM16.7091 12.4998C16.7091 11.4193 17.5853 10.5431 18.6661 10.543C19.7471 10.543 20.6231 11.4194 20.6231 12.4998C20.6231 13.5806 19.7473 14.4567 18.6661 14.4567C17.5855 14.4567 16.7091 13.581 16.7091 12.4998ZM18.6661 11.543C18.1375 11.5431 17.7091 11.9717 17.7091 12.4998C17.7091 13.0284 18.1375 13.4567 18.6661 13.4567C19.1949 13.4567 19.6231 13.0284 19.6231 12.4998C19.6231 11.9717 19.1948 11.543 18.6661 11.543Z" fill="black"/>
          <path d="M11.5432 6.33504C11.543 5.80679 11.9715 5.37819 12.5 5.37819C13.0284 5.37819 13.4568 5.80668 13.4568 6.33522C13.4568 6.86399 13.028 7.29231 12.5001 7.29231C11.9711 7.29231 11.543 6.86363 11.5432 6.33504Z" fill="black"/>
          <path d="M16.1831 7.46493C16.5566 7.0911 17.1627 7.09118 17.536 7.46467C17.9095 7.83822 17.9096 8.44445 17.5357 8.81817C17.162 9.19202 16.556 9.1918 16.1826 8.81839C15.8086 8.44435 15.8091 7.83848 16.1831 7.46493Z" fill="black"/>
          <path d="M17.7091 12.4998C17.7091 11.9717 18.1375 11.5431 18.6661 11.543C19.1948 11.543 19.6231 11.9717 19.6231 12.4998C19.6231 13.0284 19.1949 13.4567 18.6661 13.4567C18.1375 13.4567 17.7091 13.0284 17.7091 12.4998Z" fill="black"/>
          <path d="M5.3767 12.4998C5.3767 11.9718 5.80519 11.5431 6.33381 11.543C6.86259 11.543 7.29092 11.9717 7.29092 12.4998C7.29092 13.0283 6.86264 13.4567 6.33381 13.4567C5.80516 13.4567 5.3767 13.0284 5.3767 12.4998Z" fill="black"/>
          <path d="M7.46333 7.46382C7.83697 7.09019 8.44294 7.09017 8.81667 7.46404C9.19041 7.83758 9.19041 8.44374 8.81703 8.81717C8.44297 9.19122 7.83718 9.19091 7.46353 8.81708C7.0897 8.44344 7.0897 7.83745 7.46333 7.46382Z" fill="black"/>
          <path d="M14.1413 22.8877L14.2071 23.3683C13.6508 23.455 13.0806 23.5 12.5 23.5C11.9192 23.5 11.3489 23.455 10.7925 23.3683L10.8585 22.8874C10.9695 22.0782 11.6623 21.4554 12.5003 21.4554C13.3373 21.4554 14.0304 22.0784 14.1413 22.8877Z" fill="black"/>
      </svg>
    `,
    blockIcon: `
      <svg width="100%" height="100%" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M0.5 12.5C0.5 5.87294 5.87285 0.5 12.5 0.5C19.1274 0.5 24.5 5.87295 24.5 12.5C24.5 19.1275 19.1273 24.5 12.5 24.5C5.87287 24.5 0.5 19.1275 0.5 12.5ZM14.2071 23.3683L14.1413 22.8877C14.0304 22.0784 13.3373 21.4554 12.5003 21.4554C11.6623 21.4554 10.9695 22.0782 10.8585 22.8874L10.7925 23.3683C11.3489 23.455 11.9192 23.5 12.5 23.5C13.0806 23.5 13.6508 23.455 14.2071 23.3683ZM12.5001 2.46309C6.95685 2.46309 2.46281 6.95713 2.46281 12.5C2.46281 17.1783 5.66475 21.11 9.99693 22.2218C10.3636 21.193 11.3442 20.4554 12.5003 20.4554C13.6558 20.4554 14.6363 21.1933 15.0029 22.2221C19.3352 21.11 22.5371 17.1783 22.5371 12.5C22.537 6.9571 18.0433 2.46309 12.5001 2.46309ZM10.5432 6.33504C10.543 5.2543 11.4194 4.37819 12.5 4.37819C13.5809 4.37819 14.4568 5.25461 14.4568 6.33522C14.4568 7.41632 13.5802 8.29231 12.5001 8.29231C11.4191 8.29231 10.543 7.41615 10.5432 6.33504ZM12.5 5.37819C11.9715 5.37819 11.543 5.80679 11.5432 6.33504C11.543 6.86363 11.9711 7.29231 12.5001 7.29231C13.028 7.29231 13.4568 6.86399 13.4568 6.33522C13.4568 5.80668 13.0284 5.37819 12.5 5.37819ZM6.75623 6.75671C7.52044 5.99251 8.75968 5.99254 9.52391 6.75707C10.2884 7.52134 10.2878 8.76052 9.52415 9.52427C8.75967 10.2887 7.52074 10.2889 6.75643 9.5242C5.99204 8.76001 5.99209 7.52083 6.75623 6.75671ZM8.81667 7.46404C8.44294 7.09017 7.83697 7.09019 7.46333 7.46382C7.0897 7.83745 7.0897 8.44344 7.46353 8.81708C7.83718 9.19091 8.44297 9.19122 8.81703 8.81717C9.19041 8.44374 9.19041 7.83758 8.81667 7.46404ZM15.476 6.75778C16.24 5.9935 17.4794 5.9935 18.2432 6.75767C19.0074 7.52177 19.0074 8.76092 18.243 9.52514C17.4786 10.2898 16.2394 10.2893 15.4755 9.5255C14.711 8.76103 14.7109 7.52204 15.476 6.75778ZM17.536 7.46467C17.1627 7.09118 16.5566 7.0911 16.1831 7.46493C15.8091 7.83848 15.8086 8.44435 16.1826 8.81839C16.556 9.1918 17.162 9.19202 17.5357 8.81817C17.9096 8.44445 17.9095 7.83822 17.536 7.46467ZM4.3767 12.4998C4.3767 11.4193 5.2531 10.5431 6.33377 10.543C7.41486 10.543 8.29092 11.4194 8.29092 12.4998C8.29092 13.5807 7.41486 14.4567 6.33381 14.4567C5.25315 14.4567 4.3767 13.581 4.3767 12.4998ZM6.33381 11.543C5.80519 11.5431 5.3767 11.9718 5.3767 12.4998C5.3767 13.0284 5.80516 13.4567 6.33381 13.4567C6.86264 13.4567 7.29092 13.0283 7.29092 12.4998C7.29092 11.9717 6.86259 11.543 6.33381 11.543ZM16.7091 12.4998C16.7091 11.4193 17.5853 10.5431 18.6661 10.543C19.7471 10.543 20.6231 11.4194 20.6231 12.4998C20.6231 13.5806 19.7473 14.4567 18.6661 14.4567C17.5855 14.4567 16.7091 13.581 16.7091 12.4998ZM18.6661 11.543C18.1375 11.5431 17.7091 11.9717 17.7091 12.4998C17.7091 13.0284 18.1375 13.4567 18.6661 13.4567C19.1949 13.4567 19.6231 13.0284 19.6231 12.4998C19.6231 11.9717 19.1948 11.543 18.6661 11.543Z" fill="black"/>
          <path d="M11.5432 6.33504C11.543 5.80679 11.9715 5.37819 12.5 5.37819C13.0284 5.37819 13.4568 5.80668 13.4568 6.33522C13.4568 6.86399 13.028 7.29231 12.5001 7.29231C11.9711 7.29231 11.543 6.86363 11.5432 6.33504Z" fill="black"/>
          <path d="M16.1831 7.46493C16.5566 7.0911 17.1627 7.09118 17.536 7.46467C17.9095 7.83822 17.9096 8.44445 17.5357 8.81817C17.162 9.19202 16.556 9.1918 16.1826 8.81839C15.8086 8.44435 15.8091 7.83848 16.1831 7.46493Z" fill="black"/>
          <path d="M17.7091 12.4998C17.7091 11.9717 18.1375 11.5431 18.6661 11.543C19.1948 11.543 19.6231 11.9717 19.6231 12.4998C19.6231 13.0284 19.1949 13.4567 18.6661 13.4567C18.1375 13.4567 17.7091 13.0284 17.7091 12.4998Z" fill="black"/>
          <path d="M5.3767 12.4998C5.3767 11.9718 5.80519 11.5431 6.33381 11.543C6.86259 11.543 7.29092 11.9717 7.29092 12.4998C7.29092 13.0283 6.86264 13.4567 6.33381 13.4567C5.80516 13.4567 5.3767 13.0284 5.3767 12.4998Z" fill="black"/>
          <path d="M7.46333 7.46382C7.83697 7.09019 8.44294 7.09017 8.81667 7.46404C9.19041 7.83758 9.19041 8.44374 8.81703 8.81717C8.44297 9.19122 7.83718 9.19091 7.46353 8.81708C7.0897 8.44344 7.0897 7.83745 7.46333 7.46382Z" fill="black"/>
          <path d="M14.1413 22.8877L14.2071 23.3683C13.6508 23.455 13.0806 23.5 12.5 23.5C11.9192 23.5 11.3489 23.455 10.7925 23.3683L10.8585 22.8874C10.9695 22.0782 11.6623 21.4554 12.5003 21.4554C13.3373 21.4554 14.0304 22.0784 14.1413 22.8877Z" fill="black"/>
      </svg>
    `,
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "single",
    toggleable: true,
  };
</script>

<script>
  import { onMount, createEventDispatcher, onDestroy } from "svelte";
  import AtomicInput from "../main/user-interface/AtomicInput.svelte";
  import AtomicSuggestions from "../main/user-interface/AtomicSuggestions.svelte";
  import { Script } from "./_script_parsers.js";
  import { localDefinitions } from "../runtime/runtime.store";

  import { Validator } from "./_validators";

  export let config = "";
  export let index;

  import SendFeedback from "../main/user-interface/SendFeedback.svelte";
  import TabButton from "../main/user-interface/TabButton.svelte";

  let loaded = false;

  const dispatch = createEventDispatcher();

  const parameterNames = ["Channel", "Command", "Parameter 1", "Parameter 2"];
  const validators = [
    (e) => {
      return new Validator(e).NotEmpty().Result();
    },
    (e) => {
      return new Validator(e).NotEmpty().Result();
    },
    (e) => {
      return new Validator(e).NotEmpty().Result();
    },
    (e) => {
      return new Validator(e).NotEmpty().Result();
    },
  ];

  let scriptSegments = [];

  // config.script cannot be undefined
  $: if (config.script && !loaded) {
    scriptSegments = Script.toSegments({
      short: config.short,
      script: config.script,
    });
    loaded = true;
  }

  onDestroy(() => {
    loaded = false;
  });

  function sendData(e, index) {
    scriptSegments[index] = e;
    const script = Script.toScript({
      human: config.human,
      short: config.short,
      array: scriptSegments,
    }); // important to set the function name
    dispatch("output", { short: config.short, script: script });
  }

  const channels = (length) => {
    let arr = [];
    for (let i = 0; i < length; i++) {
      arr[i] = { value: i, info: `Channel ${i}` };
    }
    return arr;
  };

  const _suggestions = [
    // channels
    [...channels(16)],
    // commands
    [
      { value: "176", info: "Control Change", key: "control_change_messages" },
      { value: "144", info: "Note On", key: "note_on_event" },
      { value: "128", info: "Note Off", key: "note_off_event" },
      { value: "192", info: "Program Change", key: "program_change_messages" },
    ],
    // param 1
    {
      control_change_messages: [
        {
          value: 0,
          info: "0 - Bank Select",
        },
        {
          value: 1,
          info: "1 - Modulation Wheel or Lever",
        },
        {
          value: 2,
          info: "2 - Breath Controller",
        },
        {
          value: 3,
          info: "3 - Undefined",
        },
        {
          value: 4,
          info: "4 - Foot Controller",
        },
        {
          value: 5,
          info: "5 - Portamento Time",
        },
        {
          value: 6,
          info: "6 - Data Entry MSB",
        },
        {
          value: 7,
          info: "7 - Channel Volume (formerly Main Volume)",
        },
        {
          value: 8,
          info: "8 - Balance",
        },
        {
          value: 9,
          info: "9 - Undefined",
        },
        {
          value: 10,
          info: "10 - Pan",
        },
        {
          value: 11,
          info: "11 - Expression Controller",
        },
        {
          value: 12,
          info: "12 - Effect Control 1",
        },
        {
          value: 13,
          info: "13 - Effect Control 2",
        },
        {
          value: 14,
          info: "14 - Undefined",
        },
        {
          value: 15,
          info: "15 - Undefined",
        },
        {
          value: 16,
          info: "16 - General Purpose Controller 1",
        },
        {
          value: 17,
          info: "17 - General Purpose Controller 2",
        },
        {
          value: 18,
          info: "18 - General Purpose Controller 3",
        },
        {
          value: 19,
          info: "19 - General Purpose Controller 4",
        },
        {
          value: 20,
          info: "20 - Undefined",
        },
        {
          value: 21,
          info: "21 - Undefined",
        },
        {
          value: 22,
          info: "22 - Undefined",
        },
        {
          value: 23,
          info: "23 - Undefined",
        },
        {
          value: 24,
          info: "24 - Undefined",
        },
        {
          value: 25,
          info: "25 - Undefined",
        },
        {
          value: 26,
          info: "26 - Undefined",
        },
        {
          value: 27,
          info: "27 - Undefined",
        },
        {
          value: 28,
          info: "28 - Undefined",
        },
        {
          value: 29,
          info: "29 - Undefined",
        },
        {
          value: 30,
          info: "30 - Undefined",
        },
        {
          value: 31,
          info: "31 - Undefined",
        },
        {
          value: 32,
          info: "32 - LSB for Control 0 (Bank Select)",
        },
        {
          value: 33,
          info: "33 - LSB for Control 1 (Modulation Wheel or Lever)",
        },
        {
          value: 34,
          info: "34 - LSB for Control 2 (Breath Controller)",
        },
        {
          value: 35,
          info: "35 - LSB for Control 3 (Undefined)",
        },
        {
          value: 36,
          info: "36 - LSB for Control 4 (Foot Controller)",
        },
        {
          value: 37,
          info: "37 - LSB for Control 5 (Portamento Time)",
        },
        {
          value: 38,
          info: "38 - LSB for Control 6 (Data Entry)",
        },
        {
          value: 39,
          info: "39 - LSB for Control 7 (Channel Volume, formerly Main Volume)",
        },
        {
          value: 40,
          info: "40 - LSB for Control 8 (Balance)",
        },
        {
          value: 41,
          info: "41 - LSB for Control 9 (Undefined)",
        },
        {
          value: 42,
          info: "42 - LSB for Control 10 (Pan)",
        },
        {
          value: 43,
          info: "43 - LSB for Control 11 (Expression Controller)",
        },
        {
          value: 44,
          info: "44 - LSB for Control 12 (Effect control 1)",
        },
        {
          value: 45,
          info: "45 - LSB for Control 13 (Effect control 2)",
        },
        {
          value: 46,
          info: "46 - LSB for Control 14 (Undefined)",
        },
        {
          value: 47,
          info: "47 - LSB for Control 15 (Undefined)",
        },
        {
          value: 48,
          info: "48 - LSB for Control 16 (General Purpose Controller 1)",
        },
        {
          value: 49,
          info: "49 - LSB for Control 17 (General Purpose Controller 2)",
        },
        {
          value: 50,
          info: "50 - LSB for Control 18 (General Purpose Controller 3)",
        },
        {
          value: 51,
          info: "51 - LSB for Control 19 (General Purpose Controller 4)",
        },
        {
          value: 52,
          info: "52 - LSB for Control 20 (Undefined)",
        },
        {
          value: 53,
          info: "53 - LSB for Control 21 (Undefined)",
        },
        {
          value: 54,
          info: "54 - LSB for Control 22 (Undefined)",
        },
        {
          value: 55,
          info: "55 - LSB for Control 23 (Undefined)",
        },
        {
          value: 56,
          info: "56 - LSB for Control 24 (Undefined)",
        },
        {
          value: 57,
          info: "57 - LSB for Control 25 (Undefined)",
        },
        {
          value: 58,
          info: "58 - LSB for Control 26 (Undefined)",
        },
        {
          value: 59,
          info: "59 - LSB for Control 27 (Undefined)",
        },
        {
          value: 60,
          info: "60 - LSB for Control 28 (Undefined)",
        },
        {
          value: 61,
          info: "61 - LSB for Control 29 (Undefined)",
        },
        {
          value: 62,
          info: "62 - LSB for Control 30 (Undefined)",
        },
        {
          value: 63,
          info: "63 - LSB for Control 31 (Undefined)",
        },
        {
          value: 64,
          info: "64 - Damper Pedal on/off (Sustain)",
        },
        {
          value: 65,
          info: "65 - Portamento On/Off",
        },
        {
          value: 66,
          info: "66 - Sostenuto On/Off",
        },
        {
          value: 67,
          info: "67 - Soft Pedal On/Off",
        },
        {
          value: 68,
          info: "68 - Legato Footswitch",
        },
        {
          value: 69,
          info: "69 - Hold 2",
        },
        {
          value: 70,
          info: "70 - Sound Controller 1 (default: Sound Variation)",
        },
        {
          value: 71,
          info: "71 - Sound Controller 2 (default: Timbre/Harmonic Intens.)",
        },
        {
          value: 72,
          info: "72 - Sound Controller 3 (default: Release Time)",
        },
        {
          value: 73,
          info: "73 - Sound Controller 4 (default: Attack Time)",
        },
        {
          value: 74,
          info: "74 - Sound Controller 5 (default: Brightness)",
        },
        {
          value: 75,
          info: "75 - Sound Controller 6 (default: Decay Time - see MMA RP-021)",
        },
        {
          value: 76,
          info: "76 - Sound Controller 7 (default: Vibrato Rate - see MMA RP-021)",
        },
        {
          value: 77,
          info: "77 - Sound Controller 8 (default: Vibrato Depth - see MMA RP-021)",
        },
        {
          value: 78,
          info: "78 - Sound Controller 9 (default: Vibrato Delay - see MMA RP-021)",
        },
        {
          value: 79,
          info: "79 - Sound Controller 10 (default undefined - see MMA RP-021)",
        },
        {
          value: 80,
          info: "80 - General Purpose Controller 5",
        },
        {
          value: 81,
          info: "81 - General Purpose Controller 6",
        },
        {
          value: 82,
          info: "82 - General Purpose Controller 7",
        },
        {
          value: 83,
          info: "83 - General Purpose Controller 8",
        },
        {
          value: 84,
          info: "84 - Portamento Control",
        },
        {
          value: 85,
          info: "85 - Undefined",
        },
        {
          value: 86,
          info: "86 - Undefined",
        },
        {
          value: 87,
          info: "87 - Undefined",
        },
        {
          value: 88,
          info: "88 - High Resolution Velocity Prefix",
        },
        {
          value: 89,
          info: "89 - Undefined",
        },
        {
          value: 90,
          info: "90 - Undefined",
        },
        {
          value: 91,
          info: "91 - Effects 1 Depth \n(default: Reverb Send Level - see MMA RP-023) \n(formerly External Effects Depth)",
        },
        {
          value: 92,
          info: "92 - Effects 2 Depth (formerly Tremolo Depth)",
        },
        {
          value: 93,
          info: "93 - Effects 3 Depth \n(default: Chorus Send Level - see MMA RP-023) \n(formerly Chorus Depth)",
        },
        {
          value: 94,
          info: "94 - Effects 4 Depth (formerly Celeste [Detune] Depth)",
        },
        {
          value: 95,
          info: "95 - Effects 5 Depth (formerly Phaser Depth)",
        },
        {
          value: 96,
          info: "96 - Data Increment (Data Entry +1) (see MMA RP-018)",
        },
        {
          value: 97,
          info: "97 - Data Decrement (Data Entry -1) (see MMA RP-018)",
        },
        {
          value: 98,
          info: "98 - Non-Registered Parameter Number (NRPN) - LSB",
        },
        {
          value: 99,
          info: "99 - Non-Registered Parameter Number (NRPN) - MSB",
        },
        {
          value: 100,
          info: "100 - Registered Parameter Number (RPN) - LSB*",
        },
        {
          value: 101,
          info: "101 - Registered Parameter Number (RPN) - MSB*",
        },
        {
          value: 102,
          info: "102 - Undefined",
        },
        {
          value: 103,
          info: "103 - Undefined",
        },
        {
          value: 104,
          info: "104 - Undefined",
        },
        {
          value: 105,
          info: "105 - Undefined",
        },
        {
          value: 106,
          info: "106 - Undefined",
        },
        {
          value: 107,
          info: "107 - Undefined",
        },
        {
          value: 108,
          info: "108 - Undefined",
        },
        {
          value: 109,
          info: "109 - Undefined",
        },
        {
          value: 110,
          info: "110 - Undefined",
        },
        {
          value: 111,
          info: "111 - Undefined",
        },
        {
          value: 112,
          info: "112 - Undefined",
        },
        {
          value: 113,
          info: "113 - Undefined",
        },
        {
          value: 114,
          info: "114 - Undefined",
        },
        {
          value: 115,
          info: "115 - Undefined",
        },
        {
          value: 116,
          info: "116 - Undefined",
        },
        {
          value: 117,
          info: "117 - Undefined",
        },
        {
          value: 118,
          info: "118 - Undefined",
        },
        {
          value: 119,
          info: "119 - Undefined",
        },
        {
          value: 120,
          info: "120 - [Channel Mode Message] All Sound Off",
        },
        {
          value: 121,
          info: "121 - [Channel Mode Message] Reset All Controllers \n(See MMA RP-015)",
        },
        {
          value: 122,
          info: "122 - [Channel Mode Message] Local Control On/Off",
        },
        {
          value: 123,
          info: "123 - [Channel Mode Message] All Notes Off",
        },
        {
          value: 124,
          info: "124 - [Channel Mode Message] Omni Mode Off (+ all notes off)",
        },
        {
          value: 125,
          info: "125 - [Channel Mode Message] Omni Mode On (+ all notes off)",
        },
        {
          value: 126,
          info: "126 - [Channel Mode Message] Mono Mode On (+ poly off, + all notes off)",
        },
        {
          value: 127,
          info: "127 - [Channel Mode Message] Poly Mode On (+ mono off, +all notes off)",
        },
      ],
    },
    // param 2
    [
      //{value: '', info: 'to do...'}
    ],
  ];

  let suggestions = [];

  function renderSuggestions() {
    // removed ?. as terser didn't work
    let selectedCommand = _suggestions[1].find(
      (s) => s.value == scriptSegments[1]
    );
    if (selectedCommand) {
      selectedCommand = selectedCommand.key;
    } else {
      selectedCommand = "control_change_messages";
    }

    try {
      let param_1 = _suggestions[2][selectedCommand];
      suggestions = [
        _suggestions[0],
        _suggestions[1],
        param_1 || [],
        _suggestions[3],
      ];
    } catch (error) {
      console.warn("error while creating midi suggetions");
      suggestions = _suggestions;
    }
  }

  $: if (scriptSegments[1] || $localDefinitions) {
    renderSuggestions();
    suggestions = suggestions.map((s) => [...$localDefinitions, ...s]);
  }

  let ready = false;
  onMount(() => {
    renderSuggestions();
    ready = true;
  });

  let showSuggestions = false;
  let focusedInput = undefined;
  let focusGroup = [];

  function onActiveFocus(event, index) {
    focusGroup[index] = event.detail.focus;
    focusedInput = index;
  }

  function onLooseFocus(event, index) {
    focusGroup[index] = event.detail.focus;
    showSuggestions = focusGroup.includes(true);
  }

  const tabs = [
    { name: "MIDI", short: "gms" },
    { name: "14 bit MIDI", short: "gmsh" },
    { name: "MIDI SysEX", short: "gmss" },
  ];

  function handleTabButtonClicked(element) {
    dispatch("replace", { short: element.short });
  }
</script>

<action-midi
  class="{$$props.class} flex flex-col w-full pb-2 px-2 pointer-events-auto"
>
  {#if tabs !== undefined}
    <div class="ml-auto flex flex-row mb-2">
      <div />
      {#each tabs as element}
        <TabButton
          selected={config.information.short == element.short}
          text={element.name}
          on:click={() => handleTabButtonClicked(element)}
        />
      {/each}
    </div>
  {/if}

  <div class="w-full grid grid-cols-{scriptSegments.length}">
    {#each scriptSegments as script, i}
      <div class="flex flex-col atomicInput gap-1">
        <div class="text-gray-500 text-sm truncate">
          {parameterNames[i]}
        </div>
        <AtomicInput
          inputValue={script}
          suggestions={suggestions[i]}
          validator={validators[i]}
          on:validator={(e) => {
            const data = e.detail;
            dispatch("validator", data);
          }}
          on:active-focus={(e) => {
            onActiveFocus(e, i);
          }}
          on:loose-focus={(e) => {
            onLooseFocus(e, i);
          }}
          on:change={(e) => {
            sendData(e.detail, i);
          }}
        />
      </div>
    {/each}
  </div>

  {#if showSuggestions}
    <AtomicSuggestions
      {suggestions}
      {focusedInput}
      on:select={(e) => {
        scriptSegments[e.detail.index] = e.detail.value;
        sendData(e.detail.value, e.detail.index);
      }}
    />
  {/if}

  <SendFeedback feedback_context="Midi" class="mt-2 text-sm text-gray-500" />
</action-midi>

<style>
  .atomicInput {
    padding-right: 0.5rem;
  }

  .atomicInput:first-child {
    padding-left: 0.5rem;
  }
</style>
