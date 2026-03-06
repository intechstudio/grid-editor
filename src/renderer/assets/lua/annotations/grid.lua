---@meta grid

-- Grid Firmware Lua API Annotations
-- These annotations provide type information for the Lua Language Server (LuaLS)
-- when editing Grid firmware scripts in the Grid Editor.

---------------------------------------------------------------------------
-- Grid Element (accessed via `self` inside event handlers, or `element[n]`)
---------------------------------------------------------------------------

---@class GridElement
local GridElement = {}

-- ── Button functions ──────────────────────────────────────────────────

---Get or set the button value.
---@param value? integer  0 = released, 1 = pressed
---@return integer
function GridElement:button_value(value) end

---Get or set the button state.
---@param state? integer
---@return integer
function GridElement:button_state(state) end

---Get or set the minimum button value.
---@param min? integer
---@return integer
function GridElement:button_min(min) end

---Get or set the maximum button value.
---@param max? integer
---@return integer
function GridElement:button_max(max) end

---Get or set the button mode.
---@param mode? integer  0 = momentary, 1 = toggle
---@return integer
function GridElement:button_mode(mode) end

---Get or set the button step size.
---@param step? integer
---@return integer
function GridElement:button_step(step) end

---Get the elapsed time since the last button event (ms).
---@return integer
function GridElement:button_elapsed_time() end

-- ── Encoder functions ─────────────────────────────────────────────────

---Get or set the encoder value.
---@param value? integer
---@return integer
function GridElement:encoder_value(value) end

---Get or set the encoder state.
---@param state? integer
---@return integer
function GridElement:encoder_state(state) end

---Get or set the encoder minimum.
---@param min? integer
---@return integer
function GridElement:encoder_min(min) end

---Get or set the encoder maximum.
---@param max? integer
---@return integer
function GridElement:encoder_max(max) end

---Get or set the encoder mode.
---@param mode? integer
---@return integer
function GridElement:encoder_mode(mode) end

---Get or set the encoder number.
---@param num? integer
---@return integer
function GridElement:encoder_number(num) end

---Get or set the encoder sensitivity.
---@param sensitivity? integer
---@return integer
function GridElement:encoder_sensitivity(sensitivity) end

---Get the elapsed time since the last encoder event (ms).
---@return integer
function GridElement:encoder_elapsed_time() end

---Get the encoder velocity.
---@return integer
function GridElement:encoder_velocity() end

-- ── Endless Encoder functions ──────────────────────────────────────────

---Get or set the endless encoder value.
---@param value? integer
---@return integer
function GridElement:endless_value(value) end

---Get or set the endless encoder state.
---@param state? integer
---@return integer
function GridElement:endless_state(state) end

---Get or set the endless encoder minimum.
---@param min? integer
---@return integer
function GridElement:endless_min(min) end

---Get or set the endless encoder maximum.
---@param max? integer
---@return integer
function GridElement:endless_max(max) end

---Get or set the endless encoder mode.
---@param mode? integer
---@return integer
function GridElement:endless_mode(mode) end

---Get or set the endless encoder sensitivity.
---@param sensitivity? integer
---@return integer
function GridElement:endless_sensitivity(sensitivity) end

---Get the endless encoder direction.
---@return integer  1 = clockwise, -1 = counter-clockwise
function GridElement:endless_direction() end

---Get the elapsed time since the last endless encoder event (ms).
---@return integer
function GridElement:endless_elapsed_time() end

---Get the endless encoder velocity.
---@return integer
function GridElement:endless_velocity() end

---Get or set the LED offset for the endless encoder.
---@param offset? integer
---@return integer
function GridElement:led_offset(offset) end

-- ── Potentiometer functions ────────────────────────────────────────────

---Get or set the potentiometer value.
---@param value? integer  0–127
---@return integer
function GridElement:potmeter_value(value) end

---Get or set the potentiometer state.
---@param state? integer
---@return integer
function GridElement:potmeter_state(state) end

---Get or set the potentiometer minimum.
---@param min? integer
---@return integer
function GridElement:potmeter_min(min) end

---Get or set the potentiometer maximum.
---@param max? integer
---@return integer
function GridElement:potmeter_max(max) end

---Get or set the potentiometer resolution mode.
---@param mode? integer
---@return integer
function GridElement:potmeter_resolution(mode) end

---Get the elapsed time since the last potentiometer event (ms).
---@return integer
function GridElement:potmeter_elapsed_time() end

