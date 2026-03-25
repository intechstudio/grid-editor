---@meta
-- =============================================================================
-- Grid Lua API Annotations
--
-- This file provides type information and documentation for the Grid Lua API
-- so that lua-language-server (LuaLS) can offer completions, hover docs,
-- signature help, and diagnostics in the Monaco editor.
--
-- See also: grid-screen-api.lua for LCD/screen, endless, and extended APIs.
-- =============================================================================

-- =============================================================================
-- Element class — represents a hardware element (encoder, button, potmeter, etc.)
--
-- An EN16 module has 16 encoder elements indexed 0–15.
-- A BU16 module has 16 button elements indexed 0–15.
-- A PO16 module has 16 potentiometer elements indexed 0–15.
--
-- In event handlers, `self` refers to the element that triggered the event.
-- `element[N]` accesses element N on the same module (0-based index).
--
-- All getter/setter methods are dual-purpose:
--   self:encoder_value()    -- reads the current value
--   self:encoder_value(64)  -- sets the value to 64
-- =============================================================================

---@class Element
---Called after element initialization. Triggers the init event handler. Override to customize.
---@field post_init_cb? fun(self: Element)
---Called when a MIDI message is received from the grid. header = {instr, sx, sy}, data = {channel, command, param1, param2}.
---@field midirx_cb? fun(self: Element, header: integer[], data: integer[])
---Called when a SysEx message is received from the grid. header = {instr, sx, sy}, data = hex string.
---@field sysexrx_cb? fun(self: Element, header: integer[], data: string)
---Called when an event view message is received (LCD). header = {instr, sx, sy}, event = {page, element, type}, value = {val, min, max}.
---@field eventrx_cb? fun(self: Element, header: integer[], event: integer[], value: integer[], name: string)
local Element = {}

---Returns (or sets) the 0-based index of this element on the module.
---@param value? integer If provided, sets the index
---@return integer index The element index (0–15 for a 16-element module)
function Element:element_index(value) end

---Returns (or sets) the LED index for this element.
---@param value? integer If provided, sets the LED index
---@return integer index The LED index
function Element:led_index(value) end

-- -- Encoder methods (available on encoder elements, e.g. EN16) ----------------

---Returns (or sets) the current encoder value.
---@param value? integer If provided, sets the encoder value
---@return integer value Current encoder value
function Element:encoder_value(value) end

---Returns (or sets) the minimum encoder value.
---@param value? integer If provided, sets the minimum
---@return integer min Minimum value
function Element:encoder_min(value) end

---Returns (or sets) the maximum encoder value.
---@param value? integer If provided, sets the maximum
---@return integer max Maximum value
function Element:encoder_max(value) end

---Returns (or sets) the encoder mode.
---@param value? integer If provided, sets the mode
---@return integer mode Encoder mode
function Element:encoder_mode(value) end

---Returns the encoder state (rotation direction). Values <64 = left, >63 = right.
---@return integer state Encoder state
function Element:encoder_state() end

---Returns the encoder velocity.
---@return integer velocity Rotation velocity
function Element:encoder_velocity() end

---Returns (or sets) the encoder sensitivity.
---@param value? integer If provided, sets the sensitivity
---@return integer sensitivity Encoder sensitivity
function Element:encoder_sensitivity(value) end

---Returns the time elapsed since the last encoder event (milliseconds).
---@return integer ms Elapsed time in milliseconds
function Element:encoder_elapsed_time() end

-- -- Button methods (available on all elements with buttons) -------------------

---Returns (or sets) the current button value.
---@param value? integer If provided, sets the button value
---@return integer value Current button value
function Element:button_value(value) end

---Returns (or sets) the minimum button value.
---@param value? integer If provided, sets the minimum
---@return integer min Minimum value
function Element:button_min(value) end

---Returns (or sets) the maximum button value.
---@param value? integer If provided, sets the maximum
---@return integer max Maximum value
function Element:button_max(value) end

---Returns (or sets) the button mode. 0 = momentary.
---@param value? integer If provided, sets the mode
---@return integer mode Button mode
function Element:button_mode(value) end

