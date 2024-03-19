interface ForwardOption {
  target: HTMLElement;
  eventTypes: string[];
}

export function forwardEvents(node: HTMLElement, options: ForwardOption) {
  const forward = (e: any) => {
    const newEvent = new Event(e.type, e);

    // Change the target of the new event
    Object.defineProperty(newEvent, "target", {
      writable: false,
      value: options.target,
    });

    options.target.dispatchEvent(newEvent);
  };

  const eventListeners: { [eventName: string]: EventListener } = {};

  for (const eventName of options?.eventTypes) {
    const listener = (event: Event) => forward(event);
    node.addEventListener(eventName, listener);
    eventListeners[eventName] = listener;
  }

  return {
    destroy() {
      Object.keys(eventListeners).forEach((eventName) => {
        node.removeEventListener(eventName, eventListeners[eventName]);
      });
    },
  };
}