-- ── LCD / Display functions ───────────────────────────────────────────

---Draw a single pixel on the LCD.
---@param x integer  X position
---@param y integer  Y position
---@param color integer  Color value
function GridElement:draw_pixel(x, y, color) end

---Draw a line on the LCD.
---@param x1 integer
---@param y1 integer
---@param x2 integer
---@param y2 integer
---@param color integer
function GridElement:draw_line(x1, y1, x2, y2, color) end

---Draw a rectangle outline on the LCD.
---@param x integer
---@param y integer
---@param w integer
---@param h integer
---@param color integer
function GridElement:draw_rectangle(x, y, w, h, color) end

---Draw a filled rectangle on the LCD.
---@param x integer
---@param y integer
---@param w integer
---@param h integer
---@param color integer
function GridElement:draw_rectangle_filled(x, y, w, h, color) end

---Draw a rounded rectangle outline on the LCD.
---@param x integer
---@param y integer
---@param w integer
---@param h integer
---@param r integer  Corner radius
---@param color integer
function GridElement:draw_rectangle_rounded(x, y, w, h, r, color) end

---Draw a filled rounded rectangle on the LCD.
---@param x integer
---@param y integer
---@param w integer
---@param h integer
---@param r integer
---@param color integer
function GridElement:draw_rectangle_rounded_filled(x, y, w, h, r, color) end

---Draw a polygon outline.
---@param points table  Array of {x, y} coordinate pairs
---@param color integer
function GridElement:draw_polygon(points, color) end

---Draw a filled polygon.
---@param points table
---@param color integer
function GridElement:draw_polygon_filled(points, color) end

---Draw a filled area.
---@param x integer
---@param y integer
---@param w integer
---@param h integer
---@param color integer
function GridElement:draw_area_filled(x, y, w, h, color) end

---Render text on the LCD.
---@param x integer
---@param y integer
---@param text string
---@param color integer
function GridElement:draw_text(x, y, text, color) end

---Render text quickly (faster, lower quality) on the LCD.
---@param x integer
---@param y integer
---@param text string
---@param color integer
function GridElement:draw_text_fast(x, y, text, color) end

---Swap the display buffer (apply all pending draw calls).
function GridElement:draw_swap() end

---Run the built-in LCD demo.
function GridElement:draw_demo() end

---Get the time taken for the last render cycle (ms).
---@return integer
function GridElement:get_render_time() end

---Get the LCD screen width in pixels.
---@return integer
function GridElement:screen_width() end

---Get the LCD screen height in pixels.
---@return integer
function GridElement:screen_height() end

---Get or set the LCD screen index.
---@param index? integer
---@return integer
function GridElement:screen_index(index) end

-- ── Common element getters ─────────────────────────────────────────────

---Get the element index (0-based position on the module).
---@return integer
function GridElement:element_index() end

---Get the LED index for this element.
---@return integer
function GridElement:led_index() end

---Get or set the LED color for this element.
---@param layer? integer  LED layer (1 or 2)
---@param color? integer  Packed RGB color
---@return integer
function GridElement:led_color(layer, color) end

---------------------------------------------------------------------------
-- Global Grid functions (available in all scripts as top-level functions)
---------------------------------------------------------------------------

---Send a MIDI message.
---@param channel integer  MIDI channel (0–15)
---@param command integer  MIDI command byte (128–255)
---@param param1 integer   First parameter (0–127)
---@param param2 integer   Second parameter (0–127)
function midi_send(channel, command, param1, param2) end

---Send a raw MIDI SysEx message.
---@param data table  Array of bytes
function midi_sysex_send(data) end

---Get or set the automatic MIDI channel.
---@param channel? integer
---@return integer
function midi_auto_ch(channel) end

---Get or set the automatic MIDI command.
---@param command? integer
---@return integer
function midi_auto_cmd(command) end

---Get or set automatic MIDI parameter 1.
---@param param? integer
---@return integer
function midi_auto_p1(param) end

---Get or set automatic MIDI parameter 2.
---@param param? integer
---@return integer
function midi_auto_p2(param) end

---Enable or disable incoming MIDI Rx.
---@param enabled? integer  1 = enabled, 0 = disabled
---@return integer
function midirx_enabled(enabled) end

---Synchronise MIDI Rx state.
function midirx_sync() end

---Send a keyboard keystroke.
---@param ... integer  HID keycodes
function keyboard_send(...) end

