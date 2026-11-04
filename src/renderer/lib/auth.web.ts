import type LogtoClient from "@logto/browser";
import configuration from "../../../configuration.json";

const ENVIRONMENT_KEY = "auth-environment";
const CALLBACK_PATH = "/auth/callback";
const REFRESH_MARGIN_MS = 5 * 60 * 1000;
const MIN_REFRESH_DELAY_MS = 30 * 1000;
const REFRESH_RETRY_MS = 60 * 1000;

type AuthChange =
  { event: "login"; providerId: "oidc"; idToken: string } | { event: "logout" };

export function createWebAuth() {
  const listeners: ((change: AuthChange) => void)[] = [];
  let current: AuthChange | null = null;
  let environment = localStorage.getItem(ENVIRONMENT_KEY);
  let client: LogtoClient | undefined;
  let refreshTimer: ReturnType<typeof setTimeout> | undefined;

  function publish(change: AuthChange) {
    current = change;
    listeners.forEach((listener) => listener(change));
  }

  async function createClient(forEnvironment: string) {
    const { default: LogtoClient, UserScope } = await import("@logto/browser");
    const production = forEnvironment === "production";
    const issuer = production
      ? configuration.AUTH_ISSUER_PROD
      : configuration.AUTH_ISSUER_DEV;
    const appId = production
      ? configuration.AUTH_CLIENT_ID_PROD
      : configuration.AUTH_CLIENT_ID_DEV;
    if (!appId) {
      throw new Error(`No client id configured for ${issuer}`);
    }
    return new LogtoClient({
      endpoint: issuer.replace(/\/oidc$/, ""),
      appId,
      scopes: [UserScope.Email],
    });
  }

  function scheduleRefresh(delay: number) {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refresh, Math.max(delay, MIN_REFRESH_DELAY_MS));
  }

  async function publishIdToken(from: LogtoClient) {
    const { exp } = await from.getIdTokenClaims();
    publish({
      event: "login",
      providerId: "oidc",
      idToken: (await from.getIdToken())!,
    });
    scheduleRefresh(exp * 1000 - REFRESH_MARGIN_MS - Date.now());
  }

  async function refresh() {
    const refreshed = client;
    if (!refreshed) {
      return;
    }
    try {
      // Asks for a new ID token even while the access token is still valid.
      await refreshed.clearAccessToken();
      await refreshed.getAccessToken();
      if (refreshed === client) {
        await publishIdToken(refreshed);
      }
    } catch (e) {
      if (refreshed !== client) {
        return;
      }
      if (isRevoked(e)) {
        console.warn("Auth session is no longer valid");
        await refreshed.clearAllTokens();
        client = undefined;
        publish({ event: "logout" });
      } else {
        console.warn("Auth refresh failed, retrying:", e);
        scheduleRefresh(REFRESH_RETRY_MS);
      }
    }
  }

  function isRevoked(e: any) {
    return e?.code === "oidc.invalid_grant" || e?.code === "not_authenticated";
  }

  async function start() {
    const callbackUrl =
      window.location.pathname === CALLBACK_PATH ? window.location.href : null;
    if (callbackUrl) {
      window.history.replaceState(null, "", "/");
    }
    if (!environment) {
      publish({ event: "logout" });
      return;
    }
    try {
      const restored = await createClient(environment);
      if (callbackUrl) {
        await restored.handleSignInCallback(callbackUrl);
      }
      if (!(await restored.isAuthenticated())) {
        publish({ event: "logout" });
        return;
      }
      client = restored;
      if (callbackUrl) {
        await publishIdToken(restored);
      } else {
        await refresh();
      }
    } catch (e) {
      console.error("Sign-in failed:", e);
      publish({ event: "logout" });
    }
  }

  async function login() {
    environment ??= "production";
    localStorage.setItem(ENVIRONMENT_KEY, environment);
    const signingIn = await createClient(environment);
    await signingIn.signIn(`${window.location.origin}${CALLBACK_PATH}`);
  }

  async function logout() {
    const ended = client;
    client = undefined;
    clearTimeout(refreshTimer);
    publish({ event: "logout" });
    await ended?.signOut(`${window.location.origin}/`);
  }

  async function setEnvironment(next: string) {
    if (next === environment) {
      return;
    }
    const previous = client;
    client = undefined;
    clearTimeout(refreshTimer);
    environment = next;
    localStorage.setItem(ENVIRONMENT_KEY, next);
    if (previous) {
      publish({ event: "logout" });
      await previous.clearAllTokens();
    }
  }

  start();

  return {
    login,
    logout,
    setEnvironment,
    getState: async () => current,
    onChanged: (listener: (change: AuthChange) => void) => {
      listeners.push(listener);
    },
  };
}
