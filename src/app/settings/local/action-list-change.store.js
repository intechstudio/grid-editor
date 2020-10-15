import { writable } from 'svelte/store';

function createActionListChangeStore(){
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

export const actionListChange = createActionListChangeStore();