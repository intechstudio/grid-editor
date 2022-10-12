<script>

  import { createEventDispatcher } from 'svelte';

  import { appSettings } from   '../../runtime/app-helper.store';
  import { analytics} from      '../../runtime/analytics_influx';

  const dispatch = createEventDispatcher();

  export let feedback_context

  function openFeedbackFrom(arg){
    console.log("feedback on "+feedback_context)

    $appSettings.modal = 'feedback'
    $appSettings.feedback_context = feedback_context
    //analytics.track_event("application", "feedback", "feedback context", feedback_context)
  }

</script>

<div on:click={openFeedbackFrom} class="feedback text-sm text-gray-500 mt-2">Send Feedback</div>



<style>

  .feedback:hover{
    cursor: pointer;
    text-decoration: underline;
  }

</style>