---Returns the button state. 0 = released, 127 = pressed.
---@return integer state Button state (0 or 127)
function Element:button_state() end

---Returns the time elapsed since the last button event (milliseconds).
---@return integer ms Elapsed time in milliseconds
function Element:button_elapsed_time() end

-- -- Potentiometer methods (available on potmeter/fader elements) --------------

---Returns (or sets) the current potentiometer value.
---@param value? integer If provided, sets the value
---@return integer value Current potentiometer value
function Element:potmeter_value(value) end

---Returns (or sets) the minimum potentiometer value.
---@param value? integer If provided, sets the minimum
---@return integer min Minimum value
function Element:potmeter_min(value) end

---Returns (or sets) the maximum potentiometer value.
---@param value? integer If provided, sets the maximum
---@return integer max Maximum value
function Element:potmeter_max(value) end

---Returns (or sets) the potentiometer resolution.
---@param value? integer If provided, sets the resolution
---@return integer resolution Potentiometer resolution
function Element:potmeter_resolution(value) end

---Returns the potentiometer state.
---@return integer state Current state
function Element:potmeter_state() end

---Returns the time elapsed since the last potentiometer event (milliseconds).
---@return integer ms Elapsed time in milliseconds
function Element:potmeter_elapsed_time() end

-- -- LED methods (available on all elements) -----------------------------------

---Sets the LED color for this element.
---@param layer integer LED layer index (-1 for all layers)
---@param colors table Color data table
function Element:led_color(layer, colors) end

---Calculates the button step based on mode, min, max, and value.
---Returns false if button mode is 0 (momentary), otherwise returns the
---current step number: value // ((max - min) // steps).
---@return integer|boolean step Current step, or false if mode is 0
function Element:button_step() end

-- -- Element naming methods (available on all elements via metatable) ----------

---Gets or sets the name of this element.
---@param name? string If provided, sets the name
---@return string name Element name
function Element:element_name(name) end

-- -- Timer methods (available on all elements via metatable) -------------------

---Starts a periodic timer for this element.
---@param period integer Timer period in milliseconds
function Element:timer_start(period) end

---Stops the timer for this element.
function Element:timer_stop() end

-- -- Event methods (available on all elements via metatable) -------------------

---Triggers an event on this element.
---@param event_type integer Event type index
function Element:event_trigger(event_type) end

-- =============================================================================
-- Global variables
-- =============================================================================

---The element that triggered the current event.
---@type Element
self = {}

---Array of all elements on the current module (0-based index).
---For an EN16 module, element[0] through element[15] are available.
---@type Element[]
element = {}

