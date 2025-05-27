<script>
  import { Modal } from "./../modals/modal.store";
  import Feedback from "../modals/Feedback.svelte";

  export let feedback_context;

  function openFeedbackFrom() {
    console.log("feedback on " + feedback_context);
    new Modal.Window(Feedback).show({
      feedback_context,
    });
  }
</script>

<button on:click={openFeedbackFrom} class="{$$props.class} feedback">
  Send Feedback
</button>

<style>
  .feedback:hover {
    cursor: pointer;
    text-decoration: underline;
  }
</style>
