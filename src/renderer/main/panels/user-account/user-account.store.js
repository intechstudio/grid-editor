import { writable } from "svelte/store";

import { firebaseApp } from "$lib/firebase";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";


function createUserAccountStore() {

  const auth = getAuth(firebaseApp);

  const store = writable({
    account: null,
    credentialStash: null,
  })

  function login(email, password) {
    // we don't need specific persistence options, as local is default
    // https://firebase.google.com/docs/auth/web/auth-state-persistence#supported_types_of_auth_state_persistence
    signInWithEmailAndPassword(auth, email, password)
      .then((res) => {
        store.set({ account: res.user, credentialStash: { email, password } })
      })
      .catch((err) => {
        console.log(err);
      });
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in, see docs for a list of available properties

    } else {
      store.set({ account: null })
    }
  })

  return {
    subscribe: store.subscribe,
    login: login,
    auth: () => auth,
  }
}

export const userAccountStore = createUserAccountStore();