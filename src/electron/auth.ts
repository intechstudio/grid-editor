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
import * as oidc from "openid-client";
import configuration from "../../configuration.json";

const REDIRECT_URI = "grid-editor://auth/callback";
const POST_LOGOUT_REDIRECT_URI = "grid-editor://auth/logout";
const SCOPE = "openid offline_access profile email";
const REFRESH_MARGIN_MS = 5 * 60 * 1000;
const MIN_REFRESH_DELAY_MS = 30 * 1000;
const REFRESH_RETRY_MS = 60 * 1000;

interface Provider {
  issuer: string;
  clientId: string;
}

interface Session extends Provider {
  refreshToken: string;
  idToken?: string;
}

interface PendingLogin extends Provider {
  codeVerifier: string;
  state: string;
}

type AuthChange =
  { event: "login"; providerId: "oidc"; idToken: string } | { event: "logout" };

export const auth: { mainWindow: BrowserWindow | null } = { mainWindow: null };

let provider = providerFor("production");
let session: Session | undefined;
let pendingLogin: PendingLogin | undefined;
// Null until the stored session has been restored or ruled out.
let current: AuthChange | null = null;
let refreshTimer: NodeJS.Timeout | undefined;
let refreshing = false;
// Moves on whenever the session is replaced, so a late response cannot revive it.
let sessionEpoch = 0;
let discovered: { issuer: string; config: oidc.Configuration } | undefined;

function providerFor(environment: string): Provider {
  return environment === "production"
    ? {
        issuer: configuration.AUTH_ISSUER_PROD,
        clientId: configuration.AUTH_CLIENT_ID_PROD,
      }
    : {
        issuer: configuration.AUTH_ISSUER_DEV,
        clientId: configuration.AUTH_CLIENT_ID_DEV,
      };
}

async function discover({ issuer, clientId }: Provider) {
  if (!clientId) {
    throw new Error(`No client id configured for ${issuer}`);
  }
  if (discovered?.issuer !== issuer) {
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
    discovered = { issuer, config };
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
  if (!fs.existsSync(sessionFile())) {
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
  if (!canEncrypt()) {
    log.warn("No OS keychain available, sign-in lasts until the app quits");
    return;
  }
  fs.writeFileSync(
    sessionFile(),
    safeStorage.encryptString(
      JSON.stringify({ issuer, clientId, refreshToken }),
    ),
    { mode: 0o600 },
  );
}

function dropSession() {
  sessionEpoch++;
  clearTimeout(refreshTimer);
  session = undefined;
  fs.rmSync(sessionFile(), { force: true });
  publish({ event: "logout" });
}

function acceptTokens(
  from: Provider,
  tokens: oidc.TokenEndpointResponse & oidc.TokenEndpointResponseHelpers,
) {
  const refreshToken = tokens.refresh_token ?? session?.refreshToken;
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

async function refresh() {
  // Rotated refresh tokens are single use, a second request would end the session.
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
      acceptTokens(refreshed, tokens);
    }
  } catch (e) {
    if (epoch !== sessionEpoch) {
      return;
    }
    if (e instanceof oidc.ResponseBodyError && e.error === "invalid_grant") {
      log.warn("Auth session is no longer valid");
      dropSession();
    } else {
      log.warn("Auth refresh failed, retrying:", e);
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
      .catch((e) => log.warn("Refresh token revocation failed:", e));
    const endSessionUrl = oidc.buildEndSessionUrl(config, {
      client_id: ended.clientId,
      post_logout_redirect_uri: POST_LOGOUT_REDIRECT_URI,
      ...(ended.idToken && { id_token_hint: ended.idToken }),
    });
    await shell.openExternal(endSessionUrl.href);
  } catch (e) {
    log.warn("Could not reach the auth provider to end the session:", e);
  }
}

function setEnvironment(environment: string) {
  provider = providerFor(environment);
  if (pendingLogin?.issuer !== provider.issuer) {
    pendingLogin = undefined;
  }
  if (session && session.issuer !== provider.issuer) {
    dropSession();
  }
}

export async function handleAuthDeeplink(url: URL) {
  if (url.pathname !== "/callback") {
    return;
  }
  const login = pendingLogin;
  if (!login || url.searchParams.get("state") !== login.state) {
    log.warn("Ignoring auth callback that matches no pending sign-in");
    return;
  }
  pendingLogin = undefined;
  try {
    const config = await discover(login);
    const tokens = await oidc.authorizationCodeGrant(config, url, {
      pkceCodeVerifier: login.codeVerifier,
      expectedState: login.state,
    });
    acceptTokens(login, tokens);
  } catch (e) {
    log.error("Sign-in failed:", e);
  }
}

export function startAuth() {
  ipcMain.handle("auth:login", login);
  ipcMain.handle("auth:logout", logout);
  ipcMain.handle("auth:state", () => current);
  ipcMain.handle("auth:environment", (_event, environment: string) =>
    setEnvironment(environment),
  );

  // Timers stand still during sleep, so the token may have expired on wake.
  powerMonitor.on("resume", refresh);

  session = readStoredSession();
  if (session) {
    refresh();
  } else {
    publish({ event: "logout" });
  }
}
