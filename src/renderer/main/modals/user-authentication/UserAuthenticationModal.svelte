<script lang="ts">
  import { run } from 'svelte/legacy';

  import MoltenModal from "../MoltenModal.svelte";
  import UserLogin from "./UserLogin.svelte";
  import UserLoggedIn from "./UserLoggedIn.svelte";
  import UserForgottenPassword from "./UserForgottenPassword.svelte";
  import UserSignUp from "./UserSignUp.svelte";
  import { userStore } from "$lib/user.store";
  import { onMount } from "svelte";
  import { Modal } from "../modal.store";

  interface Props {
    data: Modal.Instance;
  }

  let { data }: Props = $props();

  let currentNavigationTarget = $state("login");


  function resetNavigation() {
    currentNavigationTarget = "login";
  }

  onMount(resetNavigation);
  run(() => {
    userStore && resetNavigation();
  });
</script>

<MoltenModal {data} width={"300px"}>
  {#snippet content()}
    <div >
      {#if $userStore}
        <UserLoggedIn {data} />
      {:else if currentNavigationTarget === "login"}
        <UserLogin
          {data}
          on:to-forgotten={() => (currentNavigationTarget = "forgotten")}
          on:to-signup={() => (currentNavigationTarget = "signup")}
        />
      {:else if currentNavigationTarget === "forgotten"}
        <UserForgottenPassword {data} on:back={resetNavigation} />
      {:else if currentNavigationTarget === "signup"}
        <UserSignUp {data} on:back={resetNavigation} />
      {/if}
    </div>
  {/snippet}
</MoltenModal>
