<script lang="ts">
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();
</script>

<button
  on:click={() => {
    dispatch("click");
  }}
  id="close-btn"
  class="p-1 cursor-pointer rounded not-draggable hover:bg-secondary"
>
  <svg
    class="w-5 h-5 p-1 fill-current text-gray-300"
    viewBox="0 0 29 29"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.37506 0.142151L28.4264 26.1935L26.1934 28.4264L0.142091 2.37512L2.37506 0.142151Z"
    />
    <path
      d="M28.4264 2.37512L2.37506 28.4264L0.14209 26.1935L26.1934 0.142151L28.4264 2.37512Z"
    />
  </svg>
</button>
