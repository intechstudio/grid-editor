import { writable } from 'svelte/store';

export let localSettings = writable({
  moduleId: '', 
  position: '', 
  controlNumber: '', 
  selectedEvent: 'bank init', 
  bank: 0
})