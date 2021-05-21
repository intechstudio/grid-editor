import { writable, get, derived } from 'svelte/store';

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

export const appSettings = writable({
  size: 2,
  version: {
    major: 1,
    minor: 1,
    patch: 9
  },
  overlays: {controlName: false},
  debugMode: false,
  selectedDisplay: '',
  layoutMode: false,
  configType: 'uiEvents',
  activePanel: 'Configuration',
  leftPanel: 'Debug',
  preferences: false,
  os: checkOS()
});

export const preferenceStore = writable();

function createActionPrefStore(){

  const store = writable({
    advanced: {
      index: undefined, 
      visible: false,
    }
  });

  return {
    ...store,
    showAdvanced: (index, outside) => {
      store.update(s => {
        s.advanced = {
          index: index, 
          visible: !s.advanced.visible
        }
        return s
      });
    }
  }
}

function createAdvancedPrefStore(){
  const store = writable({
    index:-1
  });

  return{
    ...store,
    setIndex: (i) => {
      store.update(s => {s.index = i; return s;})
    }
  }
}

function createPresetManagement(){

  const _selected_preset = writable({sub: '', name: '', configs: ''});

  const _quick_access = writable([]);

  return {
    subscribe: _selected_preset.subscribe,
    selected_preset: {
      subscribe: _selected_preset.subscribe,
      update: ({sub, name, configs}) => {
        _selected_preset.set({sub: sub, name: name, configs: configs});
      },
    },
    quick_access: {
      subscribe: _quick_access.subscribe,
      update: () => {
        _quick_access.update(s => { if(s.length >= 4){ s.shift() }; s = [...s, get(_selected_preset)]; return s});
      }
    }
  }
}

export const presetManagement = createPresetManagement();

export const layout = writable([]);

export const numberOfModulesStore = writable();

export const focusedCodeEditor = writable();

export const configNodeBinding = writable([]);

export const advancedPrefStore = createAdvancedPrefStore();

export const actionPrefStore = createActionPrefStore();

export const actionIsDragged = writable(false);




