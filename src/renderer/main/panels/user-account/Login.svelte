<script>
  import { appSettings } from "../../../runtime/app-helper.store";
  import { auth } from "$lib/firebase";
  import { userAccountStore } from "./user-account.store";

  import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

  const provider = new GoogleAuthProvider();

  if (auth?.currentUser !== null) {
    console.log("USER", auth.currentUser);
  } else {
    console;
  }

  let email = "";
  let password = "";

  let userData;

  $: console.log($userAccountStore);

  async function submitLogin() {
    userAccountStore.login(email, password);
  }

  async function logout() {
    userAccountStore.logout();
  }
</script>

<button
  on:click={() =>
    window.electron.openInBrowser("http://localhost:5200/authorize")}
>
  Google Signin
</button>

<div
  class="p-4 bg-primary h-full flex flex-col gap-4 items-start justify-start"
>
  <button on:click={logout} class="border text-white"> logout </button>

  <div class="w-full grid text-white">
    <label class="pb-1 block" for="email">E-Mail</label>
    <input
      id="email"
      bind:value={email}
      class="block w-full bg-secondary focus:outline-gray-500  focus:ring-offset-0 text-white py-1 pl-2 rounded-none"
    />
  </div>

  <div class="w-full grid text-white ">
    <label class="pb-1   block" for="password">Password</label>
    <input
      id="password"
      type="password"
      bind:value={password}
      class="block w-full bg-secondary focus:outline-gray-500  focus:ring-offset-0 text-white py-1 pl-2 rounded-none"
    />
  </div>

  <div class="w-full flex justify-between">
    <button
      on:click|preventDefault={submitLogin}
      class="px-8 py-1 bg-commit hover:bg-commit-saturate-20 text-white font-medium"
      >Login</button
    >

    <button
      on:click|preventDefault={() =>
        window.electron.openInBrowser("https://intech.studio/?loginModal=true")}
      class="px-8 py-1 border-commit border hover:bg-commit-saturate-20 text-white font-medium"
      >Register</button
    >
  </div>

  {#if $appSettings.persistant.authIdToken}
    <button
      on:click|preventDefault={getUserData}
      class="px-8 py-1 bg-gray-500 hover:bg-gray-700 text-white font-medium"
      >Get User Data</button
    >
  {/if}

  {#if userData}
    <div class="text-white px-2">
      email: {userData.email}
    </div>
    <div class="text-white px-2">
      username: {userData.userName}
    </div>
  {/if}
</div>
