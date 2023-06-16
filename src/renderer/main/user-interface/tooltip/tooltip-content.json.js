export const tooltip_content = {
  preferences_track_physical:
    "This switches on-off tracking changes of the user interaction with the Grid module. The Editor user interface will only react to mouse clicks.",

  profile_select_local_folder:
    "Choose a directory on your computer for the purpose of storing your profile data locally.",
  profile_save:
    "Save the configuration of the currently active Page to your Local Folder.",
  profile_load_profile:
    "Previously saved profiles stored in your Local Folder are shown here.",
  profile_selection:
    "Saved properties of the selected profile, such as name and description are shown here.",
  profile_load_to_module:
    "Load the configuration of the selected profile onto the currently active Page of the Grid module.",

  preset_save:
    "Save the configuration of the currently active element to your Local Folder.",
  preset_load_preset:
    "Previously saved presets stored in your Local Folder are shown here.",
  preset_selection:
    "Saved properties of the selected preset, such as name and description are shown here.",
  preset_load_to_module:
    "Load the configuration of the selected preset onto the currently active control element.",

  configuration_header_clear:
    "Clear all configurations of the currently active Page from Grid module memory.",
  configuration_header_store:
    "Store the configuration of the currently active Page into Grid module memory.",
  configuration_header_discard:
    "Discard the unstored configuration of the currently active Page from Grid module memory.",

  configuration_ui_events:
    "UI Events can be triggered by interacting with the control elements on the Grid modules (e.g. turning a knob or pressing a button).",
  configuration_system_events:
    "System Events are shared by all Grid modules and Each System Event serves a specific purpose (see the specific system event descriptions).",
  configuration_element_name:
    'Name your control element, by adding an "Element Name" field in Actions.',
  configuration_selected_element:
    "A Control Element represents each individual button, knob or fader on a Grid module and are referred to by number from 0 to 15 from topdown left-to-right fashion.",
  configuration_selected_events:
    "Egy kedves béka mindig felvidítja az embert a tóparton.",
  configuration_pages:
    "Pages store configuration data independently for all your Grid modules, providing quick access to 4 different configurations.",
  configuration_actions:
    "The Action Chain represents the set Actions pertaining to each trigger of the currently selected Control Element.",
  configuration_events:
    "An event describes a real-life interaction that triggers a reaction from a Grid module (e.g. plugging in the module triggers the init event).",
  configuration_copy_all: "Copy the contents of this Control Element.",
  configuration_overwrite:
    "Overwrite the Action Chains under the currently active Control Element.",
  configuration_cut_one: "Cut the marked Action(s) to clipboard.",
  configuration_copy_one: "Copy the marked Action(s) to clipboard.",
  configuration_paste_one:
    "Paste the marked Action(s) from the clipboard to the cursor OR to the bottom of the Action Chain on the currently active Event.",
  configuration_remove_one:
    "Remove the marked Action(s) from the Action Chain permanently.",
  configuration_export:
    "Export the configuration of the currently active Control Element in lua language.",

  event_init:
    "Each time a Page gets loaded (both when powering up and on page change) an Init Event will take place. Actions set to trigger on the Init Event will only trigger once on startup and on each page change. ",
  event_button:
    "When a Button or Encoder is pressed or released a Button Event will take place. Actions set to trigger on the Button Event will trigger on each button press and release.",
  event_encoder:
    "When an Encoder knob is turned, on each tick an Encoder Event will take place. Actions set to trigger on the Encoder Event will trigger on each click while rotating the Encoder knob.",
  event_potmeter:
    "When a Potentiometer knob or fader is moved, a Potentiometer Event will take place on each value change.",
  event_timer: "When a Timer action is triggered, this event runs.",
  event_utility: "The utility side button event.",
  "event_midi rx": "MIDI received from software.",

  action_local_variables:
    "Declare and set the value of a Local Variables. | Local variables can be accessed only on the currenly active action chain.",
  action_button_settings: "Set the button mode to Momentary, Toggle or n-step.",
  action_encoder_settings:
    "Set the velocity sensitivity and the Absolute/Relative mode of the encoder.",
  action_potmeter_settings:
    "Set the effective digital resolution of the potentiometer.",
  action_code_block:
    "Use the Codeblock to create a custom action block that can run any form of lua code.",

  action_condition_if:
    "Create a conditional action branch. | Order the conditional blocks should be: If [Elseif] ... [Elseif] [Else] End",
  action_condition_elseif:
    "Create a conditional action branch. | Order the conditional blocks should be: If [Elseif] ... [Elseif] [Else] End",
  action_condition_else:
    "Create a conditional action branch. | Order the conditional blocks should be: If [Elseif] ... [Elseif] [Else] End",
  action_condition_end:
    "Create a conditional action branch. | Order the conditional blocks should be: If [Elseif] ... [Elseif] [Else] End",

  action_led_color:
    "Set the base color of an LED on the module. | The base color is displayed when the given LED's intensity is set to the maximum value of 255.",
  action_led_color_0:
    "LED Number :: Physical indentifier of the LED. Valid values are 0...15 (0...11 on the PBF4)",
  action_led_color_1:
    "Layer :: Identifier of the layer to be modified. Valid values are 1 or 2, number or local variable. (By default Layer1 is used for Button and Potentiometer events while Layer2 is used by the Encoder event)",
  action_led_color_2:
    "Red :: Red component of the LED's base color. Valid values are 0...255, number or local variable. ",
  action_led_color_3:
    "Green :: Green component of the LED's base color. Valid values are 0...255, number or local variable. ",
  action_led_color_4:
    "Blue :: Blue component of the LED's base color. Valid values are 0...255, number or local variable. ",
  action_led_color_5:
    "Beautify ? The beautify feature makes the LED display a dim version of the base color even when the intensity value is set to 0.",

  action_led_value: "Set the intensity of an LED on the module.",
  action_led_color_0:
    "LED Number :: Physical indentifier of the LED. Valid values are 0...15 (0...11 on the PBF4)",
  action_led_color_1:
    "Layer :: Identifier of the layer to be modified. Valid values are 1 or 2, number or local variable. (By default Layer1 is used for Button and Potentiometer events while Layer2 is used by the Encoder event)",
  action_led_color_2:
    "Intensity :: The intensity parameter sets the given layer's color proportional to the base color. Valid values are 0...255, number or local variable. ",

  action_lookup: "Routing data.",
  action_keyboard:
    "Send a combination of keyboard messages to the host device.",

  action_midi: "Send a midi message to the host device.",
  action_midi_channel:
    "Channel :: Set the MIDI channel of the message. Valid values are 0...15, number or local variable. ",
  action_midi_command:
    "Command :: Set the MIDI command of the message. Valid values are 128...255, number or local variable. ",
  action_midi_parameter_1:
    "Parameter 1 :: Set the MIDI parameter 1 (note or control number) of the message. Valid values are 0...127, number or local variable. ",
  action_midi_parameter_2:
    "Parameter 2 :: Set the MIDI parameter 1 (velocity or value) of the message. Valid values are 0...127, number or local variable. ",

  action_timer_start:
    "Start the timer of the selected control element. | Once the given timeout period is passed, the timer event of the given control element will be triggered.",
  action_timer_stop:
    "Stop the timer of the selected control element. | The timer event will not be triggered until the timer is restarted.",

  action_mouse_move:
    "Send a mouse move or scroll wheel message to the host device.",
  action_mouse_button: "Send mouse button change messages to the host device.",

  sidebar_configuration_icon: "Configure your Grid modules.",
  sidebar_preferences_icon: "Change your Grid Editor settings.",
  sidebar_new_profiles_icon: "Profile Manager",
  sidebar_new_presets_icon: "Preset Manager",
  sidebar_profiles_icon: "Manage locally stored module configurations.",
  sidebar_presets_icon: "Manage locally stored element configurations.",
  sidebar_debugger_icon:
    "Access the debugger window for troubleshooting purposes.",
  sidebar_midi_monitor_icon:
    "Access the MIDI monitor for MIDI-specific troubleshooting.",

  engine_clear:
    "Clear the writebuffer after a module crash, and re-enable the Editor engine!",

  newProfile_delete: "Delete this Session Profile permanently.",
  newProfile_save: "Move this Session Profile to the Profile Cloud folder.",
  newProfile_rewrite:
    "Overwrite this Session Profile with the selected module's configuration.",
  newProfile_info: "Open the Profile description window.",
  newProfile_add_to_session:
    "Save the currently active module configuration locally as a Session Profile.",
  newProfile_load_profile: "Load the selected profile to this module.",
  newProfile_exit_overlay: "Hide the Overlay.",
  newProfile_desc_delete:
    "Delete this Profile from the Profile Cloud permanently.",
  newProfile_desc_edit: "Edit the description of this Profile.",
  newProfile_desc_split_presets:
    "This will make for each control element a control element preset in the element preset folder.",
  newProfile_load_profile:
    "Previously saved profiles stored in your Local Folder are shown here.",

  newPreset_delete: "Delete this Session Preset permanently.",
  newPreset_save: "Move this Session Preset to the Preset Storage folder",
  newPreset_rewrite:
    "Overwrite this Session Preset with the selected element's configuration.",
  newPreset_info: "Open the Preset description window.",
  newPreset_add_to_session:
    "Save the currently active element configuration locally as a Session Preset.",
  newPreset_exit_overlay: "Hide the Overlay.",
  newPreset_desc_delete:
    "Delete this Preset from the Preset Storage permanently.",
  newPreset_desc_edit: "Edit the description of this Preset.",
  newPreset_load_preset:
    "Previously saved presets stored in your Local Folder are shown here.",
};
