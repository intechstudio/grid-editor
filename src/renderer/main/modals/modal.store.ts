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

export type ModalArguments = any | undefined;

type ModalStoreValue = {
  component: unknown;
  options: ModalOptions;
  args: ModalArguments;
};

const defaultOptions: ModalOptions = {
  snap: "full",
  disableClickOutside: false,
};

function createModalStore() {
  const store = writable<ModalStoreValue | undefined>(undefined);
  let blockEscape: boolean = false;

  function close(): void {
    store.set(undefined);
  }

  function setBlockMessage(block: boolean) {
    blockEscape = block;
  }

  function tryClose(): void {
    if (!blockEscape) {
      close();
    }
  }

  function show({
    component,
    options = defaultOptions,
    args,
  }: {
    component: unknown;
    options?: ModalOptions;
    args?: ModalArguments;
  }): void {
    blockEscape = false;
    store.set({
      component: component,
      options: options,
      args: args,
    } as ModalStoreValue);
  }

  return {
    subscribe: store.subscribe,
    show: show,
    close: close,
    tryClose: tryClose,
    setBlockMessage: setBlockMessage,
  };
}
