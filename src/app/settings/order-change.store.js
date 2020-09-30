import { writable } from 'svelte/store';

function createOrderChangeStore(){
  const store = writable(null);

  return {
    ...store,
    click: (arg) => {
      store.set(arg);
      store.set(null);
      return;
    }
  }
}

export const orderChange = createOrderChangeStore();