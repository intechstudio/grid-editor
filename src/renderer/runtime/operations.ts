import { Analytics } from "./analytics";
import { appClipboard, ClipboardData, ClipboardKey } from "./clipboard.store";
import { logger, runtime, user_input } from "./runtime.store";
import {
  GridOperationResult,
  ElementData,
  ActionData,
  GridAction,
  GridElement,
  GridEvent,
  SendToGridResult,
  GridOperationType,
  InsertActionsResult,
  GridPage,
  GridProfileData,
  GridModule,
  GridPresetData,
} from "./runtime";
import { get, derived } from "svelte/store";
import { config_panel_blocks } from "../main/panels/configuration/Configuration";

function handleError(e: GridOperationResult) {
  //TODO: Better error handling
  console.warn(`Operation error: ${e.text}`);
  switch (e.type) {
    case GridOperationType.MERGE_ACTIONS_TO_CODE:
    case GridOperationType.PASTE_ACTION:
    case GridOperationType.REPLACE_ACTION:
    case GridOperationType.UPDATE_ACTION:
    case GridOperationType.INSERT_ACTIONS: {
      const error = e as InsertActionsResult;
      logger.set({
        type: "fail",
        mode: 0,
        classname: "luanotok",
        message: `${error.info.module.type}: ${e.text}`,
      });
      break;
    }
  }

  /*
  logger.set({
    type: "fail",
    mode: 0,
    classname: "luanotok",
    message: `${e.device}: Syntax error on ${e.element.no} ${e.event.type} event.`,
  });
  */
}

//Clipboard handlers
export const isCopyElementEnabled = derived(
  config_panel_blocks,
  ($config_panel_blocks) => {
    return (
      !$config_panel_blocks.some((e) => e.selected) &&
      runtime.modules.length > 0
    );
  }
);

export async function copyElement(element: GridElement) {
  logger.set({
    type: "progress",
    mode: 0,
    classname: "elementcopy",
    message: `Copying events from element...`,
  });

  appClipboard
    .copyElement(element)
    .then((result) => {
      logger.set({
        type: "success",
        mode: 0,
        classname: "elementcopy",
        message: `Events have been copied to clipbard!`,
      });
    })
    .catch(handleError)
    .finally(() => {
      Analytics.track({
        event: "Config Action",
        payload: { click: "Whole Element Copy" },
        mandatory: false,
      });
    });
}

export const isCopyActionsEnabled = derived(
  config_panel_blocks,
  ($config_panel_blocks) => {
    return $config_panel_blocks.some((e) => e.selected);
  }
);

export async function copyActions(...actions: GridAction[]) {
  appClipboard
    .copyActions(...actions)
    .then((result) => {
      logger.set({
        type: "progress",
        mode: 0,
        classname: "actionscopy",
        message: `Actions have been copied to clipbard!`,
      });
    })
    .catch(handleError)
    .finally(() => {
      Analytics.track({
        event: "Config Action",
        payload: { click: "Copy" },
        mandatory: false,
      });
    });
}

//GridElement handlers
export function isOverwriteElementEnabled(
  data: ElementData,
  clipboard: ClipboardData
) {
  if (typeof clipboard === "undefined" || typeof data === "undefined") {
    return false;
  }

  return (
    clipboard.key === ClipboardKey.ELEMENT &&
    data.isCompatible((clipboard.payload as ElementData).type)
  );
}

export async function overwriteElement(target: GridElement) {
  const clipboard = get(appClipboard);

  if (typeof clipboard === "undefined") {
    return;
  }

  if (clipboard?.key !== ClipboardKey.ELEMENT) {
    return;
  }

  target
    .overwrite(clipboard.payload as ElementData)
    .then((result) => {
      target.sendToGrid();
    })
    .catch(handleError)
    .finally(() => {
      Analytics.track({
        event: "Config Action",
        payload: { click: "Whole Element Overwrite" },
        mandatory: false,
      });
    });
}

export function isDiscardElementEnabled(data: ElementData) {
  if (typeof data === "undefined") {
    return false;
  }

  return data.hasChanges();
}

export async function discardElement(target: GridElement) {
  logger.set({
    type: "progress",
    mode: 0,
    classname: "elementdiscard",
    message: `Discarding element configuration...`,
  });

  target
    .discardChanges()
    .then((result) => {
      target.sendToGrid();
      logger.set({
        type: "progress",
        mode: 0,
        classname: "elementdiscard",
        message: `Configuration on Element ${target.elementIndex} is discarded!`,
      });
    })
    .catch(handleError)
    .finally(() => {
      Analytics.track({
        event: "Config Action",
        payload: { click: "Whole Element Discard" },
        mandatory: false,
      });
    });
}

export function isClearElementEnabled(data: ElementData) {
  return typeof data !== "undefined";
}

export async function clearElement(target: GridElement) {
  logger.set({
    type: "progress",
    mode: 0,
    classname: "elementclear",
    message: `Clearing element configuration...`,
  });

  target
    .resetDefault()
    .then((result) => {
      target.sendToGrid();
      logger.set({
        type: "progress",
        mode: 0,
        classname: "elementclear",
        message: `Configuration on Element ${target.elementIndex} was reset to default!`,
      });
    })
    .catch(handleError)
    .finally(() => {
      Analytics.track({
        event: "Config Action",
        payload: { click: "Clear Element" },
        mandatory: false,
      });
    });
}

