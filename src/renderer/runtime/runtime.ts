import {
  grid,
  Architecture,
  ElementType,
  ModuleType,
} from "@intechstudio/grid-protocol";
import {
  writable,
  get,
  Writable,
  Subscriber,
  Unsubscriber,
  Updater,
} from "svelte/store";
import { instructions } from "../serialport/instructions";
import { writeBuffer } from "./engine.store";
import { createVirtualModule } from "./virtual-engine";
import { VirtualModuleHWCFG } from "./virtual-engine";
import { virtual_runtime } from "./virtual-engine";
import { Analytics } from "./analytics.js";
import { appSettings } from "./app-helper.store";
import { add_datapoint } from "../serialport/message-stream.store.js";
import {
  elementPositionStore,
  ledColorStore,
  logger,
  user_input,
} from "./runtime.store";
import { v4 as uuidv4 } from "uuid";

type UUID = string;
interface NodeData {
  id?: UUID;
  parent?: RuntimeNode<any>;
}

abstract class RuntimeNode<T extends NodeData> implements Writable<T> {
  protected _internal: Writable<T>;

  public subscribe(
    run: Subscriber<T>,
    invalidate?: (value?: T) => void
  ): Unsubscriber {
    return this._internal.subscribe(run, invalidate);
  }

  public set(value: T) {
    this._internal.set(value);
    this.notifyParent();
  }

  public update(updater: Updater<T>) {
    this._internal.update(updater);
    this.notifyParent();
  }

  constructor(parent: RuntimeNode<any>, value?: T) {
    value.parent = parent;
    value.id = uuidv4();

    this._internal = writable(value);
  }

  get data() {
    return get(this._internal);
  }

  get parent(): RuntimeNode<any> {
    return this.getField("parent");
  }

  set parent(value: RuntimeNode<any>) {
    this.setField("parent", value);
  }

  get id() {
    return this.getField("id");
  }

  protected notify() {
    this._internal.update((s) => s);
    this.notifyParent();
  }

  protected notifyParent() {
    if (!this.parent) {
      return;
    }

    this.parent.notify();
  }

  // Generalized getter
  protected getField<K extends keyof T>(key: K): T[K] {
    const data = get(this._internal);
    return data[key];
  }

  // Generalized setter
  protected setField<K extends keyof T>(key: K, value: T[K]) {
    this.update((store) => {
      store[key] = value;
      return store;
    });
    this.notifyParent();
  }
}

export interface ActionData extends NodeData {
  short: string;
  script: string;
  name: string | undefined;
}

export class GridAction extends RuntimeNode<ActionData> {
  constructor(parent: GridEvent, data?: ActionData) {
    super(parent, data);
  }

  // Getters
  get script() {
    return this.getField("script");
  }

  get short() {
    return this.getField("short");
  }

  get name() {
    return this.getField("name");
  }

  // Setters
  set script(value: string) {
    this.setField("script", value);
  }

  set short(value: string) {
    this.setField("short", value);
  }

  set name(value: string) {
    this.setField("name", value);
  }

  toLua() {
    const namePostfix = typeof this.name !== "undefined" ? `#${this.name}` : "";
    return `--[[@${this.short}${namePostfix}]] ${this.script}`;
  }

  //Refactor this out
  isEqual(other: GridAction) {
    return (
      this.name === other.name &&
      this.script === other.script &&
      this.short === other.short
    );
  }
}

export interface EventData extends NodeData {
  config?: Array<GridAction> | undefined;
  stored?: Array<GridAction> | undefined;
  type: number;
}

export class GridEvent extends RuntimeNode<EventData> {
  constructor(parent: GridElement, data?: EventData) {
    super(parent, data);
  }

  // Getters
  get config() {
    return this.getField("config");
  }

  get stored() {
    return this.getField("stored");
  }

  get type() {
    return this.getField("type");
  }

  // Setters
  private set config(value: Array<GridAction>) {
    this.setField("config", value);
  }

  private set stored(value: Array<GridAction>) {
    this.setField("stored", value);
  }

