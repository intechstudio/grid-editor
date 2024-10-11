import { writable } from "svelte/store";

import { prodCentralAuth, devCentralAuth } from "./firebase";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  Unsubscribe,
  User,
  getAuth,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithCredential,
  signInWithPopup,
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

  let currentAuthEnvironment: AuthEnvironment | undefined = undefined;
  let authUnsubscribe: Unsubscribe | undefined = undefined;

  function getCurrentCentralAuth() {
    switch (currentAuthEnvironment) {
      case AuthEnvironment.PRODUCTION:
        return prodCentralAuth;
      case AuthEnvironment.DEVELOPMENT:
        return devCentralAuth;
      default:
        return prodCentralAuth;
    }
  }

  async function login(email, password): Promise<any> {
    // we don't need specific persistence options, as local is default
    // https://firebase.google.com/docs/auth/web/auth-state-persistence#supported_types_of_auth_state_persistence
    const credential = EmailAuthProvider.credential(email, password);

    return signInWithCredential(getCurrentCentralAuth(), credential).catch(
      (e) => {
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
      }
    );
  }

  async function socialLogin(provider, idToken) {
    if (provider == "google") {
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(getCurrentCentralAuth(), credential).catch(
        (error) => {
          console.log(error);
          // ...
        }
      );
    }
  }

  async function googleLoginPopup() {
    await signInWithPopup(
      getCurrentCentralAuth(),
      new GoogleAuthProvider()
    ).catch((error) => {
      console.log(error);
    });
  }

  async function logout() {
    await signOut(getCurrentCentralAuth()).catch((error) => {
      console.log(error);
    });
  }

  function getCurrentAuthEnvironment() {
    return currentAuthEnvironment;
  }

  async function setCurrentAuthEnvironment(environment: AuthEnvironment) {
    if (environment != currentAuthEnvironment) {
      if (currentAuthEnvironment) {
        await logout();
      }
      currentAuthEnvironment = environment;
      let currentUser = getCurrentCentralAuth().currentUser;
      if (authUnsubscribe) {
        authUnsubscribe();
      }
      authUnsubscribe = getCurrentCentralAuth().onAuthStateChanged(
        handleAuthStateChanged
      );
      handleAuthStateChanged(getCurrentCentralAuth().currentUser);
      console.log(`Current user: ${JSON.stringify(currentUser?.uid)}`);
    }
  }

  async function handleAuthStateChanged(user: User | null) {
    if (user) {
      console.log(`Logging in user: ${user.uid}`);
      user.getIdToken().then((idToken) => {
        set({ event: "login", providerId: "oidc", idToken: idToken });
      });
    } else {
      console.log(`Null user, logout`);
      set({ event: "logout" });
    }
  }

  async function sendForgottenPasswordLink(email) {
    sendPasswordResetEmail(getCurrentCentralAuth(), email).catch(() => {});
  }

  return {
    subscribe,
    login,
    socialLogin,
    logout,
    getCurrentAuthEnvironment,
    setCurrentAuthEnvironment,
    sendForgottenPasswordLink,
    googleLoginPopup,
  };
};

export const authStore = createAuth();
