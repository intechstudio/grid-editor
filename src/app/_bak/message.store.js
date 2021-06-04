import { writable } from 'svelte/store';


function createMessageStore(){

  const store = writable({
    changed: 0,
    expected: 0,
    fetched: 0,
    received: 0,
    sent_to_grid: 0
  });

  let max = 0;

  return {
    ...store,

    expected: (num) => {
      store.update(store => {store.expected = num; return store});
    },

    fetched: (num) => {
      store.update(store => {store.fetched = num; return store});
    },

    received: (num) => {
      store.update(store => {store.received = num; return store});
    },

    changed: (num) => {
      store.update(store => {store.changed = num; return store});
    },

    sent_to_grid: (num) => {
      store.update(store => {store.sent_to_grid = num; return store});
    },

    multipleChanges: ( num )=>{
      if(num > max){ max = num; }
      //store.set({message: `Applying number of changes...`, value: `${max}/${max-num+2}`});
    },
    reset: () => {
      //store.set({message: '', value: 0})
      max = 0;
    }
  }
}

export const messageStore = createMessageStore();