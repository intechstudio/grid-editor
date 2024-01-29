import type { SvelteComponent } from "svelte";
import { writable } from "svelte/store";

export const modal = createModalStore();

type ModalOptions = {
  snap: "full" | "middle";
};

type ModalStoreValue = {
  component: unknown;
  options?: ModalOptions;
};

const defaultOptions: ModalOptions = {
  snap: "full",
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
