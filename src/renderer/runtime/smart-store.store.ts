import { writable, derived, Readable, Writable, get } from "svelte/store";

// Custom deep clone function that preserves the prototype chain
function cloneWithPrototype<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  const clonedObj = Object.create(Object.getPrototypeOf(obj));
  return Object.assign(clonedObj, obj);
}

export class ProtectedStore<T> implements Readable<T> {
  public internal: Writable<T>;
  private external: Readable<T>;

  constructor(defaultValue?: T) {
    this.internal = writable(defaultValue);

    this.external = derived(this.internal, ($internal) => {
      return Object.freeze(cloneWithPrototype($internal));
    });

    this.subscribe = this.external.subscribe.bind(this.external);
  }

  subscribe: Readable<T>["subscribe"];

  set(value: T) {
    this.internal.set(value);
  }

  update(func: (param: T) => T) {
    this.internal.update(func);
  }
}
