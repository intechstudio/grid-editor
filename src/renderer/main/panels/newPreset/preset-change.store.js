import { writable } from 'svelte/store'

function presetChangeCallback() {
  const store = writable({ action: '', preset: {} })

  return {
    ...store,
    trigger: () => {
      store.update((store) => {
        store = JSON.parse(JSON.stringify(store))
        return store
      })
    },
  }
}

export const presetChangeCallbackStore = presetChangeCallback()

