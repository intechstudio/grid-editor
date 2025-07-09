import { derived, get, writable, type Readable } from "svelte/store";
import { runtime_manager } from "../../runtime/runtime-manager.store";
import { LAYOUT_CELL_WIDTH } from "./GridLayout.svelte";
import type { GridRuntime } from "../../runtime/runtime";

export namespace MiniMap {
  export type MinimapData = {
    runtime: GridRuntime;
    scale: Readable<number>;
    label: string;
    moduleCount: number;
  };

  export const connectedRuntimes: Readable<GridRuntime[]> = derived(
    runtime_manager,
    ($runtime_manager) => $runtime_manager.data.map((e) => e.runtime),
  );

  function computeMinimapData(runtimes: GridRuntime[]): MinimapData[] {
    let virtual = 0;
    let physical = 0;

    return runtimes.map((runtime) => {
      const countX = runtime.countX();
      const countY = runtime.countY();
      const scaleWidth = 300 / (countX * LAYOUT_CELL_WIDTH);
      const scaleHeight = 100 / (countY * LAYOUT_CELL_WIDTH);

      return {
        runtime,
        scale: writable(Math.min(scaleWidth, scaleHeight)),
        label: runtime.virtual ? `Virtual ${++virtual}` : `Port ${++physical}`,
        moduleCount: runtime.modules.length,
      };
    });
  }

  export const data: Readable<MinimapData[]> = derived(
    connectedRuntimes,
    ($connectedRuntimes, set) => {
      let buffer: MinimapData[] = computeMinimapData($connectedRuntimes);
      const unsubscribers: (() => void)[] = [];

      set(buffer);

      for (const runtime of $connectedRuntimes) {
        const unsubscribe = runtime.subscribe((updated) => {
          const existing = buffer.find(
            (item) => item.runtime.id === updated.id,
          );

          if (!existing || existing.moduleCount !== updated.modules.length) {
            buffer = computeMinimapData($connectedRuntimes);
            set(buffer);
          }
        });

        unsubscribers.push(unsubscribe);
      }

      return () => {
        unsubscribers.forEach((u) => u());
      };
    },
  );

  export function selectRuntime(id: string) {
    const selectedItem = runtime_manager.data.find((e) => e.runtime.id === id);
    if (selectedItem) {
      runtime_manager.active = selectedItem;
    }
  }
}