  private set type(value: number) {
    this.setField("type", value);
  }

  //Methods
  toLua() {
    return `<?lua ${this.config.map((e) => e.toLua()).join("")} ?>`;
  }

  hasChanges(): boolean {
    if (this.stored === undefined) {
      return false;
    }

    if (this.config.length !== this.stored.length) {
      return true;
    }

    for (let i = 0; i < this.config.length; ++i) {
      if (!this.config[i].isEqual(this.stored[i])) {
        return true;
      }
    }

    return false;
  }

  store(value: Array<GridAction>) {
    this.stored = value.map(
      (e) =>
        new GridAction(this, { script: e.script, short: e.short, name: e.name })
    );
  }

  clear() {
    this.config = undefined;
    this.stored = undefined;
  }
}

export interface ElementData extends NodeData {
  elementIndex: number;
  events?: Array<GridEvent>;
  name: string | undefined;
  type: ElementType;
}

export class GridElement extends RuntimeNode<ElementData> {
  constructor(parent: GridPage, data?: ElementData) {
    super(parent, data);

    this.events = [];
    const elementEvents = grid.get_element_events(data.type);
    for (const event of elementEvents) {
      this.events.push(
        new GridEvent(this, {
          type: Number(event.value),
          config: undefined,
          stored: undefined,
        })
      );
    }
  }

  // Getters
  get elementIndex() {
    return this.getField("elementIndex");
  }

  get events() {
    return this.getField("events");
  }

  get name() {
    return this.getField("name");
  }

  get type() {
    return this.getField("type");
  }

  // Setters
  private set elementIndex(value: number) {
    this.setField("elementIndex", value);
  }

  private set events(value: Array<GridEvent>) {
    this.setField("events", value);
  }

  set name(value: string) {
    this.setField("name", value);
  }

  set type(value: ElementType) {
    this.setField("type", value);
  }
}

export interface PageData extends NodeData {
  pageNumber: number;
  control_elements?: Array<GridElement>;
}

export class GridPage extends RuntimeNode<PageData> {
  constructor(parent: GridModule, data?: PageData) {
    super(parent, data);
    this.control_elements = [];
    const moduleElements = grid.get_module_element_list(parent.type);
    for (const [index, element] of Object.entries(moduleElements)) {
      if (typeof element === "undefined") {
        continue;
      }

      this.control_elements.push(
        new GridElement(this, {
          elementIndex: Number(index),
          type: element,
          name: undefined,
        })
      );
    }
  }

  // Getters
  get pageNumber() {
    return this.getField("pageNumber");
  }

  get control_elements() {
    return this.getField("control_elements");
  }

  // Setters
  private set pageNumber(value: number) {
    this.setField("pageNumber", value);
  }

  private set control_elements(value: Array<GridElement>) {
    this.setField("control_elements", value);
  }
}

type FirmwareVersion = {
  major: number | undefined;
  minor: number | undefined;
  patch: number | undefined;
};

type Direction = {
  dx: number;
  dy: number;
};

type DirectionMap = {
  bot: Direction;
  left: Direction;
  right: Direction;
  top: Direction;
};

export interface ModuleData extends NodeData {
  alive: number;
  architecture: Architecture;
  dx: number;
  dy: number;
  fwMismatch: boolean;
  fwVersion: FirmwareVersion;
  id: string;
  map: DirectionMap;
  portstate: any;
  rot: number;
  type: ModuleType;
  pages?: Array<GridPage>;
}

export class GridModule extends RuntimeNode<ModuleData> {
  constructor(parent: GridRuntime, data?: ModuleData) {
    super(parent, data);
    this.pages = [
      new GridPage(this, { pageNumber: 0 }),
      new GridPage(this, { pageNumber: 1 }),
      new GridPage(this, { pageNumber: 2 }),
      new GridPage(this, { pageNumber: 3 }),
    ];
  }

  // Getters
  get alive() {
    return this.getField("alive");
  }

  get architecture() {
    return this.getField("architecture");
  }

  get dx() {
    return this.getField("dx");
  }

