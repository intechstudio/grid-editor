import {
  app,
  ipcMain,
  powerMonitor,
  safeStorage,
  shell,
  type BrowserWindow,
} from "electron";
import path from "path";
import fs from "fs";
import log from "electron-log";
import type * as OpenIdClient from "openid-client";
import {
  authProviderFor,
  isSameAuthProvider,
  type AuthProvider,
} from "../shared/auth-provider";

const REDIRECT_URI = "grid-editor://auth/callback";
const POST_LOGOUT_REDIRECT_URI = "grid-editor://auth/logout";
const SCOPE = "openid offline_access profile email";
const REFRESH_MARGIN_MS = 5 * 60 * 1000;
const MIN_REFRESH_DELAY_MS = 30 * 1000;
const REFRESH_RETRY_MS = 60 * 1000;

interface Session extends AuthProvider {
  refreshToken: string;
  idToken?: string;
}

interface PendingLogin extends AuthProvider {
  codeVerifier: string;
  state: string;
}

type AuthChange =
  { event: "login"; providerId: "oidc"; idToken: string } | { event: "logout" };

export const auth: { mainWindow: BrowserWindow | null } = { mainWindow: null };

let provider = authProviderFor("production");
let session: Session | undefined;
let pendingLogin: PendingLogin | undefined;
// Null until the stored session has been restored or ruled out.
let current: AuthChange | null = null;
let refreshTimer: NodeJS.Timeout | undefined;
let refreshing = false;
// Moves on whenever the session is replaced, so a late response cannot revive it.
let sessionEpoch = 0;
let discovered:
  (AuthProvider & { config: OpenIdClient.Configuration }) | undefined;
let oidc: typeof OpenIdClient;

function errorSummary(e: any) {
  return [e?.code, e?.message].filter(Boolean).join(" ");
}

async function discover(from: AuthProvider) {
  const { issuer, clientId } = from;
  if (!clientId) {
    throw new Error(`No client id configured for ${issuer}`);
  }
  // A broken auth dependency must only cost the user sign-in, not the whole app.
  oidc ??= await import("openid-client");
  if (!discovered || !isSameAuthProvider(discovered, from)) {
    const url = new URL(issuer);
    const config = await oidc.discovery(
      url,
      clientId,
      undefined,
      oidc.None(),
      url.hostname === "localhost"
        ? { execute: [oidc.allowInsecureRequests] }
        : undefined,
    );
    discovered = { issuer, clientId, config };
  }
  return discovered.config;
}

function publish(change: AuthChange) {
  current = change;
  if (auth.mainWindow && !auth.mainWindow.isDestroyed()) {
    auth.mainWindow.webContents.send("auth:changed", change);
  }
}

function sessionFile() {
  return path.join(app.getPath("userData"), "auth.bin");
}

function canEncrypt() {
  return (
    safeStorage.isEncryptionAvailable() &&
    (process.platform !== "linux" ||
      safeStorage.getSelectedStorageBackend() !== "basic_text")
  );
}

function readStoredSession(): Session | undefined {
  if (!fs.existsSync(sessionFile()) || !canEncrypt()) {
    return undefined;
  }
  try {
    return JSON.parse(
      safeStorage.decryptString(fs.readFileSync(sessionFile())),
    );
  } catch (e) {
    log.warn("Discarding unreadable auth session:", e);
    fs.rmSync(sessionFile(), { force: true });
    return undefined;
  }
}

function writeStoredSession({ issuer, clientId, refreshToken }: Session) {
  try {
    if (!canEncrypt()) {
      log.warn("No OS keychain available, sign-in lasts until the app quits");
      // An earlier account must not come back on the next launch.
      fs.rmSync(sessionFile(), { force: true });
      return;
    }
    fs.writeFileSync(
      sessionFile(),
      safeStorage.encryptString(
        JSON.stringify({ issuer, clientId, refreshToken }),
      ),
      { mode: 0o600 },
    );
  } catch (e) {
    log.warn("Could not store the auth session:", errorSummary(e));
  }
}

function dropSession() {
  sessionEpoch++;
  clearTimeout(refreshTimer);
  session = undefined;
  fs.rmSync(sessionFile(), { force: true });
  publish({ event: "logout" });
}

function acceptTokens(
  from: AuthProvider,
  tokens: OpenIdClient.TokenEndpointResponse &
    OpenIdClient.TokenEndpointResponseHelpers,
  currentRefreshToken?: string,
) {
  const refreshToken = tokens.refresh_token ?? currentRefreshToken;
  const idToken = tokens.id_token;
  if (!refreshToken || !idToken) {
    throw new Error("Token response is missing a refresh or ID token");
  }
  sessionEpoch++;
  session = {
    issuer: from.issuer,
    clientId: from.clientId,
    refreshToken,
    idToken,
  };
  writeStoredSession(session);
  publish({ event: "login", providerId: "oidc", idToken });
  scheduleRefresh(tokens.claims()!.exp * 1000 - REFRESH_MARGIN_MS - Date.now());
}

