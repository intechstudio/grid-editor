import {
  writable,
  get,
  type Writable,
  type Subscriber,
  type Unsubscriber,
  type Updater,
  type Readable,
} from "svelte/store";
import { GridRuntime } from "./runtime";
import { GridInstruction } from "../serialport/instructions";
// Side-effect import to force serialport module to load and set up navigator.tryConnectGrid
import "../serialport/serialport.js";
import { type GridConnection } from "../serialport/serialport";
import { WriteBuffer } from "./engine.store";
import { VirtualTransport } from "../serialport/virtual-transport.js";
import { Architecture, GridScript } from "@intechstudio/grid-protocol";
import { logger } from "./runtime.store";
import {
  clearIntervalAsync,
  setIntervalAsync,
  type SetIntervalAsyncTimer,
} from "set-interval-async";
import { modalManager } from "../main/modals/modal.store";
import { Grid } from "../lib/_utils";
import { GridService } from "./services";

type ManagedConnection = {
  runtime: GridRuntime;
  grid_heartbeat: SetIntervalAsyncTimer<[]>;
  editor_heartbeat: SetIntervalAsyncTimer<[]>;
};

export type GridRuntimeManagerData = {
  data: ManagedConnection[];
  active: ManagedConnection;
};

export class GridRuntimeManager implements Readable<GridRuntimeManagerData> {
  private _internal: Writable<GridRuntimeManagerData>;

  public static readonly heartbeat_editor_ms = 300;
  public static readonly heartbeat_grid_ms = 250;

  constructor() {
    this._internal = writable({ data: [], active: undefined });
    const virtual = this.createVirtual();
    this.add(virtual);
    this.setActive(virtual.id);
  }

  get data(): ManagedConnection[] {
    return get(this._internal).data;
  }

  get active(): ManagedConnection {
    return get(this._internal).active;
  }

  set active(value: ManagedConnection) {
    this.update((store) => {
      store.active = value;
      return store;
    });
  }

  public subscribe(
    run: Subscriber<GridRuntimeManagerData>,
    invalidate?: (value?: GridRuntimeManagerData) => void,
  ): Unsubscriber {
    return this._internal.subscribe(run, invalidate);
  }

  private set(value: GridRuntimeManagerData) {
    this._internal.set(value);
  }

  private update(updater: Updater<GridRuntimeManagerData>) {
    this._internal.update(updater);
  }

  public add(runtime: GridRuntime) {
    const incoming: ManagedConnection = {
      runtime: runtime,
      grid_heartbeat: undefined,
      editor_heartbeat: undefined,
    };

    this.update((store) => {
      store.data.push(incoming);
      return store;
    });

    this.startHeartbeat(incoming);
  }

  public setActive(id: string) {
    const connection = get(this._internal).data.find(
      (e) => e.runtime.id === id,
    );
    if (typeof connection === "undefined") {
      throw `Destroy failed: runtime with id of ${id} was not found`;
    }

    this.update((store) => {
      store.active = connection;
      return store;
    });
  }

  public destroy(runtime: GridRuntime) {
    const destroyed = get(this._internal).data.find(
      (e) => e.runtime.id === runtime.id,
    );

    if (!destroyed) {
      throw new Error("Destroyed module is not found...");
    }

    this.killHeartbeat(destroyed);

    this.update((store) => {
      const index = store.data.findIndex((e) => e.runtime.id === runtime.id);

      if (this.active.runtime.id === runtime.id) {
        if (this.data.length === 1) {
          const virtual = this.createVirtual();
          this.add(virtual);
        }
        const next = Grid.findNearestNeighbour(store.data, index);
        store.active = next;
      }

      store.data.splice(index, 1);

      return store;
    });
  }

  public createVirtual(): GridRuntime {
    const transport = new VirtualTransport();
    const buffer = new WriteBuffer(transport);
    const virtual_connection: GridConnection = {
      id: undefined,
      buffer: buffer,
      transport: transport,
      virtual: true,
    };

    const virtual = new GridRuntime(virtual_connection, true);
    const eventFetcher = new GridService.AutoEventFetcher(virtual);
    eventFetcher.start();

    return virtual;
  }