  get dy() {
    return this.getField("dy");
  }

  get fwMismatch() {
    return this.getField("fwMismatch");
  }

  get fwVersion() {
    return this.getField("fwVersion");
  }

  get id() {
    return this.getField("id");
  }

  get map() {
    return this.getField("map");
  }

  get portstate() {
    return this.getField("portstate");
  }

  get rot() {
    return this.getField("rot");
  }

  get type() {
    return this.getField("type");
  }

  get pages() {
    return this.getField("pages");
  }

  // Setters
  set alive(value: number) {
    get(this._internal).alive = value;
    //this.setField("alive", value);
  }

  set architecture(value: Architecture) {
    this.setField("architecture", value);
  }

  set dx(value: number) {
    this.setField("dx", value);
  }

  set dy(value: number) {
    this.setField("dy", value);
  }

  set fwMismatch(value: boolean) {
    this.setField("fwMismatch", value);
  }

  set fwVersion(value: FirmwareVersion) {
    this.setField("fwVersion", value);
  }

  set id(value: string) {
    this.setField("id", value);
  }

  set map(value: DirectionMap) {
    this.setField("map", value);
  }

  set portstate(value: any) {
    this.setField("portstate", value);
  }

  set rot(value: number) {
    this.setField("rot", value);
  }

  set type(value: ModuleType) {
    this.setField("type", value);
  }

  set pages(value: Array<GridPage>) {
    this.setField("pages", value);
  }
}

export interface RuntimeData extends NodeData {
  modules: Array<GridModule>;
}

export class GridRuntime extends RuntimeNode<RuntimeData> {
  constructor() {
    super(undefined, { modules: [] });
  }

  get modules() {
    return this.getField("modules");
  }

  // Setters
  set modules(value: Array<GridModule>) {
    this.setField("modules", value);
  }

  findUpdateDestEvent(
    modules: GridModule[],
    dx: number,
    dy: number,
    page: number,
    element: number,
    event: number
  ) {
    let _event = undefined;
    // this elementnumber check refers to uninitialized UI...
    if (element !== -1) {
      modules.forEach((module) => {
        if (module.dx == dx && module.dy == dy) {
          const pageIndex = module.pages.findIndex((x) => x.pageNumber == page);
          const elementIndex = module.pages[
            pageIndex
          ].control_elements.findIndex((x) => x.elementIndex == element);
          _event = module.pages[pageIndex].control_elements[
            elementIndex
          ].events.find((e) => e.type == event);
        }
      });
    }
    return _event;
  }

  fetchOrLoadConfig({ dx, dy, page, element, event }): Promise<void> {
    return new Promise((resolve, reject) => {
      const _device = this.modules.find(
        (device) => device.dx == dx && device.dy == dy
      );
      const _page = _device.pages.find((e) => e.pageNumber == page);
      const _element = _page.control_elements.find(
        (e) => e.elementIndex == element
      );
      const _event = _element.events.find((e) => e.type == event);

      if (typeof _event.config !== "undefined") {
        resolve();
      } else {
        instructions
          .fetchConfigFromGrid(dx, dy, page, element, event)
          .then((descr) => {
            const dx = descr.brc_parameters.SX;
            const dy = descr.brc_parameters.SY;
            const page = descr.class_parameters.PAGENUMBER;
            const element = descr.class_parameters.ELEMENTNUMBER;
            const event = descr.class_parameters.EVENTTYPE;

            let dest = this.findUpdateDestEvent(
              this.modules,
              dx,
              dy,
              page,
              element,
              event
            );

            const actions = createActionsFromString(
              dest,
              descr.class_parameters.ACTIONSTRING
            );

            this.update_event_configuration(
              dx,
              dy,
              page,
              element,
              event,
              actions
            );

            resolve();
          })
          .catch((e) => reject(e));
      }
    });
  }