//GridAction handlers

export async function updateAction(target: GridAction, data: ActionData) {
  target
    .updateData(data)
    .then((result) => {
      target.sendToGrid();
    })
    .catch(handleError)
    .finally(() => {
      const event = target.parent as GridEvent;
      const element = event.parent as GridElement;
      Analytics.track({
        event: "Config Action",
        payload: {
          click: "Update",
          elementType: element.type,
          eventType: event.type,
          short: target.short,
        },
        mandatory: false,
      });
    });
}

//GridEvent handlers

export const isMergeActionsEnabled = derived(
  config_panel_blocks,
  ($config_panel_blocks) => {
    return $config_panel_blocks.some((e) => e.selected);
  }
);

export async function mergeActionsToCode(
  target: GridEvent,
  ...actions: GridAction[]
) {
  target
    .merge(...actions)
    .then((result) => {
      target.sendToGrid();
    })
    .catch(handleError)
    .finally(() => {});
}

export const isPasteActionsEnabled = derived(appClipboard, ($appClipboard) => {
  return $appClipboard?.key === ClipboardKey.ACTION_BLOCKS;
});

export async function pasteActions(target: GridEvent, index?: number) {
  target
    .pasteFromClipboard(index)
    .then((result) => {
      target.sendToGrid();
    })
    .catch(handleError)
    .finally(() => {
      Analytics.track({
        event: "Config Action",
        payload: { click: "Paste" },
        mandatory: false,
      });
    });
}

export const isRemoveActionsEnabled = derived(
  config_panel_blocks,
  ($config_panel_blocks) => {
    return $config_panel_blocks.some((e) => e.selected);
  }
);

export async function removeActions(
  target: GridEvent,
  ...actions: GridAction[]
) {
  target
    .remove(...actions)
    .then((result) => {
      target.sendToGrid();
    })
    .catch(handleError)
    .finally(() => {
      Analytics.track({
        event: "Config Action",
        payload: { click: "Remove" },
        mandatory: false,
      });
    });
}

export const isCutActionsEnabled = derived(
  config_panel_blocks,
  ($config_panel_blocks) => {
    return $config_panel_blocks.some((e) => e.selected);
  }
);

export async function cutActions(target: GridEvent, ...actions: GridAction[]) {
  appClipboard
    .copyActions(...actions)
    .then(() => {
      target.remove(...actions);
      target.sendToGrid();
    })
    .catch(handleError)
    .finally(() => {
      Analytics.track({
        event: "Config Action",
        payload: { click: "Cut" },
        mandatory: false,
      });
    });
}

export async function addActions(
  target: GridEvent,
  index?: number,
  ...actions: GridAction[]
) {
  const actionMethod =
    typeof index === "undefined"
      ? target.push
      : target.insert.bind(target, index);

  actionMethod(...actions)
    .then((result) => {
      target.sendToGrid();
    })
    .catch(handleError)
    .finally(() => {
      for (const action of actions) {
        Analytics.track({
          event: "Config Action",
          payload: {
            click: "Add Action",
            actionBlock: action.information.name,
          },
          mandatory: false,
        });
      }
    });
}

export async function replaceAction(
  target: GridEvent,
  a: GridAction,
  b: GridAction
) {
  target
    .replace(a, b)
    .then((result) => {
      target.sendToGrid();
    })
    .catch(handleError)
    .finally(() => {
      Analytics.track({
        event: "Replace Action",
        payload: { click: "Replace" },
        mandatory: false,
      });
    });
}

export async function loadProfile(
  profile: GridProfileData,
  target: GridPage
): Promise<void> {
  Analytics.track({
    event: "Pro file Load Start",
    payload: {},
    mandatory: false,
  });

  target
    .loadProfile(profile)
    .then(() => {
      const ui = get(user_input);
      const module = target.parent as GridModule;
      if (ui.dx !== module.dx || ui.dy !== module.dy) {
        user_input.set({
          dx: module.dx,
          dy: module.dy,
          pagenumber: target.pageNumber,
          elementnumber: ui.elementnumber,
          eventtype: ui.eventtype,
        });
      }
      return Promise.resolve();
    })
    .catch((e) => {
      handleError(e);
      return Promise.reject(e);
    })
    .finally(() => {
      Analytics.track({
        event: "Profile Load Success",
        payload: {},
        mandatory: false,
      });
    });
}

export async function loadPreset(
  preset: GridPresetData,
  target: GridElement
): Promise<void> {
  Analytics.track({
    event: "Preset Load Start",
    payload: {},
    mandatory: false,
  });

  target
    .loadPreset(preset)
    .then(() => {
      const ui = get(user_input);
      const page = target.parent as GridPage;
      const module = page.parent as GridModule;
      if (ui.dx !== module.dx || ui.dy !== module.dy) {
        user_input.set({
          dx: module.dx,
          dy: module.dy,
          pagenumber: page.pageNumber,
          elementnumber: target.elementIndex,
          eventtype: ui.eventtype,
        });
      }
    })
    .catch((e) => {
      handleError(e);
      return Promise.reject(e);
    })
    .finally(() => {
      Analytics.track({
        event: "Preset Load Success",
        payload: {},
        mandatory: false,
      });
    });
}
