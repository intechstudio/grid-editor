export interface ShortcutParameter {
  alt?: boolean;
  shift?: boolean;
  control?: boolean;
  callback?: (...args: any) => void;
  code: string;
}

export function shortcut(node: HTMLElement, params?: ShortcutParameter) {
  let handler: any;

  const setHandler = () => {
    if (!params) return;

    handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // If the target is an input field, allow default behavior
      if (isInputField) {
        return;
      }

      if (
        !!params.alt !== e.altKey ||
        !!params.shift !== e.shiftKey ||
        !!params.control !== (e.ctrlKey || e.metaKey) ||
        params.code !== e.code
      ) {
        return;
      }

      e.preventDefault();
      params.callback ? params.callback() : node.click();
    };
  };

  setHandler();

  return {
    update: setHandler,
  };
}
