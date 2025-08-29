<script lang="ts">
  import { authStore, AuthEnvironment } from "$lib/auth.store";
  import LoginError from "$lib/auth.store";
  import { appSettings } from "../../../runtime/app-helper.store";
  import configuration from "../../../../../configuration.json";
  import { createEventDispatcher } from "svelte";
  import { Modal } from "../modal.store";

  export let data: Modal.Instance;

  const dispatch = createEventDispatcher();

  let email = "";
  let password = "";
  let loginError = "";

  let passwordField;

  function submitLogin() {
    authStore.login(email, password).catch((e) => {
      if (e instanceof LoginError) {
        if (e.errorType === "InvalidCredentials") {
          loginError = "Invalid email or password";
        } else {
          loginError = "Unknown error occured, try again later or contact us!";
          throw e;
        }
      } else {
        throw e;
      }
    });
  }

  function socialLogin() {
    if (import.meta.env.VITE_BUILD_TARGET == "web") {
      authStore.googleLoginPopup();
    } else {
      window.electron.openInBrowser(
        $appSettings.persistent.profileCloudUrl + "/authorize",
      );
    }
  }

  function forgottenPassword() {
    dispatch("to-forgotten");
  }

  function signUp() {
    dispatch("to-signup");
  }
</script>

<div class="w-full bg-background h-full flex flex-col gap-4 justify-start">
  <div class="self-start flex flex-row justify-start items-center">
    <div class="font-medium">Login to profile cloud</div>
  </div>
  <div class="w-full grid">
    <label class="pb-1 block font-light text-foreground" for="email"
      >e-mail</label
    >
    <input
      type="text"
      placeholder="email@example.com"
      bind:value={email}
      id="email"
      on:input={() => {
        loginError = "";
      }}
      on:keyup={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          passwordField.focus();
        }
      }}
      class="w-full p-1 border rounded bg-white text-black dark:bg-neutral-800 focus:border-gray-800 border-gray-500 focus:outline-none focus:ring-blue-300 focus:ring-2"
    />
  </div>

  <div class="w-full grid">
    <label class="pb-1 block font-light text-foreground" for="password"
      >password</label
    >
    <input
      bind:this={passwordField}
      id="password"
      type="password"
      placeholder="********"
      bind:value={password}
      on:input={() => {
        loginError = "";
      }}
      on:keyup={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submitLogin();
        }
      }}
      class="w-full p-1 border rounded bg-white text-black dark:bg-neutral-800 focus:border-gray-800 border-gray-500 focus:outline-none focus:ring-blue-300 focus:ring-2"
    />
  </div>

  <div class="text-left">
    <button
      on:click={forgottenPassword}
      class="text-gray-300 hover:text-gray-500 text-sm font-medium hover:underline focus:outline-none"
      type="button"
    >
      Forgot password?
    </button>
  </div>
  {#if loginError != ""}
    <div class="w-full grid text-error">
      <p>{loginError}</p>
    </div>
  {/if}
  <div class="pt-2 w-full flex flex-col justify-between">
    <button
      on:click|preventDefault={submitLogin}
      class="min-w-[96px] px-4 w-full items-center inline-flex justify-center py-1 bg-blue-400 hover:bg-blue-500 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-medium border rounded active:border-neutral-800 border-neutral-500 dark:border-neutral-800 active:outline-none active:ring-blue-300 active:ring-2"
      >login</button
    >
  </div>

  <button
    on:click|preventDefault={signUp}
    class="min-w-[96px] w-full px-4 items-center inline-flex justify-center py-1 dark:hover:bg-emerald-700 text-white font-medium border rounded border-emerald-600 border-opacity-50 active:border-emerald-800 dark:hover:border-neutral-800 active:outline-none active:ring-blue-300 active:ring-2"
    >register</button
  >

  <div class="px-8 py-2 w-full">
    <div class="border-b border-neutral-700 w-full" />
  </div>
  {#if authStore.getCurrentAuthEnvironment() === AuthEnvironment.PRODUCTION}
    <button
      on:click|preventDefault={() =>
        window.electron.openInBrowser(
          configuration.PROFILE_CLOUD_EMAIL_REGISTRATION,
        )}
      class="mt-4 min-w-[96px] w-full px-4 items-center inline-flex justify-center py-1 dark:hover:bg-emerald-700 text-white font-medium border rounded border-emerald-600 border-opacity-50 active:border-emerald-800 dark:hover:border-neutral-800 active:outline-none active:ring-blue-300 active:ring-2"
      >register on website</button
    >
  {:else}
    <div class="text-white border border-red-500 text-center my-2">
      <p>Can't register with email on development environment!</p>
    </div>
  {/if}

  <button
    class="self-center rounded flex items-center justify-start font-medium bg-emerald-600 hover:bg-emerald-700"
    on:click={() => socialLogin()}
  >
    <div class="w-14 h-14 p-1">
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M38 0H2C0.89543 0 0 0.89543 0 2V38C0 39.1046 0.89543 40 2 40H38C39.1046 40 40 39.1046 40 38V2C40 0.89543 39.1046 0 38 0Z"
          fill="white"
        />
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M28.64 20.2045C28.64 19.5664 28.5827 18.9527 28.4764 18.3636H20V21.845H24.8436C24.635 22.97 24.0009 23.9232 23.0477 24.5614V26.8195H25.9564C27.6582 25.2527 28.64 22.9455 28.64 20.2045Z"
          fill="#4285F4"
        />
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M20 29C22.43 29 24.4673 28.1941 25.9564 26.8195L23.0477 24.5614C22.2418 25.1014 21.2109 25.4205 20 25.4205C17.6559 25.4205 15.6718 23.8373 14.9641 21.71H11.9573V24.0418C13.4382 26.9832 16.4818 29 20 29Z"
          fill="#34A853"
        />
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M14.9641 21.71C14.7841 21.17 14.6818 20.5932 14.6818 20C14.6818 19.4068 14.7841 18.83 14.9641 18.29V15.9582H11.9573C11.3477 17.1732 11 18.5477 11 20C11 21.4523 11.3477 22.8268 11.9573 24.0418L14.9641 21.71Z"
          fill="#FBBC05"
        />
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M20 14.5795C21.3214 14.5795 22.5077 15.0336 23.4405 15.9255L26.0218 13.3441C24.4632 11.8918 22.4259 11 20 11C16.4818 11 13.4382 13.0168 11.9573 15.9582L14.9641 18.29C15.6718 16.1627 17.6559 14.5795 20 14.5795Z"
          fill="#EA4335"
        />
      </svg>
    </div>

    <div class="px-8">Sign in with Google</div>
  </button>
</div>
