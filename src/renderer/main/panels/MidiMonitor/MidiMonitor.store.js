import { writable, get } from 'svelte/store';


function createMidiMonitor(){

  const store = writable([]);

  return {
    ...store,
    update_midi: (descr) => {

      store.update(s => {
        if(s.length >= 30){
          s.shift()
        };

        s = [...s, descr];
        return s;
      })
    }
  }
}

export const midi_monitor_store = createMidiMonitor();
