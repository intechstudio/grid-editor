<script>
  import { userStore } from "$lib/user.store";
  import { authStore, AuthEnvironment } from "$lib/auth.store";
  import { modal } from "../modal.store";
  import MoltenModal from "../MoltenModal.svelte";
  import LoginError from "$lib/auth.store";
  import { appSettings } from "../../../runtime/app-helper.store";
  import configuration from "../../../../../configuration.json";
  import { logger } from "../../../runtime/runtime.store";
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
      <input
        type="text"
        placeholder="email@example.com"
        bind:value={email}
        id="email"
        on:input={(emailError = "")}
        on:keyup={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            forgottenPassword();
          }
        }}
        class="w-full p-1 border rounded bg-white dark:bg-neutral-800 focus:border-gray-800 border-gray-500 focus:outline-none focus:ring-blue-300 focus:ring-2"
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

    <div class="w-full flex flex-col justify-between">
      <button
        on:click|preventDefault={forgottenPassword}
        class="min-w-[96px] px-4 w-full items-center inline-flex justify-center py-1 bg-blue-400 hover:bg-blue-500 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-medium border rounded active:border-neutral-800 border-neutral-500 dark:border-neutral-800 active:outline-none active:ring-blue-300 active:ring-2"
        >submit</button
      >
    </div>

    <div class="w-full flex flex-col justify-between">
      <button
        on:click|preventDefault={navigateBack}
        class="min-w-[96px] w-full px-4 items-center inline-flex justify-center py-1 dark:hover:bg-emerald-700 text-white font-medium border rounded border-emerald-600 border-opacity-50 active:border-emerald-800 dark:hover:border-neutral-800 active:outline-none active:ring-blue-300 active:ring-2"
        >back</button
      >
    </div>
  {:else}
    <div class="self-start flex flex-row justify-start items-center">
      <div class="font-medium">Password reset email sent!</div>
    </div>
    <div class="w-full flex text-white">
      Password reset link has been successfully sent to the given email address
      if it is registered!
    </div>

    <div class="pt-2 w-full flex flex-col justify-between">
      <button
        on:click|preventDefault={navigateBack}
        class="mt-4 min-w-[96px] w-full px-4 items-center inline-flex justify-center py-1 dark:hover:bg-emerald-700 text-white font-medium border rounded border-emerald-600 border-opacity-50 active:border-emerald-800 dark:hover:border-neutral-800 active:outline-none active:ring-blue-300 active:ring-2"
        >back</button
      >
    </div>
  {/if}
</div>
