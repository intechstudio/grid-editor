import { writable } from 'svelte/store';

export let elementSettings = writable({moduleId: '', position: '', controlNumber: '', bank: 0})