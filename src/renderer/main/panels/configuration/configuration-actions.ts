import { logger } from "./../../../runtime/runtime.store.js";
import { runtime, user_input } from "../../../runtime/runtime.store.js";
import {
  configManager,
  ConfigTarget,
  ConfigList,
  ConfigObject,
} from "../../panels/configuration/Configuration.store";
import {
  EventType,
  EventTypeToNumber,
  grid,
  GridScript,
} from "@intechstudio/grid-protocol";
import { Writable, derived, get } from "svelte/store";
import { ClipboardKey, appClipboard } from "../../../runtime/clipboard.store";

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
        eventType: EventTypeToNumber(EventType.SETUP),
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

      appClipboard.set({
        key: ClipboardKey.ELEMENT,
        payload: {
          elementType: current.elementType,
          data: data,
        },
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
  const clipboard = get(appClipboard);
  if (clipboard?.key !== ClipboardKey.ELEMENT) {
    throw `Overwrite Element: Invalid clipboard type ${clipboard?.key}`;
  }

  const current = ConfigTarget.create({
    device: {
      dx: dx,
      dy: dy,
    },
    page: page,
    element: element,
    eventType: EventTypeToNumber(EventType.SETUP),
  });

  const promises: Promise<void>[] = [];
  for (const e of current!.events ?? ([] as any[])) {
    const eventtype = e.type;
    const target = ConfigTarget.create({
      device: current!.device,
      element: current!.element,
      eventType: eventtype,
      page: current!.page,
    });

    const list = clipboard!.payload.data.find(
      (e: any) => e.eventType === eventtype
    )?.configs;
    if (typeof list === "undefined") {
      continue;
    }
    promises.push(list.sendTo({ target: target }));
  }
  return Promise.all(promises).then(() => {
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
    eventType: EventTypeToNumber(EventType.SETUP),
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

export function updateAction(index: number, newConfig: ConfigObject) {
  const { short, script, name } = newConfig;

  const cm = get(configManager);
  const tempScript = cm[index].script;
  const tempName = cm[index].name;
  try {
    configManager.update((s: ConfigList) => {
      const config = s[index];
      config.short = short;
      config.script = script;
      config.name = name;
      s.checkLength();
      return s;
    });
  } catch (e) {
    configManager.update((s: ConfigList) => {
      const config = s[index];
      config.script = tempScript;
      config.name = tempName;
      return s;
    });
    configManager.refresh();
    logger.set({
      type: "fail",
      mode: 0,
      classname: "config-limit-reached",
      message: `Update failed! Config limit reached, shorten your code, or delete actions!`,
    });
  }
}

export function mergeActionToCode(index: number, configs: ConfigObject[]) {
  //Merge scripts
  const script = configs.map((e) => e.script).join(" ");

  //Check syntax
  if (GridScript.checkSyntax(script) === false) {
    logger.set({
      type: "fail",
      mode: 0,
      classname: "luanotok",
      message: `Cannot merge actionblocks with syntax error!`,
    });
    return;
  }

  //Create new CodeBlock with merged code
  const codeBlock = new ConfigObject({
    short: "cb",
    script: script,
  });

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
  appClipboard.set({
    key: ClipboardKey.ACTION_BLOCKS,
    payload: clipboard,
  });
}

export function pasteActions(index: number | undefined) {
  if (typeof index === "undefined") {
    index = get(configManager).length;
  }

  const clipboard = get(appClipboard);

  if (clipboard?.key !== ClipboardKey.ACTION_BLOCKS) {
    throw `Paste: Invalid clipboard type ${clipboard?.key}`;
  }

  try {
    configManager.update((s) => {
      const temp = s.makeCopy();
      temp.forEach((e) => (e.selected = false));
      temp.insert(
        index,
        ...get(appClipboard)!.payload.map((e) => e.makeCopy())
      );
      temp.checkLength();
      return temp;
    });
  } catch (e) {
    return Promise.reject(e);
  }
  return Promise.resolve();
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

export function clearElement(
  dx: number,
  dy: number,
  pageNumber: number,
  elementNumber: number
) {
  const rt = get(runtime);
  const device: any = rt.find((e: any) => e.dx === dx && e.dy === dy);
  const page: any = device?.pages.find((e: any) => e.pageNumber === pageNumber);
  const type = page.control_elements.find(
    (e: any) => e.elementIndex === elementNumber
  ).type;
  const events = grid.get_element_events(type).map((e) => {
    return {
      value: Number(e.value),
      config: e.defaultConfig,
      stored: e.defaultConfig,
    };
  });

  const current = ConfigTarget.create({
    device: {
      dx: dx,
      dy: dy,
    },
    page: pageNumber,
    element: elementNumber,
    eventType: EventTypeToNumber(EventType.SETUP),
  });

  const promises: Promise<void>[] = [];
  for (const e of current!.events ?? ([] as any[])) {
    const eventtype = e.type;
    const target = ConfigTarget.create({
      device: current!.device,
      element: current!.element,
      eventType: eventtype,
      page: current!.page,
    });
    const defaultConfig = events.find(
      (e: any) => e.value === eventtype
    )?.config;
    const list = ConfigList.createFromActionString(defaultConfig);
    promises.push(list.sendTo({ target: target }));
  }

  return Promise.all(promises).then(() => {
    configManager.refresh();
  });
}

//////////////////////////////////
/// State management functions ///
//////////////////////////////////

export function createOverwriteDisabledStore(watched: Writable<ConfigTarget>) {
  return derived([watched, appClipboard], ([$watched, $appClipboard]) => {
    if (
      typeof $watched === "undefined" ||
      typeof $appClipboard === "undefined" ||
      $appClipboard.key === ClipboardKey.ACTION_BLOCKS
    ) {
      return true;
    }

    const compatible = grid.is_element_compatible_with(
      $appClipboard.payload.elementType,
      $watched.elementType
    );
    return !compatible;
  });
}

export function createCopyAllDisabledStore(watched: Writable<ConfigTarget>) {
  return derived(
    [watched, configManager, runtime],
    ([$watched, $configManager, $runtime]) => {
      return (
        typeof $configManager.find((e) => e.selected) !== "undefined" ||
        $runtime.length === 0
      );
    }
  );
}

export function createDiscardElementDisabledStore(
  watched: Writable<ConfigTarget>
) {
  return derived([watched, configManager], ([$watched, $configManager]) => {
    return !$watched?.hasChanges() ?? true;
  });
}

export function createClearElementDisabledStore(
  watched: Writable<ConfigTarget>
) {
  return derived([watched, runtime], ([$watched, $runtime]) => {
    return $runtime.length === 0;
  });
}

export function createCopyDisabledStore(watched: Writable<ConfigTarget>) {
  return derived([watched, configManager], ([$watched, $configManager]) => {
    return typeof $configManager.find((e) => e.selected) === "undefined";
  });
}

export function createPasteDisabledStore(watched: Writable<ConfigTarget>) {
  return derived([watched, appClipboard], ([$watched, $appClipboard]) => {
    return $appClipboard?.key !== ClipboardKey.ACTION_BLOCKS;
  });
}

export function createCutDisabledStore(watched: Writable<ConfigTarget>) {
  return derived([watched, configManager], ([$watched, $configManager]) => {
    return typeof $configManager.find((e) => e.selected) === "undefined";
  });
}

export function createMergeDisabledStore(watched: Writable<ConfigTarget>) {
  return derived([watched, configManager], ([$watched, $configManager]) => {
    return typeof $configManager.find((e) => e.selected) === "undefined";
  });
}

export function createRemoveDisabledStore(watched: Writable<ConfigTarget>) {
  return derived([watched, configManager], ([$watched, $configManager]) => {
    return typeof $configManager.find((e) => e.selected) === "undefined";
  });
}
