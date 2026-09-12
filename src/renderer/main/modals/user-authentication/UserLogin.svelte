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
    <div class="border-b border-neutral-700 w-full"></div>
  </div>
  <MoltenPushButton
    click={() =>
      window.electron.openInBrowser(
        configuration.PROFILE_CLOUD_EMAIL_REGISTRATION,
      )}
    text="Register on Website"
    snap="full"
  />

  <MoltenPushButton
    snap="full"
    style="outlined"
    click={() => socialLogin()}
    text="Sign in with Google"
  />
</div>
