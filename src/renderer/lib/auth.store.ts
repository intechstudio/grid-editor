import { writable } from "svelte/store";

interface AuthStore {
  event: string;
  providerId?: string;
  idToken?: string;
}

export enum AuthEnvironment {
  PRODUCTION = "production",
  DEVELOPMENT = "development",
}

const createAuth = () => {
  const { subscribe, set } = writable<AuthStore | null>(null);
  const auth = window.electron.auth;

  auth.onChanged(set);
  auth.getState().then((state: AuthStore | null) => {
    if (state) {
      set(state);
    }
  });

  return {
    subscribe,
    login: (): Promise<void> => auth.login(),
    logout: (): Promise<void> => auth.logout(),
    setCurrentAuthEnvironment: (environment: AuthEnvironment): Promise<void> =>
      auth.setEnvironment(environment),
  };
};

export const authStore = createAuth();
