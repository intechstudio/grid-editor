---@meta
-- =============================================================================
-- Grid Lua API Annotations
--
-- This file provides type information and documentation for the Grid Lua API
-- so that lua-language-server (LuaLS) can offer completions, hover docs,
-- signature help, and diagnostics in the Monaco editor.
--
-- Element subclasses are used to scope completions per hardware element type.
-- `self` and `element[]` are NOT declared here — they are injected per-editor
-- via a context document typed to the specific element subclass.
-- =============================================================================

-- =============================================================================
-- 1. SHARED TYPES & ALIASES
-- Put all dropdown menus and custom types here at the very top!
-- =============================================================================

---@alias Auto integer
---| -1 # Auto (use the configured element value / min-max)

---@alias Layer integer
---| -1 # Auto (use the active/configured layer)
---| 1  # Layer 1 (Button and Potmeter)
---| 2  # Layer 2 (Encoder and Endless)

---@alias EventType
---| 0 # setup (init) — runs once when the page is loaded
---| 1 # potmeter — potentiometer value changed
---| 2 # encoder — encoder rotated
---| 3 # button — button pressed or released
---| 4 # utility (mapmode) — utility/map mode event
---| 5 # midirx — MIDI message received (deprecated)
---| 6 # timer — periodic timer fired
---| 7 # endless — endless potentiometer rotated
---| 8 # draw — LCD screen draw event (VSN1 only)

-- =============================================================================
-- Element (base class)
--
-- Common methods available on all element types.
-- Do not use this type directly in user code — use the specific subclass.
-- =============================================================================

---**THE "self" VARIABLE**
---In Grid Lua, `self` always refers to the specific physical control (button, encoder, fader) 
---that you are currently interacting with. 
---
---When you use a function with `self:` (like `self:midi_send()`), you are 
---telling the Grid to apply that action specifically to **this exact element**.
---
---@class Element
---Called after element initialization. Triggers the init event handler.
---@field post_init_cb? fun(self: Element)
---Called when a MIDI message is received from the grid.
---### Usage
---Assign this in the element's Setup.
---- **header** `integer[]` - `{instr, sx, sy}`; use `header[1] == 13` to filter messages coming from a DAW/synth/other external gear.
---- **data** `integer[]` - `{channel, command, param1, param2}`.
---```
---self.midirx_cb = function(self, header, data)
---  if header[1] == 13 and data[2] == 176 then -- CC message from a DAW
---    print("CC "..data[3].." = "..data[4])
---  end
---end
---```
---@field midirx_cb? fun(self: Element, header: integer[], data: integer[])
---Called when a SysEx message is received from the grid.
---### Usage
---Assign this in the element's Setup.
---- **header** `integer[]` - `{instr, sx, sy}`
---- **data** `string` - the raw SysEx payload as a hex string.
---```
---self.sysexrx_cb = function(self, header, data)
---  local bytes = {}
---  for hex_byte in data:gmatch("%x%x") do
---    bytes[#bytes + 1] = tonumber(hex_byte, 16)
---  end
---  print("Manufacturer:", bytes[2])
---end
---```
---@field sysexrx_cb? fun(self: Element, header: integer[], data: string)
---Called when a MIDI Real-Time Message (clock/transport) is received. Must be enabled first via the RX Mode block (MIDI RTM).
---### Usage
---Assign this in the element's Setup.
---```
---self.rtmrx_cb = function(self, header, rtm_byte)
---  if rtm_byte == 250 then
---    print("Playback started")
---  end
---end
---```
---- **header** `integer[]` - `{instr, sx, sy}`
---- **rtm_byte** `integer` - the received status byte: `248` Clock, `250` Start, `251` Continue, `252` Stop.
---@field rtmrx_cb? fun(self: Element, header: integer[], rtm_byte: integer)
---Called when a value-change event is broadcast from any element on the page (potmeter, encoder, button, endless). Useful on VSN1 LCD elements to stay in sync with whichever control last changed, without wiring a listener per element.
---### Usage
---Assign this in the element's Setup, then redraw on the next `draw` event (see `EventType`).
---```
---self.eventrx_cb = function(self, header, event, value, name)
---  self.last_value = value[1] -- remember the new value
---  self.dirty = true -- redraw on the next draw event, see self:draw_swap()
---end
---```
---- **header** `integer[]` - `{instr, sx, sy}`
---- **event** `integer[]` - `{page, element, type}`; `type` matches `EventType`, e.g. `2` = encoder.
---- **value** `integer[]` - `{val, min, max}`.
---- **name** `string` - the changed element's display name.
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

