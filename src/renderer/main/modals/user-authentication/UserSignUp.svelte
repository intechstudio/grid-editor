<script lang="ts">
  import { authStore } from "$lib/auth.store";
  import { createEventDispatcher } from "svelte";
  import { FirebaseError } from "firebase/app";
  import { Modal } from "../modal.store";
  import { MoltenInput, MoltenPushButton } from "@intechstudio/grid-uikit";

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

<div class="w-full h-full flex flex-col gap-4 justify-start">
  <div class="self-start flex flex-row justify-start items-center">
    <div class="font-medium">Sign up to profile cloud</div>
  </div>
  <div class="w-full grid">
    <label class="pb-1 block font-light" for="email">e-mail</label>
    <MoltenInput
      placeholder="email@example.com"
      bind:target={email}
      on:input={() => {
        signUpError = "";
      }}
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
    <label class="pb-1 block font-light" for="password">password</label>
    <MoltenInput
      password={true}
      placeholder="********"
      bind:this={passwordField}
      bind:target={password}
      on:input={() => {
        signUpError = "";
      }}
      on:keyup={(e) => {
        const { key } = e.detail;
        if (key === "Enter") {
          e.preventDefault();
          repasswordField.focus();
        }
      }}
    />
  </div>

  <div class="w-full grid">
    <label class="pb-1 block font-light" for="repassword">password again</label>
    <MoltenInput
      password={true}
      placeholder="********"
      bind:this={repasswordField}
      bind:target={repassword}
      on:input={() => {
        signUpError = "";
      }}
      on:keyup={(e) => {
        const { key } = e.detail;
        if (key === "Enter") {
          e.preventDefault();
          submitSignup();
        }
      }}
    />
  </div>

  {#if signUpError != ""}
    <div class="w-full grid text-error">
      <p>{signUpError}</p>
    </div>
  {/if}
  <div class="pt-2 w-full flex flex-col justify-between gap-2">
    <MoltenPushButton
      text="Register"
      snap="full"
      style="accept"
      click={submitSignup}
    />
    <MoltenPushButton text="Back" snap="full" click={navigateBack} />
  </div>
</div>
