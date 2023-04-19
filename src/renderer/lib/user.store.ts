import { User, getAuth, onAuthStateChanged } from "firebase/auth";
import { readable } from "svelte/store";
import { firebaseApp } from "$lib/firebase";

function createUserStore() {
  // this is code for awaiting the currentUser by CaptainCodeman
  const auth = getAuth(firebaseApp);

  const { subscribe } = readable<User | null>(undefined, (set) =>
    onAuthStateChanged(auth, set)
  );

  // onAuthStateChange can be null if getAuth.currentUser is not ready
  // NOTE: "known" is only used to detect changes. It returns void, not a User. The user is available via the subscribe function on the store.
  const known = new Promise<void>((resolve) => {
    let unsub = () => {};
    unsub = subscribe((user) => {
      //first user maybe null, further run should have valid value
      if (user !== undefined) {
        resolve();
        unsub();
      }
    });
  });

  return {
    subscribe,
    known,
  };
}

export const userStore = createUserStore();