---Gets or sets the name of this element.
---@param name? string If provided, sets the name
---@return string name Element name
function Element:element_name(name) end

---Starts a periodic timer for this element.
---@param period integer Timer period in milliseconds
function Element:timer_start(period) end

---Stops the timer for this element.
function Element:timer_stop() end

---Triggers an event on this element.
---@param event_type integer Event type index
function Element:event_trigger(event_type) end

---Sets the LED color and its value-based transition for this element.  
---  
---This function creates smooth color fades based on the element's current value (min to max).  
---You must provide a list of colors, where each color is `{red, green, blue, alpha}`.  
---* **RGB** values are `0-255`. You can also use `-1` for any RGB channel to use the element's auto-configured (factory) color.  
---* **Alpha** (brightness/opacity) is `0.0 - 1.0`.  
---    
---**The transition changes based on how many colors you provide:**  
---* **1 Color:** `{{-1, -1, -1, 1}}`
---  Sets the color for the MAX value (using the auto color in this example). The MIN value defaults to transparent (0 alpha).  
---* **2 Colors:** `{{0, 0, 255, 0.5}, {255, 0, 0, 1}}`
---  1st color is MIN value, 2nd color is MAX value.  
---* **3 Colors:** `{{0, 255, 0, 1}, {255, 255, 0, 1}, {255, 0, 0, 1}}`
---  1st color is MIN, 2nd color is MIDDLE, 3rd color is MAX value.  
---  
---@param layer Layer integer The LED layer to target (use `-1` for all/active layers).
---@param colors number[][] Array of color tables. Don't forget the double braces! Example: `{{-1, -1, -1, 1}}`
function Element:led_color(layer, colors) end



---Sets or gets the LED light intensity (brightness/phase) for this element.
---  
---When parameters are provided, it sets the intensity. The `-1` value is very common and tells the Grid to use the auto-configured setting.
---
---@param layer Layer integer The LED layer to target (`1`, `2`, or `-1` for auto).
---@param value integer The intensity level (`0-255`, or `-1` for auto).
---@return integer|nil current_value Returns the current value if called without parameters, otherwise nothing.
function Element:led_value(layer, value) end

---Sends a MIDI message from this specific element.  
---Pass -1 for any parameter to use the element's auto-configured value.  
---  
---
---@param channel integer MIDI channel (0-15). Note: Your DAW translates this as channels 1-16! (0 = Channel 1, or -1 for auto).
---@param command integer MIDI command type (e.g., 144 = Note On, 176=CC or -1 for auto).
---@param param1 integer Value (0-127). For Notes: Pitch (e.g., 60 = Middle C). For CC: Controller Number (e.g., 7 = Volume). (-1 for auto).
---@param param2 integer use -1 (Auto) for the element's min-max range. or provide a specific value.
---@param resolution? integer Optional MIDI resolution mode (0=Standard 7-bit, 1=14-bit, 2=NRPN, 3=14-bit NRPN). Defaults to 0.
function Element:midi_send(channel, command, param1, param2, resolution) end

---Registers a MIDI receive (RX) listener for this element.  
---This allows the element to automatically update its internal value or LED state 
---when the specified MIDI message is received from the host (DAW).  
---
---@param element_index integer Target element index (use `-1` for this specific element).
---@param channel integer MIDI channel (0-15, or -1 for auto).
---@param command integer MIDI command type (e.g., 144 = Note On, 176=CC or -1 for auto).
---@param param1 integer Note pitch or CC number (0-127, or -1 for auto).
---@param sync_config {value_sync: boolean, led_sync: boolean} Synchronization settings. Example: `{value_sync = true, led_sync = true}`.
---@param resolution integer resolution mode (0=Standard 7-bit, 1=14-bit, 2=NRPN, 3=14-bit NRPN).
function Element:midirx_register(element_index, channel, command, param1, sync_config, resolution) end

---Sends a MIDI SysEx message from this element.  
--- Send 8bit SysEx data bytes (0-255) as separate arguments. eg: (0xF0, 0x41, 0x10, 0xF7)
---@param ... integer SysEx data bytes
function Element:midi_sysex_send(...) end

-- =============================================================================
-- ButtonElement
-- Available on: BU16
-- =============================================================================

---@class ButtonElement : Element
local ButtonElement = {}

---Returns (or sets) the current button value.
---@param value? integer If provided, sets the button value
---@return integer value Current button value
function ButtonElement:button_value(value) end