  isFirmwareMismatch(currentFirmware, requiredFirmware) {
    // Extract major, minor, and patch versions from current and required firmware
    const {
      major: currentMajor,
      minor: currentMinor,
      patch: currentPatch,
    } = currentFirmware;
    const {
      major: requiredMajor,
      minor: requiredMinor,
      patch: requiredPatch,
    } = requiredFirmware;

    // Compare major versions
    if (currentMajor < requiredMajor) {
      return true; // Firmware mismatch if current major version is lower
    } else if (currentMajor > requiredMajor) {
      return false; // No firmware mismatch if current major version is higher
    }

    // Compare minor versions
    if (currentMinor < requiredMinor) {
      return true; // Firmware mismatch if current minor version is lower
    } else if (currentMinor > requiredMinor) {
      return false; // No firmware mismatch if current minor version is higher
    }

    // Compare patch versions
    if (currentPatch < requiredPatch) {
      return true; // Firmware mismatch if current patch version is lower
    } else {
      return false; // No firmware mismatch if current patch version is equal or higher
    }
  }

  incoming_heartbeat_handler(descr) {
    try {
      for (const module of this.modules) {
        if (module.architecture === "virtual") {
          this.destroy_module(module.dx, module.dy);
        }
      }

      const [sx, sy] = [descr.brc_parameters.SX, descr.brc_parameters.SY];

      let firstConnection = false;
      const module = this.modules.find((e) => e.dx == sx && e.dy == sy);
      if (module) {
        if (module.rot != descr.brc_parameters.ROT) {
          module.rot = descr.brc_parameters.ROT;
        }

        if (module.portstate != descr.class_parameters.PORTSTATE) {
          module.portstate = descr.class_parameters.PORTSTATE;
        }

        const lastDate = module.alive;
        const newDate = Date.now();
        module.alive = newDate;

        if (get(appSettings).persistent.heartbeatDebugEnabled) {
          const key1 = `Hearbeat (${module.dx}, ${module.dy})`;
          add_datapoint(key1, newDate - lastDate);
        }
      }
      // device not found, add it to runtime and get page count from grid
      else {
        const controller = this.create_module(
          descr.brc_parameters,
          descr.class_parameters,
          false
        );
        // check if the firmware version of the newly connected device is acceptable
        console.log("Incoming Device");
        console.log("Architecture", controller.architecture);

        const as = get(appSettings);
        const firmware_required =
          controller.architecture === "esp32"
            ? as.firmware_esp32_required
            : as.firmware_d51_required;
        controller.fwMismatch = this.isFirmwareMismatch(
          controller.fwVersion,
          firmware_required
        );

        console.log(
          "Mismatch: ",
          controller.fwMismatch,
          "Firmware Version: ",
          controller.fwVersion
        );

        this.modules = [...this.modules, controller];
        controller.alive = Date.now();

        firstConnection = this.modules.length === 1;

        Analytics.track({
          event: "Connect Module",
          payload: {
            action: "Connect",
            controller: controller,
            moduleCount: this.modules.length,
          },
          mandatory: false,
        });
      }

      if (firstConnection) {
        this.setDefaultSelectedElement();
      }
    } catch (error) {
      console.warn(error);
    }
  }

  setDefaultSelectedElement() {
    user_input.set({
      dx: this.modules[0].dx,
      dy: this.modules[0].dy,
      pagenumber: 0,
      elementnumber: 0,
      eventtype: 2,
    });
  }

  element_preset_load(x, y, element, preset): Promise<void> {
    return new Promise((resolve, reject) => {
      const ui = get(user_input);
      let events = preset.configs.events;
      const promises = [];
      events.forEach((e) => {
        const page = ui.pagenumber;
        const event = e.event;

        let dest = this.findUpdateDestEvent(
          this.modules,
          x,
          y,
          page,
          element,
          event
        );
        if (typeof dest !== "undefined") {
          dest.config = createActionsFromString(dest, e.config);
          const promise = instructions.sendConfigToGrid(
            x,
            y,
            page,
            element,
            event,
            e.config
          );

          promises.push(promise);
        }
      });
      Promise.all(promises)
        .then(() => {
          resolve();
          logger.set({
            type: "success",
            mode: 0,
            classname: "elementoverwrite",
            message: `Overwrite done!`,
          });
        })
        .catch((e) => reject(e));
    });
  }