---Send a mouse move event.
---@param x integer  Horizontal delta
---@param y integer  Vertical delta
function mouse_move_send(x, y) end

---Send a mouse button event.
---@param button integer  Button index
---@param state integer   1 = pressed, 0 = released
function mouse_button_send(button, state) end

---Send a gamepad axis move event.
---@param axis integer
---@param value integer
function gamepad_move_send(axis, value) end

---Send a gamepad button event.
---@param button integer
---@param state integer
function gamepad_button_send(button, state) end

---Load a page by index.
---@param page integer  Page number (0-based)
function page_load(page) end

---Get or set the current page index.
---@param page? integer
---@return integer
function page_current(page) end

---Switch to the next page.
function page_next() end

---Switch to the previous page.
function page_previous() end

---Trigger an element event programmatically.
---@param element_index integer
---@param event_type integer
function event_trigger(element_index, event_type) end

---Constrain a value between min and max.
---@param value integer
---@param min integer
---@param max integer
---@return integer
function limit(value, min, max) end

---Map and clamp a value to a target range, clamping at the boundaries.
---@param value integer   Input value
---@param in_min integer  Input range minimum
---@param in_max integer  Input range maximum
---@param out_min integer Output range minimum
---@param out_max integer Output range maximum
---@return integer
function map_saturate(value, in_min, in_max, out_min, out_max) end

---Get the sign of a value.
---@param value integer
---@return integer  -1, 0, or 1
function sign(value) end

---Get the count of elements on the current module.
---@return integer
function element_count() end

---Get or set the element name.
---@param element_index integer
---@param name? string
---@return string
function element_name(element_index, name) end

---Retrieve the element name (from firmware).
---@param element_index integer
function element_name_get(element_index) end

---Push the element name to firmware.
---@param element_index integer
function element_name_send(element_index) end

---Set the element name.
---@param element_index integer
---@param name string
function element_name_set(element_index, name) end

---Get the X position of the module on the grid.
---@return integer
function module_position_x() end

---Get the Y position of the module on the grid.
---@return integer
function module_position_y() end

---Get the rotation of the module (0, 90, 180, or 270 degrees).
---@return integer
function module_rotation() end

---Get the hardware configuration identifier.
---@return integer
function hardware_configuration() end

---Get the firmware major version.
---@return integer
function version_major() end

---Get the firmware minor version.
---@return integer
function version_minor() end

---Get the firmware patch version.
---@return integer
function version_patch() end

---Get a random 8-bit integer (0–255).
---@return integer
function random8() end

---Set the global LED color minimum intensity.
---@param value? integer
---@return integer
function led_color_min(value) end

---Set the global LED color mid intensity.
---@param value? integer
---@return integer
function led_color_mid(value) end

---Set the global LED color maximum intensity.
---@param value? integer
---@return integer
function led_color_max(value) end

---Get or set the default LED red component.
---@param value? integer
---@return integer
function led_default_red(value) end

---Get or set the default LED green component.
---@param value? integer
---@return integer
function led_default_green(value) end

---Get or set the default LED blue component.
---@param value? integer
---@return integer
function led_default_blue(value) end

---Get the address of the LED at the given position.
---@param index integer
---@return integer
function led_address_get(index) end

---Get or set the LED animation value/phase.
---@param layer? integer
---@param value? integer
---@return integer
function led_value(layer, value) end

---Get or set the LED animation rate/frequency.
---@param layer? integer
---@param rate? integer
---@return integer
function led_animation_rate(layer, rate) end

---Get or set the LED animation phase rate type.
---@param layer? integer
---@param type? integer
---@return integer
function led_animation_phase_rate_type(layer, type) end

---Get or set the LED animation shape/type.
---@param layer? integer
---@param shape? integer
---@return integer
function led_animation_type(layer, shape) end

---Get or set the LED timeout (ms).
---@param timeout? integer
---@return integer
function led_timeout(timeout) end

---Get or set the LED color for a specific layer and LED index.
---@param led_index integer
---@param layer integer
---@param color? integer  Packed RGB value
---@return integer
function led_color(led_index, layer, color) end

---Calculate LED layer from color_auto_layer override hook.
---@param self GridElement
---@return integer
function color_auto_layer(self) end

---Calculate LED value from color_auto_value override hook.
---@param self GridElement
---@param segment_index integer
---@return integer
function color_auto_value(self, segment_index) end

---Calculate three-point LED color response curve.
---@param color_array table
---@return table, table, table
function color_curve(color_array) end

