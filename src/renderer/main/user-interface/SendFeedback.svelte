<script>
  import { createEventDispatcher } from "svelte";

  import { appSettings } from "../../runtime/app-helper.store";

  const dispatch = createEventDispatcher();

  export let feedback_context;

  function openFeedbackFrom(arg) {
    console.log("feedback on " + feedback_context);

    $appSettings.modal = "feedback";
    $appSettings.feedback_context = feedback_context;
  }
</script>

<button on:click={openFeedbackFrom} class="feedback text-sm text-gray-500 mt-2">
  Send Feedback
</button>

<style>
  .feedback:hover {
    cursor: pointer;
    text-decoration: underline;
  }
</style>
