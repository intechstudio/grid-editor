import { GridAction, GridEvent } from "../../../runtime/runtime";

type ConfigObject = any;

export async function copyElement({ dx, dy, page, element }) {
  /*
  logger.set({
    type: "progress",
    mode: 0,
    classname: "elementcopy",
    message: `Copy events from element...`,
  });

  //Fetching all unloaded elements configuration
  return runtime
    .getModule(dx, dy)
    .getPage(page)
    .getElement(element)
    .load()
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
    */
}

export async function overwriteElement({ dx, dy, page, element }) {
  /*
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
  */
}

export async function discardElement({ dx, dy, page, element }) {
  /*
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

  const promises: Promise<string>[] = [];
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
    const list = ConfigList.createFromActions(stored);
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
    */
}

export function selectAction(index: number, value: boolean) {
  /*
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
  */
}

export function insertAction(
  index: number | undefined,
  configs: ConfigObject[],
  parent: GridEvent
) {
  /*
  if (typeof index === "undefined") {
    index = get(configManager).length;
  }

  configManager.update((s) => {
    const value = configs.map((e) => {
      const node = new GridAction(parent, {
        short: e.short,
        script: e.script,
        name: e.name,
      });
      e.runtimeRef = node;
      e.id = node.id;
      return e;
    });
    s.insert(index, ...value);
    const res = s.checkLength();
    if (!res.value) {
      for (let i = 0; i < value.length; ++i) {
        s.remove(index);
      }
      console.warn(res.detail);
      handleError(res.detail);
    }
    return s;
  });
  */
}

export function updateAction(index: number, newConfig: ConfigObject) {
  /*
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
      const res = s.checkLength();
      if (!res.value) {
        throw "Length error";
      }

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
  */
}

export function mergeActionToCode(index: number, configs: ConfigObject[]) {
  /*
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
    runtimeRef: new GridAction(configs[0].runtimeRef.parent as GridEvent, {
      short: "cb",
      script: script,
      name: undefined,
    }),
  });

  configManager.update((s: ConfigList) => {
    //Insert CodeBlock into position
    s.insert(index, codeBlock);
    // Remove selected action blocks
    s = s.filter((config) => !config.selected) as ConfigList;
    return s;
  });
  */
}

export function copyActions() {
  /*
  const clipboard = get(configManager)
    .filter((e) => e.selected)
    .map((e) => {
      return new ConfigObject({
        short: e.short,
        script: e.script,
        name: e.name,
        runtimeRef: new GridAction(undefined, {
          short: e.short,
          script: e.script,
          name: e.name,
        }),
      });
    });
  appClipboard.set({
    key: ClipboardKey.ACTION_BLOCKS,
    payload: clipboard,
  });
  */
}

export function pasteActions(index: number | undefined) {
  /*
  return new Promise((resolve, reject) => {
    if (typeof index === "undefined") {
      index = get(configManager).length;
    }

    const clipboard = get(appClipboard);

    if (clipboard?.key !== ClipboardKey.ACTION_BLOCKS) {
      reject(`Paste: Invalid clipboard type ${clipboard?.key}`);
    }

    let error = false;
    configManager.update((s) => {
      const value = get(appClipboard)!.payload;
      s.forEach((e) => (e.selected = false));
      s.insert(index, ...value);
      const res = s.checkLength();
      if (!res.value) {
        error = true;
        for (let i = 0; i < value.length; ++i) {
          s.remove(index);
        }
      }

      return s;
    });
    error ? reject("Paste failed") : resolve();
  });
  */
}

export function removeActions() {
  /*
  configManager.update((s: ConfigList) => {
    s.forEach((config) => {
      if (config.selected) {
        config.runtimeRef.parent = undefined;
      }
    });
    return s.filter((config) => !config.selected);
  });
  */
}

export function cutActions() {
  /*
  copyActions();
  removeActions();
  */
}

export function clearElement(
  dx: number,
  dy: number,
  pageNumber: number,
  elementNumber: number
) {
  /*
  const device: any = runtime.modules.find(
    (e: any) => e.dx === dx && e.dy === dy
  );
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

  const promises: Promise<string>[] = [];
  for (const e of current!.events ?? ([] as any[])) {
    const eventtype = e.type;
    const target = ConfigTarget.create({
      device: current!.device,
      element: current!.element,
      eventType: eventtype,
      page: current!.page,
    });
    const defaultConfig = createActionsFromString(
      undefined,
      events.find((e: any) => e.value === eventtype)?.config
    );

    const list = ConfigList.createFromActions(defaultConfig);
    promises.push(list.sendTo({ target: target }));
  }

  return Promise.all(promises).then(() => {
    configManager.refresh();
  });
  */
}
