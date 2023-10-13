import { writable } from "svelte/store";

import { centralAuth } from "./firebase";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  getAuth,
  signInAnonymously,
  signInWithCredential,
  signOut,
} from "firebase/auth";

interface AuthStore {
  event: string;
  providerId?: string;
  idToken?: string;
  email?: string;
  password?: string;
  credential?: any;
}

const createAuth = () => {
  const { subscribe, set } = writable<AuthStore | null>(null);

  async function login(email, password) {
    // we don't need specific persistence options, as local is default
    // https://firebase.google.com/docs/auth/web/auth-state-persistence#supported_types_of_auth_state_persistence
    const credential = EmailAuthProvider.credential(email, password);

    await signInWithCredential(centralAuth, credential).then(
      async (userCredential) => {
        const userIdToken = await centralAuth.currentUser!.getIdToken();
        set({ event: "login", providerId: "oidc", idToken: userIdToken });
      }
    );
  }

  async function anonymousLogin() {
    await signInAnonymously(centralAuth).then(async () => {
      const userIdToken = await centralAuth.currentUser!.getIdToken();
      set({ event: "login", providerId: "oidc", idToken: userIdToken });
    });
  }

  async function socialLogin(provider, idToken) {
    if (provider == "google") {
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(centralAuth, credential)
        .then(async (userCredential) => {
          const idToken = await centralAuth.currentUser?.getIdToken();
          set({ event: "login", providerId: "oidc", idToken: idToken });
        })
        .catch((error) => {
          console.log(error);
          // ...
        });
    }
  }

  async function logout() {
    await signOut(centralAuth)
      .then((res) => {
        set({ event: "logout" });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  return {
    subscribe,
    login,
    socialLogin,
    logout,
    anonymousLogin,
  };
};

export const authStore = createAuth();