---Returns (or sets) the minimum button value.
---@param value? integer If provided, sets the minimum
---@return integer min Minimum value
function ButtonElement:button_min(value) end

---Returns (or sets) the maximum button value.
---@param value? integer If provided, sets the maximum
---@return integer max Maximum value
function ButtonElement:button_max(value) end

---Returns (or sets) the button mode. 0 = momentary.
---@param value? integer If provided, sets the mode
---@return integer mode Button mode
function ButtonElement:button_mode(value) end

---Returns the button state. 0 = released, 127 = pressed.
---@return integer state Button state (0 or 127)
function ButtonElement:button_state() end

---Returns the time elapsed since the last button event (milliseconds).
---@return integer ms Elapsed time in milliseconds
function ButtonElement:button_elapsed_time() end

---Calculates the button step based on mode, min, max, and value.
---Returns false if button mode is 0 (momentary), otherwise returns the current step number.
---@return integer|boolean step Current step, or false if mode is 0
function ButtonElement:button_step() end

-- =============================================================================
-- EncoderElement
-- Available on: EN16
-- Encoders have both a rotary encoder and a push button.
-- =============================================================================

---@class EncoderElement : Element
local EncoderElement = {}

---Returns (or sets) the current encoder value.
---@param value? integer If provided, sets the encoder value
---@return integer value Current encoder value
function EncoderElement:encoder_value(value) end

---Returns (or sets) the minimum encoder value.
---@param value? integer If provided, sets the minimum
---@return integer min Minimum value
function EncoderElement:encoder_min(value) end

---Returns (or sets) the maximum encoder value.
---@param value? integer If provided, sets the maximum
---@return integer max Maximum value
function EncoderElement:encoder_max(value) end

---Returns (or sets) the encoder mode.
---@param value? integer If provided, sets the mode
---@return integer mode Encoder mode
function EncoderElement:encoder_mode(value) end

---Returns the encoder state (rotation direction). Values <64 = left, >63 = right.
---@return integer state Encoder state
function EncoderElement:encoder_state() end

---Returns the encoder velocity.
---@param value? integer If provided, sets the velocity
---@return integer velocity Rotation velocity
function EncoderElement:encoder_velocity(value) end

---Returns (or sets) the encoder sensitivity.
---@param value? integer If provided, sets the sensitivity
---@return integer sensitivity Encoder sensitivity
function EncoderElement:encoder_sensitivity(value) end

---Returns the time elapsed since the last encoder event (milliseconds).
---@return integer ms Elapsed time in milliseconds
function EncoderElement:encoder_elapsed_time() end

---Returns (or sets) the current button value.
---@param value? integer If provided, sets the button value
---@return integer value Current button value
function EncoderElement:button_value(value) end

---Returns (or sets) the minimum button value.
---@param value? integer If provided, sets the minimum
---@return integer min Minimum value
function EncoderElement:button_min(value) end

---Returns (or sets) the maximum button value.
---@param value? integer If provided, sets the maximum
---@return integer max Maximum value
function EncoderElement:button_max(value) end

---Returns (or sets) the button mode. 0 = momentary.
---@param value? integer If provided, sets the mode
---@return integer mode Button mode
function EncoderElement:button_mode(value) end

---Returns the button state. 0 = released, 127 = pressed.
---@return integer state Button state (0 or 127)
function EncoderElement:button_state() end

---Returns the time elapsed since the last button event (milliseconds).
---@return integer ms Elapsed time in milliseconds
function EncoderElement:button_elapsed_time() end

---Calculates the button step based on mode, min, max, and value.
---@return integer|boolean step Current step, or false if mode is 0
function EncoderElement:button_step() end

-- =============================================================================
-- PotmeterElement
-- Available on: PO16
-- =============================================================================

---@class PotmeterElement : Element
local PotmeterElement = {}

---Returns (or sets) the current potentiometer value.
---@param value? integer If provided, sets the value
---@return integer value Current potentiometer value
function PotmeterElement:potmeter_value(value) end

---Returns (or sets) the minimum potentiometer value.
---@param value? integer If provided, sets the minimum
---@return integer min Minimum value
function PotmeterElement:potmeter_min(value) end

---Returns (or sets) the maximum potentiometer value.
---@param value? integer If provided, sets the maximum
---@return integer max Maximum value
function PotmeterElement:potmeter_max(value) end

---Returns (or sets) the potentiometer resolution.
---@param value? integer If provided, sets the resolution
---@return integer resolution Potentiometer resolution
function PotmeterElement:potmeter_resolution(value) end

