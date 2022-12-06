import { writable, get, derived } from 'svelte/store'

import grid from '../protocol/grid-protocol'
import instructions from '../serialport/instructions'
import { writeBuffer, sendHeartbeat } from './engine.store'
import _utils from './_utils'

import { appSettings } from './app-helper.store'

const { env } = window.ctxProcess

console.log(
  'Minimum Firmware Version Required: ',
  get(appSettings).firmware_required,
)

let lastPageActivator = ''

async function detectActiveWindow() {
  if (get(appSettings).persistant.pageActivatorEnabled !== true) {
    return
  }

  try {
    if (get(appSettings).intervalPause) return

    let result = await window.electron.activeWindow()

    if (result === undefined) {
      result = { owner: { name: 'Unknown!' }, title: 'Invalid title!' }
    }

    if (get(appSettings).intervalPause) return
    if (get(unsaved_changes) !== 0) return

    appSettings.update((s) => {
      s.activeWindowResult = result
      return s
    })

    if (get(appSettings).persistant.pageActivatorEnabled !== true) {
      return
    }

    if (lastPageActivator === result.owner.name) {
      return
    }

    let criteria = [
      get(appSettings).persistant.pageActivatorCriteria_0,
      get(appSettings).persistant.pageActivatorCriteria_1,
      get(appSettings).persistant.pageActivatorCriteria_2,
      get(appSettings).persistant.pageActivatorCriteria_3,
    ]

    for (let i = 0; i < 4; i++) {
      if (criteria[i] === result.owner.name) {
        lastPageActivator = result.owner.name

        runtime.change_page(i)
        return
      }
    }

    // default to page 0 if not found
    lastPageActivator = result.owner.name
    runtime.change_page(0)
  } catch (e) {
    console.error('detectActiveWindow failed', e)
  }
}

const setIntervalAsync = (fn, ms) => {
  fn().then(() => {
    setTimeout(() => setIntervalAsync(fn, ms), ms)
  })
}

const setIntervalAsyncActiveWindow = (fn) => {
  fn().then(() => {
    let interval = get(appSettings).persistant.pageActivatorInterval
    setTimeout(() => setIntervalAsyncActiveWindow(fn), interval)
  })
}

setIntervalAsyncActiveWindow(detectActiveWindow)

// The controller which is added to runtime first, load a default config!

let selection_changed_timestamp = 0

export const controlElementClipboard = writable([])
export const appActionClipboard = writable([])
export const conditionalConfigPlacement = writable()

export const elementPositionStore = writable({})
export const elementNameStore = writable({})
export const ledColorStore = writable({})

export function update_elementPositionStore(descr) {
  let eps = get(elementPositionStore)

  if (eps[descr.brc_parameters.SX] === undefined) {
    eps[descr.brc_parameters.SX] = {}
  }
  if (eps[descr.brc_parameters.SX][descr.brc_parameters.SY] === undefined) {
    eps[descr.brc_parameters.SX][descr.brc_parameters.SY] = {}
  }
  if (
    eps[descr.brc_parameters.SX][descr.brc_parameters.SY][
      descr.class_parameters.ELEMENTNUMBER
    ] === undefined
  ) {
    eps[descr.brc_parameters.SX][descr.brc_parameters.SY][
      descr.class_parameters.ELEMENTNUMBER
    ] = -1
  }

  eps[descr.brc_parameters.SX][descr.brc_parameters.SY][
    descr.class_parameters.ELEMENTNUMBER
  ] = descr.class_parameters.EVENTPARAM

  elementPositionStore.set(eps)
}

export function update_elementNameStore(descr) {
  let ens = get(elementNameStore)

  if (ens[descr.brc_parameters.SX] === undefined) {
    ens[descr.brc_parameters.SX] = {}
  }
  if (ens[descr.brc_parameters.SX][descr.brc_parameters.SY] === undefined) {
    ens[descr.brc_parameters.SX][descr.brc_parameters.SY] = {}
  }
  if (
    ens[descr.brc_parameters.SX][descr.brc_parameters.SY][
      descr.class_parameters.NUM
    ] === undefined
  ) {
    ens[descr.brc_parameters.SX][descr.brc_parameters.SY][
      descr.class_parameters.NUM
    ] = -1
  }

  ens[descr.brc_parameters.SX][descr.brc_parameters.SY][
    descr.class_parameters.NUM
  ] = descr.class_parameters.NAME

  elementNameStore.set(ens)
}

