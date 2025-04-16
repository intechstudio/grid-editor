export namespace Focus {
  const focusMap: Map<string, HTMLElement> = new Map();

  export function on(node: HTMLElement, identifier: string) {
    if (focusMap.has(identifier)) {
      throw new Error(
        `Duplicate identifier '${identifier}' used in Focus.on()`,
      );
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
      throw new Error(
        `No focusable element registered for identifier '${identifier}'`,
      );
    }
    node.focus();
  }
}
