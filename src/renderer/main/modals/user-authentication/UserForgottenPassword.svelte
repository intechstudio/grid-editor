<script lang="ts">
  import { authStore } from "$lib/auth.store";
  import { MoltenInput, MoltenPushButton } from "@intechstudio/grid-uikit";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  let email = "";
  let emailError = "";
  let showSuccess = false;

  function forgottenPassword() {
    if (!email) {
      emailError = "Input email to send the password reset to!";
      return;
    }

    authStore.sendForgottenPasswordLink(email);
    showSuccess = true;
  }

  function navigateBack() {
    dispatch("back");
  }
</script>

<div class="w-full bg-primary h-full flex flex-col gap-4 justify-start">
  {#if !showSuccess}
    <div class="self-start flex flex-row justify-start items-center">
      <div class="font-medium">Forgotten password</div>
    </div>
    <div class="w-full grid text-white">
      <label class="pb-1 block font-light" for="email">e-mail</label>
      <MoltenInput
        placeholder="email@example.com"
        bind:target={email}
        on:input={() => {
          emailError = "";
        }}
        on:keyup={(e) => {
          const { key } = e.detail;
          if (key === "Enter") {
            e.preventDefault();
            forgottenPassword();
          }
        }}
      />
    </div>

    {#if emailError != ""}
      <div class="w-full grid text-error">
        <p>{emailError}</p>
      </div>
    {/if}

    <div class="pt-2">
      Enter the email address associated with the account you are recovering!
    </div>

    <div class="w-full flex flex-col gap-2 justify-between">
      <MoltenPushButton
        text="Submit"
        click={forgottenPassword}
        snap="full"
        style="accept"
      />

      <MoltenPushButton text="Back" click={navigateBack} snap="full" />
    </div>
  {:else}
    <div class="self-start flex flex-row justify-start items-center">
      <div class="font-medium">Password reset email sent!</div>
    </div>
    <div class="w-full flex text-white">
      Password reset link has been successfully sent to the given email address
      if it is registered!
    </div>

    <MoltenPushButton text="Back" click={navigateBack} snap="full" />
  {/if}
</div>
