<script lang="ts">
  import { fade } from "svelte/transition";
  interface Props {
    spaceAway?: number;
    text?: string;
  }

  let { spaceAway = 5, text = "" }: Props = $props();
</script>

<div
  out:fade={{ duration: 300 }}
  class="absolute top-0 left-1/2"
  style="transform: translate(-50%, calc(-100% - {spaceAway}px));"
>
  <div class="bg-black bg-opacity-50 px-2 py-1 rounded whitespace-nowrap">
    {text}
  </div>
</div>
