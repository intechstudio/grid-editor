import { get } from "svelte/store";
import { Grid } from "../../lib/_utils";
import { appSettings } from "../../runtime/app-helper.store";
import {
  GridElement,
  GridModule,
  GridPage,
  GridRuntime,
} from "../../runtime/runtime";

type ElementPosition = {
  index: number;
  dx: number;
  dy: number;
  width: number;
  height: number;
  originDx: number;
  originDy: number;
};

export namespace KeyboardTarget {
  const ATTRIBUTE_PREFIX = "data-kbtarget";

  export function set(node: HTMLElement, data: GridElement) {
    const page = data.parent as GridPage;
    const module = page.parent as GridModule;
    const index = data.elementIndex;
    const [originDx, originDy] = [module.dx, module.dy];
    node.classList.add(ATTRIBUTE_PREFIX);
    node.setAttribute(`${ATTRIBUTE_PREFIX}-index`, String(index));
    node.setAttribute(`${ATTRIBUTE_PREFIX}-originDx`, String(originDx));
    node.setAttribute(`${ATTRIBUTE_PREFIX}-originDy`, String(originDy));
  }

  export function getAll(): ElementPosition[] {
    const elements = document.getElementsByClassName(
      ATTRIBUTE_PREFIX,
    ) as HTMLCollectionOf<HTMLElement>;
    const result: ElementPosition[] = [];

    for (let i = 0; i < elements.length; i++) {
      const e = elements[i];
      const rect = e.getBoundingClientRect();

      result.push({
        index: Number(e.getAttribute(`${ATTRIBUTE_PREFIX}-index`)),
        dx: rect.left + window.scrollX,
        dy: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height,
        originDx: Number(e.getAttribute(`${ATTRIBUTE_PREFIX}-originDx`)),
        originDy: Number(e.getAttribute(`${ATTRIBUTE_PREFIX}-originDy`)),
      });
    }

    return result;
  }
}

export function directionToVector(direction: Grid.Direction) {
  switch (direction) {
    case Grid.Direction.UP:
      return [0, 1];
    case Grid.Direction.DOWN:
      return [0, -1];
    case Grid.Direction.LEFT:
      return [-1, 0];
    case Grid.Direction.RIGHT:
      return [1, 0];
  }
}

export function getNeighbour(
  element: GridElement,
  direction: Grid.Direction,
): GridElement | undefined {
  const page = element.parent as GridPage;
  const module = page.parent as GridModule;
  const runtime = module.parent as GridRuntime;

  const elements = KeyboardTarget.getAll();

  const current = elements.find(
    (e) =>
      e.index === element.elementIndex &&
      e.originDx === module.dx &&
      e.originDy === module.dy,
  );

  if (!current) {
    throw new Error("Current element not found");
  }

  const centerX = current.dx + current.width / 2;
  const centerY = current.dy + current.height / 2;

  const candidates = elements
    //Get current and neighbouring modules elements
    .filter((e) => {
      const rotation = get(appSettings).persistent.moduleRotation;
      const rotatedDirection = Grid.rotateDirection(direction, rotation);
      const [dirX, dirY] = directionToVector(rotatedDirection);
      return (
        (e.originDx === current.originDx && e.originDy === current.originDy) ||
        (e.originDx === current.originDx + dirX &&
          e.originDy === current.originDy + dirY)
      );
    })
    //Get directional elements
    .filter((e) => {
      if (e === current) return false;

      const eCenterX = e.dx + e.width / 2;
      const eCenterY = e.dy + e.height / 2;

      const deltaX = eCenterX - centerX;
      const deltaY = eCenterY - centerY;

      switch (direction) {
        case Grid.Direction.UP:
          if (deltaY >= 0) return false;
          break;
        case Grid.Direction.DOWN:
          if (deltaY <= 0) return false;
          break;
        case Grid.Direction.LEFT:
          if (deltaX >= 0) return false;
          break;
        case Grid.Direction.RIGHT:
          if (deltaX <= 0) return false;
          break;
      }

      return true;
    })
    //Get aligned elements
    .filter((e) => {
      switch (direction) {
        case Grid.Direction.UP:
        case Grid.Direction.DOWN:
          if (
            e.dx < current.dx + current.width &&
            e.dx + e.width > current.dx
          ) {
            return true;
          }
          return false;

        case Grid.Direction.LEFT:
        case Grid.Direction.RIGHT:
          if (
            e.dy < current.dy + current.height &&
            e.dy + e.height > current.dy
          ) {
            return true;
          }
          return false;
      }
    })
    //Calculate distances
    .map((e) => {
      const eCenterX = e.dx + e.width / 2;
      const eCenterY = e.dy + e.height / 2;

      const deltaX = eCenterX - centerX;
      const deltaY = eCenterY - centerY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      return {
        ...e,
        distance,
      };
    })
    //Sort by shortest distance
    .sort((a, b) => a.distance - b.distance);

  const best = candidates[0];
  if (!best) return undefined;

  const targetModule = runtime.findModule(best.originDx, best.originDy);
  const targetPage = targetModule.findPage(page.pageNumber);
  return targetPage.findElement(best.index);
}
