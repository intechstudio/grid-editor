import type {
  ElementType,
  EventType,
  ModuleType,
} from "@intechstudio/grid-protocol";
import type { ActionBlockInformation } from "../../../../config-blocks/ActionBlockInformation";

export type PickerTarget = {
  elementType: ElementType;
  eventType: EventType;
  // A function body tab (VirtualGridEvent) rather than the real event.
  isVirtual: boolean;
  moduleType?: ModuleType;
};

type Filtered = Pick<
  ActionBlockInformation,
  "elementTypes" | "eventTypes" | "moduleTypes"
>;

// A block that declares elementTypes or eventTypes belongs at the top level of
// a real event of those types, so it is never offered in a function body tab.
// Blocks that declare neither are allowed everywhere.
// A block that declares moduleTypes is offered only on those modules.
export function isAllowedIn(
  information: Filtered,
  target: PickerTarget,
): boolean {
  const { elementTypes, eventTypes, moduleTypes } = information;
  if (
    typeof moduleTypes !== "undefined" &&
    (typeof target.moduleType === "undefined" ||
      !moduleTypes.includes(target.moduleType))
  ) {
    return false;
  }
  if (
    typeof elementTypes === "undefined" &&
    typeof eventTypes === "undefined"
  ) {
    return true;
  }
  return (
    !target.isVirtual &&
    (typeof elementTypes === "undefined" ||
      elementTypes.includes(target.elementType)) &&
    (typeof eventTypes === "undefined" || eventTypes.includes(target.eventType))
  );
}

type Placed = {
  information: Pick<ActionBlockInformation, "keepLast">;
};

// Where the picker inserts: before the event's last block when that one is
// kept last (Touch Start) and the insert point is after it.
export function pickerInsertIndex(actions: Placed[], index: number): number {
  const last = actions.at(-1);
  return index >= actions.length && last?.information.keepLast === true
    ? actions.length - 1
    : index;
}

// The element a companion goes to: the block's own element, or the first one
// of the page with the companion's element type.
export function companionElement<E extends { type: string }>(
  elements: E[],
  current: E,
  elementType?: string,
): E | undefined {
  return typeof elementType === "undefined"
    ? current
    : elements.find((e) => e.type === elementType);
}
