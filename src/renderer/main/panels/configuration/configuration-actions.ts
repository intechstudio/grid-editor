import {
  appActionClipboard,
  logger,
} from "./../../../runtime/runtime.store.js";
import {
  runtime,
  user_input,
  controlElementClipboard,
} from "../../../runtime/runtime.store.js";
import {
  configManager,
  ConfigTarget,
  ConfigList,
  ConfigObject,
} from "../../panels/configuration/Configuration.store";
import {
  EventType,
  EventTypeToNumber,
} from "../../../protocol/grid-protocol.ts";
import { get } from "svelte/store";

function handleError(e: any) {
  switch (e.type) {
    case "lengthError":
      logger.set({
        type: "fail",
        mode: 0,
        classname: "luanotok",
        message: `${e.device}: Modifications can not be synced with grid, 
        maximum character limit reached. Shorten your code or delete action blocks.`,
      });
      break;
    case "syntaxError":
      logger.set({
        type: "fail",
        mode: 0,
        classname: "luanotok",
        message: `${e.device}: Syntax error on ${e.element.no} ${e.event.type} event.`,
      });
      break;
  }
}

export async function loadPreset({ dx, dy, page, element, preset }) {
  configManager
    .loadPreset({
      x: dx,
      y: dy,
      element: element,
      preset: preset,
    })
    .catch((error) => {
      console.warn(error);
      Promise.reject(error);
    });
}

export async function loadProfile({ dx, dy, page, profile }) {
  configManager
    .loadProfile({
      x: dx,
      y: dy,
      profile: profile,
    })
    .catch((error) => {
      console.warn(error);
      Promise.reject(error);
    });
}

export async function copyElement({ dx, dy, page, element }) {
  logger.set({
    type: "progress",
    mode: 0,
    classname: "elementcopy",
    message: `Copy events from element...`,
  });

  //Fetching all unloaded elements configuration
  return runtime
    .fetch_element_configuration_from_grid(dx, dy, page, element)
    .then(async (desc) => {
      const current = ConfigTarget.create({
        device: {
          dx: dx,
          dy: dy,
        },
        page: page,
        element: element,
        eventType: EventTypeToNumber(EventType.INIT),
      });

      if (typeof current === "undefined") {
        return Promise.reject("Target is undefined");
      }

      const data: any[] = [];
      for (const event of current!.events ?? ([] as any[])) {
        const target = ConfigTarget.create({
          device: current.device,
          element: current.element,
          eventType: event.type,
          page: current.page,
        });
        const list = await ConfigList.createFromTarget(target);
        data.push({ eventType: target!.eventType, configs: list });
      }

      controlElementClipboard.set({
        elementType: current.elementType,
        data: data,
      });
      logger.set({
        type: "success",
        mode: 0,
        classname: "elementcopy",
        message: `Events are copied!`,
      });
    })
    .catch((error) => {
      console.warn(error);
      Promise.reject(error);
    });
}

export async function overwriteElement({ dx, dy, page, element }) {
  let clipboard: any = get(controlElementClipboard);
  if (typeof clipboard === "undefined") {
    return Promise.reject("Clipboard is empty");
  }

  const current = ConfigTarget.create({
    device: {
      dx: dx,
      dy: dy,
    },
    page: page,
    element: element,
    eventType: EventTypeToNumber(EventType.INIT),
  });

  if (typeof current === "undefined") {
    return Promise.reject("Target is undefined");
  }

  if (current!.elementType !== clipboard!.elementType) {
    const message = `Overwrite element failed! Current ${
      current!.elementType
    } control 
          element is not compatible with clipboards ${
            clipboard.elementType
          } type.`;
    logger.set({
      type: "fail",
      mode: 0,
      classname: "rejectoverwrite",
      message: message,
    });
    return Promise.reject(message);
  }

  const promises: Promise<void>[] = [];
  for (const e of current!.events ?? ([] as any[])) {
    const eventtype = e.type;
    const target = ConfigTarget.create({
      device: current!.device,
      element: current!.element,
      eventType: eventtype,
      page: current!.page,
    });
    const list = clipboard.data.find(
      (e: any) => e.eventType === eventtype
    ).configs;
    promises.push(list.sendTo({ target: target }));
  }
  return Promise.all(promises)
    .then(() => {
      const ui = get(user_input);
      user_input.set({
        dx: dx,
        dy: dy,
        pagenumber: page,
        elementnumber: element,
        eventtype: ui.eventtype,
      });
      const displayed = ConfigTarget.createFrom({
        userInput: ui,
      });
      ConfigList.createFromTarget(displayed).then((list) => {
        configManager.set(list);
      });
    })
    .catch((error) => {
      console.warn(error);
      return Promise.reject(error);
    });
}

