import { writable } from 'svelte/store';

export let elementSettings = writable({
  moduleId: '', 
  position: '', 
  controlNumber: '', 
  selectedEvent: '', 
  bank: 0
})