export function update_elementPositionStore_fromPreview(descr) {
  let eps = get(elementPositionStore)

  if (eps[descr.brc_parameters.SX] === undefined) {
    eps[descr.brc_parameters.SX] = {}
  }
  if (eps[descr.brc_parameters.SX][descr.brc_parameters.SY] === undefined) {
    eps[descr.brc_parameters.SX][descr.brc_parameters.SY] = {}
  }

  for (let i = 1; i < descr.class_parameters.LENGTH / 4; i++) {
    const num = parseInt(
      '0x' +
        String.fromCharCode(descr.raw[4 + i * 4 + 0]) +
        String.fromCharCode(descr.raw[4 + i * 4 + 1]),
    )
    const val = parseInt(
      '0x' +
        String.fromCharCode(descr.raw[4 + i * 4 + 2]) +
        String.fromCharCode(descr.raw[4 + i * 4 + 3]),
    )
    //console.log(num, val)

    if (
      eps[descr.brc_parameters.SX][descr.brc_parameters.SY][num] === undefined
    ) {
      eps[descr.brc_parameters.SX][descr.brc_parameters.SY][num] = -1
    }

    eps[descr.brc_parameters.SX][descr.brc_parameters.SY][num] = val

    elementPositionStore.set(eps)
  }
}

export function update_ledColorStore(descr) {
  for (let i = 0; i < descr.class_parameters.LENGTH / 8; i++) {
    const num = parseInt(
      '0x' +
        String.fromCharCode(descr.raw[8 + i * 8 + 0]) +
        String.fromCharCode(descr.raw[8 + i * 8 + 1]),
    )
    const red = parseInt(
      '0x' +
        String.fromCharCode(descr.raw[8 + i * 8 + 2]) +
        String.fromCharCode(descr.raw[8 + i * 8 + 3]),
    )
    const gre = parseInt(
      '0x' +
        String.fromCharCode(descr.raw[8 + i * 8 + 4]) +
        String.fromCharCode(descr.raw[8 + i * 8 + 5]),
    )
    const blu = parseInt(
      '0x' +
        String.fromCharCode(descr.raw[8 + i * 8 + 6]) +
        String.fromCharCode(descr.raw[8 + i * 8 + 7]),
    )

    //console.log(num, red, gre, blu)

    let lcs = get(ledColorStore)

    if (lcs[descr.brc_parameters.SX] === undefined) {
      lcs[descr.brc_parameters.SX] = {}
    }
    if (lcs[descr.brc_parameters.SX][descr.brc_parameters.SY] === undefined) {
      lcs[descr.brc_parameters.SX][descr.brc_parameters.SY] = {}
    }
    if (
      lcs[descr.brc_parameters.SX][descr.brc_parameters.SY][num] === undefined
    ) {
      lcs[descr.brc_parameters.SX][descr.brc_parameters.SY][num] = [0, 0, 0]
    }

    lcs[descr.brc_parameters.SX][descr.brc_parameters.SY][num][0] = red * 4
    lcs[descr.brc_parameters.SX][descr.brc_parameters.SY][num][1] = gre * 4
    lcs[descr.brc_parameters.SX][descr.brc_parameters.SY][num][2] = blu * 4

    ledColorStore.set(lcs)
  }
}

function createLogger() {
  const _log_store = writable({ type: '', message: '', classname: '' })
  const _trigger = writable(0)

  function set_log(value) {
    _log_store.set(value)
    _trigger.update((n) => n + 1)
  }

  const _log = derived([_trigger], ([$t]) => {
    return { ...get(_log_store), n: $t }
  })

  return {
    set: set_log,
    subscribe: _log.subscribe,
  }
}

export const logger = createLogger()

//debug monitor lua section
function create_luadebug_store() {
  const store = writable({ config: '', enabled: true, data: [] })

  return {
    ...store,
    update_config: (value) => {
      store.update((s) => {
        s.config = value
        return s
      })
    },
  }
}

