import { Analytics } from "./analytics";
import { appClipboard, ClipboardKey } from "./clipboard.store";
import { logger } from "./runtime.store";
import {
  GridOperationResult,
  ElementData,
  ActionData,
  GridAction,
  GridElement,
  GridEvent,
  SendToGridResult,
} from "./runtime";
import { get } from "svelte/store";

function handleError(e: GridOperationResult) {
  console.warn(`Operation error: ${e.text}`);
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
    .then((result) => {})
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
    .overwride(data)
    .then((result) => {})
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

export async function mergeActionsToCode(
  target: GridEvent,
  ...actions: GridAction[]
) {
  target
    .merge(...actions)
    .then((result) => {})
    .catch(handleError);
}

export async function pasteActions(target: GridEvent, index?: number) {
  target
    .pasteFromClipboard(index)
    .then((result) => {})
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
    .then((result) => {})
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

export async function replaceActions(
  target: GridEvent,
  a: GridAction,
  b: GridAction
) {
  target
    .replace(a, b)
    .catch(handleError)
    .finally(() => {
      Analytics.track({
        event: "Replace Action",
        payload: { click: "Replace" },
        mandatory: false,
      });
    });
}
