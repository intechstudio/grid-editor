import {
  writable,
  get,
  Writable,
  Updater,
  Subscriber,
  Unsubscriber,
} from "svelte/store";

import {
  Architecture,
  ElementType,
  EventType,
  grid,
  ModuleType,
  EventTypeToNumber,
  NumberToEventType,
} from "@intechstudio/grid-protocol";
import { instructions } from "../serialport/instructions";
import { writeBuffer, sendHeartbeat } from "./engine.store";
import { createVirtualModule } from "./virtual-engine";
import { VirtualModuleHWCFG } from "./virtual-engine";
import { virtual_runtime } from "./virtual-engine";

import { Analytics } from "./analytics.js";

import { appSettings } from "./app-helper.store";

import { add_datapoint } from "../serialport/message-stream.store.js";
import { modal } from "../main/modals/modal.store";
import { ProtectedStore } from "./smart-store.store";
import { elementNameStore } from "./element-name.store";
import { v4 as uuidv4 } from "uuid";

export type FirmwareVersion = {
  major: number;
  minor: number;
  patch: number;
};

export type ModulePosition = {
  dx: number;
  dy: number;
};

export type ModuleMap = {
  top: ModulePosition;
  bot: ModulePosition;
  left: ModulePosition;
  right: ModulePosition;
};

export type ConfigurationList = string;

export class Configuration {
  private short: string;
  private script: string;

  constructor(short: string, script: string) {
    this.short = short;
    this.script = script;
  }

  public getShort(): string {
    return this.short;
  }

  public getScript(): string {
    return this.script;
  }
}

export class ElementEvent {
  private type: number;
  private configs: ConfigurationList;
  private stored: ConfigurationList;

  constructor(type: number) {
    this.type = type;
    this.configs = undefined;
    this.stored = undefined;
  }

  public getType(): number {
    return this.type;
  }

  public getConfigs(): ConfigurationList {
    return this.configs;
  }

  public setStored(configs: ConfigurationList) {
    this.stored = configs;
  }
  public getStored(): ConfigurationList {
    return this.stored;
  }
}

export class ControlElement {
  private elementIndex: number;
  private events: ElementEvent[] = [];
  private name: string;
  private type: number;

  constructor(index: number, type: number) {
    this.elementIndex = index;
    this.name = "";
    this.type = type;

    for (const obj of grid.get_element_events(type)) {
      const event = new ElementEvent(obj.value);
      this.events.push(event);
    }
  }

  public getEvent(type: number) {
    return this.events.find((e) => e.getType() === type);
  }

  public getElementIndex(): number {
    return this.elementIndex;
  }

  public getEvents(): ElementEvent[] {
    return this.events;
  }

  public getName(): string {
    return this.name;
  }

  public getType(): ElementType {
    return this.type;
  }
}

export class Page {
  private parent?: Module = undefined;
  private pageNumber: number;
  private control_elements: ControlElement[];

  constructor(index: number, elements: ControlElement[]) {
    this.pageNumber = index;
    this.control_elements = elements;
  }

  getElement(index: number) {
    return this.control_elements.find((e) => e.getElementIndex() === index);
  }

  public getPageNumber(): number {
    return this.pageNumber;
  }

  public getControlElements(): ControlElement[] {
    return this.control_elements;
  }
}

export class Module {
  private architecture: Architecture;
  private portstate: number;
  private id: string;
  private dx: number;
  private dy: number;
  private rot: number;
  private fwVersion: FirmwareVersion;
  private fwMismatch: boolean;
  private alive: number;
  private map: ModuleMap;
  private pages: Page[] = [];
  private type: ModuleType;

  constructor(
    architecture: Architecture,
    type: ModuleType,
    portstate: number,
    dx: number,
    dy: number,
    rot: number,
    fwVersion: FirmwareVersion,
    fwMismatch: boolean,
    alive: number,
    map: ModuleMap
  ) {
    this.architecture = architecture;
    this.portstate = portstate;
    this.id = uuidv4();
    this.dx = dx;
    this.dy = dy;
    this.rot = rot;
    this.fwVersion = fwVersion;
    this.fwMismatch = fwMismatch;
    this.alive = alive;
    this.map = map;
    this.type = type;

    for (const n of [0, 1, 2, 3]) {
      let elements = [];

      const elementTypes = grid.get_module_element_list(type);

      for (const [index, type] of Object.entries(elementTypes)) {
        if (typeof type === "undefined") {
          continue;
        }
        const element = new ControlElement(Number(index), type);
        elements.push(element);
      }

      const page = new Page(n, elements);
      this.pages.push(page);
    }
  }

