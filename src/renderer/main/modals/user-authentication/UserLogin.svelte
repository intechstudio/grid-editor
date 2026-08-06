<script lang="ts">
  import { authStore } from "$lib/auth.store";
  import LoginError from "$lib/auth.store";
  import { appSettings } from "../../../runtime/app-helper.store";
  import configuration from "../../../../../configuration.json";
  import { createEventDispatcher } from "svelte";
  import { MoltenPushButton, MoltenInput } from "@intechstudio/grid-uikit";

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

<div class="bg-background h-full flex flex-col gap-4 justify-start">
  <div class="self-start flex flex-row justify-start items-center">
    <div class="font-medium">Login to profile cloud</div>
  </div>
  <div class="w-full grid">
    <label class="pb-1 block font-light text-foreground" for="email"
      >e-mail</label
    >
    <MoltenInput
      bind:target={email}
      on:input={() => {
        loginError = "";
      }}
      placeholder="email@example.com"
      on:keyup={(e) => {
        const { key } = e.detail;
        if (key === "Enter") {
          e.preventDefault();
          passwordField.focus();
        }
      }}
    />
  </div>

  <div class="w-full grid">
    <label class="pb-1 block font-light text-foreground" for="password"
      >password</label
    >

    <MoltenInput
      bind:this={passwordField}
      placeholder="********"
      bind:target={password}
      password={true}
      on:input={() => {
        loginError = "";
      }}
      on:keyup={(e) => {
        const { key } = e.detail;
        if (key === "Enter") {
          e.preventDefault();
          submitLogin();
        }
      }}
    />
  </div>

  <div class="text-left">
    <button
      on:click={forgottenPassword}
      class="text-foreground-soft hover:text-foreground-muted text-sm font-medium hover:underline focus:outline-none"
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
    <MoltenPushButton
      click={submitLogin}
      text="Login"
      snap="full"
      style="accept"
    />
  </div>

  <MoltenPushButton text="Register" snap="full" click={signUp} />

  <div class="px-8 py-2 w-full">
    <div class="border-b border-neutral-700 w-full" />
  </div>
  <MoltenPushButton
    click={() =>
      window.electron.openInBrowser(
        configuration.PROFILE_CLOUD_EMAIL_REGISTRATION,
      )}
    text="Register on Website"
    snap="full"
  />

  <MoltenPushButton snap="full" style="outlined" click={() => socialLogin()}>
    <div
      slot="content"
      class="p-1 gap-2 flex flex-row items-center justify-center"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        x="0px"
        y="0px"
        viewBox="4 4 40 40"
        class="w-6 h-6"
      >
        <path
          fill="#FFC107"
          d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
        ></path><path
          fill="#FF3D00"
          d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
        ></path><path
          fill="#4CAF50"
          d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
        ></path><path
          fill="#1976D2"
          d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
        ></path>
      </svg>
      <span>Sign in with Google</span>
    </div>
  </MoltenPushButton>
</div>
