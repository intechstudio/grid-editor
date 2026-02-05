<script lang="ts">
  import { onMount } from "svelte";
  import { Analytics } from "../runtime/analytics";

  onMount(() => {
    Analytics.init();
  });
</script>