function scheduleRefresh(delay: number) {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(refresh, Math.max(delay, MIN_REFRESH_DELAY_MS));
}

function isSessionRevoked(e: any) {
  return e?.error === "invalid_grant" || e?.error === "invalid_client";
}

async function refresh() {
  // Keeps the user signed in: a second request would spend the rotated token.
  if (!session || refreshing) {
    return;
  }
  const refreshed = session;
  const epoch = sessionEpoch;
  refreshing = true;
  try {
    const config = await discover(refreshed);
    const tokens = await oidc.refreshTokenGrant(config, refreshed.refreshToken);
    if (epoch === sessionEpoch) {
      acceptTokens(refreshed, tokens, refreshed.refreshToken);
    }
  } catch (e) {
    if (epoch !== sessionEpoch) {
      return;
    }
    if (isSessionRevoked(e)) {
      log.warn("Auth session is no longer valid");
      dropSession();
    } else {
      log.warn("Auth refresh failed, retrying:", errorSummary(e));
      scheduleRefresh(REFRESH_RETRY_MS);
    }
  } finally {
    refreshing = false;
  }
}

async function login() {
  const config = await discover(provider);
  const codeVerifier = oidc.randomPKCECodeVerifier();
  const state = oidc.randomState();
  pendingLogin = { ...provider, codeVerifier, state };
  const authorizeUrl = oidc.buildAuthorizationUrl(config, {
    redirect_uri: REDIRECT_URI,
    scope: SCOPE,
    prompt: "consent",
    state,
    code_challenge: await oidc.calculatePKCECodeChallenge(codeVerifier),
    code_challenge_method: "S256",
  });
  await shell.openExternal(authorizeUrl.href);
}

async function logout() {
  const ended = session;
  pendingLogin = undefined;
  dropSession();
  if (!ended) {
    return;
  }
  try {
    const config = await discover(ended);
    oidc
      .tokenRevocation(config, ended.refreshToken)
      .catch((e) =>
        log.warn("Refresh token revocation failed:", errorSummary(e)),
      );
    const endSessionUrl = oidc.buildEndSessionUrl(config, {
      client_id: ended.clientId,
      post_logout_redirect_uri: POST_LOGOUT_REDIRECT_URI,
      ...(ended.idToken && { id_token_hint: ended.idToken }),
    });
    await shell.openExternal(endSessionUrl.href);
  } catch (e) {
    log.warn(
      "Could not reach the auth provider to end the session:",
      errorSummary(e),
    );
  }
}

function setEnvironment(environment: string) {
  provider = authProviderFor(environment);
  if (pendingLogin && !isSameAuthProvider(pendingLogin, provider)) {
    pendingLogin = undefined;
  }
  if (session && !isSameAuthProvider(session, provider)) {
    dropSession();
  }
}

export async function handleAuthDeeplink(url: URL) {
  if (url.pathname !== "/callback") {
    return;
  }
  const pending = pendingLogin;
  if (!pending || url.searchParams.get("state") !== pending.state) {
    log.warn("Ignoring auth callback that matches no pending sign-in");
    return;
  }
  pendingLogin = undefined;
  const epoch = sessionEpoch;
  try {
    const config = await discover(pending);
    const tokens = await oidc.authorizationCodeGrant(config, url, {
      pkceCodeVerifier: pending.codeVerifier,
      expectedState: pending.state,
    });
    if (epoch === sessionEpoch && isSameAuthProvider(pending, provider)) {
      acceptTokens(pending, tokens);
    }
  } catch (e) {
    log.error("Sign-in failed:", errorSummary(e));
  }
}

function isConfiguredProvider(from: AuthProvider) {
  return ["production", "development"].some((environment) =>
    isSameAuthProvider(authProviderFor(environment), from),
  );
}

export function startAuth() {
  ipcMain.handle("auth:login", login);
  ipcMain.handle("auth:logout", logout);
  ipcMain.handle("auth:state", () => current);
  ipcMain.handle("auth:environment", (_event, environment: string) =>
    setEnvironment(environment),
  );

  // Waking from sleep must not leave the user with an expired token.
  powerMonitor.on("resume", refresh);

  session = readStoredSession();
  if (!session) {
    publish({ event: "logout" });
  } else if (isConfiguredProvider(session)) {
    refresh();
  } else {
    dropSession();
  }
}
