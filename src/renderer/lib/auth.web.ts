import type * as OAuth from "oauth4webapi";
import {
  authProviderFor,
  isSameAuthProvider,
  type AuthProvider,
} from "../../shared/auth-provider";

const ENVIRONMENT_KEY = "auth-environment";
const SESSION_KEY = "auth-session";
const PENDING_LOGIN_KEY = "auth-pending-login";
const CALLBACK_PATH = "/auth/callback";
// No profile scope: Firebase rejects the null picture claim it adds.
const SCOPE = "openid offline_access email";
const REFRESH_MARGIN_MS = 60 * 1000;
const MIN_REFRESH_DELAY_MS = 30 * 1000;
const REFRESH_RETRY_MS = 60 * 1000;
const TOKENS_LOCK = "grid-editor-auth-tokens";

interface Session extends AuthProvider {
  refreshToken: string;
  idToken: string;
}

interface PendingLogin extends AuthProvider {
  codeVerifier: string;
  state: string;
}

interface Discovered extends AuthProvider {
  as: OAuth.AuthorizationServer;
  client: OAuth.Client;
}

type AuthChange =
  { event: "login"; providerId: "oidc"; idToken: string } | { event: "logout" };

export function createWebAuth() {
  const listeners: ((change: AuthChange) => void)[] = [];
  let current: AuthChange | null = null;
  let environment = localStorage.getItem(ENVIRONMENT_KEY);
  let refreshTimer: ReturnType<typeof setTimeout> | undefined;
  let refreshDueAt = 0;
  // Moves on whenever the session is replaced, so a late response cannot revive it.
  let sessionEpoch = 0;
  let discovered: Discovered | undefined;
  let oauth: typeof OAuth;

  function publish(change: AuthChange) {
    current = change;
    listeners.forEach((listener) => listener(change));
  }

  // Lets a developer sign in against the provider on their own machine.
  function requestOptions(from: AuthProvider) {
    return {
      [oauth.allowInsecureRequests]:
        new URL(from.issuer).hostname === "localhost",
    };
  }

  async function discover(from: AuthProvider) {
    oauth ??= await import("oauth4webapi");
    if (!discovered || !isSameAuthProvider(discovered, from)) {
      const issuer = new URL(from.issuer);
      const as = await oauth.processDiscoveryResponse(
        issuer,
        await oauth.discoveryRequest(issuer, requestOptions(from)),
      );
      discovered = { ...from, as, client: { client_id: from.clientId } };
    }
    return discovered;
  }

  function readStored<T>(storage: Storage, key: string): T | undefined {
    try {
      return JSON.parse(storage.getItem(key) ?? "null") ?? undefined;
    } catch {
      return undefined;
    }
  }

  function redirectUri() {
    return `${window.location.origin}${CALLBACK_PATH}`;
  }

  function acceptTokens(
    from: AuthProvider,
    tokens: OAuth.TokenEndpointResponse,
    currentRefreshToken?: string,
  ) {
    const refreshToken = tokens.refresh_token ?? currentRefreshToken;
    const idToken = tokens.id_token;
    const claims = oauth.getValidatedIdTokenClaims(tokens);
    if (!refreshToken || !idToken || !claims) {
      throw new Error("Token response is missing a refresh or ID token");
    }
    const session: Session = {
      issuer: from.issuer,
      clientId: from.clientId,
      refreshToken,
      idToken,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    publish({ event: "login", providerId: "oidc", idToken });
    scheduleRefresh(claims.exp * 1000 - REFRESH_MARGIN_MS - Date.now());
  }

  function scheduleRefresh(delay: number) {
    clearTimeout(refreshTimer);
    delay = Math.max(delay, MIN_REFRESH_DELAY_MS);
    refreshDueAt = Date.now() + delay;
    refreshTimer = setTimeout(refresh, delay);
  }

  // Tabs share one rotating refresh token, so they must take turns changing it.
  function inTurn<T>(task: () => Promise<T>) {
    return navigator.locks.request(TOKENS_LOCK, task);
  }

  function refresh() {
    return inTurn(refreshInTurn);
  }

  function isRevoked(e: any) {
    return e?.error === "invalid_grant" || e?.error === "invalid_client";
  }

  async function refreshInTurn() {
    // Another tab may have refreshed or ended the session in the meantime.
    const refreshed = readStored<Session>(localStorage, SESSION_KEY);
    if (
      !environment ||
      !refreshed ||
      !isSameAuthProvider(refreshed, authProviderFor(environment))
    ) {
      publish({ event: "logout" });
      return;
    }
    const epoch = sessionEpoch;
    try {
      const { as, client } = await discover(refreshed);
      const tokens = await oauth.processRefreshTokenResponse(
        as,
        client,
        await oauth.refreshTokenGrantRequest(
          as,
          client,
          oauth.None(),
          refreshed.refreshToken,
          requestOptions(refreshed),
        ),
      );
      if (epoch === sessionEpoch) {
        acceptTokens(refreshed, tokens, refreshed.refreshToken);
      }
    } catch (e) {
      if (epoch !== sessionEpoch) {
        return;
      }
      if (isRevoked(e)) {
        console.warn("Auth session is no longer valid");
        localStorage.removeItem(SESSION_KEY);
        publish({ event: "logout" });
      } else {
        console.warn("Auth refresh failed, retrying:", e);
        scheduleRefresh(REFRESH_RETRY_MS);
      }
    }
  }

  async function completeLogin(pending: PendingLogin, callbackUrl: URL) {
    const { as, client } = await discover(pending);
    const parameters = oauth.validateAuthResponse(
      as,
      client,
      callbackUrl,
      pending.state,
    );
    const tokens = await oauth.processAuthorizationCodeResponse(
      as,
      client,
      await oauth.authorizationCodeGrantRequest(
        as,
        client,
        oauth.None(),
        parameters,
        redirectUri(),
        pending.codeVerifier,
        requestOptions(pending),
      ),
      { requireIdToken: true },
    );
    acceptTokens(pending, tokens);
  }

  async function start() {
    const callbackUrl =
      window.location.pathname === CALLBACK_PATH
        ? new URL(window.location.href)
        : null;
    if (callbackUrl) {
      window.history.replaceState(null, "", "/");
    }
    const pending = readStored<PendingLogin>(sessionStorage, PENDING_LOGIN_KEY);
    sessionStorage.removeItem(PENDING_LOGIN_KEY);
    if (!environment) {
      publish({ event: "logout" });
      return;
    }
    if (callbackUrl) {
      try {
        if (
          !pending ||
          !isSameAuthProvider(pending, authProviderFor(environment))
        ) {
          throw new Error("Auth callback matches no pending sign-in");
        }
        await inTurn(() => completeLogin(pending, callbackUrl));
        return;
      } catch (e) {
        console.error("Sign-in failed:", e);
      }
    }
    await refresh();
  }

  async function login() {
    environment ??= "production";
    localStorage.setItem(ENVIRONMENT_KEY, environment);
    const provider = authProviderFor(environment);
    const { as } = await discover(provider);
    const pending: PendingLogin = {
      ...provider,
      codeVerifier: oauth.generateRandomCodeVerifier(),
      state: oauth.generateRandomState(),
    };
    sessionStorage.setItem(PENDING_LOGIN_KEY, JSON.stringify(pending));
    const authorizeUrl = new URL(as.authorization_endpoint!);
    authorizeUrl.search = new URLSearchParams({
      client_id: pending.clientId,
      redirect_uri: redirectUri(),
      response_type: "code",
      scope: SCOPE,
      state: pending.state,
      code_challenge: await oauth.calculatePKCECodeChallenge(
        pending.codeVerifier,
      ),
      code_challenge_method: "S256",
    }).toString();
    window.location.assign(authorizeUrl);
  }

  async function logout() {
    sessionEpoch++;
    clearTimeout(refreshTimer);
    publish({ event: "logout" });
    const ended = await inTurn(async () => {
      const stored = readStored<Session>(localStorage, SESSION_KEY);
      localStorage.removeItem(SESSION_KEY);
      return stored;
    });
    if (!ended) {
      return;
    }
    try {
      const { as, client } = await discover(ended);
      await oauth
        .revocationRequest(
          as,
          client,
          oauth.None(),
          ended.refreshToken,
          requestOptions(ended),
        )
        .then(oauth.processRevocationResponse)
        .catch((e) => console.warn("Refresh token revocation failed:", e));
      // Ends the browser session too, so the next sign-in can pick another account.
      const endSessionUrl = new URL(as.end_session_endpoint!);
      endSessionUrl.search = new URLSearchParams({
        client_id: ended.clientId,
        id_token_hint: ended.idToken,
        post_logout_redirect_uri: `${window.location.origin}/`,
      }).toString();
      window.location.assign(endSessionUrl);
    } catch (e) {
      console.warn("Could not reach the auth provider to end the session:", e);
    }
  }

  async function setEnvironment(next: string) {
    if (next === environment) {
      return;
    }
    environment = next;
    localStorage.setItem(ENVIRONMENT_KEY, next);
    sessionEpoch++;
    clearTimeout(refreshTimer);
    if (current?.event !== "logout") {
      publish({ event: "logout" });
    }
    await inTurn(async () => localStorage.removeItem(SESSION_KEY));
  }

  // Waking from sleep must not leave the user with an expired token.
  document.addEventListener("visibilitychange", () => {
    if (
      document.visibilityState === "visible" &&
      current?.event === "login" &&
      Date.now() >= refreshDueAt
    ) {
      refresh();
    }
  });

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