---Returns the potentiometer state.
---@return integer state Current state
function PotmeterElement:potmeter_state() end

---Returns the time elapsed since the last potentiometer event (milliseconds).
---@return integer ms Elapsed time in milliseconds
function PotmeterElement:potmeter_elapsed_time() end

-- =============================================================================
-- FaderElement
-- Available on: fader modules
-- Faders use the same API as potmeters.
-- =============================================================================

---@class FaderElement : Element
local FaderElement = {}

---Returns (or sets) the current fader value.
---@param value? integer If provided, sets the value
---@return integer value Current fader value
function FaderElement:potmeter_value(value) end

---Returns (or sets) the minimum fader value.
---@param value? integer If provided, sets the minimum
---@return integer min Minimum value
function FaderElement:potmeter_min(value) end

---Returns (or sets) the maximum fader value.
---@param value? integer If provided, sets the maximum
---@return integer max Maximum value
function FaderElement:potmeter_max(value) end

---Returns (or sets) the fader resolution.
---@param value? integer If provided, sets the resolution
---@return integer resolution Fader resolution
function FaderElement:potmeter_resolution(value) end

---Returns the fader state.
---@return integer state Current state
function FaderElement:potmeter_state() end

---Returns the time elapsed since the last fader event (milliseconds).
---@return integer ms Elapsed time in milliseconds
function FaderElement:potmeter_elapsed_time() end

-- =============================================================================
-- EndlessElement
-- Available on: EF44
-- Endless encoders have a rotary encoder, a push button, and an LED ring.
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

---Returns (or sets) the current button value.
---@param value? integer If provided, sets the button value
---@return integer value Current button value
function EndlessElement:button_value(value) end

---Returns (or sets) the minimum button value.
---@param value? integer If provided, sets the minimum
---@return integer min Minimum value
function EndlessElement:button_min(value) end

---Returns (or sets) the maximum button value.
---@param value? integer If provided, sets the maximum
---@return integer max Maximum value
function EndlessElement:button_max(value) end

---Returns (or sets) the button mode. 0 = momentary.
---@param value? integer If provided, sets the mode
---@return integer mode Button mode
function EndlessElement:button_mode(value) end

---Returns the button state. 0 = released, 127 = pressed.
---@return integer state Button state (0 or 127)
function EndlessElement:button_state() end

---Returns the time elapsed since the last button event (milliseconds).
---@return integer ms Elapsed time in milliseconds
function EndlessElement:button_elapsed_time() end

---Calculates the button step based on mode, min, max, and value.
---@return integer|boolean step Current step, or false if mode is 0
function EndlessElement:button_step() end

-- =============================================================================
-- LCDElement
-- Available on: VSN1 (screen elements)
-- All draw methods operate on a background buffer — call draw_swap() to push
-- changes to the visible screen.
-- =============================================================================

---@class LCDElement : Element
local LCDElement = {}

---Updates the screen with the contents of the background buffer.
function LCDElement:draw_swap() end

---Draws a pixel at (x, y) with the specified color.
---@param x integer X coordinate
---@param y integer Y coordinate
---@param color integer[] RGB color as {r, g, b} with 8-bit channels (0–255)
function LCDElement:draw_pixel(x, y, color) end

---Draws a line between two points.
---@param x1 integer Start X coordinate
---@param y1 integer Start Y coordinate
---@param x2 integer End X coordinate
---@param y2 integer End Y coordinate
---@param color integer[] RGB color as {r, g, b} with 8-bit channels (0–255)
function LCDElement:draw_line(x1, y1, x2, y2, color) end

---Draws a rectangle outline between two corner points.
---@param x1 integer Top-left X coordinate
---@param y1 integer Top-left Y coordinate
---@param x2 integer Bottom-right X coordinate
---@param y2 integer Bottom-right Y coordinate
---@param color integer[] RGB color as {r, g, b} with 8-bit channels (0–255)
function LCDElement:draw_rectangle(x1, y1, x2, y2, color) end

---Draws a filled rectangle between two corner points.
---@param x1 integer Top-left X coordinate
---@param y1 integer Top-left Y coordinate
---@param x2 integer Bottom-right X coordinate
---@param y2 integer Bottom-right Y coordinate
---@param color integer[] RGB color as {r, g, b} with 8-bit channels (0–255)
function LCDElement:draw_rectangle_filled(x1, y1, x2, y2, color) end

