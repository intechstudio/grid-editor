export interface ShortcutParameter {
  alt?: boolean;
  shift?: boolean;
  control?: boolean;
  callback?: (...args: any) => void;
  code: string;
  targetPanel?: HTMLElement;
}

export function shortcut(node: HTMLElement, params?: ShortcutParameter) {
  let handler: any;
  const removeHandler = () => window.removeEventListener("keydown", handler);
  const setHandler = () => {
    removeHandler();
    if (!params) return;

    handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      const isWebcomponent = target.shadowRoot;

      //Ignore input fields and webcomponents, let them have they own shortcut handling work
      if (isInputField || isWebcomponent) {
        return;
      }

      if (
        !!params.alt != e.altKey ||
        !!params.shift != e.shiftKey ||
        !!params.control != (e.ctrlKey || e.metaKey) ||
        params.code != e.code
      ) {
        return;
      }
      e.preventDefault();
      params.callback ? params.callback() : node.click();
    };
    window.addEventListener("keydown", handler);
  };
  setHandler();
  return {
    update: setHandler,
    destroy: removeHandler,
  };
}
