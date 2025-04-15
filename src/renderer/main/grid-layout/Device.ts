import { Grid } from "../../lib/_utils";
import {
  GridElement,
  GridModule,
  GridPage,
  GridRuntime,
} from "../../runtime/runtime";

type PositionWithOrigin = Grid.Module.ElementDimension & {
  originDx: number;
  originDy: number;
};

function overlaps(
  aStart: number,
  aSpan: number,
  bStart: number,
  bSpan: number,
) {
  const aEnd = aStart + aSpan;
  const bEnd = bStart + bSpan;
  return aStart < bEnd && bStart < aEnd;
}

export function getNeighbour(
  element: GridElement,
  direction: Grid.Direction,
): GridElement | undefined {
  const page = element.parent as GridPage;
  const module = page.parent as GridModule;
  const runtime = module.parent as GridRuntime;

  let epm: PositionWithOrigin[] = module.elementPositionMap.map((e) => ({
    ...e,
    originDx: module.dx,
    originDy: module.dy,
  }));

  const neighborOffsets = {
    [Grid.Direction.LEFT]: [-1, 0, -4, 0],
    [Grid.Direction.RIGHT]: [1, 0, 4, 0],
    [Grid.Direction.UP]: [0, 1, 0, -4],
    [Grid.Direction.DOWN]: [0, -1, 0, 4],
  };

  const [dxOffset, dyOffset, shiftX, shiftY] = neighborOffsets[direction];
  const neighbor = runtime.findModule(
    module.dx + dxOffset,
    module.dy + dyOffset,
  );

  if (neighbor) {
    const extended = neighbor.elementPositionMap.map((e) => ({
      ...e,
      dx: e.dx + shiftX,
      dy: e.dy + shiftY,
      originDx: neighbor.dx,
      originDy: neighbor.dy,
    }));
    epm.push(...extended);
  }

  const current = module.elementPositionMap.find(
    (e) => e.index === element.elementIndex,
  );

  if (!current) return;

  const candidates = epm
    .filter((e) => {
      let aligned = false;
      let inDirection = false;

      switch (direction) {
        case Grid.Direction.UP:
        case Grid.Direction.DOWN:
          aligned = overlaps(current.dx, current.spanX, e.dx, e.spanX);
          break;
        case Grid.Direction.LEFT:
        case Grid.Direction.RIGHT:
          aligned = overlaps(current.dy, current.spanY, e.dy, e.spanY);
          break;
      }

      switch (direction) {
        case Grid.Direction.UP:
          inDirection = e.dy + e.spanY <= current.dy;
          break;
        case Grid.Direction.DOWN:
          inDirection = e.dy >= current.dy + current.spanY;
          break;
        case Grid.Direction.LEFT:
          inDirection = e.dx + e.spanX <= current.dx;
          break;
        case Grid.Direction.RIGHT:
          inDirection = e.dx >= current.dx + current.spanX;
          break;
      }

      return aligned && inDirection;
    })
    .map((e) => {
      let weight: number;
      switch (direction) {
        case Grid.Direction.UP:
          weight = current.dy - (e.dy + e.spanY);
          break;
        case Grid.Direction.DOWN:
          weight = e.dy - (current.dy + current.spanY);
          break;
        case Grid.Direction.LEFT:
          weight = current.dx - (e.dx + e.spanX);
          break;
        case Grid.Direction.RIGHT:
          weight = e.dx - (current.dx + current.spanX);
          break;
        default:
          weight = Number.MAX_VALUE;
      }

      return {
        index: e.index,
        originDx: e.originDx,
        originDy: e.originDy,
        weight,
      };
    })
    .sort((a, b) => a.weight - b.weight);

  const best = candidates[0];
  if (!best) return undefined;

  const targetModule = runtime.findModule(best.originDx, best.originDy);
  const targetPage = targetModule.findPage(page.pageNumber);
  return targetPage.findElement(best.index);
}
