import { writable } from 'svelte/store';

export let elementSettings = writable({moduleId: '', position: '', controlNumber: ''})