export const luadebug_store = create_luadebug_store()

function createMultiSelect() {
  const default_values = {
    multiselect: false,
    selection: [],
    all_selected: false,
  }

  const store = writable(default_values)

  return {
    ...store,
    reset: () => {
      store.update((s) => {
        s.multiselect = false
        s.all_selected = false
        s.selection = []
        return s
      })
    },
  }
}

export const appMultiSelect = createMultiSelect()

function create_user_input() {
  const defaultValues = {
    brc: {
      dx: '0',
      dy: '0',
      rot: '0',
    },
    event: {
      pagenumber: 0,
      elementnumber: -1, // should be checked out if grid sends back array or not
      eventtype: 2,
    },
  }

  const _event = writable({ ...defaultValues })

  function process_incoming_event_from_grid(descr) {
    // engine is disabled
    if (get(engine) === 'DISABLED') {
      return
    }

    // track physical interaction
    if (!get(appSettings).changeOnContact) {
      return
    }

    // modal block track physical interaction setting
    if (get(appSettings).modal !== '') {
      return
    }

    // event is init, mapmode, midirx, timer
    if (
      descr.class_parameters.EVENTTYPE == 0 ||
      descr.class_parameters.EVENTTYPE == 4 ||
      descr.class_parameters.EVENTTYPE == 5 ||
      descr.class_parameters.EVENTTYPE == 6
    ) {
      return
    }

    // system element
    if (descr.class_parameters.ELEMENTNUMBER == 255) {
      return
    }
    const store = get(_event)

    // filter same control element had multiple interactions
    let elementDifferent =
      store.event.elementnumber != descr.class_parameters.ELEMENTNUMBER
    let eventDifferent =
      store.event.eventtype != descr.class_parameters.EVENTTYPE
    let sxDifferent = store.brc.dx != descr.brc_parameters.SX
    let syDifferent = store.brc.dy != descr.brc_parameters.SY

    if (eventDifferent || elementDifferent || sxDifferent || syDifferent) {
      let current_timestamp = Date.now()

      if (current_timestamp - 100 > selection_changed_timestamp) {
        selection_changed_timestamp = current_timestamp
      } else {
        return
      }

      _event.update((store) => {
        const rt = get(runtime)

        let device = rt.find(
          (device) =>
            device.dx == descr.brc_parameters.SX &&
            device.dy == descr.brc_parameters.SY,
        )

        if (device === undefined) {
          return store
        }

        // lets find out what type of module this is....
        store.brc.dx = descr.brc_parameters.SX // coming from source x, will send data back to destination x
        store.brc.dy = descr.brc_parameters.SY // coming from source y, will send data back to destination y
        store.brc.rot = descr.brc_parameters.ROT

        store.event.eventtype = descr.class_parameters.EVENTTYPE
        store.event.elementnumber = descr.class_parameters.ELEMENTNUMBER

        let elementtype =
          grid.moduleElements[device.id.split('_')[0]][
            store.event.elementnumber
          ]
        store.event.elementtype = elementtype

        return store
      })
    } else {
      let current_timestamp = Date.now()
      selection_changed_timestamp = current_timestamp
    }
  }

  function update_eventtype(value) {
    const eventtype = get(user_input).event.eventtype
    if (eventtype != value) {
      _event.update((s) => {
        s.event.eventtype = value
        return s
      })
    }
  }

  function update_elementnumber(value) {
    const elementnumber = get(user_input).event.elementnumber
    if (elementnumber != value) {
      _event.update((s) => {
        s.event.elementnumber = value
        return s
      })
    }
  }

  function module_destroy_handler(dx, dy) {
    // This is used to re-init local settings panel if a module is removed which values have been displayed
    const li = get(_event)

    if (dx == li.brc.dx && dy == li.brc.dy) {
      _event.set({ ...defaultValues })
    }
  }

  function reset() {
    _event.set({ ...defaultValues })
  }

  return {
    ..._event,
    subscribe: _event.subscribe,
    update: _event.update,
    process_incoming_event_from_grid: process_incoming_event_from_grid,
    update_eventtype: update_eventtype,
    update_elementnumber: update_elementnumber,
    module_destroy_handler: module_destroy_handler,
    reset: reset,
  }
}

