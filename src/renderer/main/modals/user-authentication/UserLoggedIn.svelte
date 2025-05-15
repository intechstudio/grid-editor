<script>
  import { userStore } from "$lib/user.store";
  import { authStore, AuthEnvironment } from "$lib/auth.store";
  import { modal } from "../modal.store";
</script>

<div class="text-white px-2">
  Signed in as: {$userStore?.email ?? ""}
</div>
{#if $userStore?.userName}
  <div class="text-white px-2">
    username: {$userStore.userName}
  </div>
{/if}

<div class="flex justify-between">
  <button
    on:click|preventDefault={() => modal.close()}
    class=" px-4 items-center inline-flex justify-center py-1 bg-blue-400 hover:bg-blue-500 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-medium border rounded active:border-neutral-800 border-neutral-500 dark:border-neutral-800 active:outline-none active:ring-blue-300 active:ring-2"
    >close</button
  >
  <button
    on:click|preventDefault={() => authStore.logout()}
    class="px-4 items-center inline-flex justify-center py-1 border dark:border-emerald-600 dark:hover:bg-emerald-700 text-white font-medium rounded active:border-neutral-800 border-neutral-500 active:outline-none active:ring-blue-300 active:ring-2"
    >logout</button
  >
</div>
