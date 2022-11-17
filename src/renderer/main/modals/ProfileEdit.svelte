<script>
  import { get } from 'svelte/store'
  import { clickOutside } from '/main/_actions/click-outside.action'
  import { appSettings } from '/runtime/app-helper.store'
  import { selectedProfileStore } from '/runtime/profile-helper.store'
  import Toggle from '/main/user-interface/Toggle.svelte'

  let editor
  let modalWidth
  let modalHeight

  let charsOfArea = ''
  let charCount = undefined
  $: charCount = charsOfArea.length

  $: if (modalWidth || modalHeight) {
    if (editor !== undefined) {
      editor.layout()
    }
  }

  let selectedProfile = get(selectedProfileStore)

  let allModulesTypes = ['BU16', 'EF44', 'PBF4', 'EN16', 'PO16']
</script>

<svelte:window bind:innerWidth={modalWidth} bind:innerHeight={modalHeight} />
<modal
  class=" z-40 flex absolute items-center justify-center w-full h-screen
  bg-secondary bg-opacity-50 ">

  <div
    use:clickOutside={{ useCapture: true }}
    on:click-outside={() => {
      $appSettings.modal = ''
    }}
    class="z-50 w-4/6 h-fit max-h-[3/4] text-white relative flex flex-col shadow
    bg-primary bg-opacity-100 items-start opacity-100 p-6 overflow-auto">
    <div>Profile Info - Edit</div>
    <button
      on:click={() => {
        $appSettings.modal = ''
      }}
      id="close-btn"
      class="p-1 absolute top-6 right-6 cursor-pointer rounded not-draggable
      hover:bg-secondary">
      <svg
        class="w-5 h-5 p-1 fill-current text-gray-300"
        viewBox="0 0 29 29"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M2.37506 0.142151L28.4264 26.1935L26.1934 28.4264L0.142091
          2.37512L2.37506 0.142151Z" />
        <path
          d="M28.4264 2.37512L2.37506 28.4264L0.14209 26.1935L26.1934
          0.142151L28.4264 2.37512Z" />
      </svg>
    </button>

    <div class="p-6 flex flex-col w-full">

      <form action="" class="flex flex-row gap-10 text-gray-500">

        <div class="w-full flex flex-col gap-4">
          <div class="flex flex-col ">
            <label class="mb-1 " for="title">Title</label>
            <input
              id="title"
              bind:value={selectedProfile.name}
              type="text"
              class="w-full py-2 px-3 bg-secondary text-white
              placeholder-gray-400 text-md" />

          </div>

          <div class="flex flex-col">
            <label class="mb-1" for="shortDesc">Short Description</label>
            <textarea
              id="shortDesc"
              bind:value={selectedProfile.description}
              type="text"
              class="w-full py-2 px-3 h-20 bg-secondary text-white
              placeholder-gray-400 text-md resize-none" />
          </div>

          <div class="flex flex-col">
            <label class="mb-1" for="longDesc">Long Description</label>
            <textarea
              id="longDesc"
              bind:value={charsOfArea}
              type="text"
              class="w-full py-2 px-3 h-40 bg-secondary text-white
              placeholder-gray-400 text-md resize-none" />
            {charCount}
          </div>

          <div>Upload Cover Photo</div>
          <div>Upload Attachments</div>
        </div>

        <div class="w-full flex flex-col gap-4">

          <div class="flex flex-col">
            <label class="mb-1" for="category">Tags</label>
            <!--Ide valami fancy input text field kellene-->
            <select
              id="category"
              class="bg-secondary border-none flex-grow text-white p-2 shadow">
              <option class="text-white bg-secondary py-1 border-none">
                Element
              </option>
            </select>
          </div>

          <div class="flex flex-col">
            <label class="mb-1" for="compContr">Compatible Controller</label>
            <select
              id="compContr"
              class="bg-secondary border-none flex-grow text-white p-2 shadow ">
              <option value="" selected disabled hidden>- Select -</option>

              {#each allModulesTypes as module}
                <option
                  value={module}
                  selected={module == selectedProfile.type}>
                  {module}
                </option>
              {/each}

            </select>
          </div>

          <div class="flex">
            <Toggle />
            <span class="ml-3 text-md font-medium">Private Profile</span>
          </div>
        </div>

      </form>

      <div class="flex justify-end">
        <button
          class=" flex items-center justify-center rounded my-2
          focus:outline-none border-2 border-commit bg-commit
          hover:bg-commit-saturate-20 hover:border-commit-saturate-20 text-white
          px-2 py-0.5 ml-1 w-24">
          Save
        </button>
      </div>

    </div>

  </div>

</modal>
