import { derived, get, writable, type Readable } from "svelte/store";
import { runtime_manager } from "../../runtime/runtime-manager.store";
import { LAYOUT_CELL_WIDTH } from "./GridLayout.svelte";
import type { GridRuntime } from "../../runtime/runtime";
import { Grid } from "../../lib/_utils";

export namespace MiniMap {
  export type MinimapData = {
    runtime: GridRuntime;
    label: string;
    moduleCount: number;
    component: HTMLElement;
  };

  export const connectedRuntimes: Readable<GridRuntime[]> = derived(
    runtime_manager,
    ($runtime_manager) => $runtime_manager.data.map((e) => e.runtime),
  );

  function computeMinimapData(runtimes: GridRuntime[]): MinimapData[] {
    let virtual = 0;
    let physical = 0;

    return runtimes.map((runtime) => {
      return {
        runtime,
        label: runtime.virtual ? `Virtual ${++virtual}` : `Port ${++physical}`,
        moduleCount: runtime.modules.length,
        component: null,
      };
    });
  }

  export function calculateScale(
    entry: MinimapData,
    height: number,
    rotation: Grid.Rotation,
  ) {
    const countY = [Grid.Rotation.R90, Grid.Rotation.R270].includes(
      Grid.addRotations(rotation, entry.runtime.rotation),
    )
      ? entry.runtime.countX()
      : entry.runtime.countY();
    const scale = Math.min(height / (countY * LAYOUT_CELL_WIDTH), 0.5);
    return writable(scale);
  }

  export function calculateWidth(
    entry: MinimapData,
    height: number,
    rotation: Grid.Rotation,
  ) {
    const countX = [Grid.Rotation.R90, Grid.Rotation.R270].includes(
      Grid.addRotations(rotation, entry.runtime.rotation),
    )
      ? entry.runtime.countY()
      : entry.runtime.countX();
    const scale = calculateScale(entry, height, rotation);
    return countX * LAYOUT_CELL_WIDTH * get(scale);
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
