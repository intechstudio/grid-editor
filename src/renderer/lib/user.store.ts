import { derived } from "svelte/store";
import { authStore } from "./auth.store";

interface User {
  uid: string;
  email?: string;
}

function decodeIdToken(idToken: string): User {
  const payload = idToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0));
  const { sub, email } = JSON.parse(new TextDecoder().decode(bytes));
  return { uid: sub, email };
}

export const userStore = derived<typeof authStore, User | null>(
  authStore,
  (auth) => (auth?.idToken ? decodeIdToken(auth.idToken) : null),
);
