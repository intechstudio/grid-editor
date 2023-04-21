import { Readable, derived, readable, writable } from "svelte/store";

import { firebaseApp } from "$lib/firebase";
import {
  Auth,
  EmailAuthProvider,
  GoogleAuthProvider,
  User,
  getAuth,
  signInWithCredential,
  signOut,
} from "firebase/auth";

interface AuthStore {
  event: string;
  providerId?: string;
  idToken?: string;
  email?: string;
  password?: string;
}

const createAuth = () => {
  let auth = getAuth(firebaseApp);

  const { subscribe, set } = writable<AuthStore | null>(null);

  async function login(email, password) {
    // we don't need specific persistence options, as local is default
    // https://firebase.google.com/docs/auth/web/auth-state-persistence#supported_types_of_auth_state_persistence
    const credential = EmailAuthProvider.credential(email, password);
    await signInWithCredential(auth, credential).then((userCredential) => {
      set({ event: "login", email, password, providerId: "password" });
    });
  }

  async function socialLogin(provider, idToken) {
    if (provider == "google") {
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential)
        .then((res) => {
          set({ event: "login", ...credential });
        })
        .catch((error) => {
          console.log(error);
          // ...
        });
    }
  }

  async function logout() {
    await signOut(auth)
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
  };
};

export const authStore = createAuth();
