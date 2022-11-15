<script>
  import { clickOutside } from '/main/_actions/click-outside.action'
  import { appSettings } from '/runtime/app-helper.store'

  let editor
  let modalWidth
  let modalHeight

  let liked = false

  $: if (modalWidth || modalHeight) {
    if (editor !== undefined) {
      editor.layout()
    }
  }
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
    class="z-50 w-2/5 h-fit max-h-[3/4] text-white relative flex flex-col shadow
    bg-primary bg-opacity-100 items-start opacity-100 p-6">
    <div>Profile Attachments</div>
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

    <div class="p-6 flex flex-col gap-4 overflow-auto w-full">

      <div class="text-lg font-medium">Productivity macros</div>

      <div class="flex flex-col gap-3 w-full">
        <button class="p-3 bg-secondary rounded flex flex-col w-full">
          <span>read_me.txt</span>
          <span>size: 2 kB</span>
        </button>

        <button class="p-3 bg-secondary rounded flex flex-col">
          <span>read_me.txt</span>
          <span>size: 2 kB</span>
        </button>
      </div>

      <div>
        <div class="text-md font-medium">Description:</div>
        <p>These two files are required for proper functioning.</p>
      </div>

      <div class="flex justify-end">
        <button
          class=" flex items-center justify-center rounded my-2
          focus:outline-none border-2 border-commit bg-commit
          hover:bg-commit-saturate-20 hover:border-commit-saturate-20 text-white
          px-2 py-0.5 ml-1 w-24">
          Download
        </button>
      </div>

    </div>

  </div>

</modal>
