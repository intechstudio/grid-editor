import { createPopper } from "@popperjs/core";

export default function createPopperAction() {
  let popperElement, popperTooltip, popperParams;
  let popper;

  function initialisePopper() {
    if (popperElement && popperTooltip) {
      popper = createPopper(popperElement, popperTooltip, popperParams);
    }
  }

  function destroyPopper() {
    if (popper) {
      popper.destroy();
      popper = null;
    }
  }

  function usePopperElement(element) {
    popperElement = element;
    initialisePopper();
    return {
      destroy() {
        popperElement = null;
        destroyPopper();
      },
    };
  }
  function usePopperToolip(element, params) {
    popperTooltip = element;
    popperParams = params;
    initialisePopper();

    return {
      update(newParams) {
        popperParams = newParams;
        popper.setOptions(popperParams);
      },
      destroy() {
        popperTooltip = null;
        destroyPopper();
      },
    };
  }
  return [usePopperElement, usePopperToolip];
}
