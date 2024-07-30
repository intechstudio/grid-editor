export const blocks = (page) => ({
  variables: {
    Lookup: {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Lookup" })
        .nth(2),
      elements: {
        source: page.getByPlaceholder("Incoming value to match"),
        input: page.getByPlaceholder("input").first(),
        output: page.getByPlaceholder("output").first(),
        destination: page.getByPlaceholder("Variable name to load the"),
        addNewPair: page.getByText("Add new pair..."),
      },
    },
    Global: {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Global" })
        .nth(2),
      elements: {
        Commit: page.getByRole("button", { name: "Commit" }),
        var: page.getByPlaceholder("variable name"),
        i: page.locator("#monaco_container"),
        addNewPair: page.getByText("Add global variable..."),
      },
    },
    Locals: {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Locals" })
        .nth(2),
      elements: {
        Commit: page.getByRole("button", { name: "Commit" }),
        var: page.getByPlaceholder("variable name"),
        i: page.locator("#monaco_container"),
        addNewPair: page.getByText("Add local variable..."),
      },
    },
    Self: {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Self" })
        .nth(2),
      elements: {
        Commit: page.getByRole("button", { name: "Commit" }),
        var: page.getByPlaceholder("variable name"),
        i: page.locator("#monaco_container"),
        addNewPair: page.getByText("Add self variable..."),
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
        ledNumber: page.getByRole("textbox").first(),
        Layer: page.getByRole("textbox").nth(1),
        Phase: page.getByRole("textbox").nth(2),
        Rate: page.getByRole("textbox").nth(3),
        Shape: page.getByRole("textbox").nth(4),
      },
    },
    "Stop Animation": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Stop Animation" })
        .nth(2),
      elements: {
        ledNumber: page.getByRole("textbox").first(),
        Layer: page.getByRole("textbox").nth(1),
      },
    },
    Color: {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Color" })
        .nth(2),
      elements: {
        ledNumber: page.getByRole("textbox").first(),
        Layer: page.getByRole("textbox").nth(1),
        Red: page.getByRole("textbox").nth(2),
        Green: page.getByRole("textbox").nth(3),
        Blue: page.getByRole("textbox").nth(4),
        Canva: page.locator("#myCanvas"),
        Random: page.locator(".w-1\\/5"),
        Beauty: page.locator("#cfg-0").getByRole("checkbox"),
      },
    },
    Intensity: {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Intensity" })
        .nth(2),
      elements: {
        "LED Number": page.getByRole("textbox").first(),
        Layer: page.getByRole("textbox").nth(1),
        Intensity: page.getByRole("textbox").nth(2),
      },
    },
  },
  midi: {
    MIDI: {
      block: page.locator("div:nth-child(6) > div").first(),
      elements: {
        Channel: page.getByRole("textbox").first(),
        Command: page.getByRole("textbox").nth(1),
        Parameter1: page.getByRole("textbox").nth(2),
        Parameter2: page.getByRole("textbox").nth(3),
      },
    },
    "MIDI 14": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "MIDI 14" })
        .nth(2),
      elements: {
        Channel: page.getByRole("textbox").first(),
        CC: page.getByRole("textbox").nth(1),
        "Controller Value": page.getByRole("textbox").nth(2),
      },
    },
    "MIDI SysEX": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "MIDI SysEX" })
        .nth(2),
      elements: {
        Commit: page.getByRole("button", { name: "Commit" }),
        message: page.getByText("0xF0, 0x41, 0x10, val, 0xF7", { exact: true }),
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
        Axis: page.getByRole("textbox").first(),
        Position: page.getByRole("textbox").nth(1),
      },
    },
    "GamePad Button": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "GamePad Button" })
        .nth(2),
      elements: {
        Button: page.getByRole("textbox").first(),
        State: page.getByRole("textbox").nth(1),
      },
    },
    Keyboard: {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Keyboard" })
        .nth(2),
      elements: {
        Macro: page.locator(".focus\\:border-select-desaturate-20"),
        "Add Key": page.getByRole("combobox").nth(3),
        "Delay Key": page.getByRole("spinbutton").first(),
        "Add Delay": page.getByRole("button", { name: "Add Delay" }),
        "Defaul Delay": page.getByRole("spinbutton").nth(1),
        "Clear All": page.getByRole("button", { name: "Clear All" }),
      },
    },
    "Mouse Button": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Mouse Button" })
        .nth(2),
      elements: {
        Button: page.getByRole("textbox").first(),
        State: page.getByRole("textbox").nth(1),
      },
    },
    "Mouse Move": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Mouse Move" })
        .nth(2),
      elements: {
        Axis: page.getByRole("textbox").first(),
        Position: page.getByRole("textbox").nth(1),
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
        Mode: page.getByRole("textbox").first(),
      },
    },
    "Encoder Mode": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Encoder Mode" })
        .nth(2),
      elements: {
        Mode: page.getByRole("textbox").first(),
        Velocity: page.getByRole("textbox").nth(1),
      },
    },
    "Potmeter Mode": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Potmeter Mode" })
        .nth(2),
      elements: {
        Bit: page.getByRole("textbox").first(),
        Min: page.getByRole("textbox").nth(1),
        Max: page.getByRole("textbox").nth(2),
      },
    },
  },
  condition: {
    If: {
      block: page.locator("#action-menu div").filter({ hasText: "If" }).nth(2),
      elements: {
        input: page.locator(".view-line"),
        end: page.locator("#cfg-1"),
      },
    },
    Else: {
      block: page.locator("div:nth-child(12) > div").first(),
      elements: {
        else: page.locator("#cfg-1"),
      },
    },
    "Else if": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Else if" })
        .nth(2),
      elements: {
        input: page.locator("#cfg-1 #monaco_container"),
      },
    },
  },
  loop: {
    "Repeater Loop": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Repeater Loop" })
        .nth(2),
      elements: {
        input: page.locator("div").filter({ hasText: /^10$/ }).nth(3),
        times: page.locator("#cfg-0").getByRole("checkbox"),
        end: page.locator("#cfg-1"),
        Variable: page.getByRole("textbox").nth(1),
        Initial: page.getByRole("textbox").nth(2),
        End: page.getByRole("textbox").nth(3),
        Increment: page.getByRole("textbox").nth(4),
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
        press: page.locator("#cfg-0"),
        release: page.locator("#cfg-1"),
        end: page.locator("#cfg-2"),
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
        left: page.locator("#cfg-0"),
        right: page.locator("#cfg-1"),
        end: page.locator("#cfg-2"),
      },
    },
    "Push & Rotate L R": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Push & Rotate L R" })
        .nth(2),
      elements: {
        "push left": page.locator("#cfg-0"),
        "push right": page.locator("#cfg-1"),
        "just left": page.locator("#cfg-2"),
        "just right": page.locator("#cfg-3"),
        end: page.locator("#cfg-4"),
      },
    },
    "Push & Rotate": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Push & Rotate" })
        .nth(2),
      elements: {
        "push rotate": page.locator("#cfg-0"),
        "kust rotate": page.locator("#cfg-1"),
        end: page.locator("#cfg-2"),
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
        input: page.locator("pre"),
        "Edit Code": page.getByRole("button", { name: "Edit Code" }),
      },
    },
    "Comment Block": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Comment Block" })
        .nth(2),
      elements: {
        input: page.getByRole("textbox"),
      },
    },
    "Element Name": {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Element Name" })
        .nth(2),
      elements: {
        input: page.getByRole("textbox"),
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
        "Element Number": page.getByRole("textbox").first(),
        Source: page.getByRole("textbox").nth(1),
      },
    },
    Start: {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Start" })
        .nth(2),
      elements: {
        "Element Number": page.getByRole("textbox").first(),
        Time: page.getByRole("textbox").nth(1),
      },
    },
    Stop: {
      block: page
        .locator("#action-menu div")
        .filter({ hasText: "Stop" })
        .nth(2),
      elements: {
        Stop: page.getByRole("textbox").first(),
      },
    },
  },
});
