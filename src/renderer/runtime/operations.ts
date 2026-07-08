import { Analytics } from "./analytics";
import {
  clearDirFiles,
  pageNumberToFolderPath,
} from "../main/panels/FileManager/FileManager";
import { appClipboard, ClipboardKey } from "./clipboard.store";
import { logger } from "./runtime.store";
import { selected_actions } from "./selected-actions.store";

import {
  ElementData,
  ActionData,
  GridAction,
  GridElement,
  GridEvent,
  GridOperationType,
  GridPage,
  GridProfileData,
  GridModule,
  GridPresetData,
  GridSnippetData,
  ProfileCloudLoad,
  type SnippetLoadResult,
  type InsertActionsResult,
  type GridOperationResult,
} from "./runtime";
import { get } from "svelte/store";
import { user_input } from "./user-input.store";
import { ConfigTour, configTour } from "../main/panels/profileCloud/ConfigTour";

function handleError(e: GridOperationResult) {
  //TODO: Better error handling
  console.warn(`Operation error: ${e.text}`, e);
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
    case GridOperationType.LOAD_SNIPPET: {
      const error = e as SnippetLoadResult;
      logger.set({
        type: "fail",
        mode: 0,
        classname: "operationerror",
        message: e.text,
      });
      break;
    }
  }
}

//Clipboard handlers
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

export async function syncWithGrid(target: GridAction) {
  target
    .sendToGrid()
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

export async function updateAction(
  target: GridAction,
  data: ActionData,
  sync: boolean,
  onError?: (message: string) => void,
) {
  return target
    .updateData(data)
    .catch((e: GridOperationResult) => {
      if (onError) {
        onError(e.text);
      } else {
        handleError(e);
      }
    })
    .finally(() => {
      if (sync) {
        syncWithGrid(target);
      }
    });
}

//GridEvent handlers

export async function mergeActionsToCode(
  target: GridEvent,
  selectMergedAction: boolean,
  ...actions: GridAction[]
) {
  target
    .merge(...actions)
    .then((result) => {
      target.sendToGrid();
      if (selectMergedAction) {
        selected_actions.set([result.merged]);
      }
    })
    .catch(handleError)
    .finally(() => {});
}

export async function pasteActions(target: GridEvent, index?: number) {
  target
    .pasteFromClipboard(index)
    .then((result) => {
      target.sendToGrid();
      selected_actions.set(result.pasted);
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

export async function removeActions(
  target: GridEvent,
  ...actions: GridAction[]
) {
  target
    .remove(...actions)
    .then((result) => {
      target.sendToGrid();
      selected_actions.update((s) => {
        for (const action of actions) {
          if (s.includes(action)) {
            s = s.filter((item) => item !== action);
          }
        }
        return s;
      });
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
  b: GridAction,
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
  target: GridPage,
  setStatus?: (status: ProfileCloudLoad.Status) => void,
) {
  Analytics.track({
    event: "Pro file Load Start",
    payload: {},
    mandatory: false,
  });

  const module = target.parent as GridModule;

  if (profile.files && profile.files?.length > 0) {
    // consider adding this to path where profile does not have files
    const folderPath = pageNumberToFolderPath(target.pageNumber);
    await clearDirFiles(folderPath, module);
    // upload files to module
    await target.sendFiles(profile.files, setStatus);
  }

  return target
    .sendProfile(profile, setStatus)
    .then(() => {
      const ui = get(user_input);
      if (ui.dx !== module.dx || ui.dy !== module.dy) {
        user_input.set({
          dx: module.dx,
          dy: module.dy,
          pagenumber: target.pageNumber,
          elementnumber: ui.elementnumber,
          eventtype: ui.eventtype,
        });
      }
      configTour.createTourFromProfile(profile, module);
      return Promise.resolve();
    })
    .catch((e) => {
      handleError(e);
      configTour.clear();
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
  target: GridElement,
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
      configTour.clear();
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

export async function loadSnippet(
  snippet: GridSnippetData,
  target: GridEvent,
  index: number,
) {
  Analytics.track({
    event: "Snippet Load Start",
    payload: {},
    mandatory: false,
  });

  return target
    .loadSnippet(snippet, index)
    .catch((e) => {
      configTour.clear();
      handleError(e);
    })
    .finally(() => {
      Analytics.track({
        event: "Snippet Load Success",
        payload: {},
        mandatory: false,
      });
    });
}

export async function dropActions(
  target: GridEvent,
  index: number,
  actions: GridAction[],
): Promise<InsertActionsResult> {
  let targetActions = actions.filter((e) => e.parent === target);
  let targetIndexes = targetActions.map((action) =>
    target.config.findIndex((e) => e.id === action.id),
  );
  const targetMinIndex = Math.min(...targetIndexes);
  const targetMaxIndex = Math.max(...targetIndexes);

  if (index >= targetMinIndex && index <= targetMaxIndex + 1) {
    const error = {
      value: false,
      text: `Oops! You can\'t drop actions here — try a different spot.`,
      type: GridOperationType.INSERT_ACTIONS,
      info: target.getInfo(),
    };
    handleError(error);
    return Promise.reject(error);
  }

  if (targetActions.length > 0) {
    const movingDown = index > targetMaxIndex;
    index = movingDown ? index - targetIndexes.length : index;
  }

  const removed: Array<{ index: number; action: GridAction }> = [];
  const sourceEvents = new Set<GridEvent>();

  // Remove all actions first without sending intermediate states
  for (const action of actions) {
    const parent = action.parent as GridEvent;
    removed.push(...(await parent.remove(action)).removed);
    sourceEvents.add(parent);
  }

  try {
    await target.insert(index, ...actions);

    // Send all updates only after successful insert
    for (const sourceEvent of sourceEvents) {
      if (sourceEvent !== target) {
        sourceEvent.sendToGrid();
      }
    }
    target.sendToGrid();
  } catch (e) {
    // Restore all removed actions
    for (const obj of removed) {
      const parent = obj.action.parent as GridEvent;
      parent.insert(obj.index, obj.action);
    }
    // Send restored state for all affected events
    for (const sourceEvent of sourceEvents) {
      sourceEvent.sendToGrid();
    }
    handleError(e);
  }
}
