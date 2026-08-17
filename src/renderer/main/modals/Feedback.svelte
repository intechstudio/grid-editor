<script lang="ts">
  import { onMount } from "svelte";
  import { Modal } from "./modal.store";
  import { fade, scale } from "svelte/transition";
  import { backOut } from "svelte/easing";
  import MoltenModal from "./MoltenModal.svelte";
  import { Analytics } from "../../runtime/analytics.js";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";

  export let data: Modal.Instance;
  export let feedback_context: string;

  let textArea = undefined;
  let inputField = undefined;

  async function sendFeedback() {
    feedbackSubmitted = true;
    setTimeout(handleClose, 3000);
    const [title, text] = [inputField.value, textArea.value];
    Analytics.track({
      event: "Feedback",
      payload: {
        title: title,
        text: text,
      },
      mandatory: true,
    });
  }

  function handleClose() {
    data.close();
  }

  let feedbackSubmitted = false;
</script>

<div id="modal-copy-placeholder" />

<MoltenModal {data}>
  <div slot="content" class="p-6">
    <div class="flex flex-col gap-4 flex-grow">
      <div class="flex-row w-full flex justify-between">
        <div class="flex flex-col">
          <span class="w-full text-4xl">Send Feedback</span>
          <span class="w-full text-2xl text-foreground-muted"
            >Intech Studio</span
          >
        </div>

        <button
          on:click={handleClose}
          id="close-btn"
          class="cursor-pointer rounded not-draggable
        hover:bg-secondary w-7 h-7 p-1"
        >
          <svg
            class="fill-current text-foreground-muted"
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
        <div class="text-foreground-muted">Feedback Context:</div>
        <input
          bind:this={inputField}
          class="bg-background-muted p-2"
          type="text"
          value={feedback_context}
        />
      </div>
      <div class="flex flex-col gap-1 flex-grow">
        <span class="text-foreground-muted">Text:</span>
        <div class="flex flex-grow relative">
          <textarea
            bind:this={textArea}
            class="bg-background-muted p-2 w-full h-32 outline-none"
          />
          {#if feedbackSubmitted}
            <div
              in:fade|global={{ duration: 100 }}
              class="bg-primary bg-opacity-50 absolute flex w-full h-full justify-center items-center backdrop-blur-sm"
            >
              <span
                in:scale|global={{
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
      <MoltenPushButton
        click={sendFeedback}
        id="close-btn"
        text={"Submit Feedback!"}
        style={"accept"}
      />
    </div>

    <div />
  </div>
</MoltenModal>
