import { writable } from "svelte/store";

export const modal = createModalStore();

export enum Snap {
  FULL = "full",
  MIDDLE = "middle",
}

export type ModalOptions = {
  snap?: "full" | "middle";
  disableClickOutside?: boolean;
};

type ModalStoreValue = {
  component: unknown;
  options: ModalOptions;
};

const defaultOptions: ModalOptions = {
  snap: "full",
  disableClickOutside: false,
};

function createModalStore() {
  const store = writable<ModalStoreValue | undefined>(undefined);

  function show(
    component: unknown,
    options: ModalOptions = defaultOptions
  ): void {
    store.set({ component: component, options: options } as ModalStoreValue);
  }

  function close(): void {
    store.set(undefined);
  }

  return {
    subscribe: store.subscribe,
    show: show,
    close: close,
  };
}
