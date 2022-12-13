<script>
  import { selectedProfileStore } from '../../../../runtime/profile-helper.store'
  import { runtime, user_input } from '../../../../runtime/runtime.store'

  export let id

  let showOverlay = false
  let selectedProfile = undefined

  selectedProfileStore.subscribe((store) => {
    selectedProfile = store
    showLoadProfileOverlay(id, store.type)
  })

  function showLoadProfileOverlay(moduleId, profileType) {
    let moduleType = moduleId.substr(0, 4)
    if (moduleType == profileType) {
      showOverlay = true
    } else {
      showOverlay = false
    }
  }

  function selectModuleWhereProfileIsLoaded() {
    const dx = id.split(';')[0].split(':').pop()
    const dy = id.split(';')[1].split(':').pop()

    user_input.update((store) => {
      store.brc.dx = +dx
      store.brc.dy = +dy
      return store
    })
  }

  function loadProfileToThisModule() {
    selectModuleWhereProfileIsLoaded()

    window.electron.analytics.google('profile-library', { value: 'load start' })
    window.electron.analytics.influx(
      'application',
      'profiles',
      'profile',
      'load start',
    )

    // to do.. if undefined configs

    runtime.whole_page_overwrite(selectedProfile.configs)

    window.electron.analytics.google('profile-library', {
      value: 'load success',
    })
    window.electron.analytics.influx(
      'application',
      'profiles',
      'profile',
      'load success',
    )
  }
</script>

{#if showOverlay}
  <div
    class="text-white bg-black bg-opacity-25 w-full h-full absolute flex
    items-center justify-center rounded">

    <button
      on:click={() => {
        loadProfileToThisModule()
      }}
      class="px-4 py-2 rounded bg-commit block">
      Load Profile
    </button>

  </div>
{/if}