---Decode a packed value.
---@param value integer
---@return integer, integer, integer, integer
function decode(value) end

---Look up a value in a table.
---@param index integer
---@param ... integer
---@return integer
function lookup(index, ...) end

---Calculate the LED segment index.
---@param value integer
---@param segments integer
---@return integer
function segment_calculate(value, segments) end

---Get a string by index.
---@param index integer
---@return string
function string_get(index) end

---Start a timer.
---@param timer_id integer
---@param interval integer  Interval in ms
function timer_start(timer_id, interval) end

---Stop a timer.
---@param timer_id integer
function timer_stop(timer_id) end

---Get or set the timer source.
---@param timer_id integer
---@param source? integer
---@return integer
function timer_source(timer_id, source) end

---Send an immediate Lua script to the grid.
---@param script string
function immediate_send(script) end

---Send a package payload.
---@param payload string
function package_send(payload) end

---Send a WebSocket message.
---@param message string
function websocket_send(message) end

---Reset potentiometer calibration.
function calibration_reset() end

---Get the current potentiometer calibration.
---@param element_index integer
---@return table
function potmeter_calibration_get(element_index) end

---Get the current range calibration.
---@param element_index integer
---@return table
function range_calibration_get(element_index) end

---Set range calibration values.
---@param element_index integer
---@param min integer
---@param max integer
function range_calibration_set(element_index, min, max) end

---Set the center calibration point for a potentiometer.
---@param element_index integer
---@param center integer
function potmeter_center_set(element_index, center) end

---Set the detent calibration point for a potentiometer.
---@param element_index integer
---@param detent integer
function potmeter_detent_set(element_index, detent) end

---Set the LCD backlight level.
---@param level integer  0–255
function lcd_set_backlight(level) end

---Read a file from the device filesystem.
---@param path string
---@return string
function readfile(path) end

---List the contents of a directory on the device filesystem.
---@param path string
---@return table
function readdir(path) end

---------------------------------------------------------------------------
-- Global GUI draw functions (available on modules with a built-in display)
---------------------------------------------------------------------------

---Draw a pixel on the global display.
---@param x integer
---@param y integer
---@param color integer
function gui_draw_pixel(x, y, color) end

---Draw a line on the global display.
---@param x1 integer
---@param y1 integer
---@param x2 integer
---@param y2 integer
---@param color integer
function gui_draw_line(x1, y1, x2, y2, color) end

---Draw a rectangle outline on the global display.
---@param x integer
---@param y integer
---@param w integer
---@param h integer
---@param color integer
function gui_draw_rectangle(x, y, w, h, color) end

---Draw a filled rectangle on the global display.
---@param x integer
---@param y integer
---@param w integer
---@param h integer
---@param color integer
function gui_draw_rectangle_filled(x, y, w, h, color) end

---Draw a rounded rectangle on the global display.
---@param x integer
---@param y integer
---@param w integer
---@param h integer
---@param r integer
---@param color integer
function gui_draw_rectangle_rounded(x, y, w, h, r, color) end

---Draw a filled rounded rectangle on the global display.
---@param x integer
---@param y integer
---@param w integer
---@param h integer
---@param r integer
---@param color integer
function gui_draw_rectangle_rounded_filled(x, y, w, h, r, color) end

---Draw a polygon on the global display.
---@param points table
---@param color integer
function gui_draw_polygon(points, color) end

---Draw a filled polygon on the global display.
---@param points table
---@param color integer
function gui_draw_polygon_filled(points, color) end

---Draw a filled area on the global display.
---@param x integer
---@param y integer
---@param w integer
---@param h integer
---@param color integer
function gui_draw_area_filled(x, y, w, h, color) end

---Render text on the global display.
---@param x integer
---@param y integer
---@param text string
---@param color integer
function gui_draw_text(x, y, text, color) end

---Render text quickly on the global display.
---@param x integer
---@param y integer
---@param text string
---@param color integer
function gui_draw_fasttext(x, y, text, color) end

---Swap the display buffer on the global display.
function gui_draw_swap() end

---Run the built-in demo on the global display.
function gui_draw_demo() end

---Get the global display render time (ms).
---@return integer
function gui_get_render_time() end

---------------------------------------------------------------------------
-- Pre-defined variables available inside event handlers
---------------------------------------------------------------------------

---The element that fired the current event.
---@type GridElement
self = {}

---An array of all elements on the current module (0-indexed).
---@type GridElement[]
element = {}
