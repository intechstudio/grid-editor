<script lang="ts">
  import { Modal } from "./../modals/modal.store";
  import Feedback from "../modals/Feedback.svelte";
import { mount } from "svelte";

  let { feedback_context } = $props();

  function openFeedbackFrom() {
    console.log("feedback on " + feedback_context);
    mount(Feedback, Feedback).show({
      feedback_context,
    });
  }
</script>

<button onclick={openFeedbackFrom} class="text-sm text-gray-500 feedback">
  Send Feedback
</button>

<style>
  .feedback:hover {
    cursor: pointer;
    text-decoration: underline;
  }
</style>
