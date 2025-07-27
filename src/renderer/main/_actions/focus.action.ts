export namespace Focus {
  const focusMap: Map<string, HTMLElement> = new Map();

  export function on(node: HTMLElement, identifier: string) {
    if (focusMap.has(identifier)) {
      console.error(`Duplicate identifier '${identifier}' used in Focus.on()`);
      return;
    }

    focusMap.set(identifier, node);

    return {
      destroy() {
        focusMap.delete(identifier);
      },
    };
  }

  export function trigger(identifier: string) {
    const node = focusMap.get(identifier);
    if (!node) {
      console.error(
        `No focusable element registered for identifier '${identifier}'`,
      );
      return;
    }
    node.focus();
  }
}
