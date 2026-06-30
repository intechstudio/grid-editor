<script lang="ts">
  import { Grid } from "../../lib/_utils";

  // Script length against the protocol limit, shared by the code editors.
  export let scriptLength: number | undefined = undefined;
</script>

<span>
  {`Character Count: ${
    typeof scriptLength === "undefined" ? "?" : scriptLength
  }/${Grid.Protocol.maxScriptLength - 1} (max)`}
</span>
