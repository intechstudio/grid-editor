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

// A block that declares elementTypes or eventTypes belongs at the top level of
// a real event of those types, so it is never offered in a function body tab.
// Blocks that declare neither are allowed everywhere.
// A block that declares moduleTypes is offered only on those modules.
export function isAllowedIn(
  information: Pick<
    ActionBlockInformation,
    "elementTypes" | "eventTypes" | "moduleTypes"
  >,
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
