export interface ShortcutParameter {
  alt?: boolean;
  shift?: boolean;
  control?: boolean;
  callback: (...args: any) => void;
  code: string;
}

export const shortcut = (node: HTMLElement, params?: ShortcutParameter) => {
  let handler: any;
  const removeHandler = () => window.removeEventListener("keydown", handler),
    setHandler = () => {
      removeHandler();
      if (!params) return;

      handler = (e: KeyboardEvent) => {
        // Check if the event target is an input, textarea, or contenteditable element
        const target = e.target as HTMLElement;
        const isInputField =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable;

        // If the target is an input field, textarea, or contenteditable, allow default behavior
        if (isInputField) {
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
};
