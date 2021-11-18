import { writable, get, readable } from 'svelte/store';
import { getAllComponents } from '../../config-blocks/_configs';
import grid from '../../protocol/grid-protocol';

function checkOS() {
  if (typeof window !== 'undefined' && typeof window.process === 'object' && window.process.type === 'renderer') {
    return process.platform;
  }

  // Main process
  if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process.versions.electron) {
      return process.platform;
  }

  // Detect the user agent when the `nodeIntegration` option is set to true
  if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
    return process.platform;
  }

  return 'browser';
}

export const current_tooltip_store = writable({key: '', bool: false});

export const appSettings = writable({
  size: 2.1,
  version: {
    major: grid.properties.VERSION.MAJOR,
    minor: grid.properties.VERSION.MINOR,
    patch: grid.properties.VERSION.PATCH
  },
  overlays: {controlElementName: false},
  debugMode: false,
  selectedDisplay: '',
  changeOnContact: true,
  layoutMode: false,
  configType: 'uiEvents',
  rightPanel: 'Configuration',
  leftPanel: 'Profiles',
  stringNameOverlay: false,
  preferences: false,
  modal: '',
  os: checkOS()
});

export const preferenceStore = writable();

function createActionPrefStore(){

  const default_values = {
    advanced: {
      index: undefined, 
      visible: false,
    }
  }

  const store = writable(default_values);

  return {
    ...store,
    showAdvanced: (index, bool) => {
        store.update(s => {
            s.advanced = {
              index: index, 
              visible: s.advanced.visible = ! s.advanced.visible,
            }

          return s
        });
    },
    reset: () => {
      store.update(s => {s = default_values; return s;});
    }
  }
}



export const action_collection = readable(Promise.all([getAllComponents()]))

function createPresetManagement(){

  const _selected_preset = writable({sub: '', name: '', configs: ''});

  const _selected_action = writable({name: '', configs: ''});

  const _quick_access = writable([]);

  return {
    subscribe: _selected_preset.subscribe,
    selected_preset: {
      subscribe: _selected_preset.subscribe,
      update: ({sub, name, configs}) => {
        _selected_preset.set({sub: sub, name: name, configs: configs});
      },
    },
    selected_action: {
      subscribe: _selected_action.subscribe,
      update: ({name, configs}) => {
        _selected_action.set({name: name, configs: configs})
      }
    },
    quick_access: {
      subscribe: _quick_access.subscribe,
      update: () => {
        _quick_access.update(s => { if(s.length >= 4){ s.shift() }; s = [...s, get(_selected_preset)]; return s});
      }
    }
  }
}

export const activeDropDown = writable({config_index: undefined, input_index: undefined})

export const presetManagement = createPresetManagement();

export const layout = writable([]);

export const numberOfModulesStore = writable();

export const focusedCodeEditor = writable();

export const configNodeBinding = writable([]);

export const actionPrefStore = createActionPrefStore();

export const actionIsDragged = writable(false);




