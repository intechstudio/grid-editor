import { test, expect, describe } from "vitest";
import { ElementType, EventType } from "@intechstudio/grid-protocol";
import { isAllowedIn } from "../main/panels/configuration/components/ActionPickerFilter";

const at = (elementType, eventType, isVirtual = false) => ({
  elementType,
  eventType,
  isVirtual,
});

describe("Action picker filter", () => {
  test("no restriction allows everywhere, including function bodies", () => {
    expect(isAllowedIn({}, at(ElementType.TOUCH, EventType.TIMER))).toBe(true);
    expect(isAllowedIn({}, at(ElementType.SYSTEM, EventType.SETUP))).toBe(true);
    expect(isAllowedIn({}, at(ElementType.TOUCH, EventType.SETUP, true))).toBe(
      true,
    );
  });

  test("eventTypes restricts the event", () => {
    const information = { eventTypes: [EventType.SETUP] };
    expect(
      isAllowedIn(information, at(ElementType.TOUCH, EventType.SETUP)),
    ).toBe(true);
    expect(
      isAllowedIn(information, at(ElementType.SYSTEM, EventType.SETUP)),
    ).toBe(true);
    expect(
      isAllowedIn(information, at(ElementType.TOUCH, EventType.TIMER)),
    ).toBe(false);
    expect(
      isAllowedIn(information, at(ElementType.TOUCH, EventType.TOUCH)),
    ).toBe(false);
  });

  test("elementTypes restricts the element", () => {
    const information = { elementTypes: [ElementType.TOUCH] };
    expect(
      isAllowedIn(information, at(ElementType.TOUCH, EventType.TOUCH)),
    ).toBe(true);
    expect(
      isAllowedIn(information, at(ElementType.BUTTON, EventType.SETUP)),
    ).toBe(false);
  });

  test("both must match", () => {
    const information = {
      elementTypes: [ElementType.TOUCH],
      eventTypes: [EventType.SETUP],
    };
    expect(
      isAllowedIn(information, at(ElementType.TOUCH, EventType.SETUP)),
    ).toBe(true);
    expect(
      isAllowedIn(information, at(ElementType.TOUCH, EventType.TOUCH)),
    ).toBe(false);
    expect(
      isAllowedIn(information, at(ElementType.SYSTEM, EventType.SETUP)),
    ).toBe(false);
  });

  test("declared placement is never offered in a function body tab", () => {
    // A VirtualGridEvent keeps its host's event type (Setup), so only
    // isVirtual tells the two apart.
    expect(
      isAllowedIn(
        { eventTypes: [EventType.SETUP] },
        at(ElementType.TOUCH, EventType.SETUP, true),
      ),
    ).toBe(false);
    expect(
      isAllowedIn(
        { elementTypes: [ElementType.TOUCH] },
        at(ElementType.TOUCH, EventType.SETUP, true),
      ),
    ).toBe(false);
  });

  test("empty lists allow nothing", () => {
    expect(
      isAllowedIn({ eventTypes: [] }, at(ElementType.TOUCH, EventType.SETUP)),
    ).toBe(false);
  });
});

describe("moduleTypes", () => {
  const information = { moduleTypes: ["ZONA"] };
  const target = (moduleType) => ({
    ...at(ElementType.SYSTEM, EventType.UTILITY),
    moduleType,
  });

  test("offered on the listed modules", () => {
    expect(isAllowedIn(information, target("ZONA"))).toBe(true);
  });

  test("not on other modules, or when the module is unknown", () => {
    expect(isAllowedIn(information, target("EN16"))).toBe(false);
    expect(isAllowedIn(information, target(undefined))).toBe(false);
  });

  test("without moduleTypes, every module", () => {
    expect(isAllowedIn({}, target("EN16"))).toBe(true);
  });
});
