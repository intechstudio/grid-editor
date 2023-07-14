import { writable } from "svelte/store";

export class PolyLineGraphData {
  constructor({ value, type }) {
    this.value = Number(value);
    this.type = String(type);
  }
}

export function createDataPointsStore(data) {
  const store = writable([]);

  return {
    ...store,
    add: (data) => {
      if (data.length >= 90) {
        data.shift();
      }
      data.push(Number(value));

      const min = Math.min(...data);
      const max = Math.max(...data);
      store.update((s) => {
        return data.map((v, i) => {
          if (max - min !== 0) {
            v = 50 - ((v - min) / (max - min)) * 50;
          } else {
            v = 50;
          }
          return `${i},${v}`;
        });
      });
    },
  };
}
