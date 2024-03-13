import { writable } from "svelte/store";

import { prodCentralAuth, devCentralAuth } from "./firebase";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  getAuth,
  signInAnonymously,
  signInWithCredential,
  signOut,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";

interface AuthStore {
  event: string;
  providerId?: string;
  idToken?: string;
  email?: string;
  password?: string;
  credential?: any;
}

export enum LoginErrorType {
  INVALID_CREDENTIALS = "InvalidCredentials",
  GENERAL_ERROR = "GeneralError",
}

export enum AuthEnvironment {
  PRODUCTION = "production",
  DEVELOPMENT = "development",
}

// Custom exception class with an enum field
export default class LoginError extends Error {
  errorType: LoginErrorType;

  constructor(message, errorType) {
    super(message);
    this.name = "LoginError";
    this.errorType = errorType;
  }
}

const createAuth = () => {
  const { subscribe, set } = writable<AuthStore | null>(null);

  let currentAuthEnvironment: AuthEnvironment = AuthEnvironment.PRODUCTION;

  function getCurrentCentralAuth() {
    switch (currentAuthEnvironment) {
      case AuthEnvironment.PRODUCTION:
        return prodCentralAuth;
      case AuthEnvironment.DEVELOPMENT:
        return devCentralAuth;
    }
  }

  async function login(email, password): Promise<any> {
    // we don't need specific persistence options, as local is default
    // https://firebase.google.com/docs/auth/web/auth-state-persistence#supported_types_of_auth_state_persistence
    const credential = EmailAuthProvider.credential(email, password);

    return signInWithCredential(getCurrentCentralAuth(), credential)
      .then(async (userCredential) => {
        const userIdToken =
          await getCurrentCentralAuth().currentUser!.getIdToken();
        set({ event: "login", providerId: "oidc", idToken: userIdToken });
      })
      .catch((e) => {
        if (e instanceof FirebaseError) {
          switch (e.code) {
            case "auth/account-exists-with-different-credential":
            case "auth/invalid-credential":
            case "auth/user-not-found":
            case "auth/wrong-password":
            case "auth/invalid-email":
              throw new LoginError(
                e.message,
                LoginErrorType.INVALID_CREDENTIALS
              );
            default:
              throw new LoginError(e.message, LoginErrorType.GENERAL_ERROR);
          }
        } else {
          throw e;
        }
      });
  }

  async function socialLogin(provider, idToken) {
    if (provider == "google") {
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(getCurrentCentralAuth(), credential)
        .then(async (userCredential) => {
          const idToken =
            await getCurrentCentralAuth().currentUser?.getIdToken();
          set({ event: "login", providerId: "oidc", idToken: idToken });
        })
        .catch((error) => {
          console.log(error);
          // ...
        });
    }
  }

  async function logout() {
    await signOut(getCurrentCentralAuth())
      .then((res) => {
        set({ event: "logout" });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function getCurrentAuthEnvironment() {
    return currentAuthEnvironment;
  }

  function setCurrentAuthEnvironment(environment: AuthEnvironment) {
    if (environment != currentAuthEnvironment) {
      logout();
      currentAuthEnvironment = environment;
    }
  }

  return {
    subscribe,
    login,
    socialLogin,
    logout,
    getCurrentAuthEnvironment,
    setCurrentAuthEnvironment,
  };
};

export const authStore = createAuth();