---Alias for `element`. Array of all elements on the current module (0-based index).
---System element is at ele[#ele] (last element).
---@type Element[]
ele = {}

-- =============================================================================
-- Event types
--
-- Each element can have event handlers attached to these event types.
-- The handler short codes are used internally (e.g. in --[[@cb]] tags).
-- =============================================================================

---@alias EventType
---| 0 # setup (init) — runs once when the page is loaded
---| 1 # potmeter — potentiometer value changed
---| 2 # encoder — encoder rotated
---| 3 # button — button pressed or released
---| 4 # utility (mapmode) — utility/map mode event
---| 5 # midirx — MIDI message received
---| 6 # timer — periodic timer fired
---| 7 # endless — endless potentiometer rotated
---| 8 # draw — LCD screen draw event (VSN1 only)

-- =============================================================================
-- Callback system
--
-- Elements support callback functions for receiving decoded messages from
-- other modules on the grid. Set these as fields on the element object.
--
-- These callbacks are invoked by the firmware's decode system whenever a
-- matching message arrives. They are optional — if not set, the message
-- type is silently ignored for that element.
--
-- The callback fields are declared on the Element class above:
--   post_init_cb  — called after element init, triggers init handler
--   midirx_cb     — MIDI receive: midirx_cb(self, {instr,sx,sy}, {ch,cmd,p1,p2})
--   sysexrx_cb    — SysEx receive: sysexrx_cb(self, {instr,sx,sy}, hex_data)
--   eventrx_cb    — Event view receive (LCD): eventrx_cb(self, header, event, value, name)
-- =============================================================================

-- =============================================================================
-- Event handler short codes (internal reference)
--
-- These are the short codes used in event handler tags --[[@XX]]:
--   ini = init/setup       ec = encoder          bc = button
--   pc  = potmeter         tim = timer           map = utility/mapmode
--   mrx = midi rx          epc = endless         ld  = draw (LCD)
--   cb  = init callback
-- =============================================================================

-- =============================================================================
-- Global functions — MIDI
-- =============================================================================

---Returns the short code of the currently executing event handler.
---Possible values: "ini", "ec", "bc", "pc", "tim", "map", "mrx", "epc", "ld".
---@return string event_name Event handler short code
function event_function_name() end

---@alias MIDI_Channel
---| -1 # auto
---| 0 # Channel 1
---| 1 # Channel 2
---| 2 # Channel 3
---| 3 # Channel 4
---| 4 # Channel 5
---| 5 # Channel 6
---| 6 # Channel 7
---| 7 # Channel 8
---| 8 # Channel 9
---| 9 # Channel 10
---| 10 # Channel 11
---| 11 # Channel 12
---| 12 # Channel 13
---| 13 # Channel 14
---| 14 # Channel 15
---| 15 # Channel 16

---@alias MIDI_Command
---| -1 # auto
---| 176 # Control change
---| 144 # Note on
---| 128 # Note off

---@alias MIDI_Param
---| -1 # auto
---| 0
---| 1
---| 2
---| 3
---| 4
---| 5
---| 6
---| 7
---| 8
---| 9
---| 10
---| 11
---| 12
---| 13
---| 14
---| 15
---| 16
---| 17
---| 18
---| 19
---| 20
---| 21
---| 22
---| 23
---| 24
---| 25
---| 26
---| 27
---| 28
---| 29
---| 30
---| 31
---| 32
---| 33
---| 34
---| 35
---| 36
---| 37
---| 38
---| 39
---| 40
---| 41
---| 42
---| 43
---| 44
---| 45
---| 46
---| 47
---| 48
---| 49
---| 50
---| 51
---| 52
---| 53
---| 54
---| 55
---| 56
---| 57
---| 58
---| 59
---| 60
---| 61
---| 62
---| 63
---| 64
---| 65
---| 66
---| 67
---| 68
---| 69
---| 70
---| 71
---| 72
---| 73
---| 74
---| 75
---| 76
---| 77
---| 78
---| 79
---| 80
---| 81
---| 82
---| 83
---| 84
---| 85
---| 86
---| 87
---| 88
---| 89
---| 90
---| 91
---| 92
---| 93
---| 94
---| 95
---| 96
---| 97
---| 98
---| 99
---| 100
---| 101
---| 102
---| 103
---| 104
---| 105
---| 106
---| 107
---| 108
---| 109
---| 110
---| 111
---| 112
---| 113
---| 114
---| 115
---| 116
---| 117
---| 118
---| 119
---| 120
---| 121
---| 122
---| 123
---| 124
---| 125
---| 126
---| 127

---Sends a MIDI message.
---Pass -1 for any parameter to use the auto-configured value.
---@param channel MIDI_Channel MIDI channel (0–15, or -1 for auto)
---@param command MIDI_Command MIDI command (e.g. 144=NoteOn, 176=CC, or -1 for auto)
---@param param1 MIDI_Param First parameter (0–127, or -1 for auto)
---@param param2 MIDI_Param Second parameter (0–127, or -1 for auto)
function midi_send(channel, command, param1, param2) end

---Sends a MIDI SysEx message.
---@param ... integer SysEx data bytes
function midi_sysex_send(...) end

-- =============================================================================
-- Global functions — LED
-- =============================================================================

---Sets LED color by layer for a specific element LED.
---@param led_index integer Hardware LED index (use led_address_get to resolve)
---@param layer integer LED layer
---@param red integer Red component (0–255)
---@param green integer Green component (0–255)
---@param blue integer Blue component (0–255)
function led_color(led_index, layer, red, green, blue) end

---Sets the LED phase/intensity value for a specific LED and layer.
---@param led_index integer Hardware LED index
---@param layer integer LED layer
---@param value integer Phase/intensity value (0–255)
function led_value(led_index, layer, value) end

---Sets the default red LED component for the module.
---@param value? integer If provided, sets the red value (0–255)
---@return integer red Current red value
function led_default_red(value) end

---Sets the default green LED component for the module.
---@param value? integer If provided, sets the green value (0–255)
---@return integer green Current green value
function led_default_green(value) end

---Sets the default blue LED component for the module.
---@param value? integer If provided, sets the blue value (0–255)
---@return integer blue Current blue value
function led_default_blue(value) end

---Sets the LED animation rate for a specific LED and layer.
---@param led_index integer Hardware LED index
---@param layer integer LED layer
---@param value integer Animation rate
function led_animation_rate(led_index, layer, value) end

---Sets the LED animation type/shape for a specific LED and layer.
---@param led_index integer Hardware LED index
---@param layer integer LED layer
---@param value integer Animation type
function led_animation_type(led_index, layer, value) end

-- =============================================================================
-- Global functions — Navigation & Pages
-- =============================================================================

---Returns the current page number (0-based).
---@return integer page Current page index
function page_current() end

---Loads a specific page.
---@param page integer Page index to load
function page_load(page) end

---Loads the next page.
function page_next() end

---Loads the previous page.
function page_prev() end

-- =============================================================================
-- Global functions — Module info
-- =============================================================================

---Returns the X position of this module in the grid.
---@return integer x Module X coordinate
function module_position_x() end

---Returns the Y position of this module in the grid.
---@return integer y Module Y coordinate
function module_position_y() end

---Returns the rotation of this module.
---@return integer rotation Module rotation (0, 90, 180, 270)
function module_rotation() end

---Returns the number of elements on this module.
---@return integer count Element count
function element_count() end

-- =============================================================================
-- Global functions — Timers
-- =============================================================================

---Starts a periodic timer for an element.
---@param element_index integer Element index
---@param period integer Timer period in milliseconds
function timer_start(element_index, period) end

---Stops the timer for an element.
---@param element_index integer Element index
function timer_stop(element_index) end

-- =============================================================================
-- Global functions — Events
-- =============================================================================

---Triggers an event on a specific element.
---@param element_index integer Element index
---@param event_type integer Event type
function event_trigger(element_index, event_type) end

-- =============================================================================
-- Global functions — Keyboard & Mouse
-- =============================================================================

---Sends a keyboard HID report.
function keyboard_send() end

---Sends a mouse button HID report.
---@param button integer Mouse button
---@param state integer Button state
function mouse_button_send(button, state) end

---Sends a mouse movement HID report.
---@param axis integer Movement axis
---@param position integer Movement amount
function mouse_move_send(axis, position) end

-- =============================================================================
-- Global functions — Utilities
-- =============================================================================

---Maps and saturates a value from one range to another.
---@param value number Input value
---@param from_min number Source range minimum
---@param from_max number Source range maximum
---@param to_min number Target range minimum
---@param to_max number Target range maximum
---@return number mapped Mapped and clamped value
function map_saturate(value, from_min, from_max, to_min, to_max) end

---Clamps a value to [min, max].
---@param value number Input value
---@param min number Minimum bound
---@param max number Maximum bound
---@return number clamped Clamped value
function limit(value, min, max) end

---Returns the sign of a number (-1, 0, or 1).
---@param value number Input value
---@return integer sign -1, 0, or 1
function sign(value) end

---Returns a random integer between 0 and 255.
---@return integer value Random byte (0–255)
function random8() end

---Calculates segment values for multi-segment LED elements.
---@param segment integer Segment index
---@param value integer Current value
---@param min integer Minimum value
---@param max integer Maximum value
---@return integer segment_value Calculated segment value (0–255)
function segment_calculate(segment, value, min, max) end

-- =============================================================================
-- Global functions — Communication
-- =============================================================================

---Sends a string message via the package protocol.
---@param message string Message to send
function package_send(message) end

---Sends a string message via WebSocket.
---@param message string Message to send
function websocket_send(message) end

---Sends Lua code for immediate execution on a remote module.
---@param x integer Target module X coordinate
---@param y integer Target module Y coordinate
---@param lua_code string Lua code to execute
function immediate_send(x, y, lua_code) end

-- =============================================================================
-- Global functions — Element naming
-- =============================================================================

---Sets the name of an element.
---@param element_index integer Element index
---@param name string Name to assign
function element_name_set(element_index, name) end

---Gets the name of an element.
---@param element_index integer Element index
---@return string name Element name
function element_name_get(element_index) end

---Sends an element name update notification.
---@param element_index integer Element index
function element_name_send(element_index) end

-- =============================================================================
-- LCD Element — screen drawing methods (VSN1 module)
--
-- LCD elements are available on modules with screens (e.g. VSN1).
-- In draw event handlers, `self` refers to the LCD element.
-- All draw methods operate on a background buffer — call draw_swap() to
-- push changes to the visible screen.
-- =============================================================================

---@class LcdElement : Element
local LcdElement = {}

---Updates the screen with the contents of the background buffer.
---Call this after drawing operations to make them visible.
function LcdElement:draw_swap() end

---Draws a pixel at (x, y) with the specified color.
---@param x integer X coordinate
---@param y integer Y coordinate
---@param color integer[] RGB color as {r, g, b} with 8-bit channels (0–255)
function LcdElement:draw_pixel(x, y, color) end

---Draws a line between two points.
---@param x1 integer Start X coordinate
---@param y1 integer Start Y coordinate
---@param x2 integer End X coordinate
---@param y2 integer End Y coordinate
---@param color integer[] RGB color as {r, g, b} with 8-bit channels (0–255)
function LcdElement:draw_line(x1, y1, x2, y2, color) end

---Draws a rectangle outline between two corner points.
---@param x1 integer Top-left X coordinate
---@param y1 integer Top-left Y coordinate
---@param x2 integer Bottom-right X coordinate
---@param y2 integer Bottom-right Y coordinate
---@param color integer[] RGB color as {r, g, b} with 8-bit channels (0–255)
function LcdElement:draw_rectangle(x1, y1, x2, y2, color) end

---Draws a filled rectangle between two corner points.
---@param x1 integer Top-left X coordinate
---@param y1 integer Top-left Y coordinate
---@param x2 integer Bottom-right X coordinate
---@param y2 integer Bottom-right Y coordinate
---@param color integer[] RGB color as {r, g, b} with 8-bit channels (0–255)
function LcdElement:draw_rectangle_filled(x1, y1, x2, y2, color) end

---Draws a rounded rectangle outline between two corner points.
---@param x1 integer Top-left X coordinate
---@param y1 integer Top-left Y coordinate
---@param x2 integer Bottom-right X coordinate
---@param y2 integer Bottom-right Y coordinate
---@param radius integer Corner radius in pixels
---@param color integer[] RGB color as {r, g, b} with 8-bit channels (0–255)
function LcdElement:draw_rectangle_rounded(x1, y1, x2, y2, radius, color) end

---Draws a filled rounded rectangle between two corner points.
---@param x1 integer Top-left X coordinate
---@param y1 integer Top-left Y coordinate
---@param x2 integer Bottom-right X coordinate
---@param y2 integer Bottom-right Y coordinate
---@param radius integer Corner radius in pixels
---@param color integer[] RGB color as {r, g, b} with 8-bit channels (0–255)
function LcdElement:draw_rectangle_rounded_filled(x1, y1, x2, y2, radius, color) end

---Draws a polygon outline using coordinate arrays.
---@param xs integer[] Array of X coordinates {x1, x2, x3, ...}
---@param ys integer[] Array of Y coordinates {y1, y2, y3, ...}
---@param color integer[] RGB color as {r, g, b} with 8-bit channels (0–255)
function LcdElement:draw_polygon(xs, ys, color) end

---Draws a filled polygon using coordinate arrays.
---@param xs integer[] Array of X coordinates {x1, x2, x3, ...}
---@param ys integer[] Array of Y coordinates {y1, y2, y3, ...}
---@param color integer[] RGB color as {r, g, b} with 8-bit channels (0–255)
function LcdElement:draw_polygon_filled(xs, ys, color) end

---Draws text at the specified position.
---@param text string Text to draw
---@param x integer X coordinate
---@param y integer Y coordinate
---@param size integer Font size
---@param color integer[] RGB color as {r, g, b} with 8-bit channels (0–255)
function LcdElement:draw_text(text, x, y, size, color) end

---Draws text at the specified position using fast rendering.
---Faster than draw_text but may have fewer font options.
---@param text string Text to draw
---@param x integer X coordinate
---@param y integer Y coordinate
---@param size integer Font size
---@param color integer[] RGB color as {r, g, b} with 8-bit channels (0–255)
function LcdElement:draw_text_fast(text, x, y, size, color) end

---Fills an area with a solid color (no alpha blending).
---@param x1 integer Top-left X coordinate
---@param y1 integer Top-left Y coordinate
---@param x2 integer Bottom-right X coordinate
---@param y2 integer Bottom-right Y coordinate
---@param color integer[] RGB color as {r, g, b} with 8-bit channels (0–255)
function LcdElement:draw_area_filled(x1, y1, x2, y2, color) end

---Draws the n-th iteration of a built-in demo animation.
---@param n integer Demo iteration number
function LcdElement:draw_demo(n) end

---Returns the time spent rendering between the last two swaps, in microseconds.
---@return integer microseconds Render time
function LcdElement:get_render_time() end

---Returns the screen index used by low-level global GUI APIs.
---@return integer screen_index Screen index for use with gui_draw_* functions
function LcdElement:screen_index() end

---Returns the screen width in pixels.
---@return integer width Screen width
function LcdElement:screen_width() end

---Returns the screen height in pixels.
---@return integer height Screen height
function LcdElement:screen_height() end

-- =============================================================================
-- Endless Potentiometer Element — methods for endless encoder elements (EF44)
--
-- Endless potentiometers combine a rotary encoder (endless_*) with a button
-- (button_*). The EF44 module has 4 such elements indexed 0–3.
-- =============================================================================

---@class EndlessElement : Element
local EndlessElement = {}

---Returns (or sets) the current endless potentiometer value.
---@param value? integer If provided, sets the value
---@return integer value Current value
function EndlessElement:endless_value(value) end

---Returns (or sets) the minimum endless potentiometer value.
---@param value? integer If provided, sets the minimum
---@return integer min Minimum value
function EndlessElement:endless_min(value) end

---Returns (or sets) the maximum endless potentiometer value.
---@param value? integer If provided, sets the maximum
---@return integer max Maximum value
function EndlessElement:endless_max(value) end

---Returns (or sets) the endless potentiometer mode.
---@param value? integer If provided, sets the mode
---@return integer mode Mode value
function EndlessElement:endless_mode(value) end

---Returns the endless potentiometer state.
---@return integer state Current state
function EndlessElement:endless_state() end

---Returns the endless potentiometer velocity.
---@return integer velocity Rotation velocity
function EndlessElement:endless_velocity() end

---Returns the endless potentiometer direction.
---@return integer direction Rotation direction
function EndlessElement:endless_direction() end

---Returns (or sets) the endless potentiometer sensitivity.
---@param value? integer If provided, sets the sensitivity
---@return integer sensitivity Sensitivity value
function EndlessElement:endless_sensitivity(value) end

---Returns the LED offset for this endless element.
---@param value? integer If provided, sets the offset
---@return integer offset LED offset
function EndlessElement:led_offset(value) end

---Calculates the button step based on mode, min, max, and value.
---Returns false if button mode is 0 (momentary), otherwise returns the
---current step number: value // ((max - min) // steps).
---@return integer|boolean step Current step, or false if mode is 0
function EndlessElement:button_step() end