  public getPage(index: number) {
    return this.pages.find((e) => e.getPageNumber() === index);
  }

  public getArchitecture(): Architecture {
    return this.architecture;
  }

  public setPortstate(portstate: number) {
    this.portstate = portstate;
  }

  public getPortstate(): number {
    return this.portstate;
  }

  public getId(): string {
    return this.id;
  }

  public getDx(): number {
    return this.dx;
  }

  public getDy(): number {
    return this.dy;
  }

  public setRot(rot: number) {
    this.rot = rot;
  }

  public getRot(): number {
    return this.rot;
  }

  public getFwVersion(): FirmwareVersion {
    return this.fwVersion;
  }

  public setFwMismatch(value: boolean) {
    this.fwMismatch = value;
  }

  public isFwMismatch(): boolean {
    return this.fwMismatch;
  }

  public getAlive(): number {
    return this.alive;
  }

  public getMap(): ModuleMap {
    return this.map;
  }

  public getPages(): Page[] {
    return this.pages;
  }

  public getType(): ModuleType {
    return this.type;
  }
}

export type UUID = string;

class Runtime implements Writable<Module[]> {
  private internal: Writable<Module[]>;

  constructor(initialValue: Module[]) {
    this.internal = writable(initialValue);
  }

  // Subscribe method
  subscribe(
    run: Subscriber<Module[]>,
    invalidate?: (value?: Module[]) => void
  ): Unsubscriber {
    return this.internal.subscribe(run, invalidate);
  }

  // Set method
  set(value: Module[]) {
    this.internal.set(value);
  }

  // Update method
  update(updater: Updater<Module[]>) {
    this.internal.update(updater);
  }

  public getModule(dx: number, dy: number) {
    return get(this.internal).find((e) => e.getDx() === dx && e.getDy() === dy);
  }

  public findUpdateDestEvent(dx, dy, page, element, event) {
    // this elementnumber check refers to uninitialized UI...
    if (element === -1) {
      return undefined;
    }

    return this.getModule(dx, dy)
      ?.getPage(page)
      ?.getElement(element)
      ?.getEvent(event);
  }

