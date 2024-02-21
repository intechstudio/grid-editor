import { writable, derived, Readable, Writable } from "svelte/store";

export class ProtectedStore<T> implements Readable<T> {
  public internal: Writable<T>;
  private external: Readable<T>;

  constructor(defaultValue?: T) {
    this.internal = writable(defaultValue);

    this.external = derived(this.internal, ($internal) => {
      return Object.freeze(structuredClone($internal));
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
