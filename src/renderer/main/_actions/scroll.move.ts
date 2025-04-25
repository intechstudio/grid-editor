import { Readable, writable } from "svelte/store";

export function createDebouncedStore<T>(initialValue: T, debounceTime: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const { subscribe, set } = writable<T>(initialValue);

  const debouncedSet = (value: T) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => set(value), debounceTime);
  };

  return {
    subscribe,
    set: debouncedSet,
  };
}

export function scrollToBottom(node: HTMLElement, trigger: Readable<any>) {
  if (!node) return;

  let isScrolling = false;

  const scroll = () => {
    if (node.scrollTop + node.clientHeight < node.scrollHeight - 10) {
      isScrolling = true;
      requestAnimationFrame(() => {
        node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
        isScrolling = false;
      });
    }
  };

  // Create a debounced store to prevent excessive scroll updates
  const store = createDebouncedStore<number>(0, 100);
  const unsubscribe = store.subscribe(scroll);

  // React to trigger value changes
  const triggerUnsubscribe = trigger.subscribe(() => store.set(Date.now()));

  // Detect content changes to trigger scrolling
  const observer = new MutationObserver(() => store.set(Date.now()));
  observer.observe(node, { childList: true, subtree: true });

  return {
    update: () => store.set(Date.now()), // Manually trigger scroll
    destroy: () => {
      unsubscribe();
      triggerUnsubscribe();
      observer.disconnect();
    },
  };
}
