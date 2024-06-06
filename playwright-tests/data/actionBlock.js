export const blocks = (page) => ({
  variables: {
    Lookup: {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Lookup" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
    Global: {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Global" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
    Locals: {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Locals" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
    Self: {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Self" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
  },
  led: {
    "Start Animation": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Start Animation" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
    "Stop Animation": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Stop Animation" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
    Color: {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Color" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
    Intensity: {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Intensity" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
  },
  midi: {
    MIDI: {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "MIDI" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
    "MIDI 14": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "MIDI 14" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
    "MIDI SysEX": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "MIDI SysEX" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
  },
  hid: {
    "GamePad Axis": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "GamePad Axis" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
    "GamePad Button": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "GamePad Button" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
    Keyboard: {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Keyboard" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
    "Mouse Button": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Mouse Button" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
    "Mouse Move": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Mouse Move" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
  },
  element: {
    "Button Mode": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Button Mode" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
    "Encoder Mode": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Encoder Mode" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
    "Potmeter Mode": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Potmeter Mode" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
  },
  condition: {
    If: {
      block: page.locator("#action-menu div").filter({ hasText: "If" }).nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
    // Add "If Else" and "Else"
  },
  loop: {
    "Repeater Loop": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Repeater Loop" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
  },
  specialButton: {
    "Press/Release": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Press/Release" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
  },
  specialEncoder: {
    "Left/Right Rotate": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Left/Right Rotate" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
    "Push & Rotate L R": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Push & Rotate L R" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
    "Push & Rotate": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Push & Rotate" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
  },
  code: {
    "Code Block": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Code Block" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
    "Comment Block": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Comment Block" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
    "Element Name": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Element Name" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
  },
  timer: {
    "Clock Source": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Clock Source" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
    Start: {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Start" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
    Stop: {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Stop" })
        .nth(2),
      elements: {
        element1: null,
        element2: null,
        element3: null,
        element4: null,
      },
    },
  },
});
