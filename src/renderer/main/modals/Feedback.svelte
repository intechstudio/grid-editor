<script>
  import { onMount } from "svelte";
  import { appSettings } from "../../runtime/app-helper.store";
  import { fade, slide, scale } from "svelte/transition";
  import { backIn, backOut } from "svelte/easing";

  import { clickOutside } from "../_actions/click-outside.action";

  let feedback = {
    title: "",
    text: "",
  };

  let textArea = undefined;

  onMount(() => {
    textArea.focus();
  });

  async function sendFeedback() {
    showThankYou = !showThankYou;
    return;
    await window.electron.discord.sendMessage({
      title: feedback.title.value,
      text: feedback.text.value,
    });
    thank_you = "Thank you for your feedback!";
  }

  function handleClose(e) {
    $appSettings.modal = "";
  }

  function handleClickOutside(e) {
    console.log(textArea.value.length);
    if (textArea.value === "") {
      handleClose(e);
    }
  }

  let showThankYou = false;
</script>

<div id="modal-copy-placeholder" />

<!-- transition:fade={{ duration: 150 }} -->
<modal
  class="z-40 flex absolute flex-col items-center justify-center w-full h-screen
  bg-primary bg-opacity-50"
>
  <!-- transition:slide={{ delay: 250, duration: 300, axis: "x" }} -->
  <div
    class="z-50 w-1/2 h-1/2 flex flex-col shadow-xl bg-primary
bg-opacity-100 overflow-auto rounded-lg"
  >
    <div
      use:clickOutside={{ useCapture: true }}
      on:click-outside={handleClickOutside}
      id="clickbox"
      class="flex flex-col gap-4 px-8 pt-8 pb-4 flex-grow"
    >
      <div class="flex-row w-full flex justify-between">
        <div class="flex flex-col">
          <span class="w-full text-4xl text-white">Send Feedback</span>
          <span class="w-full text-2xl text-gray-300">Intech Studio</span>
        </div>

        <button
          on:click={handleClose}
          id="close-btn"
          class="cursor-pointer rounded not-draggable
        hover:bg-secondary w-7 h-7 p-1"
        >
          <svg
            class="fill-current text-gray-300"
            viewBox="0 0 29 29"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.37506 0.142151L28.4264 26.1935L26.1934 28.4264L0.142091
            2.37512L2.37506 0.142151Z"
            />
            <path
              d="M28.4264 2.37512L2.37506 28.4264L0.14209 26.1935L26.1934
            0.142151L28.4264 2.37512Z"
            />
          </svg>
        </button>
      </div>

      <div class="flex flex-col gap-1">
        <div class="text-gray-500">Feedback Context:</div>
        <input
          bind:this={feedback.title}
          class="bg-secondary p-2 text-white"
          type="text"
          value={$appSettings.feedback_context}
        />
      </div>
      <div class="flex flex-col gap-1 flex-grow">
        <span class="text-gray-500">Text:</span>
        <div class="flex flex-grow relative">
          <textarea
            bind:this={textArea}
            class="bg-secondary p-2 w-full h-full text-white outline-none"
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam quis
            justo tortor. Sed ac augue luctus, elementum purus eget, ultricies
            est. Nulla facilisi. Ut malesuada gravida velit. Nulla pharetra
            iaculis lacus. Proin ut metus vel quam porttitor malesuada.
            Phasellus posuere et nunc eget commodo. Morbi condimentum nibh
            accumsan, fringilla augue sed, tincidunt felis. Aliquam lectus nisi,
            faucibus ac volutpat eget, egestas vel ligula. Morbi pellentesque
            maximus ante, nec fermentum justo eleifend in. Cras varius mi ut
            eros feugiat feugiat. Morbi vitae leo in est finibus lobortis eu sit
            amet nisl. Phasellus condimentum venenatis urna, ac luctus ipsum
            luctus eu. Etiam cursus ligula vitae sem feugiat venenatis.
          </textarea>
          {#if showThankYou}
            <div
              transition:fade={{ duration: 100 }}
              class="bg-primary bg-opacity-50 absolute flex w-full h-full justify-center items-center backdrop-blur-sm"
            >
              <span
                transition:scale={{
                  start: 0.5,
                  easing: backOut,
                  duration: 300,
                }}
                class="text-white text-4xl">Thank you for your Feedback!</span
              >
            </div>
          {/if}
        </div>
      </div>
      <button
        on:click={sendFeedback}
        id="close-btn"
        class="py-2 px-8 w-fit rounded not-draggable hover:bg-commit
        bg-secondary disabled:bg-secondary transition-colors duration-75"
      >
        <span class="text-white">Submit Feedback!</span>
      </button>
    </div>
    <div
      class="flex flex-col w-full h-content bg-black
      bg-opacity-10 px-8 py-4"
    >
      <span class="text-gray-300"> Grid Editor is Open-Source Software </span>
      <span class="text-gray-500">Developed by Intech Studio</span>
    </div>
    <div />
  </div></modal
>
