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
