import { writable } from "svelte/store";

import { firebaseApp } from "$lib/firebase";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
  EmailAuthCredential,
  EmailAuthProvider,
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
    const credential = EmailAuthProvider.credential(email, password)
    signInWithCredential(auth, credential).then(res => {
      console.log('successful login', res)
      store.set({ account: res.user, credential: credential })
    })
  }

  function socialLogin(provider, idToken) {
    if (provider == 'google') {
      const credential = GoogleAuthProvider.credential(idToken);
      signInWithCredential(auth, credential).then(res => {
        console.log('successful google login', res)
        store.set({ account: res.user, credential: credential, currentUser: auth.currentUser })
      }).catch((error) => {
        console.log(error)
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.email;
        // The credential that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        // ...
      });
    }
  }

  function logout() {
    signOut(auth)
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
    login,
    logout,
    socialLogin,
    auth: () => auth,
  }
}

export const userAccountStore = createUserAccountStore();