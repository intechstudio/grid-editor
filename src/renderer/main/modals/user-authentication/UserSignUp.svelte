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
  import { FirebaseError } from "firebase/app";

  const dispatch = createEventDispatcher();

  let email = "";
  let password = "";
  let repassword = "";
  let signUpError = "";

  let passwordField;
  let repasswordField;

  function validateEmail(email) {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      );
  }

  function submitSignup() {
    if (!validateEmail(email)) {
      signUpError = "Invalid email address!";
      return;
    }

    let passwordShort = password.length < 8;
    let passwordNoDigit = !/\d/.test(password);
    let passwordNoCapital = password == password.toLowerCase();

    console.log({ passwordShort, passwordNoDigit, passwordNoCapital });

    if (passwordShort || passwordNoDigit || passwordNoCapital) {
      signUpError =
        "Password must contain minimum 8 characters, at least one uppercase letter and one number";
      return;
    }

    if (repassword != password) {
      signUpError = "The two passwords do not match!";
      return;
    }

    authStore
      .signUpWithEmail(email, password)
      .catch((e) => {
        if (e instanceof FirebaseError) {
          if (e.code === "auth/email-already-in-use") {
            signUpError = "Email already taken!";
            return;
          }
        }
        signUpError = "Error occured during signing up!";
        console.error(e);
      })
      .then(() => {
        dispatch("back");
      });
  }

  function navigateBack() {
    dispatch("back");
  }
</script>

<div class="w-full bg-primary h-full flex flex-col gap-4 justify-start">
  <div class="self-start flex flex-row justify-start items-center">
    <div class="font-medium">Sign up to profile cloud</div>
  </div>
  <div class="w-full grid text-white">
    <label class="pb-1 block font-light" for="email">e-mail</label>
    <input
      type="text"
      placeholder="email@example.com"
      bind:value={email}
      id="email"
      on:input={() => {
        signUpError = "";
      }}
      on:keyup={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          passwordField.focus();
        }
      }}
      class="w-full p-1 border rounded bg-white dark:bg-neutral-800 focus:border-gray-800 border-gray-500 focus:outline-none focus:ring-blue-300 focus:ring-2"
    />
  </div>

  <div class="w-full grid text-white">
    <label class="pb-1 block font-light" for="password">password</label>
    <input
      id="password"
      type="password"
      placeholder="********"
      bind:this={passwordField}
      bind:value={password}
      on:input={() => {
        signUpError = "";
      }}
      on:keyup={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          repasswordField.focus();
        }
      }}
      class="w-full p-1 border rounded bg-white dark:bg-neutral-800 focus:border-gray-800 border-gray-500 focus:outline-none focus:ring-blue-300 focus:ring-2"
    />
  </div>

  <div class="w-full grid text-white">
    <label class="pb-1 block font-light" for="repassword">password again</label>
    <input
      id="repassword"
      type="password"
      placeholder="********"
      bind:this={repasswordField}
      bind:value={repassword}
      on:input={() => {
        signUpError = "";
      }}
      on:keyup={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submitSignup();
        }
      }}
      class="w-full p-1 border rounded bg-white dark:bg-neutral-800 focus:border-gray-800 border-gray-500 focus:outline-none focus:ring-blue-300 focus:ring-2"
    />
  </div>

  {#if signUpError != ""}
    <div class="w-full grid text-error">
      <p>{signUpError}</p>
    </div>
  {/if}
  <div class="pt-2 w-full flex flex-col justify-between">
    <button
      on:click|preventDefault={submitSignup}
      class="min-w-[96px] px-4 w-full items-center inline-flex justify-center py-1 bg-blue-400 hover:bg-blue-500 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-medium border rounded active:border-neutral-800 border-neutral-500 dark:border-neutral-800 active:outline-none active:ring-blue-300 active:ring-2"
      >register</button
    >
    <button
      on:click|preventDefault={navigateBack}
      class="mt-4 min-w-[96px] w-full px-4 items-center inline-flex justify-center py-1 dark:hover:bg-emerald-700 text-white font-medium border rounded border-emerald-600 border-opacity-50 active:border-emerald-800 dark:hover:border-neutral-800 active:outline-none active:ring-blue-300 active:ring-2"
      >back</button
    >
  </div>
</div>