export async function discardElement({ dx, dy, page, element }) {
  logger.set({
    type: "progress",
    mode: 0,
    classname: "elementdiscard",
    message: `Discarding element configuration...`,
  });

  const current = ConfigTarget.create({
    device: { dx, dy },
    page,
    element,
    eventType: EventTypeToNumber(EventType.INIT),
  });
  if (!current) {
    console.warn("Target is undefined");
    return Promise.reject();
  }

  const promises: Promise<void>[] = [];
  for (const event of current.events ?? ([] as any[])) {
    const stored = event.stored;
    if (!stored) continue;
    const eventtype = event.type;
    const target = ConfigTarget.create({
      device: current.device,
      element: current.element,
      eventType: eventtype,
      page: current.page,
    });
    const list = ConfigList.createFromActionString(stored);
    promises.push(list.sendTo({ target }));
  }

  return Promise.all(promises)
    .then(async () => {
      const ui = get(user_input); // assuming user_input is accessible
      user_input.set({
        dx,
        dy,
        pagenumber: page,
        elementnumber: element,
        eventtype: ui.eventtype,
      });
      const displayed = ConfigTarget.createFrom({ userInput: ui });
      const list = await ConfigList.createFromTarget(displayed);
      configManager.set(list);

      logger.set({
        type: "progress",
        mode: 0,
        classname: "elementdiscard",
        message: `Configuration on Element ${element} is discarded!`,
      });
    })
    .catch((error) => {
      console.warn(error);
      return Promise.reject(error);
    });
}

export function selectAction(index: number, value: boolean) {
  configManager.update((s: ConfigList) => {
    const stack: any[] = [];
    let n = index;
    do {
      const config = s[n];
      if (config.information.type === "composite_open") {
        stack.push(config);
      } else if (config.information.type === "composite_close") {
        stack.pop();
      }
      config.selected = value;
      ++n;
    } while (stack.length > 0);
    return s;
  });
}

export function insertAction(
  index: number | undefined,
  configs: ConfigObject[]
) {
  if (typeof index === "undefined") {
    index = get(configManager).length;
  }

  try {
    configManager.update((s) => {
      const list = s.makeCopy();
      list.insert(index, ...configs);
      list.checkLength();
      return list;
    });
  } catch (e) {
    console.warn(e);
    handleError(e);
  }
}

export function updateAction(index: number, short: string, script: string) {
  configManager.update((s: ConfigList) => {
    const config = s[index];
    if (typeof config !== "undefined") {
      config.short = short;
      config.script = script;
    }
    return s;
  });
}

export function mergeActionToCode(index: number, configs: ConfigObject[]) {
  //Create new CodeBlock with merged code
  const codeBlock = new ConfigObject({
    short: "cb",
    script: configs.map((e) => e.script).join(" "),
  });

  //Check syntax
  if (codeBlock.checkSyntax() === false) {
    logger.set({
      type: "fail",
      mode: 0,
      classname: "luanotok",
      message: `Cannot merge actionblocks with syntax error!`,
    });
    return;
  }

  configManager.update((s: ConfigList) => {
    //Insert CodeBlock into position
    s.insert(index, codeBlock);
    // Remove selected action blocks
    s = s.filter((config) => !config.selected);
    return s;
  });
}

export function copyActions() {
  const clipboard: ConfigObject[] = get(configManager)
    .makeCopy()
    .filter((e) => e.selected);
  appActionClipboard.set(clipboard);
}

export function pasteActions(index: number | undefined) {
  if (typeof index === "undefined") {
    index = get(configManager).length;
  }

  configManager.update((s) => {
    s.forEach((e) => (e.selected = false));
    s.insert(index, ...get(appActionClipboard).map((e) => e.makeCopy()));

    return s;
  });
}

export function removeActions() {
  configManager.update((s: ConfigList) =>
    s.filter((config) => !config.selected)
  );
}

export function cutActions() {
  copyActions();
  removeActions();
}
