import { writable, get } from 'svelte/store';

function createHandshakeStore(){
  const store = writable([]);

  return {
    ...store
  }
}

export const handshakeStore = createHandshakeStore();