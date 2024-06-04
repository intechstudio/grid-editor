export const blocks = (page) => ({
  variables: {
    Lookup: page
      .locator("#action-menu div")
      .filter({ hasText: "Lookup" })
      .nth(2),
    Global: page
      .locator("#action-menu div")
      .filter({ hasText: "Global" })
      .nth(2),
    Locals: page
      .locator("#action-menu div")
      .filter({ hasText: "Locals" })
      .nth(2),
    Self: page.locator("#action-menu div").filter({ hasText: "Self" }).nth(2),
  },
  led: {
    "Start Animation": page
      .locator("#action-menu div")
      .filter({ hasText: "Start Animation" })
      .nth(2),
    "Stop Animation": page
      .locator("#action-menu div")
      .filter({ hasText: "Stop Animation" })
      .nth(2),
    Color: page.locator("#action-menu div").filter({ hasText: "Color" }).nth(2),
    Intensity: page
      .locator("#action-menu div")
      .filter({ hasText: "Intensity" })
      .nth(2),
  },
  midi: {
    MIDI: page.locator("#action-menu div").filter({ hasText: "MIDI" }).nth(2),
    "MIDI 14": page
      .locator("#action-menu div")
      .filter({ hasText: "MIDI 14" })
      .nth(2),
    "MIDI SysEX": page
      .locator("#action-menu div")
      .filter({ hasText: "MIDI SysEX" })
      .nth(2),
  },
  hid: {
    "GamePad Axis": page
      .locator("#action-menu div")
      .filter({ hasText: "GamePad Axis" })
      .nth(2),
    "GamePad Button": page
      .locator("#action-menu div")
      .filter({ hasText: "GamePad Button" })
      .nth(2),
    Keyboard: page
      .locator("#action-menu div")
      .filter({ hasText: "Keyboard" })
      .nth(2),
    "Mouse Button": page
      .locator("#action-menu div")
      .filter({ hasText: "Mouse Button" })
      .nth(2),
    "Mouse Move": page
      .locator("#action-menu div")
      .filter({ hasText: "Mouse Move" })
      .nth(2),
  },
  element: {
    "Button Mode": page
      .locator("#action-menu div")
      .filter({ hasText: "Button Mode" })
      .nth(2),
    "Encoder Mode": page
      .locator("#action-menu div")
      .filter({ hasText: "Encoder Mode" })
      .nth(2),
    "Potmeter Mode": page
      .locator("#action-menu div")
      .filter({ hasText: "Potmeter Mode" })
      .nth(2),
  },
  condition: {
    If: page.locator("#action-menu div").filter({ hasText: "If" }).nth(2),
    // Add  "If Else" and "Else"
  },
  loop: {
    "Repeater Loop": page
      .locator("#action-menu div")
      .filter({ hasText: "Repeater Loop" })
      .nth(2),
  },
  special: {
    "Press/Release": page
      .locator("#action-menu div")
      .filter({ hasText: "Press/Release" })
      .nth(2),
  },
  code: {
    "Code Block": page
      .locator("#action-menu div")
      .filter({ hasText: "Code Block" })
      .nth(2),
    "Comment Block": page
      .locator("#action-menu div")
      .filter({ hasText: "Comment Block" })
      .nth(2),
    "Element Name": page
      .locator("#action-menu div")
      .filter({ hasText: "Element Name" })
      .nth(2),
  },
  timer: {
    "Clock Source": page
      .locator("#action-menu div")
      .filter({ hasText: "Clock Source" })
      .nth(2),
    Start: page.locator("#action-menu div").filter({ hasText: "Start" }).nth(2),
    Stop: page.locator("#action-menu div").filter({ hasText: "Stop" }).nth(2),
  },
});
