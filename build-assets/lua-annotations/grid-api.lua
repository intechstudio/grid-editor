---@meta
-- =============================================================================
-- Grid Lua API Annotations (representative subset)
--
-- This file provides type information and documentation for the Grid Lua API
-- so that lua-language-server (LuaLS) can offer completions, hover docs,
-- signature help, and diagnostics in the Monaco editor.
--
-- NOTE: This is a representative subset of the full API. In the future,
-- annotations will be auto-generated from @intechstudio/grid-protocol luadocs.
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

-- =============================================================================
-- Global functions — MIDI
-- =============================================================================

---Sends a MIDI message.
---Pass -1 for any parameter to use the auto-configured value.
---@param channel integer MIDI channel (0–15, or -1 for auto)
---@param command integer MIDI command (e.g. 144=NoteOn, 176=CC, or -1 for auto)
---@param param1 integer First parameter (0–127, or -1 for auto)
---@param param2 integer Second parameter (0–127, or -1 for auto)
function midi_send(channel, command, param1, param2) end

---Sends a MIDI SysEx message.
---@param ... integer SysEx data bytes
function midi_sysex_send(...) end

-- =============================================================================
-- Global functions — LED
-- =============================================================================

---Sets LED color by layer for a specific element.
---@param element_index integer Element index
---@param layer integer LED layer (-1 for all)
---@param red integer Red component (0–255)
---@param green integer Green component (0–255)
---@param blue integer Blue component (0–255)
function led_color(element_index, layer, red, green, blue) end

---Sets the LED brightness value.
---@param value integer Brightness (0–255)
function led_value(value) end

---Sets the default red LED component.
---@param value integer Red (0–255)
function led_default_red(value) end

---Sets the default green LED component.
---@param value integer Green (0–255)
function led_default_green(value) end

---Sets the default blue LED component.
---@param value integer Blue (0–255)
function led_default_blue(value) end

---Sets the LED animation rate.
---@param value integer Animation rate
function led_animation_rate(value) end

---Sets the LED animation type.
---@param value integer Animation type
function led_animation_type(value) end

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
function page_previous() end

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

---Gets or sets the name of an element.
---@param element_index integer Element index
---@param name? string If provided, sets the name
---@return string name Element name
function element_name(element_index, name) end

-- =============================================================================
-- Test stub (kept for continuity from initial integration)
-- =============================================================================

---@class Vector3
---@field x number
---@field y number
---@field z number
---@operator add(Vector3): Vector3
---@operator mul(number): Vector3

---@alias Color
---| "red"
---| "green"
---| "blue"
---| "yellow"

---@class Entity
---@field id integer
---@field name string
---@field position Vector3
---@field tags string[]
---@field metadata table<string, any>

---@class SpawnOptions
---@field color? Color
---@field scale? number
---@field callback? fun(entity: Entity): boolean
---@field parent? Entity

---Spawns an entity in the world.
---@param name string Entity name
---@param pos Vector3 Spawn position
---@param opts? SpawnOptions Optional configuration
---@return Entity entity The spawned entity
---@return boolean success Whether the spawn succeeded
---@nodiscard
function spawnEntity(name, pos, opts)
end