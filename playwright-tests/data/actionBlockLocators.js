export const blocks = (page) => ({
  Function: {
    Function: {
      block: page.locator("#action-menu").getByText("Function").nth(1),
      elements: {
        Function: page.locator("#cfg-0"),
        input: page.locator("#cfg-0 input"),
        End: page.locator("#cfg-1"),
      },
    },
  },
  variables: {
    Lookup: {
      block: page.locator("#action-menu").getByText("Lookup"),
      elements: {
        source: page.getByPlaceholder("Incoming value to match"),
        input: page.getByPlaceholder("input").first(),
        output: page.getByPlaceholder("output").first(),
        destination: page.getByPlaceholder("Variable name to load the"),
        addNewPair: page.getByRole("button", { name: "Add New Pair" }),
      },
    },
    Global: {
      block: page
        .locator("#action-menu")
        .getByRole("button", { name: "G Global", exact: true }),
      elements: {
        name: page.getByTestId("variable-name"),
        value: page.getByTestId("variable-value"),
        addNewPair: page.getByTestId("add-variable"),
      },
    },
    Locals: {
      block: page.locator("#action-menu").getByText("Locals"),
      elements: {
        name: page.getByTestId("variable-name"),
        value: page.getByTestId("variable-value"),
        addNewPair: page.getByTestId("add-variable"),
      },
    },
    Self: {
      block: page.locator("#action-menu").getByText("Self"),
      elements: {
        name: page.getByTestId("variable-name"),
        value: page.getByTestId("variable-value"),
        addNewPair: page.getByTestId("add-variable"),
      },
    },
  },
  led: {
    "Start Animation": {
      block: page.locator("#action-menu").getByText("Start Animation"),
      elements: {
        ledNumber: page.getByLabel("LED Number"),
        Layer: page.getByLabel("Layer"),
        Phase: page.getByLabel("Phase"),
        Rate: page.getByLabel("Rate"),
        Shape: page.getByLabel("Shape"),
      },
    },
    "Stop Animation": {
      block: page.locator("#action-menu").getByText("Stop Animation"),
      elements: {
        ledNumber: page.getByLabel("LED Number"),
        Layer: page.getByLabel("Layer"),
      },
    },
    "Simple Color": {
      block: page.locator("#action-menu").getByText("Simple Color"),
      elements: {
        ledNumber: page.getByLabel("Element"),
        Layer: page.getByLabel("Layer"),
        Red: page.getByLabel("Red"),
        Green: page.getByLabel("Green"),
        Blue: page.getByLabel("Blue"),
      },
    },
    "Simple Intensity": {
      block: page.locator("#action-menu").getByText("Simple Intensity"),
      elements: {
        Element: page.getByLabel("Element"),
        Layer: page.getByLabel("Layer"),
        Intensity: page.getByLabel("Intensity"),
      },
    },
  },
  midi: {
    MIDI: {
      block: page.locator("#action-menu").getByText("MIDI", { exact: true }),
      elements: {
        Channel: page.getByLabel("Channel"),
        Command: page.getByLabel("Command"),
        Parameter1: page.getByLabel("Parameter 1"),
        Parameter2: page.getByLabel("Parameter 2"),
      },
    },
    "MIDI 14": {
      block: page.locator("#action-menu").getByText("MIDI 14"),
      elements: {
        Channel: page.getByLabel("Channel"),
        CC: page.getByLabel("CC Number"),
        "Controller Value": page.getByLabel("Controller Value"),
      },
    },
    SysEX: {
      block: page.locator("#action-menu").getByText("SysEX"),
      elements: {
        Commit: page.getByRole("button", { name: "Commit" }),
        message: page.getByText("0xF0, 0x41, 0x10, val, 0xF7", { exact: true }),
      },
    },
    "MIDI NRPN": {
      block: page.locator("#action-menu").getByText("MIDI NRPN"),
      elements: {
        Channel: page.getByLabel("Channel"),
        MSB: page.getByLabel("MSB"),
        LSB: page.getByLabel("LSB"),
        "NRPN CC": page.getByLabel("NRPN CC"),
        Value: page.getByLabel("Value"),
        "14bit Resolution": page.getByLabel("14bit Resolution"),
      },
    },
  },
  hid: {
    "GamePad Axis": {
      block: page.locator("#action-menu").getByText("GamePad Axis"),
      elements: {
        Axis: page.getByLabel("Axis"),
        Position: page.getByLabel("Position"),
      },
    },
    "GamePad Button": {
      block: page.locator("#action-menu").getByText("GamePad Button"),
      elements: {
        Button: page
          .getByTestId("action-block")
          .getByRole("button", { name: "Button" }),
        State: page.getByLabel("State"),
      },
    },
    Keyboard: {
      block: page.locator("#action-menu").getByText("Keyboard"),
      elements: {
        Macro: page.locator(".focus\\:border-select-desaturate-20"),
        "Add Key": page.getByRole("combobox").nth(3),
        "Delay Key": page.getByRole("spinbutton").first(),
        "Add Delay": page.getByRole("button", { name: "Add Delay" }),
        "Default Delay": page.getByRole("spinbutton").nth(1),
        "Clear All": page.getByRole("button", { name: "Clear All" }),
      },
    },
    "Mouse Button": {
      block: page.locator("#action-menu").getByText("Mouse Button"),
      elements: {
        Button: page
          .getByTestId("action-block")
          .getByRole("button", { name: "Button" }),
        State: page.getByLabel("State"),
      },
    },
    "Mouse Move": {
      block: page.locator("#action-menu").getByText("Mouse Move"),
      elements: {
        Axis: page.getByLabel("Axis"),
        Position: page.getByLabel("Position"),
      },
    },
  },
  element: {
    "Button Mode": {
      block: page.locator("#action-menu").getByText("Button Mode"),
      elements: {
        Mode: page.getByLabel("Mode"),
        Min: page.getByLabel("Min", { exact: true }),
        Max: page.getByLabel("Max", { exact: true }),
      },
    },
    "Encoder Mode": {
      block: page.locator("#action-menu").getByText("Encoder Mode"),
      elements: {
        Mode: page.getByLabel("Mode"),
        Velocity: page.getByLabel("Velocity"),
        Min: page.getByLabel("Min", { exact: true }),
        Max: page.getByLabel("Max", { exact: true }),
        Sensitivity: page.getByLabel("Sensitivity", { exact: true }),
      },
    },
    "Potmeter Mode": {
      block: page.locator("#action-menu").getByText("Potmeter Mode"),
      elements: {
        Bit: page.getByLabel("Bit"),
        Min: page.getByLabel("Min", { exact: true }),
        Max: page.getByLabel("Max", { exact: true }),
      },
    },
    "Endless Mode": {
      block: page.locator("#action-menu").getByText("Endless Mode"),
      elements: {
        Mode: page.getByLabel("Mode"),
        Velocity: page.getByLabel("Velocity"),
        Min: page.getByLabel("Min", { exact: true }),
        Max: page.getByLabel("Max", { exact: true }),
        Sensitivity: page.getByLabel("Sensitivity", { exact: true }),
      },
    },
  },
  condition: {
    If: {
      block: page
        .locator("#action-menu")
        .getByRole("button", { name: "If", exact: true }),
      elements: {
        input: page.locator(".view-line"),
        end: page.locator("#cfg-1"),
      },
    },
    Else: {
      block: page
        .locator("#action-menu")
        .getByText("Else", { exact: true })
        .first(),
      elements: {
        else: page.locator("#cfg-1"),
      },
    },
    "Else if": {
      block: page.locator("#action-menu").getByText("Else if"),
      elements: {
        input: page.locator("#cfg-1 #monaco_container"),
      },
    },
  },
  loop: {
    "Repeater Loop": {
      block: page.getByText("Repeater Loop"),
      elements: {
        variable: page
          .locator("#cfg-0")
          .getByRole("button", { name: "Repeat" }),
        times: page.locator("#cfg-0").getByRole("button", { name: "Times" }),
      },
    },
  },
  specialButton: {
    "Press/Release": {
      block: page.locator("#action-menu").getByText("Press/Release"),
      elements: {
        press: page.locator("#cfg-0"),
        release: page.locator("#cfg-1"),
        end: page.locator("#cfg-2"),
      },
    },
    "Button Step": {
      block: page.locator("#action-menu").getByText("Button Step"),
      elements: {
        "Button Off": page.locator("#cfg-0"),
        "Step One": page.locator("#cfg-1"),
      },
    },
  },
  specialEncoder: {
    "Encoder Left/Right Rotate": {
      block: page
        .locator("#action-menu")
        .getByText("Encoder Left/Right Rotate"),
      elements: {
        left: page.locator("#cfg-0"),
        right: page.locator("#cfg-1"),
        end: page.locator("#cfg-2"),
      },
    },
    "Encoder Push & Rotate L R": {
      block: page
        .locator("#action-menu")
        .getByText("Encoder Push & Rotate L R"),
      elements: {
        "push left": page.locator("#cfg-0"),
        "push right": page.locator("#cfg-1"),
        "just left": page.locator("#cfg-2"),
        "just right": page.locator("#cfg-3"),
        end: page.locator("#cfg-4"),
      },
    },
    "Encoder Push & Rotate": {
      block: page
        .locator("#action-menu")
        .getByText("Encoder Push & Rotate", { exact: true }),
      elements: {
        "push rotate": page.locator("#cfg-0"),
        "just rotate": page.locator("#cfg-1"),
        end: page.locator("#cfg-2"),
      },
    },
  },
  code: {
    "Code Block": {
      block: page.locator("#action-menu").getByText("Code Block"),
      elements: {
        input: page.locator("pre"),
        "Edit Code": page.getByRole("button", { name: "Edit Code" }),
      },
    },
    "Comment Block": {
      block: page.locator("#action-menu").getByText("Comment Block"),
      elements: {
        input: page.getByLabel("Comment"),
      },
    },
    "Element Name": {
      block: page.locator("#action-menu").getByText("Element Name"),
      elements: {
        input: page.getByLabel("Element Name"),
      },
    },
  },
  timer: {
    "Clock Source": {
      block: page.locator("#action-menu").getByText("Clock Source"),
      elements: {
        "Element Number": page.getByLabel("Element Number"),
        Source: page.getByLabel("Source"),
      },
    },
    Start: {
      block: page.locator("#action-menu").getByText("Start", { exact: true }),
      elements: {
        "Element Number": page.getByLabel("Element Number"),
        Time: page.getByLabel("Time", { exact: true }),
      },
    },
    Stop: {
      block: page.locator("#action-menu").getByText("Stop", { exact: true }),
      elements: {
        "Element Number": page.getByLabel("Element Number"),
      },
    },
  },
});
