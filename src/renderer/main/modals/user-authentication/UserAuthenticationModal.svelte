<script lang="ts">
  import MoltenModal from "../MoltenModal.svelte";
  import UserLoggedIn from "./UserLoggedIn.svelte";
  import { authStore } from "$lib/auth.store";
  import { userStore } from "$lib/user.store";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import { Modal } from "../modal.store";

  export let data: Modal.Instance;

  let loginError = "";

  function signIn() {
    loginError = "";
    authStore.login().catch((e) => {
      console.error(e);
      loginError = "Could not open the sign-in page, try again later.";
    });
  }
</script>

<MoltenModal {data} width={"300px"}>
  <div slot="content" class="p-6">
    {#if $userStore}
      <UserLoggedIn {data} />
    {:else}
      <div class="bg-background h-full flex flex-col gap-4 justify-start">
        <div class="font-medium">Login to profile cloud</div>
        {#if loginError != ""}
          <div class="w-full grid text-error">
            <p>{loginError}</p>
          </div>
        {/if}
        <MoltenPushButton
          click={signIn}
          text="Sign in"
          snap="full"
          style="accept"
        />
      </div>
    {/if}
  </div>
</MoltenModal>