export const user_input = create_user_input()

export const unsaved_changes = writable(0)

function create_runtime() {
  const _runtime = writable([])

  const findUpdateDestEvent = (_runtime, dx, dy, page, element, event) => {
    let _event = undefined
    // this elementnumber check refers to uninitialized UI...
    if (element !== -1) {
      _runtime.forEach((device) => {
        if (device.dx == dx && device.dy == dy) {
          try {
            const pageIndex = device.pages.findIndex(
              (x) => x.pageNumber == page,
            )
            const elementIndex = device.pages[
              pageIndex
            ].control_elements.findIndex(
              (x) => x.controlElementNumber == element,
            )
            _event = device.pages[pageIndex].control_elements[
              elementIndex
            ].events.find((e) => e.event.value == event)
          } catch (error) {
            console.error("Couldn't update in destination: ", li)
          }
        }
      })
    }
    return _event
  }

  function fetchOrLoadConfig(ui, callback) {
    //console.log("Fetch Or Load")

    const rt = get(runtime)

    const device = rt.find(
      (device) => device.dx == ui.brc.dx && device.dy == ui.brc.dy,
    )
    const pageIndex = device.pages.findIndex(
      (x) => x.pageNumber == ui.event.pagenumber,
    )
    const elementIndex = device.pages[pageIndex].control_elements.findIndex(
      (x) => x.controlElementNumber == ui.event.elementnumber,
    )

    if (device.pages[pageIndex].control_elements[elementIndex] === undefined)
      return

    const eventIndex = device.pages[pageIndex].control_elements[
      elementIndex
    ].events.findIndex((x) => x.event.value == ui.event.eventtype)

    //console.log(device, pageIndex, elementIndex, eventIndex)

    const cfgstatus =
      device.pages[pageIndex].control_elements[elementIndex].events[eventIndex]
        .cfgStatus

    if (
      cfgstatus == 'GRID_REPORT' ||
      cfgstatus == 'EDITOR_EXECUTE' ||
      cfgstatus == 'EDITOR_BACKGROUND'
    ) {
      // its loaded
      if (callback !== undefined) {
        callback()
      }
    } else {
      // fetch
      const dx = ui.brc.dx
      const dy = ui.brc.dy
      const page = ui.event.pagenumber
      const element = ui.event.elementnumber
      const event = ui.event.eventtype

      instructions.fetchConfigFromGrid(dx, dy, page, element, event, callback)
    }

    return
  }

  function incoming_heartbeat_handler(descr) {
    let controller = this.create_module(
      descr.brc_parameters,
      descr.class_parameters,
      false,
    )

    if (controller === undefined) {
      return
    }

    let firstConnection = false

    _runtime.update((_runtime) => {
      let online = false
      _runtime.forEach((device) => {
        // device is online, update the uptime
        if (device.id == controller.id) {
          online = true
          device.rot = controller.rot // UPDATE ROTATION, AS NEIGHTBOUR MODULE REMEMBERS INVALID ROT!
          device.alive = Date.now()
        }
      })
      // device not found, add it to runtime and get page count from grid
      if (!online) {
        // check if the firmware version of the newly connected device is acceptable
        let moduleMismatch = true

        const firmware_required = get(appSettings).firmware_required

        if (controller.fwVersion.major > firmware_required.major) {
          moduleMismatch = false
        } else if (
          controller.fwVersion.major == firmware_required.major &&
          controller.fwVersion.minor > firmware_required.minor
        ) {
          moduleMismatch = false
        } else if (
          controller.fwVersion.major == firmware_required.major &&
          controller.fwVersion.minor == firmware_required.minor &&
          controller.fwVersion.patch > firmware_required.patch
        ) {
          moduleMismatch = false
        } else if (
          controller.fwVersion.major == firmware_required.major &&
          controller.fwVersion.minor == firmware_required.minor &&
          controller.fwVersion.patch == firmware_required.patch
        ) {
          moduleMismatch = false
        }

        if (moduleMismatch === true) {
          controller.fwMismatch = true
        }

        console.log(
          'Mismatch: ',
          moduleMismatch,
          'Firmware Version: ',
          controller.fwVersion,
        )

        _runtime.push(controller)

        if (_runtime.length === 1) {
          firstConnection = true
        }

        window.electron.analytics.influx(
          'application',
          'runtime',
          'module count',
          _runtime.lengt,
        )
      }

      return _runtime
    })

    if (firstConnection) {
      setTimeout(() => {
        user_input.update((ui) => {
          ui.brc.dx = controller.dx
          ui.brc.dy = controller.dy
          ui.event.elementnumber = 0

          ui.event.elementtype =
            controller.pages[
              ui.event.pagenumber
            ].control_elements[0].controlElementType
          ui.event.eventtype = 0
          return ui
        })
      }, 500)
    }
  }

  function erase_all() {
    _runtime.update((rt) => {
      rt.forEach((device) => {
        device.pages.forEach((page) => {
          page.control_elements.forEach((events) => {
            events.events.forEach((event) => {
              event.config = ''
              event.cfgStatus = 'ERASED'
            })
          })
        })
      })
      return rt
    })
  }

  function element_preset_load(preset) {
    console.log(preset)

    const li = get(user_input)

    if (li.event.elementtype == preset.type) {
      console.log('GOOD TYPE')

      let events = preset.configs.events

      events.forEach((ev, index) => {
        let callback
        if (index === events.length - 1) {
          // last element
          callback = function () {
            logger.set({
              type: 'success',
              mode: 0,
              classname: 'elementoverwrite',
              message: `Overwrite done!`,
            })
            user_input.update((n) => n)
          }
        } else {
          callback = undefined
        }

        let li = get(user_input)

        const dx = li.brc.dx
        const dy = li.brc.dy
        const page = li.event.pagenumber
        const element = li.event.elementnumber
        const event = ev.event

        console.log(index, dx, dy, page, element, event, ev)

        _runtime.update((_runtime) => {
          let dest = findUpdateDestEvent(_runtime, dx, dy, page, element, event)
          if (dest) {
            console.log('FOUND')
            dest.config = ev.config
            dest.cfgStatus = 'EDITOR_BACKGROUND'

            instructions.sendConfigToGrid(
              dx,
              dy,
              page,
              element,
              event,
              dest.config,
              callback,
            )
            // trigger change detection
          }
          return _runtime
        })
      })
    } else {
      logger.set({
        type: 'fail',
        mode: 0,
        classname: 'elementoverwrite',
        message: `Target element is different!`,
      })
    }
  }

  function whole_element_overwrite({ controlElementType, events }) {
    const li = get(user_input)

    if (li.event.elementtype == controlElementType) {
      events.forEach((ev, index) => {
        let callback
        if (index === events.length - 1) {
          // last element
          callback = function () {
            logger.set({
              type: 'success',
              mode: 0,
              classname: 'elementoverwrite',
              message: `Overwrite done!`,
            })
            user_input.update((n) => n)
          }
        } else {
          callback = undefined
        }

        let li = get(user_input)

        const dx = li.brc.dx
        const dy = li.brc.dy
        const page = li.event.pagenumber
        const element = li.event.elementnumber
        const event = ev.event.value

        _runtime.update((_runtime) => {
          let dest = findUpdateDestEvent(_runtime, dx, dy, page, element, event)
          if (dest) {
            dest.config = ev.config
            dest.cfgStatus = 'EDITOR_BACKGROUND'

            instructions.sendConfigToGrid(
              dx,
              dy,
              page,
              element,
              event,
              dest.config,
              callback,
            )
            // trigger change detection
          }
          return _runtime
        })
      })
    } else {
      logger.set({
        type: 'fail',
        mode: 0,
        classname: 'elementoverwrite',
        message: `Target element is different!`,
      })
    }
  }

  function whole_page_overwrite(array) {
    engine.set('DISABLED')
    logger.set({
      type: 'progress',
      mode: 0,
      classname: 'profileload',
      message: `Profile load started...`,
    })

    array.forEach((elem, elementIndex) => {
      elem.events.forEach((ev, eventIndex) => {
        let li = get(user_input)

        li.event.pagenumber = li.event.pagenumber
        li.event.elementnumber = elem.controlElementNumber
        li.event.eventtype = ev.event

        const dx = li.brc.dx
        const dy = li.brc.dy
        const page = li.event.pagenumber
        const element = li.event.elementnumber
        const event = li.event.eventtype

        _runtime.update((_runtime) => {
          let dest = findUpdateDestEvent(_runtime, dx, dy, page, element, event)
          if (dest) {
            dest.config = ev.config.trim()
            dest.cfgStatus = 'EDITOR_BACKGROUND'
          }
          return _runtime
        })

        let callback

        if (
          elementIndex === array.length - 1 &&
          eventIndex === elem.events.length - 1
        ) {
          // this is last element so we need to add the callback
          callback = function () {
            engine.set('ENABLED')
            logger.set({
              type: 'success',
              mode: 0,
              classname: 'profileload',
              message: `Profile load complete!`,
            })
            // trigger change detection
            user_input.update((n) => n)
          }
        }

        instructions.sendConfigToGrid(
          dx,
          dy,
          page,
          element,
          event,
          ev.config,
          callback,
        )
      })
    })
  }

  function update_event_configuration(
    dx,
    dy,
    page,
    element,
    event,
    actionstring,
    status,
  ) {
    // config
    _runtime.update((_runtime) => {
      let dest = findUpdateDestEvent(_runtime, dx, dy, page, element, event)
      if (dest) {
        dest.config = actionstring
        dest.cfgStatus = status
      }
      return _runtime
    })
  }
  function send_event_configuration_to_grid(
    dx,
    dy,
    page,
    element,
    event,
    callback,
  ) {
    let rt = get(_runtime)

    let dest = findUpdateDestEvent(rt, dx, dy, page, element, event)
    if (dest) {
      instructions.sendConfigToGrid(
        dx,
        dy,
        page,
        element,
        event,
        dest.config,
        callback,
      )
    } else {
      console.error('DEST not found!')
    }
  }

  // whole element copy: fetches all event configs from a control element
  function fetch_element_configuration_from_grid(callback) {
    const li = get(user_input)
    const rt = get(runtime)

    const device = rt.find(
      (device) => device.dx == li.brc.dx && device.dy == li.brc.dy,
    )
    const pageIndex = device.pages.findIndex(
      (x) => x.pageNumber == li.event.pagenumber,
    )
    const elementIndex = device.pages[pageIndex].control_elements.findIndex(
      (x) => x.controlElementNumber == li.event.elementnumber,
    )

    const events = device.pages[pageIndex].control_elements[elementIndex].events
    const controlElementType =
      device.pages[pageIndex].control_elements[elementIndex].controlElementType

    const array = []

    events.forEach((e) => {
      array.push({
        event: e.event.value,
        elementnumber:
          device.pages[pageIndex].control_elements[elementIndex]
            .controlElementNumber,
      })
    })

    array.forEach((elem, ind) => {
      li.event.eventtype = elem.event
      li.event.elementnumber = elem.elementnumber

      if (ind == array.length - 1 && callback !== undefined) {
        // this is last and callback is defined

        fetchOrLoadConfig(li, callback)
      } else {
        fetchOrLoadConfig(li)
      }
    })
  }

  function fetch_page_configuration_from_grid(callback) {
    engine.set('DISABLED')
    logger.set({
      type: 'progress',
      mode: 0,
      classname: 'profilesave',
      message: `Preparing configs...`,
    })

    const rt = get(runtime)

    let li = Object.assign({}, get(user_input))

    const device = rt.find(
      (device) => device.dx == li.brc.dx && device.dy == li.brc.dy,
    )
    const pageIndex = device.pages.findIndex(
      (x) => x.pageNumber == li.event.pagenumber,
    )
    const controlElements = device.pages[pageIndex].control_elements

    const fetchArray = []

    controlElements.forEach((controlElement) => {
      controlElement.events.forEach((elem) => {
        const cfgstatus = elem.cfgStatus

        if (
          cfgstatus == 'GRID_REPORT' ||
          cfgstatus == 'EDITOR_EXECUTE' ||
          cfgstatus == 'EDITOR_BACKGROUND'
        ) {
          //alreade loaded config
        } else {
          // put it into the fetchArray
          fetchArray.push({
            event: elem.event.value,
            elementnumber: controlElement.controlElementNumber,
          })
        }
      })
    })

    // clear the writeBuffer to make sure that there are no fetch operations that may interfere with the callback
    writeBuffer.clear()

    if (fetchArray.length === 0) {
      //nothing to do, let's do calback
      callback()
    } else {
      fetchArray.forEach((elem, ind) => {
        li.event.eventtype = elem.event
        li.event.elementnumber = elem.elementnumber

        if (ind === fetchArray.length - 1) {
          // last element

          fetchOrLoadConfig(li, callback)
        } else {
          fetchOrLoadConfig(li)
        }
      })
    }

    return
  }

  function clear_page_configuration() {
    const li = get(user_input)

    _runtime.update((_runtime) => {
      _runtime.forEach((device) => {
        device.pages[li.event.pagenumber].control_elements.forEach(
          (control_element) => {
            control_element.events.forEach((event) => {
              if (
                ['GRID_REPORT', 'EDITOR_EXECUTE', 'EDITOR_BACKGROUND'].includes(
                  event.cfgStatus,
                )
              ) {
                event.config = ''
                event.cfgStatus = 'NULL'
              }
            })
          },
        )
      })
      return _runtime
    })

    unsaved_changes.set(0)

    // epicly shitty workaround before implementing acknowledge state management
    setTimeout(() => {
      //do nothing just trigger change detection
      user_input.update((n) => n)
      return this
    }, 150)
  }

  function create_page(moduleType, pageNumber) {
    moduleType = moduleType.substr(0, 4)

    let control_elements = []

    let status = 'INIT'

    try {
      const elementsArrayLength = grid.moduleElements[moduleType].length

      // control elements
      for (let i = 0; i < elementsArrayLength; i++) {
        if (grid.moduleElements[moduleType][i]) {
          let events = []
          for (
            let j = 0;
            j < grid.elementEvents[grid.moduleElements[moduleType][i]].length;
            j++
          ) {
            events.push({
              event: grid.elementEvents[grid.moduleElements[moduleType][i]][j],
              config: '',
              cfgStatus: 'NULL',
            })
          }
          control_elements[i] = {
            events: events,
            controlElementNumber: i,
            controlElementType: grid.moduleElements[moduleType][i],
            controlElementName: '',
          }
        }
      }

      control_elements = control_elements.filter((x) => x) // filter null or invalid items!

      return { status, pageNumber: pageNumber, control_elements }
    } catch (error) {
      console.error('Error while creating page for ', moduleType, error)
    }
  }

  function create_module(header, heartbeat) {
    let moduleType = grid.module_type_from_hwcfg(heartbeat.HWCFG)

    let controller = undefined

    // generic check, code below if works only if all parameters are provided
    if (
      header !== undefined &&
      moduleType !== undefined &&
      heartbeat !== undefined
    ) {
      moduleType = moduleType.substr(0, 4)

      controller = {
        // implement the module id rep / req
        id: moduleType + '_' + 'dx:' + header.SX + ';dy:' + header.SY,
        dx: header.SX,
        dy: header.SY,
        rot: header.ROT,
        fwVersion: {
          major: heartbeat.VMAJOR,
          minor: heartbeat.VMINOR,
          patch: heartbeat.VPATCH,
        },
        fwMismatch: false,
        alive: Date.now(),
        map: {
          top: { dx: header.SX, dy: header.SY + 1 },
          right: { dx: header.SX + 1, dy: header.SY },
          bot: { dx: header.SX, dy: header.SY - 1 },
          left: { dx: header.SX - 1, dy: header.SY },
        },
        pages: [
          this.create_page(moduleType, 0),
          this.create_page(moduleType, 1),
          this.create_page(moduleType, 2),
          this.create_page(moduleType, 3),
        ],
      }
    }

    return controller
  }

  function destroy_module(dx, dy) {
    // remove the destroyed device from runtime
    _runtime.update((rt) => {
      return rt.filter((g) => g.dx != dx || g.dy != dy)
    })

    user_input.module_destroy_handler(dx, dy)
    writeBuffer.module_destroy_handler(dx, dy)

    // reset rendering helper stores

    try {
      elementPositionStore.update((eps) => {
        eps[dx][dy] = undefined
        return eps
      })

      elementNameStore.update((ens) => {
        ens[dx][dy] = undefined
        return ens
      })

      ledColorStore.update((lcs) => {
        lcs[dx][dy] = undefined
        return lcs
      })
    } catch (error) {}

    window.electron.analytics.influx(
      'application',
      'runtime',
      'module count',
      get(runtime).length,
    )
  }

  function reset() {
    _runtime.set([])

    user_input.reset()
    unsaved_changes.set(0)
    writeBuffer.clear()
  }

  function change_page(new_page_number) {
    if (get(engine) !== 'ENABLED') {
      return
    }

    let li = get(user_input)

    // only update pagenumber if it differs from the runtime pagenumber
    if (li.event.pagenumber !== new_page_number) {
      // clean up the writebuffer if pagenumber changes!
      writeBuffer.clear()

      instructions.changeActivePage(new_page_number)
    }
  }

  return {
    reset: reset,
    subscribe: _runtime.subscribe,

    element_preset_load: element_preset_load,
    whole_element_overwrite: whole_element_overwrite,
    whole_page_overwrite: whole_page_overwrite,

    update_event_configuration: update_event_configuration,
    send_event_configuration_to_grid: send_event_configuration_to_grid,

    fetch_element_configuration_from_grid: fetch_element_configuration_from_grid,
    fetch_page_configuration_from_grid: fetch_page_configuration_from_grid,

    incoming_heartbeat_handler: incoming_heartbeat_handler,

    clear_page_configuration: clear_page_configuration,

    create_page: create_page,
    create_module: create_module,
    destroy_module: destroy_module,

    change_page: change_page,

    erase: erase_all,
    fetchOrLoadConfig: fetchOrLoadConfig,
  }
}

