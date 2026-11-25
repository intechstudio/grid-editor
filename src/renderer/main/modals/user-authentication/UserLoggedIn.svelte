<script lang="ts">
  import { userStore } from "$lib/user.store";
  import { authStore } from "$lib/auth.store";
  import { Modal } from "../modal.store";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";

  export let data: Modal.Instance;
</script>

<div class="flex flex-col gap-4 text-foreground">
  <div class="font-medium">
    Signed in as: {$userStore?.email ?? ""}
  </div>

  <div class="flex justify-between gap-2">
    <MoltenPushButton
      click={() => data.close()}
      text="Close"
      snap="full"
      style="accept"
    />
    <MoltenPushButton
      click={() => authStore.logout()}
      text="Logout"
      snap="full"
      style="normal"
    />
  </div>
</div>