---Draws a rounded rectangle outline between two corner points.
---@param x1 integer Top-left X coordinate
---@param y1 integer Top-left Y coordinate
---@param x2 integer Bottom-right X coordinate
---@param y2 integer Bottom-right Y coordinate
---@param radius integer Corner radius in pixels
---@param color integer[] RGB color as {r, g, b} with 8-bit channels (0–255)
function LCDElement:draw_rectangle_rounded(x1, y1, x2, y2, radius, color) end

---Draws a filled rounded rectangle between two corner points.
---@param x1 integer Top-left X coordinate
---@param y1 integer Top-left Y coordinate
---@param x2 integer Bottom-right X coordinate
---@param y2 integer Bottom-right Y coordinate
---@param radius integer Corner radius in pixels
---@param color integer[] RGB color as {r, g, b} with 8-bit channels (0–255)
function LCDElement:draw_rectangle_rounded_filled(x1, y1, x2, y2, radius, color) end

---Draws a polygon outline using coordinate arrays.
---@param xs integer[] Array of X coordinates {x1, x2, x3, ...}
---@param ys integer[] Array of Y coordinates {y1, y2, y3, ...}
---@param color integer[] RGB color as {r, g, b} with 8-bit channels (0–255)
function LCDElement:draw_polygon(xs, ys, color) end

---Draws a filled polygon using coordinate arrays.
---@param xs integer[] Array of X coordinates {x1, x2, x3, ...}
---@param ys integer[] Array of Y coordinates {y1, y2, y3, ...}
---@param color integer[] RGB color as {r, g, b} with 8-bit channels (0–255)
function LCDElement:draw_polygon_filled(xs, ys, color) end

---Draws text at the specified position.
---@param text string Text to draw
---@param x integer X coordinate
---@param y integer Y coordinate
---@param size integer Font size
---@param color integer[] RGB color as {r, g, b} with 8-bit channels (0–255)
function LCDElement:draw_text(text, x, y, size, color) end

---Draws text at the specified position using fast rendering.
---@param text string Text to draw
---@param x integer X coordinate
---@param y integer Y coordinate
---@param size integer Font size
---@param color integer[] RGB color as {r, g, b} with 8-bit channels (0–255)
function LCDElement:draw_text_fast(text, x, y, size, color) end

---Fills an area with a solid color (no alpha blending).
---@param x1 integer Top-left X coordinate
---@param y1 integer Top-left Y coordinate
---@param x2 integer Bottom-right X coordinate
---@param y2 integer Bottom-right Y coordinate
---@param color integer[] RGB color as {r, g, b} with 8-bit channels (0–255)
function LCDElement:draw_area_filled(x1, y1, x2, y2, color) end

---Draws the n-th iteration of a built-in demo animation.
---@param n integer Demo iteration number
function LCDElement:draw_demo(n) end

---Returns the time spent rendering between the last two swaps, in microseconds.
---@return integer microseconds Render time
function LCDElement:get_render_time() end

---Returns the screen index used by low-level global GUI APIs.
---@return integer screen_index Screen index for use with gui_draw_* functions
function LCDElement:screen_index() end

---Returns the screen width in pixels.
---@return integer width Screen width
function LCDElement:screen_width() end

---Returns the screen height in pixels.
---@return integer height Screen height
function LCDElement:screen_height() end