  whole_page_overwrite(x, y, array): Promise<void> {
    logger.set({
      type: "progress",
      mode: 0,
      classname: "profileload",
      message: `Profile load started...`,
    });

    return new Promise((resolve, reject) => {
      // Reorder array to send system element first
      const index = array.findIndex((obj) => obj.elementIndex === 255);

      // Check if the object with id === 255 was found
      if (index !== -1) {
        // Remove the object at the found index
        const objectToMove = array.splice(index, 1)[0];

        // Add the object to the front of the array
        array.unshift(objectToMove);
      }

      let ui = structuredClone(get(user_input));
      const promises = [];
      array.forEach((elem) => {
        elem.events.forEach((ev) => {
          ui.elementnumber = elem.controlElementNumber;
          ui.eventtype = ev.event;

          const page = ui.pagenumber;
          const element = ui.elementnumber;
          const event = ui.eventtype;

          let dest = this.findUpdateDestEvent(
            this.modules,
            x,
            y,
            page,
            element,
            event
          );
          if (dest) {
            dest.config = createActionsFromString(dest, ev.config);
          }

          const promise = instructions.sendConfigToGrid(
            x,
            y,
            page,
            element,
            event,
            ev.config
          );

          promises.push(promise);
        });
      });
      Promise.all(promises)
        .then((desc) => {
          logger.set({
            type: "success",
            mode: 0,
            classname: "profileload",
            message: `Profile load complete!`,
          });
          resolve();
        })
        .catch((e) => reject(e));
    });
  }

  update_event_configuration(
    dx: number,
    dy: number,
    page: number,
    element: number,
    event: number,
    actions: GridAction[]
  ) {
    // config

    let dest = this.findUpdateDestEvent(
      this.modules,
      dx,
      dy,
      page,
      element,
      event
    );
    if (dest) {
      actions.forEach((e) => (e.parent = dest));
      dest.config = actions;

      if (typeof dest.stored === "undefined") {
        dest.store(dest.config);
      }
    }
  }

