import { get } from "svelte/store";
import { user_input } from "../../../../runtime/runtime.store.js";
import { selectedConfigStore } from "../../../../runtime/config-helper.store";

export function selectElement(controlNumber, controlElementType, moduleId) {
  if (controlNumber !== undefined && controlElementType !== undefined) {
    const dx = moduleId.split(";")[0].split(":").pop();
    const dy = moduleId.split(";")[1].split(":").pop();

    //reset of config selecting
    selectedConfigStore.set({});

    // this should be checked to not reupdate UI when clicking on a control element.
    // should be probably put into user_input store's functions
    const ui = get(user_input);

    if (
      ui.event.elementnumber != +controlNumber ||
      ui.brc.dx != dx ||
      ui.brc.dy != dy
    ) {
      user_input.update((ui) => {
        ui.brc.dx = +dx;
        ui.brc.dy = +dy;
        ui.event.elementnumber = +controlNumber;
        ui.event.elementtype = controlElementType;
        return ui;
      });
    }
  }
}
