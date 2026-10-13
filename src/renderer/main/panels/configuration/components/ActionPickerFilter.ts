import type {
  ElementType,
  EventType,
  ModuleType,
} from "@intechstudio/grid-protocol";
import type {
  ActionBlockInformation,
  BodyRule,
} from "../../../../config-blocks/ActionBlockInformation";

export type PickerTarget = {
  elementType: ElementType;
  eventType: EventType;
  // A function body tab (VirtualGridEvent) rather than the real event.
  isVirtual: boolean;
  moduleType?: ModuleType;
  // Rules of the composites the insert point is inside (bodyAccepts), from
  // the innermost out. A zone's body accepts outputs only.
  bodies?: BodyRule[];
};

type Filtered = Pick<
  ActionBlockInformation,
  "elementTypes" | "eventTypes" | "moduleTypes" | "category" | "short"
>;

// Whether every enclosing body accepts the block.
export function isAllowedInBodies(
  information: Pick<ActionBlockInformation, "category" | "short">,
  bodies: BodyRule[] = [],
): boolean {
  return bodies.every(
    (rule) =>
      information.category !== null &&
      rule.categories.includes(information.category) &&
      !(rule.excludeShorts ?? []).includes(information.short),
  );
}

// A block that declares elementTypes or eventTypes belongs at the top level of
// a real event of those types, so it is never offered in a function body tab.
// Blocks that declare neither are allowed everywhere.
// A block that declares moduleTypes is offered only on those modules.
// Inside a composite with bodyAccepts, only what that body accepts.
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
  if (!isAllowedInBodies(information, target.bodies)) {
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
  information: Pick<
    ActionBlockInformation,
    "type" | "bodyAccepts" | "keepLast"
  >;
};

// The body rules of the composites that an insert at `index` lands inside,
// innermost first: walking back, every composite_open not closed before the
// index encloses it.
export function bodyRulesAt(actions: Placed[], index: number): BodyRule[] {
  const rules: BodyRule[] = [];
  let depth = 0;
  for (let i = Math.min(index, actions.length) - 1; i >= 0; i--) {
    const { type, bodyAccepts } = actions[i].information;
    if (type === "composite_close") {
      depth++;
    } else if (type === "composite_open") {
      if (depth === 0) {
        if (typeof bodyAccepts !== "undefined") {
          rules.push(bodyAccepts);
        }
      } else {
        depth--;
      }
    }
  }
  return rules;
}

// Where the picker inserts: before the event's last block when that one is
// kept last (Touch Start) and the insert point is after it.
export function pickerInsertIndex(actions: Placed[], index: number): number {
  const last = actions.at(-1);
  return index >= actions.length && last?.information.keepLast === true
    ? actions.length - 1
    : index;
}
