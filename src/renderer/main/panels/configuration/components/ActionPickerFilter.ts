import type { ElementType, EventType } from "@intechstudio/grid-protocol";
import type { ActionBlockInformation } from "../../../../config-blocks/ActionBlockInformation";

export type PickerTarget = {
  elementType: ElementType;
  eventType: EventType;
  // A function body tab (VirtualGridEvent) rather than the real event.
  isVirtual: boolean;
};

// A block that declares elementTypes or eventTypes belongs at the top level of
// a real event of those types, so it is never offered in a function body tab.
// Blocks that declare neither are allowed everywhere.
export function isAllowedIn(
  information: Pick<ActionBlockInformation, "elementTypes" | "eventTypes">,
  target: PickerTarget,
): boolean {
  const { elementTypes, eventTypes } = information;
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
