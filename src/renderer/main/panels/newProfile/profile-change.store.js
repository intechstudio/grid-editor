import { writable } from 'svelte/store'

function profileChangeCallback() {
  const store = writable({ action: '', profile: {} })

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

export const profileChangeCallbackStore = profileChangeCallback()
