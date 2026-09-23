<script>
  import { logStreamStore } from "./LogStream.store";
  import { createEventDispatcher } from "svelte";
  import { LogStream } from "@intechstudio/grid-uikit";

  const dispatch = createEventDispatcher();

  function handleContentChange(e) {
    dispatch("content-change", { DOMElementCount: e.detail.count });
  }
</script>

<LogStream
  store={logStreamStore}
  bottom="5rem"
  on:content-change={handleContentChange}
/>
