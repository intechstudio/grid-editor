<script lang="ts" context="module">
  import { getCompositePart } from "./_composite-factory";
  const part = getCompositePart("bprel")!;
  export const information = part.information;
  export const header = part.header;
</script>