  public fetchOrLoadConfig({ dx, dy, page, element, event }) {
    return new Promise<string>((resolve, reject) => {
      const _event = this.getModule(dx, dy)
        ?.getPage(page)
        ?.getElement(element)
        ?.getEvent(event);

      if (typeof _event.getConfigs() !== "undefined") {
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
            const actionstring = descr.class_parameters.ACTIONSTRING;

            this.update_event_configuration(
              dx,
              dy,
              page,
              element,
              event,
              actionstring
            );

            resolve(actionstring);
          })
          .catch((e) => reject(e));
      }
    });
  }

  public isFirmwareMismatch(currentFirmware, requiredFirmware) {
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

  public incoming_heartbeat_handler(descr) {
    const rt = get(this.internal);
    try {
      for (const device of rt) {
        if (device.getArchitecture() === Architecture.VIRTUAL) {
          const [dx, dy] = [device.getDx(), device.getDy()];
          this.destroy_module(dx, dy);
        }
      }
      const controller = this.create_module(
        descr.brc_parameters,
        descr.class_parameters,
        false
      );

      let firstConnection = false;
      const device = rt.find((device) => device.getId() == controller.getId());
      if (device) {
        if (device.getRot() != controller.getRot()) {
          this.update((store) => {
            const index = store.findIndex(
              (device) => device.getId() == controller.getId()
            );
            store[index].setRot(controller.getRot());
            return store;
          });
        }

        if (device.getPortstate() != controller.getPortstate()) {
          this.update((store) => {
            const index = store.findIndex(
              (device) => device.getId() == controller.getId()
            );
            store[index].setPortstate(controller.getPortstate());
            return store;
          });
        }

        const lastDate = get(heartbeat).find(
          (device) => device.id == controller.getId()
        )?.alive;
        if (lastDate) {
          let newDate = Date.now();

          heartbeat.update((store) => {
            const device = store.find(
              (device) => device.id == controller.getId()
            );
            if (device) {
              device.alive = newDate;
            }
            return store;
          });

          //console.log(newDate - lastDate)
          if (get(appSettings).persistent.heartbeatDebugEnabled) {
            const key1 = `Hearbeat (${controller.getDx()}, ${controller.getDy()})`;

            add_datapoint(key1, newDate - lastDate);
          }
        }
      }
      // device not found, add it to runtime and get page count from grid
      else {
        // check if the firmware version of the newly connected device is acceptable
        console.log("Incoming Device");
        console.log("Architecture", controller.getArchitecture());

        const as = get(appSettings);
        const firmware_required =
          controller.getArchitecture() === "esp32"
            ? as.firmware_esp32_required
            : as.firmware_d51_required;
        controller.setFwMismatch(
          this.isFirmwareMismatch(controller.getFwVersion(), firmware_required)
        );

        console.log(
          "Mismatch: ",
          controller.isFwMismatch(),
          "Firmware Version: ",
          controller.getFwVersion()
        );

        this.update((store) => {
          store.push(controller);
          return store;
        });
        heartbeat.update((devices) => {
          return [...devices, { id: controller.getId(), alive: Date.now() }];
        });

        firstConnection = get(this.internal).length === 1;

        Analytics.track({
          event: "Connect Module",
          payload: {
            action: "Connect",
            controller: controller,
            moduleCount: get(runtime).length,
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

  public setDefaultSelectedElement() {
    const first = this.getModule(0, 0);
    const [dx, dy] = [first.getDx(), first.getDy()];
    user_input.set({
      dx: dx,
      dy: dy,
      pagenumber: 0,
      elementnumber: 0,
      eventtype: 2,
    });
  }

  public element_preset_load(x, y, element, preset) {
    return new Promise<void>((resolve, reject) => {
      const ui = get(user_input);
      let events = preset.configs.events;
      const promises = [];
      events.forEach((e) => {
        const page = ui.pagenumber;
        const event = e.event;

        this.update((store) => {
          let dest = this.findUpdateDestEvent(x, y, page, element, event);
          if (typeof dest !== "undefined") {
            dest.config = e.config;
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
          return store;
        });
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

  public whole_page_overwrite(x, y, array) {
    logger.set({
      type: "progress",
      mode: 0,
      classname: "profileload",
      message: `Profile load started...`,
    });

    return new Promise<void>((resolve, reject) => {
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

          this.update((_runtime) => {
            let dest = this.findUpdateDestEvent(x, y, page, element, event);
            if (dest) {
              dest.config = ev.config.trim();
            }
            return _runtime;
          });

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

  public update_event_configuration(
    dx,
    dy,
    page,
    element,
    event,
    actionString
  ) {
    // config
    this.update((_runtime) => {
      let dest = this.findUpdateDestEvent(dx, dy, page, element, event);
      if (dest) {
        dest.config = actionString;
        if (typeof dest.stored === "undefined") {
          dest.stored = actionString;
        }
      }
      return _runtime;
    });
  }

  public send_event_configuration_to_grid(dx, dy, page, element, event) {
    return new Promise<void>((resolve, reject) => {
      let dest = this.findUpdateDestEvent(dx, dy, page, element, event);
      if (dest) {
        instructions
          .sendConfigToGrid(dx, dy, page, element, event, dest.config)
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
  public fetch_element_configuration_from_grid(
    dx,
    dy,
    pageNumber,
    elementNumber
  ) {
    const events = this.getModule(dx, dy)
      ?.getPage(pageNumber)
      ?.getElement(elementNumber)
      ?.getEvents();

    const promises = events.map((e) => {
      const dest = {
        dx: dx,
        dy: dy,
        page: pageNumber,
        element: elementNumber,
        event: e.getType(),
      };
      const promise = this.fetchOrLoadConfig(dest);
      return promise;
    });

    return Promise.all(promises);
  }

  public fetch_page_configuration_from_grid({ dx, dy, page }) {
    logger.set({
      type: "progress",
      mode: 0,
      classname: "profilesave",
      message: `Preparing configs...`,
    });

    let device = this.getModule(dx, dy);

    if (typeof device === "undefined") {
      logger.set({
        type: "fail",
        mode: 0,
        classname: "profilesave",
        message: `No module selected`,
      });

      return Promise.reject(`No module selected`);
    }

    const elements = device.getPage(page).getControlElements();

    const fetchArray = [];

    elements.forEach((element) => {
      element.getEvents().forEach((e) => {
        if (typeof e.getConfigs() === "undefined") {
          // put it into the fetchArray
          fetchArray.push({
            event: e.getType(),
            elementIndex: element.getElementIndex(),
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

  public clear_page_configuration(index) {
    this.update((store) => {
      store.forEach((device) => {
        device
          .getPage(index)
          .getControlElements()
          .forEach((e) => {
            e.getEvents().map((e) => {
              const type = e.getType();
              return new ElementEvent(type);
            });
          });
      });
      return store;
    });
  }

  public create_module(
    header_param,
    heartbeat_class_param,
    virtual = false
  ): Module {
    const type = grid.module_type_from_hwcfg(
      Number(heartbeat_class_param.HWCFG)
    );

    // generic check, code below if works only if all parameters are provided
    if (
      header_param === undefined ||
      type === undefined ||
      heartbeat_class_param === undefined
    ) {
      console.log(
        heartbeat_class_param.HWCFG,
        "ERROR",
        header_param,
        type,
        heartbeat_class_param
      );
      throw "Error creating new module.";
    }

    return new Module(
      virtual
        ? Architecture.VIRTUAL
        : grid.module_architecture_from_hwcfg(heartbeat_class_param.HWCFG),
      type,
      Number(heartbeat_class_param.PORTSTATE),
      Number(header_param.SX),
      Number(header_param.SY),
      Number(header_param.ROT),
      {
        major: Number(heartbeat_class_param.VMAJOR),
        minor: Number(heartbeat_class_param.VMINOR),
        patch: Number(heartbeat_class_param.VPATCH),
      },
      false,
      Date.now(),
      {
        top: { dx: Number(header_param.SX), dy: Number(header_param.SY + 1) },
        right: { dx: Number(header_param.SX + 1), dy: Number(header_param.SY) },
        bot: { dx: Number(header_param.SX), dy: Number(header_param.SY - 1) },
        left: { dx: Number(header_param.SX - 1), dy: Number(header_param.SY) },
      }
    );
  }

  public destroy_module(dx, dy) {
    // remove the destroyed device from runtime
    const removed = this.getModule(dx, dy);

    this.update((store) => {
      const index = store.findIndex((e) => e.getId() === removed.getId());
      store.splice(index, 1);
      return store;
    });

    if (get(this.internal).length === 0) {
      appSettings.update((s) => {
        s.gridLayoutShift = { x: 0, y: 0 };
        return s;
      });
    }

    user_input.module_destroy_handler(dx, dy);
    if (removed.getArchitecture() === Architecture.VIRTUAL) {
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

      elementNameStore.update((ens) => {
        ens[dx][dy] = undefined;
        return ens;
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
        moduleCount: get(runtime).length,
      },
      mandatory: false,
    });
  }

  public change_page(new_page_number) {
    return new Promise<void>((resolve, reject) => {
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

  public unsavedChangesCount() {
    let count = 0;
    get(this.internal).forEach((e) => {
      e.getPages().forEach((e) => {
        e.getControlElements().forEach((e) => {
          e.getEvents().forEach((e) => {
            const stored = e.getStored();
            const configs = e.getConfigs();
            if (typeof stored !== "undefined" && stored !== configs) {
              count += 1;
            }
          });
        });
      });
    });
    return count;
  }

  public async storePage(index) {
    return new Promise((resolve, reject) => {
      instructions
        .sendPageStoreToGrid()
        .then((res) => {
          this.update((store) => {
            store.forEach((device) => {
              device
                .getPage(index)
                ?.getControlElements()
                .forEach((e) => {
                  e.getEvents().forEach((e) => {
                    const stored = e.getStored();
                    const configs = e.getConfigs();
                    if (stored !== configs) {
                      e.setStored(configs);
                    }
                  });
                });
            });
            return store;
          });
          resolve(res);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  public clearPage(index) {
    logger.set({
      type: "progress",
      mode: 0,
      classname: "pageclear",
      message: `Clearing configurations from page...`,
    });
    return new Promise<void>((resolve, reject) => {
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

  public discardPage(index) {
    logger.set({
      type: "progress",
      mode: 0,
      classname: "pagediscard",
      message: `Discarding configurations...`,
    });
    return new Promise<void>((resolve, reject) => {
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

  public addVirtualModule({ dx, dy, type }) {
    const module = VirtualModuleHWCFG[type];
    const controller = this.create_module(
      {
        DX: dx,
        DY: dy,
        SX: dx,
        SY: dy,
      },
      {
        HWCFG: module.hwcfg,
      },
      true
    );

    createVirtualModule(dx, dy, module.type);

    this.update((store) => {
      store.push(controller);
      return store;
    });
    this.setDefaultSelectedElement();
  }
}

const setIntervalAsync = (fn, ms) => {
  fn().then(() => {
    setTimeout(() => setIntervalAsync(fn, ms), ms);
  });
};

// The controller which is added to runtime first, load a default config!

let selection_changed_timestamp = 0;

export const elementPositionStore = writable({});
export const ledColorStore = writable({});

export function update_elementPositionStore(descr) {
  if (descr.class_parameters.EVENTTYPE == 3) {
    // button change must not be registered

    return;
  }

  let eps = get(elementPositionStore);

  if (eps[descr.brc_parameters.SX] === undefined) {
    eps[descr.brc_parameters.SX] = {};
  }
  if (eps[descr.brc_parameters.SX][descr.brc_parameters.SY] === undefined) {
    eps[descr.brc_parameters.SX][descr.brc_parameters.SY] = {};
  }
  if (
    eps[descr.brc_parameters.SX][descr.brc_parameters.SY][
      descr.class_parameters.ELEMENTNUMBER
    ] === undefined
  ) {
    eps[descr.brc_parameters.SX][descr.brc_parameters.SY][
      descr.class_parameters.ELEMENTNUMBER
    ] = -1;
  }

  eps[descr.brc_parameters.SX][descr.brc_parameters.SY][
    descr.class_parameters.ELEMENTNUMBER
  ] = [descr.class_parameters.EVENTPARAM1, descr.class_parameters.EVENTPARAM2];

  //console.log("Pos", descr.class_parameters.EVENTPARAM)

  elementPositionStore.set(eps);
}

export function update_elementPositionStore_fromPreview(descr) {
  let eps = get(elementPositionStore);

  if (eps[descr.brc_parameters.SX] === undefined) {
    eps[descr.brc_parameters.SX] = {};
  }
  if (eps[descr.brc_parameters.SX][descr.brc_parameters.SY] === undefined) {
    eps[descr.brc_parameters.SX][descr.brc_parameters.SY] = {};
  }

  for (let i = 1; i < descr.class_parameters.LENGTH / 4; i++) {
    const num = parseInt(
      "0x" +
        String.fromCharCode(descr.raw[4 + i * 4 + 0]) +
        String.fromCharCode(descr.raw[4 + i * 4 + 1])
    );
    const val = parseInt(
      "0x" +
        String.fromCharCode(descr.raw[4 + i * 4 + 2]) +
        String.fromCharCode(descr.raw[4 + i * 4 + 3])
    );
    //console.log(num, val)

    if (
      eps[descr.brc_parameters.SX][descr.brc_parameters.SY][num] === undefined
    ) {
      eps[descr.brc_parameters.SX][descr.brc_parameters.SY][num] = -1;
    }

    eps[descr.brc_parameters.SX][descr.brc_parameters.SY][num] = val;

    elementPositionStore.set(eps);
  }
}

export function update_ledColorStore(descr) {
  for (let i = 0; i < descr.class_parameters.LENGTH / 8; i++) {
    const num = parseInt(
      "0x" +
        String.fromCharCode(descr.raw[8 + i * 8 + 0]) +
        String.fromCharCode(descr.raw[8 + i * 8 + 1])
    );
    const red = parseInt(
      "0x" +
        String.fromCharCode(descr.raw[8 + i * 8 + 2]) +
        String.fromCharCode(descr.raw[8 + i * 8 + 3])
    );
    const gre = parseInt(
      "0x" +
        String.fromCharCode(descr.raw[8 + i * 8 + 4]) +
        String.fromCharCode(descr.raw[8 + i * 8 + 5])
    );
    const blu = parseInt(
      "0x" +
        String.fromCharCode(descr.raw[8 + i * 8 + 6]) +
        String.fromCharCode(descr.raw[8 + i * 8 + 7])
    );

    //console.log(num, red, gre, blu)

    let lcs = get(ledColorStore);

    if (lcs[descr.brc_parameters.SX] === undefined) {
      lcs[descr.brc_parameters.SX] = {};
    }
    if (lcs[descr.brc_parameters.SX][descr.brc_parameters.SY] === undefined) {
      lcs[descr.brc_parameters.SX][descr.brc_parameters.SY] = {};
    }
    if (
      lcs[descr.brc_parameters.SX][descr.brc_parameters.SY][num] === undefined
    ) {
      lcs[descr.brc_parameters.SX][descr.brc_parameters.SY][num] = [0, 0, 0];
    }

    lcs[descr.brc_parameters.SX][descr.brc_parameters.SY][num][0] = red * 4;
    lcs[descr.brc_parameters.SX][descr.brc_parameters.SY][num][1] = gre * 4;
    lcs[descr.brc_parameters.SX][descr.brc_parameters.SY][num][2] = blu * 4;

    ledColorStore.set(lcs);
  }
}

//Template logger object: { type: "", message: "", classname: "" }
export const logger = writable();

interface UserInput {
  dx: number;
  dy: number;
  pagenumber: number;
  elementnumber: number;
  eventtype: number;
}

function create_user_input() {
  const defaultValues: UserInput = {
    dx: undefined,
    dy: undefined,
    pagenumber: undefined,
    elementnumber: undefined,
    eventtype: undefined,
  };

  const store = new ProtectedStore<UserInput>(defaultValues);

  function setOverride({ dx, dy, pagenumber, elementnumber, eventtype }) {
    for (const [key, value] of Object.entries({
      dx,
      dy,
      pagenumber,
      elementnumber,
      eventtype,
    })) {
      if (typeof value === "undefined") {
        store.set({
          ...defaultValues,
        });
        return;
      }
    }

    const events = runtime
      .getModule(dx, dy)
      .getPage(pagenumber)
      .getElement(elementnumber)
      .getEvents()
      .map((e) => e.getType());
    const closestEvent = get_closest_event(events, eventtype);

    store.set({
      dx: dx,
      dy: dy,
      pagenumber: pagenumber,
      elementnumber: elementnumber,
      eventtype: closestEvent,
    });
  }

  function get_closest_event(events, event) {
    if (events.map((e) => Number(e)).includes(Number(event))) {
      return event;
    }

    //Select closest event type if incoming device does not have the corrently selected event type
    const closestEvent = Math.min(
      ...events.map((e) => Number(e)).filter((e) => e > 0)
    );
    return closestEvent;
  }

  function process_incoming_event_from_grid(descr) {
    // engine is disabled
    if (get(writeBuffer).length > 0) {
      return;
    }

    // modal block track physical interaction setting
    if (typeof get(modal) !== "undefined") {
      return;
    }

    // event is init, mapmode, midirx, timer
    if (
      descr.class_parameters.EVENTTYPE == 0 ||
      descr.class_parameters.EVENTTYPE == 4 ||
      descr.class_parameters.EVENTTYPE == 5 ||
      descr.class_parameters.EVENTTYPE == 6
    ) {
      return;
    }

    // system element
    if (descr.class_parameters.ELEMENTNUMBER == 255) {
      return;
    }

    const ui = get(store);

    // filter same control element had multiple interactions
    let elementDifferent =
      ui.elementnumber != descr.class_parameters.ELEMENTNUMBER;
    let eventDifferent = ui.eventtype != descr.class_parameters.EVENTTYPE;
    let sxDifferent = ui.dx != descr.brc_parameters.SX;
    let syDifferent = ui.dy != descr.brc_parameters.SY;

    if (eventDifferent || elementDifferent || sxDifferent || syDifferent) {
      //Filtering out clashing events of control elements
      //Example: multiple fader movenet at the same time
      if (Date.now() < selection_changed_timestamp + 100) {
        return;
      }

      let eventtype;
      switch (get(appSettings).persistent.changeOnEvent) {
        case "element": {
          const [dx, dy, element] = [
            descr.brc_parameters.SX,
            descr.brc_parameters.SY,
            descr.class_parameters.ELEMENTNUMBER,
          ];
          const incomingEventTypes = runtime
            .getModule(dx, dy)
            .getPage(ui.pagenumber)
            .getElement(element)
            .getEvents()
            .map((e) => e.getType());
          const current = ui.eventtype;
          eventtype = get_closest_event(incomingEventTypes, current);
          if (!elementDifferent) {
            return;
          }
          break;
        }
        case "none": {
          return;
        }
        case "event":
        default: {
          eventtype = descr.class_parameters.EVENTTYPE;
        }
      }
      store.set({
        dx: descr.brc_parameters.SX,
        dy: descr.brc_parameters.SY,
        pagenumber: ui.pagenumber,
        elementnumber: descr.class_parameters.ELEMENTNUMBER,
        eventtype: eventtype,
      });
    }
    selection_changed_timestamp = Date.now();
  }

  function module_destroy_handler(dx, dy) {
    // This is used to re-init local settings panel if a module is removed which values have been displayed
    const ui = get(store);
    const rt = get(runtime);

    if (dx == ui.dx && dy == ui.dy) {
      if (get(runtime).length > 0) {
        //Set user input to an EXISTING module
        //(0,0) module is not guaranteed to exist when unplugging all modules once
        //NOTE: Hardcoding (0,0) may break user_input
        setOverride({
          dx: rt[0].getDx(),
          dy: rt[0].getDy(),
          pagenumber: ui.pagenumber,
          elementnumber: 0,
          eventtype: ui.eventtype,
        });
      } else {
        setOverride({
          ...defaultValues,
        });
      }
    }
  }

  return {
    ...store,
    set: setOverride,
    process_incoming_event_from_grid: process_incoming_event_from_grid,
    module_destroy_handler: module_destroy_handler,
  };
}

export const user_input = create_user_input();

export const runtime = new Runtime([]);

//Retrieves device name from coordinates of the device
export function getDeviceName(dx, dy) {
  const device = runtime.getModule(dx, dy);
  return String(device.getType()).toUpperCase();
}

function createEngine() {
  const _engine = writable("ENABLED");

  return {
    ..._engine,
  };
}

export const engine = createEngine();

export const heartbeat = writable([]);

const heartbeat_editor_ms = 300;
const heartbeat_grid_ms = 250;

const grid_heartbeat_interval_handler = async function () {
  let rt = get(runtime);

  rt.forEach((device, i) => {
    if (device.getArchitecture() === Architecture.VIRTUAL) {
      return;
    }

    const alive = get(heartbeat).find((e) => e.id == device.getId())?.alive;

    // Allow less strict elapsedTimeLimit while writeBuffer is busy!
    const elapsedTimeLimit =
      get(writeBuffer).length > 0
        ? heartbeat_grid_ms * 6
        : heartbeat_grid_ms * 3;
    const elapsedTime = Date.now() - alive;

    if (!alive || elapsedTime > elapsedTimeLimit) {
      // TIMEOUT! let's remove the device
      const [dx, dy] = [device.getDx(), device.getDy()];
      runtime.destroy_module(dx, dy);
      heartbeat.update((heartbeat) => {
        return heartbeat.filter((e) => e.id !== device.getId());
      });
    }
  });
};

setIntervalAsync(grid_heartbeat_interval_handler, heartbeat_grid_ms);

const editor_heartbeat_interval_handler = async function () {
  let type = 255;

  if (runtime.unsavedChangesCount() != 0 || typeof get(modal) !== "undefined") {
    type = 254;
  }

  if (
    get(runtime).length > 0 &&
    get(runtime).filter((e) => e.getArchitecture() === Architecture.VIRTUAL)
      .length === 0
  ) {
    sendHeartbeat(type);
  } else {
    //writeBuffer.clear();
  }
};

setIntervalAsync(editor_heartbeat_interval_handler, heartbeat_editor_ms);

export class LocalDefinitions {
  static getFrom({ configs, index }) {
    const config = configs[index];
    let n = index - 1;
    let list = [];
    let indentation = config.indentation;
    while (n >= 0) {
      if (configs[n].indentation <= indentation) {
        list.push(configs[n]);
        if (configs[n].indentation != indentation) {
          indentation = configs[n].indentation;
        }
      }
      --n;
    }

    let arr = [];
    list.forEach((c) => {
      if (c.short == "l" && c.script !== "") {
        let _variable_array = c.script.split("=")[0];
        _variable_array = _variable_array.split("local")[1];
        _variable_array = _variable_array.split(",");
        _variable_array.forEach((val, i) => {
          arr.push({ info: `local - ${val.trim()}`, value: val.trim() });
        });
      }
    });
    return arr;
  }
}

export async function wss_send_message(message) {
  window.electron.websocket.transmit({ event: "message", data: message });
}

console.log("reached end of runtime");
