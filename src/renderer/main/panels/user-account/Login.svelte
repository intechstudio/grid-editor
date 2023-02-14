<script>
  import { appSettings } from "../../../runtime/app-helper.store";
  import api from "$lib/api";

  let email = "";
  let password = "";

  let userData;

  async function submitLogin() {
    // zod validate!
    const response = await api.post(
      "auth/login?provider=emailPassword&context=editor",
      {
        email,
        password,
      }
    );

    if (response.ok) {
      $appSettings.persistant.authUser = response.data.user;
      $appSettings.persistant.authIdToken = response.data.idToken;
      $appSettings.persistant.authRefreshToken = response.data.refreshToken;
    } else {
      userData = response;
    }
  }

  async function getUserData() {
    const response = await api.get(
      `user/${$appSettings.persistant.authUser.uid}`
    );

    if (response.ok) {
      userData = response.data;
    }
  }
</script>

<div
  class="p-4 bg-primary h-full flex flex-col gap-4 items-start justify-start"
>
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
