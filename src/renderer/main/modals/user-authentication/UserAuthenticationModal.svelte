<script>
  import MoltenModal from "../MoltenModal.svelte";
  import UserLogin from "./UserLogin.svelte";
  import UserLoggedIn from "./UserLoggedIn.svelte";
  import UserForgottenPassword from "./UserForgottenPassword.svelte";
  import UserSignUp from "./UserSignUp.svelte";
  import { userStore } from "$lib/user.store";
  import { modal } from "../modal.store";
  import { onMount } from "svelte";

  let currentNavigationTarget = "login";

  $: userStore && resetNavigation();

  function resetNavigation() {
    currentNavigationTarget = "login";
  }

  onMount(resetNavigation);
</script>

<MoltenModal width={300}>
  <div slot="content">
    {#if $userStore}
      <UserLoggedIn />
    {:else if currentNavigationTarget === "login"}
      <UserLogin
        on:to-forgotten={() => (currentNavigationTarget = "forgotten")}
        on:to-signup={() => (currentNavigationTarget = "signup")}
      />
    {:else if currentNavigationTarget === "forgotten"}
      <UserForgottenPassword on:back={resetNavigation} />
    {:else if currentNavigationTarget === "signup"}
      <UserSignUp on:back={resetNavigation} />
    {/if}
  </div>
</MoltenModal>
