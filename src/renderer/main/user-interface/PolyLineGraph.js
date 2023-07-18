import { writable, get } from "svelte/store";

export class PolyLineGraphData {
  constructor({ value, type }) {
    this.value = String(value);
    this.type = String(type);
  }
}

export function createDataPointsStore({ max_y, max_x }) {
  const store = writable([]);
  const values = [];
  let mx = max_x;
  let my = max_y;
  let min_value = 0;
  let max_value = 0;
  let STORE_CAPACITY = 100;

  function update_values() {
    store.update((s) => {
      return values.map((v, i) => {
        //Calculate Y
        if (max_value - min_value !== 0) {
          v = my - ((v - min_value) / (max_value - min_value)) * my;
        } else {
          v = my;
        }

        //Calculate X
        const x = (mx / STORE_CAPACITY) * i;
        return `${x},${v}`;
      });
    });
  }

  return {
    ...store,
    update_values: update_values,
    get_values: () => {
      return values;
    },
    add: (value, isPercentage) => {
      if (values.length >= STORE_CAPACITY) {
        values.shift();
      }
      values.push(Number(value));

      if (isPercentage) {
        min_value = 0;
        max_value = 100;
      } else {
        min_value = Math.min(...values);
        max_value = Math.max(...values);
      }

      update_values();
    },
    set_max_x: (value) => {
      mx = value;
      update_values();
    },
    set_max_y: (value) => {
      my = value;
      update_values();
    },
    set_max_values: ({ max_x, max_y }) => {
      mx = max_x;
      my = max_y;
      update_values();
    },
  };
}