  public NVMErase() {
    logger.set({
      type: "progress",
      mode: 0,
      classname: "nvmerase",
      message: `Erasing all modules...`,
    });
    const promises: Promise<any>[] = [];
    for (const target of get(this._internal).data) {
      const instruction = new GridInstruction.NVMErase(target.runtime.virtual);
      promises.push(instruction.executeOn(target.runtime.connection));
    }
    Promise.all(promises)
      .then((res) => {
        //TODO
        logger.set({
          type: "success",
          mode: 0,
          classname: "nvmerase",
          message: `Erase complete!`,
        });
      })
      .catch((e) => {
        if (typeof e !== "undefined") {
          logger.set(e);
        } else {
          logger.set({
            type: "alert",
            mode: 0,
            classname: "nvmerase",
            message: `Retry erase all modules...`,
          });
        }
      });
  }

  public LUAExecImmediate(dx: number, dy: number, script: string) {
    const target = get(this._internal).active;
    if (!target) {
      //ERROR HANDLING
      return;
    }

    const instruction = new GridInstruction.SendConfigImmediate(
      dx,
      dy,
      GridScript.compressScript(script),
      target.runtime.virtual,
    );
    instruction.executeOn(target.runtime.connection).catch((e) => {
      console.warn(e);
    });
  }

  private startHeartbeat(connection: ManagedConnection) {
    connection.editor_heartbeat = setIntervalAsync(
      () =>
        GridRuntimeManager.editor_heartbeat_interval_handler(
          connection.runtime,
        ),
      GridRuntimeManager.heartbeat_editor_ms,
    );
    connection.grid_heartbeat = setIntervalAsync(
      () =>
        GridRuntimeManager.grid_heartbeat_interval_handler(connection.runtime),
      GridRuntimeManager.heartbeat_grid_ms,
    );
  }

  public killHeartbeat(connection: ManagedConnection) {
    clearIntervalAsync(connection.grid_heartbeat);
    clearIntervalAsync(connection.editor_heartbeat);
  }

  private static async editor_heartbeat_interval_handler(runtime: GridRuntime) {
    let type = 255;

    if (
      runtime.unsavedChangesCount() != 0 ||
      get(modalManager).windows.length > 0
    ) {
      // THIS IS NEEDED!
      // This determines if the Grid FW should prevent page change when unsaved
      // changes are present
      type = 254;
    }

    if (
      runtime.modules.length > 0 &&
      runtime.modules.filter((e) => e.architecture === Architecture.VIRTUAL)
        .length === 0
    ) {
      const instruction = new GridInstruction.SendHeartbeatImmediate(
        type,
        runtime.virtual,
      );

      instruction.executeOn(runtime.connection).catch((e) => {
        console.warn("EDITOR: Heartbeat skipped...", e);
      });
    } else {
      //writeBuffer.clear();
    }
  }

  private static async grid_heartbeat_interval_handler(runtime: GridRuntime) {
    for (const device of runtime.modules) {
      if (device.architecture === Architecture.VIRTUAL) {
        return;
      }

      if (!runtime.isAlive(device)) {
        // TIMEOUT! let's remove the device
        console.log(
          "Heartbeat lost. DESTROY:",
          device.dx,
          device.dy,
          device.type,
        );
        runtime.destroy_module(device.dx, device.dy);
      }
    }
  }
}

// Lazy singleton to avoid circular dependency issues at module load time
let _runtime_manager: GridRuntimeManager | undefined;
export function getRuntimeManager(): GridRuntimeManager {
  if (!_runtime_manager) {
    _runtime_manager = new GridRuntimeManager();
  }
  return _runtime_manager;
}

// For backward compatibility - access triggers lazy init
export const runtime_manager = new Proxy({} as GridRuntimeManager, {
  get(_target, prop) {
    const instance = getRuntimeManager();
    const value = (instance as any)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
  set(_target, prop, value) {
    const instance = getRuntimeManager();
    (instance as any)[prop] = value;
    return true;
  },
});
