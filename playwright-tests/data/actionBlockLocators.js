export const blocks = (page) => {
  const actionMenu = page.locator("#action-menu");
  const pickerById = (id) => actionMenu.getByTestId(id);
  const pickerByText = (text, options) => actionMenu.getByText(text, options);

  return {
    Function: {
      Function: {
        block: pickerById("Function_Start"),
        elements: {
          Function: page.locator("#cfg-0"),
          input: page.locator("#cfg-0 input"),
          End: page.locator("#cfg-1"),
        },
      },
    },
    variables: {
      Lookup: {
        block: pickerById("Lookup"),
        elements: {
          source: page.getByPlaceholder("Incoming value to match"),
          input: page.getByPlaceholder("input").first(),
          output: page.getByPlaceholder("output").first(),
          destination: page.getByPlaceholder("Variable name to load the"),
          addNewPair: page.getByRole("button", { name: "Add New Pair" }),
        },
      },
      Global: {
        block: pickerById("VarGlobal"),
        elements: {
          name: page.getByTestId("variable-name"),
          value: page.getByTestId("variable-value"),
          addNewPair: page.getByTestId("add-variable"),
        },
      },
      Locals: {
        block: pickerById("VarLocals"),
        elements: {
          name: page.getByTestId("variable-name"),
          value: page.getByTestId("variable-value"),
          addNewPair: page.getByTestId("add-variable"),
        },
      },
      Self: {
        block: pickerById("VarSelf"),
        elements: {
          name: page.getByTestId("variable-name"),
          value: page.getByTestId("variable-value"),
          addNewPair: page.getByTestId("add-variable"),
        },
      },
    },
    led: {
      "Start Animation": {
        block: pickerById("LedAnimationStart"),
        elements: {
          ledNumber: page.getByLabel("LED Number"),
          Layer: page.getByLabel("Layer"),
          Phase: page.getByLabel("Phase"),
          Rate: page.getByLabel("Rate"),
          Shape: page.getByLabel("Shape"),
        },
      },
      "Stop Animation": {
        block: pickerById("LedAnimationStop"),
        elements: {
          ledNumber: page.getByLabel("LED Number"),
          Layer: page.getByLabel("Layer"),
        },
      },
      Color: {
        block: pickerById("SimpleColor"),
        elements: {
          ledNumber: page.getByLabel("Element"),
          Layer: page.getByLabel("Layer"),
          Red: page.getByLabel("Red"),
          Green: page.getByLabel("Green"),
          Blue: page.getByLabel("Blue"),
        },
      },
      Intensity: {
        block: pickerById("SimpleIntensity"),
        elements: {
          Element: page.getByLabel("Element"),
          Layer: page.getByLabel("Layer"),
          Intensity: page.getByLabel("Intensity"),
        },
      },
    },
    midi: {
      MIDI: {
        block: pickerById("Midi"),
        elements: {
          Channel: page.getByLabel("Channel"),
          Command: page.getByLabel("Command"),
          Parameter1: page.getByLabel("Parameter 1"),
          Parameter2: page.getByLabel("Parameter 2"),
        },
      },
      "MIDI 14": {
        block: pickerById("MidiFourteenBit"),
        elements: {
          Channel: page.getByLabel("Channel"),
          CC: page.getByLabel("CC Number"),
          "Controller Value": page.getByLabel("Controller Value"),
        },
      },
      SysEX: {
        block: pickerById("MidiSysEx"),
        elements: {
          Commit: page.getByRole("button", { name: "Commit" }),
          message: page.getByText("0xF0, 0x41, 0x10, val, 0xF7", {
            exact: true,
          }),
        },
      },
      "MIDI NRPN": {
        block: pickerById("MidiNRPN"),
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
        block: pickerById("GamePadAxis"),
        elements: {
          Axis: page.getByLabel("Axis"),
          Position: page.getByLabel("Position"),
        },
      },
      "GamePad Button": {
        block: pickerById("GamePadButton"),
        elements: {
          Button: page
            .getByTestId("action-block")
            .getByRole("button", { name: "Button" }),
          State: page.getByLabel("State"),
        },
      },
      Keyboard: {
        block: pickerById("Macro"),
        elements: {
          Macro: page.getByTestId("macro-key-select"),
          "Add Key": page.getByRole("combobox").nth(3),
          "Delay Key": page.getByRole("spinbutton").first(),
          "Add Delay": page.getByRole("button", { name: "Add Delay" }),
          "Default Delay": page.getByRole("spinbutton").nth(1),
          "Clear All": page.getByRole("button", { name: "Clear All" }),
        },
      },
      "Mouse Button": {
        block: pickerById("MouseButton"),
        elements: {
          Button: page
            .getByTestId("action-block")
            .getByRole("button", { name: "Button" }),
          State: page.getByLabel("State"),
        },
      },
      "Mouse Move": {
        block: pickerById("MouseMove"),
        elements: {
          Axis: page.getByLabel("Axis"),
          Position: page.getByLabel("Position"),
        },
      },
    },
    element: {
      "Button Mode": {
        block: pickerById("SettingsButton"),
        elements: {
          Mode: page.getByLabel("Button Mode"),
          Min: page.getByLabel("Min", { exact: true }),
          Max: page.getByLabel("Max", { exact: true }),
        },
      },
      "Encoder Mode": {
        block: pickerById("SettingsEncoder"),
        elements: {
          Mode: page.getByLabel("Encoder Mode"),
          Velocity: page.getByLabel("Velocity"),
          Min: page.getByLabel("Min", { exact: true }),
          Max: page.getByLabel("Max", { exact: true }),
          Sensitivity: page.getByLabel("Sensitivity", { exact: true }),
        },
      },
      "Potmeter Mode": {
        block: pickerById("SettingsPotmeter"),
        elements: {
          Bit: page.getByLabel("Bit"),
          Min: page.getByLabel("Min", { exact: true }),
          Max: page.getByLabel("Max", { exact: true }),
        },
      },
      "Endless Mode": {
        block: pickerById("SettingsEndless"),
        elements: {
          Mode: page.getByLabel("Endless Mode"),
          Velocity: page.getByLabel("Velocity"),
          Min: page.getByLabel("Min", { exact: true }),
          Max: page.getByLabel("Max", { exact: true }),
          Sensitivity: page.getByLabel("Sensitivity", { exact: true }),
        },
      },
    },
    condition: {
      If: {
        block: pickerById("Condition_If"),
        elements: {
          input: page.locator(".view-line"),
          end: page.locator("#cfg-1"),
        },
      },
      Else: {
        block: pickerById("Condition_Else"),
        elements: {
          else: page.locator("#cfg-1"),
        },
      },
      "Else if": {
        block: pickerById("Condition_ElseIf"),
        elements: {
          input: page.locator("#cfg-1 #monaco_container"),
        },
      },
    },
    loop: {
      "Repeater Loop": {
        block: pickerById("For_Loop"),
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
        block: pickerByText("Press/Release"),
        elements: {
          press: page.locator("#cfg-0"),
          release: page.locator("#cfg-1"),
          end: page.locator("#cfg-2"),
        },
      },
      "Button Step": {
        block: pickerByText("Button Step"),
        elements: {
          "Button Off": page.locator("#cfg-0"),
          "Step One": page.locator("#cfg-1"),
        },
      },
    },
    specialEncoder: {
      "Encoder Left/Right Rotate": {
        block: pickerByText("Encoder Left/Right Rotate"),
        elements: {
          left: page.locator("#cfg-0"),
          right: page.locator("#cfg-1"),
          end: page.locator("#cfg-2"),
        },
      },
      "Encoder Push & Rotate L R": {
        block: pickerByText("Encoder Push & Rotate L R"),
        elements: {
          "push left": page.locator("#cfg-0"),
          "push right": page.locator("#cfg-1"),
          "just left": page.locator("#cfg-2"),
          "just right": page.locator("#cfg-3"),
          end: page.locator("#cfg-4"),
        },
      },
      "Encoder Push & Rotate": {
        block: pickerByText("Encoder Push & Rotate", { exact: true }),
        elements: {
          "push rotate": page.locator("#cfg-0"),
          "just rotate": page.locator("#cfg-1"),
          end: page.locator("#cfg-2"),
        },
      },
    },
    code: {
      "Code Block": {
        block: pickerById("CodeBlock"),
        elements: {
          input: page.locator("code-block .view-line").first(),
          "Open Editor": page.getByRole("button", { name: "Open Editor" }),
        },
      },
      "Comment Block": {
        block: pickerById("Comment"),
        elements: {
          input: page.getByLabel("Comment"),
        },
      },
      "Element Name": {
        block: pickerById("ElementName"),
        elements: {
          input: page.getByLabel("Element Name"),
        },
      },
    },
    timer: {
      "Clock Source": {
        block: pickerById("TimerSource"),
        elements: {
          "Element Number": page.getByLabel("Element Number"),
          Source: page.getByLabel("Source"),
        },
      },
      Start: {
        block: pickerById("TimerStart"),
        elements: {
          "Element Number": page.getByLabel("Element Number"),
          Time: page.getByLabel("Time", { exact: true }),
        },
      },
      Stop: {
        block: pickerById("TimerStop"),
        elements: {
          "Element Number": page.getByLabel("Element Number"),
        },
      },
    },
  };
};