export const runtime = create_runtime()

function createEngine() {
  const _engine = writable('ENABLED')

  return {
    ..._engine,
  }
}

export const engine = createEngine()

export const heartbeat = writable({
  editor: 300,
  grid: 300,
})

const grid_heartbeat_interval_handler = async function () {
  let rt = get(runtime)

  rt.forEach((device, i) => {
    if (Date.now() - device.alive > get(heartbeat).grid * 3) {
      // TIMEOUT! let's remove the device
      runtime.destroy_module(device.dx, device.dy)
    }
  })
}

setIntervalAsync(grid_heartbeat_interval_handler, get(heartbeat).grid)

setInterval(function () {
  if (!get(appSettings).trayState) {
    window.electron.analytics.influx('application', 'runtime', 'tray state', 1)
  } else {
    window.electron.analytics.influx('application', 'runtime', 'tray state', 0)
  }

  window.electron.analytics.influx(
    'application',
    'runtime',
    'module count',
    get(runtime).length,
  )
}, 10000)

const editor_heartbeat_interval_handler = async function () {
  let type = 255
  if (get(unsaved_changes) != 0 || get(appSettings).modal !== '') {
    type = 254
  }

  if (get(runtime).length > 0) {
    sendHeartbeat(type)
  } else {
    writeBuffer.clear()
  }
}

setIntervalAsync(editor_heartbeat_interval_handler, get(heartbeat).editor)

function createLocalDefinitions() {
  const store = writable()

  return {
    ...store,
    update: (configs) => {
      let arr = []

      configs.forEach((c) => {
        if (c.short == 'l' && c.script !== '') {
          let _variable_array = c.script.split('=')[0]
          _variable_array = _variable_array.split('local')[1]
          _variable_array = _variable_array.split(',')
          _variable_array.forEach((val, i) => {
            arr.push({ info: `local - ${val.trim()}`, value: val.trim() })
          })
        }
      })

      store.set(arr)
    },
  }
}

export const localDefinitions = createLocalDefinitions()

export async function wss_send_message(message) {
  //const toSend = Array.from(message).toString('base64')

  const data = JSON.parse(message)

  console.log(data)

  if (data.command == 'mediaKeys') {
    window.electron.mediaKeys(data.key)
  } else {
    window.electron.websocket.transmit(JSON.stringify(data))
  }
}

console.log('reached end of runtime')