  send_event_configuration_to_grid(
    dx,
    dy,
    page,
    element,
    event
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let dest = this.findUpdateDestEvent(
        this.modules,
        dx,
        dy,
        page,
        element,
        event
      );
      if (dest) {
        const script = `<?lua ${dest.config.map((e) => e.toLua()).join("")} ?>`;
        instructions
          .sendConfigToGrid(dx, dy, page, element, event, script)
          .then((desc) => {
            resolve();
          })
          .catch((e) => reject(e));
      } else {
        reject("DEST not found!");
      }
    });
  }

  // whole element copy: fetches all event configs from a control element
  fetch_element_configuration_from_grid(dx, dy, pageNumber, elementNumber) {
    const device = this.modules.find(
      (device) => device.dx == dx && device.dy == dy
    );
    const page = device.pages.find((x) => x.pageNumber == pageNumber);
    const element = page.control_elements.find(
      (x) => x.elementIndex == elementNumber
    );
    const events = element.events;

    const promises = events.map((e) => {
      const eventType = e.type;
      const dest = {
        dx: dx,
        dy: dy,
        page: pageNumber,
        element: elementNumber,
        event: eventType,
      };
      const promise = this.fetchOrLoadConfig(dest);
      return promise;
    });

    return Promise.all(promises);
  }

  fetch_page_configuration_from_grid({ dx, dy, page }) {
    logger.set({
      type: "progress",
      mode: 0,
      classname: "profilesave",
      message: `Preparing configs...`,
    });

    let device = this.modules.find(
      (device) => device.dx == dx && device.dy == dy
    );

    if (typeof device === "undefined") {
      logger.set({
        type: "fail",
        mode: 0,
        classname: "profilesave",
        message: `No module selected`,
      });

      return Promise.reject(`No module selected`);
    }

    const pageIndex = device.pages.findIndex((x) => x.pageNumber == page);
    const controlElements = device.pages[pageIndex].control_elements;

    const fetchArray = [];

    controlElements.forEach((controlElement) => {
      controlElement.events.forEach((e) => {
        if (typeof e.config === "undefined") {
          // put it into the fetchArray
          fetchArray.push({
            event: e.type,
            elementIndex: controlElement.elementIndex,
          });
        }
      });
    });

    // clear the writeBuffer to make sure that there are no fetch operations that may interfere with the callback
    // writeBuffer.clear();

    if (fetchArray.length === 0) {
      //nothing to do, let's do calback
      return Promise.resolve();
    }

    const promises = fetchArray.map((e) => {
      const promise = this.fetchOrLoadConfig({
        dx: dx,
        dy: dy,
        page: page,
        element: e.elementIndex,
        event: e.event,
      });
      return promise;
    });

    return Promise.all(promises);
  }

  clear_page_configuration(index) {
    this.modules.forEach((module) => {
      module.pages[index].control_elements.forEach((control_element) => {
        control_element.events.forEach((event) => {
          event.clear();
        });
      });
    });
  }

  create_module(header_param, heartbeat_class_param, virtual = false) {
    const moduleType = grid
      .module_type_from_hwcfg(Number(heartbeat_class_param.HWCFG))
      ?.substring(0, 4);

    // generic check, code below if works only if all parameters are provided
    if (
      header_param === undefined ||
      moduleType === undefined ||
      heartbeat_class_param === undefined
    ) {
      console.log(
        heartbeat_class_param.HWCFG,
        "ERROR",
        header_param,
        moduleType,
        heartbeat_class_param
      );
      throw "Error creating new module.";
    }

    return new GridModule(this, {
      // implement the module id rep / req
      architecture: virtual
        ? Architecture.VIRTUAL
        : grid.module_architecture_from_hwcfg(heartbeat_class_param.HWCFG),
      portstate: heartbeat_class_param.PORTSTATE,
      id: moduleType + "_" + "dx:" + header_param.SX + ";dy:" + header_param.SY,
      dx: header_param.SX,
      dy: header_param.SY,
      rot: header_param.ROT,
      fwVersion: {
        major: heartbeat_class_param.VMAJOR,
        minor: heartbeat_class_param.VMINOR,
        patch: heartbeat_class_param.VPATCH,
      },
      type: ModuleType[moduleType as keyof typeof ModuleType],
      fwMismatch: false,
      alive: Date.now(),
      map: {
        top: { dx: header_param.SX, dy: header_param.SY + 1 },
        right: { dx: header_param.SX + 1, dy: header_param.SY },
        bot: { dx: header_param.SX, dy: header_param.SY - 1 },
        left: { dx: header_param.SX - 1, dy: header_param.SY },
      },
    });
  }

  destroy_module(dx, dy) {
    console.log("DESTORY", dx, dy);
    // remove the destroyed device from runtime
    const removed = this.modules.find((e) => e.dx == dx && e.dy == dy);
    this.modules = this.modules.filter((e) => e.dx !== dx && e.dy !== dy);

    if (this.modules.length === 0) {
      appSettings.update((s) => {
        s.gridLayoutShift = { x: 0, y: 0 };
        return s;
      });
    }

    user_input.module_destroy_handler(dx, dy);
    if (removed.architecture === "virtual") {
      virtual_runtime.destroyModule(dx, dy);
    } else {
      writeBuffer.module_destroy_handler(dx, dy);
    }

    // reset rendering helper stores

    try {
      elementPositionStore.update((eps) => {
        eps[dx][dy] = undefined;
        return eps;
      });

      ledColorStore.update((lcs) => {
        lcs[dx][dy] = undefined;
        return lcs;
      });
    } catch (error) {}

    Analytics.track({
      event: "Disconnect Module",
      payload: {
        action: "Disconnect",
        moduleCount: this.modules.length,
      },
      mandatory: false,
    });
  }

  change_page(new_page_number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (get(writeBuffer).length > 0) {
        reject("Wait before all operations are finished.");
        return;
      }

      if (this.unsavedChangesCount() != 0) {
        reject("Store your changes before changin pages!");
        return;
      }

      let ui = get(user_input);

      // only update pagenumber if it differs from the runtime pagenumber
      if (ui.pagenumber === new_page_number) {
        resolve();
        return;
      }
      // clean up the writebuffer if pagenumber changes!
      // writeBuffer.clear();

      instructions
        .changeActivePage(new_page_number)
        .then(() => {
          const ui = get(user_input);
          user_input.set({
            dx: ui.dx,
            dy: ui.dy,
            pagenumber: new_page_number,
            elementnumber: ui.elementnumber,
            eventtype: ui.eventtype,
          });
          resolve();
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  unsavedChangesCount() {
    let count = 0;
    this.modules.forEach((e) => {
      e.pages.forEach((e) => {
        e.control_elements.forEach((e) => {
          e.events.forEach((e) => {
            if (e.hasChanges()) {
              count += 1;
            }
          });
        });
      });
    });
    return count;
  }

  async storePage(index) {
    return new Promise((resolve, reject) => {
      instructions
        .sendPageStoreToGrid()
        .then((res) => {
          this.modules.forEach((module) => {
            module.pages
              .find((e) => e.pageNumber == index)
              ?.control_elements.forEach((element) => {
                element.events.forEach((event) => {
                  if (event.stored !== event.config) {
                    event.store(event.config);
                  }
                });
              });
          });
          resolve(res);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  clearPage(index): Promise<void> {
    logger.set({
      type: "progress",
      mode: 0,
      classname: "pageclear",
      message: `Clearing configurations from page...`,
    });
    return new Promise((resolve, reject) => {
      instructions
        .sendPageClearToGrid()
        .then(() => {
          this.clear_page_configuration(index);
          resolve();
        })
        .catch((e) => {
          console.warn(e);
          reject(e);
        });
    });
  }

  discardPage(index): Promise<void> {
    logger.set({
      type: "progress",
      mode: 0,
      classname: "pagediscard",
      message: `Discarding configurations...`,
    });
    return new Promise((resolve, reject) => {
      instructions
        .sendPageDiscardToGrid()
        .then(() => {
          this.clear_page_configuration(index);
          resolve();
        })
        .catch((e) => {
          console.warn(e);
          reject(e);
        });
    });
  }

  addVirtualModule({ dx, dy, type }) {
    const moduleInfo = grid.module_hwcfgs().findLast((e) => e.type === type);
    const controller = this.create_module(
      {
        DX: dx,
        DY: dy,
        SX: dx,
        SY: dy,
      },
      {
        HWCFG: moduleInfo.hwcfg,
      },
      true
    );

    createVirtualModule(dx, dy, moduleInfo.type);

    this.modules = [...this.modules, controller];
    this.setDefaultSelectedElement();
  }
}

//TODO: helper function to refactor out
export function createActionsFromString(parent: GridEvent, script: string) {
  const result: GridAction[] = [];
  let configList: string[] = [];
  let actionString = script;
  // get rid of new line, enter
  actionString = actionString.replace(/[\n\r]+/g, "");
  // get rid of more than 2 spaces
  actionString = actionString.replace(/\s{2,10}/g, " ");
  // remove lua opening and closing characters
  // this function is used for both parsing full config (long complete lua) and individiual actions lua
  if (actionString.startsWith("<?lua")) {
    actionString = actionString.split("<?lua")[1].split("?>")[0];
  }
  // split by meta comments
  configList = actionString.split(/(--\[\[@\w+(?:#|\w|\s)*\]\])/);

  configList = configList.slice(1);
  for (var i = 0; i < configList.length; i += 2) {
    const split = configList[i]
      .match(/--\[\[@(.*)\]\]/)
      ?.at(1)
      .split(/#(.*)/);
    const obj = new GridAction(parent, {
      //Extract short + name, e.g.: '--[[@gms#name]]' => 'gms'
      short: split[0],
      script: configList[i + 1].trim(),
      name: split.length > 1 ? split[1] : undefined,
    });
    result.push(obj);
  }

  return result;
}
