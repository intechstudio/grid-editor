import {
  writable,
  get,
  type Writable,
  Subscriber,
  Unsubscriber,
  Updater,
  Readable,
} from "svelte/store";
import { GridRuntime, aliveModules } from "./runtime";
import { GridInstruction } from "../serialport/instructions";
import { GridConnection } from "../serialport/serialport";
import { WriteBuffer } from "./engine.store";
import { Architecture } from "@intechstudio/grid-protocol";
import { logger } from "./runtime.store";
import {
  clearIntervalAsync,
  setIntervalAsync,
  SetIntervalAsyncTimer,
} from "set-interval-async";

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
    invalidate?: (value?: GridRuntimeManagerData) => void
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
      if (typeof store.active === "undefined") {
        store.active = incoming;
      }
      return store;
    });

    this.startHeartbeat(incoming);
  }

  public destroy(runtime: GridRuntime) {
    const destroyed = get(this._internal).data.find(
      (e) => e.runtime.id === runtime.id
    );

    console.log(destroyed);

    if (!destroyed) {
      throw new Error("Destroyed module is not found...");
    }

    this.killHeartbeat(destroyed);

    this.update((store) => {
      store.data = store.data.filter(
        (e) => e.runtime.id !== destroyed.runtime.id
      );

      if (store.active.runtime.id === destroyed.runtime.id) {
        store.active = store.data[0];
      }

      return store;
    });
  }

  public createVirtual(): GridRuntime {
    const buffer = new WriteBuffer(undefined);
    const virtual_connection: GridConnection = {
      id: undefined,
      buffer: buffer,
      port: undefined,
      virtual: true,
    };

    return new GridRuntime(virtual_connection, true);
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

  public NVMDefrag() {
    logger.set({
      type: "progress",
      mode: 0,
      classname: "nvmdefrag",
      message: `Defragging all modules...`,
    });

    const promises: Promise<any>[] = [];
    for (const target of get(this._internal).data) {
      const instruction = new GridInstruction.NVMDefrag(target.runtime.virtual);
      promises.push(instruction.executeOn(target.runtime.connection));
    }
    Promise.all(promises)
      .then((res) => {
        //TODO
        logger.set({
          type: "success",
          mode: 0,
          classname: "nvmdefrag",
          message: `Defrag complete!`,
        });
      })
      .catch((e) => {
        logger.set({
          type: "fail",
          mode: 0,
          classname: "engine-disabled",
          message: `Engine is disabled, NVM Defragmentation failed!`,
        });
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
      script,
      target.runtime.virtual
    );
    instruction.executeOn(target.runtime.connection).catch((e) => {
      console.warn(e);
    });
  }

  private startHeartbeat(connection: ManagedConnection) {
    connection.editor_heartbeat = setIntervalAsync(
      () =>
        GridRuntimeManager.editor_heartbeat_interval_handler(
          connection.runtime
        ),
      GridRuntimeManager.heartbeat_editor_ms
    );
    connection.grid_heartbeat = setIntervalAsync(
      () =>
        GridRuntimeManager.grid_heartbeat_interval_handler(connection.runtime),
      GridRuntimeManager.heartbeat_grid_ms
    );
  }

  public killHeartbeat(connection: ManagedConnection) {
    clearIntervalAsync(connection.grid_heartbeat);
    clearIntervalAsync(connection.editor_heartbeat);
  }

  private static async editor_heartbeat_interval_handler(runtime: GridRuntime) {
    let type = 255;

    // if (runtime.unsavedChangesCount() != 0 || typeof get(modal) !== "undefined") {
    //   type = 254;
    // }

    if (
      runtime.modules.length > 0 &&
      runtime.modules.filter((e) => e.architecture === "virtual").length === 0
    ) {
      const instruction = new GridInstruction.SendHeartbeatImmediate(
        type,
        runtime.virtual
      );

      instruction.executeOn(runtime.connection).catch((e) => {
        console.log("EDITOR: Heartbeat skipped...");
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

      const last =
        get(aliveModules).find((e) => e.id === device.id)?.last ?? Date.now();

      // Allow less strict elapsedTimeLimit while writeBuffer is busy!
      const elapsedTimeLimit =
        get(runtime.connection.buffer).length > 0
          ? GridRuntimeManager.heartbeat_grid_ms * 6
          : GridRuntimeManager.heartbeat_grid_ms * 3;
      const elapsedTime = Date.now() - last;

      if (!last || elapsedTime > elapsedTimeLimit) {
        // TIMEOUT! let's remove the device
        runtime.destroy_module(device.dx, device.dy);
      }
    }
  }
}

export const runtime_manager = new GridRuntimeManager();