-- =============================================================================
-- SystemElement
-- The system element is the last element in the element[] array (ele[#ele]).
-- It has no hardware-specific methods beyond the base Element class.
-- =============================================================================

---@class SystemElement : Element
local SystemElement = {}

-- =============================================================================
-- Global functions — MIDI
-- =============================================================================

---Sends a standard 7-bit MIDI message.  
---(Note: Use `self:midi_send()` to send the MIDI messages from an Element).  
---  
---
---@param channel integer MIDI channel (0-15). Note: Your DAW translates this as channels 1-16! (0 = Channel 1).
---@param command integer MIDI command type (e.g., 144 = Note On).
---@param param1 integer Value (0-127). For Notes: Pitch (e.g., 60 = Middle C). For CC: Controller Number (e.g., 7 = Volume).
---@param param2 integer Value (0-127). For Notes: Velocity (hit strength). For CC: Control Value (CV).
function midi_send(channel, command, param1, param2) end

---Sends a MIDI SysEx message.  
--- Send 8bit SysEx data bytes (0-255) as separate arguments. eg: (0xF0, 0x41, 0x10, 0xF7)
---@param ... integer SysEx data bytes
function midi_sysex_send(...) end

-- =============================================================================
-- Global functions — LED
-- =============================================================================

---Sets LED color by layer for a specific element LED.
---@param led_index integer Hardware LED index (use led_address_get to resolve)
---@param layer Layer integer LED layer
---@param red integer Red component (0–255)
---@param green integer Green component (0–255)
---@param blue integer Blue component (0–255)
function led_color(led_index, layer, red, green, blue) end

---Sets the LED phase/intensity value for a specific LED and layer.
---### Usage
---You can call this in the global scope.
---```
---led_value(self:element_index(), 2, 255) -- this sets LED to max brightness
---```
---@param led_index integer Hardware LED index
---@param layer Layer integer LED layer
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
---@param layer Layer integer LED layer
---@param value integer Animation rate
function led_animation_rate(led_index, layer, value) end

---Sets the LED animation type/shape for a specific LED and layer.
---@param led_index integer Hardware LED index
---@param layer Layer integer LED layer
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
---@return integer rotation Module rotation (0 - 0°,1 - 90°,2 - 180°, 3 - 270°)
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

---Returns the short code of the currently executing event handler.
---Possible values: "ini" (setup), "ec" (encoder), "bc" (button), "pc" (potmeter), "tim" (timer), "map" (utility) , "epc" (endless), "ld" (lcd draw).
---@return string event_name Event handler short code
function event_function_name() end

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
---Example: https://docs.intech.studio/wiki/more/immediate-send-explainer/
---@param x integer|nil Target module X coordinate. If nil and y is nil, broadcasts to all modules.
---@param y integer|nil Target module Y coordinate. If nil and x is nil, broadcasts to all modules.
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
-- Global functions — Auto values
-- =============================================================================

---Overrideable MIDI channel provider.
---Called by the system for every MIDI event.
---
---You can override it like:
---```lua
---midi_auto_ch = function(self)
---  return 0
---end
---```  
---more info: https://docs.intech.studio/wiki/more/midi-auto-value
---@param self table Context of the current MIDI event
---@return MIDI_Channel channel 0–15
function midi_auto_ch(self) end

---Overrideable MIDI command provider.
---Example override:
---```lua
---midi_auto_cmd = function(self)
---  return 144
---end
---```  
---more info: https://docs.intech.studio/wiki/more/midi-auto-value
---@param self table Context of the current MIDI event
---@return MIDI_Command command
function midi_auto_cmd(self) end

---Overrideable MIDI parameter 1 provider (note/CC number).
---Example override:
---```lua
---midi_auto_p1 = function(self)
---  return 60
---end
---```  
---more info: https://docs.intech.studio/wiki/more/midi-auto-value
---@param self table Context of the current MIDI event
---@return integer value
function midi_auto_p1(self) end

---Overrideable MIDI parameter 2 provider (velocity/value).
---Example override:
---```lua
---midi_auto_p2 = function(self)
---  return 127
---end
---```  
---more info: https://docs.intech.studio/wiki/more/midi-auto-value
---@param self table Context of the current MIDI event
---@return integer value
function midi_auto_p2(self) end

-- =============================================================================
-- MIDI RX Mode configuration
-- =============================================================================

---Configures which input sources are enabled for a specific MIDI message type.
---
---This function controls the RX Mode routing programmatically.
---
---### Types:
---- `0` = MIDI Voice
---- `1` = MIDI SysEx
---- `2` = MIDI RTM
---- `3` = Event View
---
---### Sources:
---- `0` = Disabled
---- `1` = USB
---- `2` = External (Ext)
---- `3` = USB + Ext
---- `4` = Internal (Int)
---- `5` = USB + Int
---- `6` = Ext + Int
---- `7` = USB + Ext + Int
---
---@param type integer MIDI message type (0–3)
---@param source integer Input source mask (0–7)
function rx_mode(type, source) end

-- =============================================================================
-- ERROR CATCHING STUBS (Do not use these functions globally!)
-- These are helper definitions to warn beginners who forget to use "self:"
-- =============================================================================

---@deprecated ❌ Incorrect usage! Did you forget "self:"? Use: self:button_value()
function button_value(value) end

---@deprecated ❌ Incorrect usage! Did you forget "self:"? Use: self:encoder_value()
function encoder_value(value) end

---@deprecated ❌ Incorrect usage! Did you forget "self:"? Use: self:potmeter_value()
function potmeter_value(value) end

---@deprecated ❌ Incorrect usage! Did you forget "self:"? Use: self:endless_value()
function endless_value(value) end