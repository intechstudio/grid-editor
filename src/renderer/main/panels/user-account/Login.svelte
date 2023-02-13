<script>
  import { appSettings } from "../../../runtime/app-helper.store";

  let email = "";
  let password = "";

  const env = window.ctxProcess.env();
  const apiUrl =
    env.NODE_ENV === "development" ? env.HQ_API_URL_DEV : env.HQ_API_URL_PROD;

  let userData;

  async function submitLogin() {
    // zod validate!
    const response = await fetch(
      apiUrl + "/auth/login?provider=emailPassword&context=editor",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      }
    )
      .then((res) => res.json())
      .catch((err) => console.error(err));

    if (response.ok) {
      $appSettings.persistant.authUser = response.data.user;
      $appSettings.persistant.authIdToken = response.data.idToken;
      $appSettings.persistant.authRefreshToken = response.data.refreshToken;
    }
  }

  async function getUserData() {
    const response = await fetch(
      apiUrl + `/user/${$appSettings.persistant.authUser.uid}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + $appSettings.persistant.authIdToken,
        },
      }
    )
      .then((res) => res.json())
      .catch((err) => console.error(err));

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

  <button
    on:click|preventDefault={submitLogin}
    class="px-8 py-1 bg-commit hover:bg-commit-saturate-20 text-white font-medium"
    >Login</button
  >

  {#if $appSettings.persistant.authIdToken}
    <button
      on:click|preventDefault={getUserData}
      class="px-8 py-1 bg-gray-500 hover:bg-gray-700 text-white font-medium"
      >Get User Data</button
    >
  {/if}

  {#if userData}
    <div class="text-white px-4">{JSON.stringify(userData)}</div>
  {/if}
</div>
