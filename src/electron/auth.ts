import { app, ipcMain, powerMonitor, safeStorage, shell } from "electron";
import type { BrowserWindow } from "electron";
import http from "http";
import type { AddressInfo } from "net";
import path from "path";
import fs from "fs";
import log from "electron-log";
import type * as OAuth from "oauth4webapi";
import {
  authProviderFor,
  isSameAuthProvider,
  type AuthProvider,
} from "../shared/auth-provider";

const CALLBACK_PATH = "/auth/callback";
const SIGNED_OUT_PATH = "/auth/signed-out";
// No profile scope: Firebase rejects the null picture claim it adds.
const SCOPE = "openid offline_access email";
const REFRESH_MARGIN_MS = 60 * 1000;
const MIN_REFRESH_DELAY_MS = 30 * 1000;
const REFRESH_RETRY_MS = 60 * 1000;

interface Session extends AuthProvider {
  refreshToken: string;
  idToken?: string;
}

interface PendingLogin extends AuthProvider {
  codeVerifier: string;
  state: string;
  redirectUri: string;
  listener: http.Server;
}

interface Discovered extends AuthProvider {
  as: OAuth.AuthorizationServer;
  client: OAuth.Client;
}

type AuthChange =
  { event: "login"; providerId: "oidc"; idToken: string } | { event: "logout" };

export const auth: {
  mainWindow: BrowserWindow | null;
  showMainWindow: () => void;
} = { mainWindow: null, showMainWindow: () => {} };

let provider = authProviderFor("production");
let session: Session | undefined;
let pendingLogin: PendingLogin | undefined;
// Null until the stored session has been restored or ruled out.
let current: AuthChange | null = null;
let refreshTimer: NodeJS.Timeout | undefined;
let refreshing = false;
// Moves on whenever the session is replaced, so a late response cannot revive it.
let sessionEpoch = 0;
let discovered: Discovered | undefined;
let oauth: typeof OAuth;

function errorSummary(e: any) {
  return [...new Set([e?.error, e?.code, e?.cause?.code, e?.message])]
    .filter(Boolean)
    .join(" ");
}

// Lets a developer sign in against the provider on their own machine.
function requestOptions(from: AuthProvider) {
  return {
    [oauth.allowInsecureRequests]:
      new URL(from.issuer).hostname === "localhost",
  };
}

async function discover(from: AuthProvider) {
  // A broken auth dependency must only cost the user sign-in, not the whole app.
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

function publish(change: AuthChange) {
  current = change;
  if (auth.mainWindow && !auth.mainWindow.isDestroyed()) {
    auth.mainWindow.webContents.send("auth:changed", change);
  }
}

function sessionFile() {
  return path.join(app.getPath("userData"), "auth.bin");
}

function temporarySessionFile() {
  return `${sessionFile()}.tmp`;
}

// Signing out must complete for the user even if the file cannot be removed.
function removeSessionFile() {
  try {
    fs.rmSync(sessionFile(), { force: true });
    fs.rmSync(temporarySessionFile(), { force: true });
  } catch (e) {
    log.warn("Could not remove the stored auth session:", errorSummary(e));
  }
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
    removeSessionFile();
    return undefined;
  }
}

function writeStoredSession({ issuer, clientId, refreshToken }: Session) {
  try {
    if (!canEncrypt()) {
      log.warn("No OS keychain available, sign-in lasts until the app quits");
      // An earlier account must not come back on the next launch.
      removeSessionFile();
      return true;
    }
    // A crash mid-write must not cost the user their sign-in.
    fs.writeFileSync(
      temporarySessionFile(),
      safeStorage.encryptString(
        JSON.stringify({ issuer, clientId, refreshToken }),
      ),
      { mode: 0o600 },
    );
    fs.renameSync(temporarySessionFile(), sessionFile());
    return true;
  } catch (e) {
    log.warn("Could not store the auth session:", errorSummary(e));
    return false;
  }
}

function dropSession() {
  sessionEpoch++;
  clearTimeout(refreshTimer);
  session = undefined;
  removeSessionFile();
  publish({ event: "logout" });
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
  sessionEpoch++;
  session = {
    issuer: from.issuer,
    clientId: from.clientId,
    refreshToken,
    idToken,
  };
  // After a new sign-in, the previous account must not come back on the next launch.
  if (!writeStoredSession(session) && !currentRefreshToken) {
    removeSessionFile();
  }
  publish({ event: "login", providerId: "oidc", idToken });
  scheduleRefresh(claims.exp * 1000 - REFRESH_MARGIN_MS - Date.now());
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

function cancelPendingLogin() {
  pendingLogin?.listener.close();
  pendingLogin = undefined;
}

function callbackPage(title: string, message: string) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family: system-ui, sans-serif; text-align: center; margin-top: 20vh">
<h1>${title}</h1>
<p>${message}</p>
</body>
</html>`;
}

// Returns the browser tab to a finished page and the user to the editor.
async function answerCallback(
  pending: PendingLogin,
  request: http.IncomingMessage,
  response: http.ServerResponse,
) {
  const url = new URL(request.url ?? "/", pending.redirectUri);
  if (url.pathname !== CALLBACK_PATH) {
    response.writeHead(404).end();
    return;
  }
  if (
    pending !== pendingLogin ||
    url.searchParams.get("state") !== pending.state
  ) {
    log.warn("Ignoring auth callback that matches no pending sign-in");
    response.writeHead(400).end();
    return;
  }
  cancelPendingLogin();
  const signedIn = await completeLogin(pending, url);
  response
    .writeHead(signedIn ? 200 : 400, { "Content-Type": "text/html" })
    .end(
      signedIn
        ? callbackPage(
            "Signed in",
            "You can close this tab and return to Grid Editor.",
          )
        : callbackPage(
            "Sign-in failed",
            "Return to Grid Editor and try again.",
          ),
    );
  auth.showMainWindow();
  if (process.platform === "darwin") {
    app.focus({ steal: true });
  }
}

async function completeLogin(pending: PendingLogin, url: URL) {
  const epoch = sessionEpoch;
  try {
    const { as, client } = await discover(pending);
    const parameters = oauth.validateAuthResponse(
      as,
      client,
      url,
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
        pending.redirectUri,
        pending.codeVerifier,
        requestOptions(pending),
      ),
      { requireIdToken: true },
    );
    if (epoch !== sessionEpoch || !isSameAuthProvider(pending, provider)) {
      log.warn("Discarding a sign-in overtaken by another session change");
      return false;
    }
    acceptTokens(pending, tokens);
    return true;
  } catch (e) {
    log.error("Sign-in failed:", errorSummary(e));
    return false;
  }
}

// Receives the browser back from the auth provider, once.
async function listenOnLoopback(pathname: string) {
  const listener = http.createServer();
  await new Promise<void>((resolve, reject) => {
    listener.once("error", reject);
    listener.listen(0, "127.0.0.1", resolve);
  });
  listener.unref();
  const { port } = listener.address() as AddressInfo;
  return { listener, redirectUri: `http://127.0.0.1:${port}${pathname}` };
}

async function login() {
  const { as } = await discover(provider);
  cancelPendingLogin();
  const { listener, redirectUri } = await listenOnLoopback(CALLBACK_PATH);
  const pending: PendingLogin = {
    ...provider,
    codeVerifier: oauth.generateRandomCodeVerifier(),
    state: oauth.generateRandomState(),
    redirectUri,
    listener,
  };
  pendingLogin = pending;
  listener.on("request", (request, response) =>
    answerCallback(pending, request, response),
  );
  const authorizeUrl = new URL(as.authorization_endpoint!);
  authorizeUrl.search = new URLSearchParams({
    client_id: pending.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    state: pending.state,
    code_challenge: await oauth.calculatePKCECodeChallenge(
      pending.codeVerifier,
    ),
    code_challenge_method: "S256",
  }).toString();
  await shell.openExternal(authorizeUrl.href);
}

// Leaves the browser tab on a finished page after the provider signs the user out.
async function showSignedOutPage() {
  const { listener, redirectUri } = await listenOnLoopback(SIGNED_OUT_PATH);
  listener.on("request", (request, response) => {
    if (new URL(request.url ?? "/", redirectUri).pathname !== SIGNED_OUT_PATH) {
      response.writeHead(404).end();
      return;
    }
    response
      .writeHead(200, { "Content-Type": "text/html" })
      .end(
        callbackPage(
          "Signed out",
          "You can close this tab and return to Grid Editor.",
        ),
      );
    listener.close();
  });
  return redirectUri;
}

async function logout() {
  const ended = session;
  cancelPendingLogin();
  dropSession();
  if (!ended) {
    return;
  }
  try {
    const { as, client } = await discover(ended);
    oauth
      .revocationRequest(
        as,
        client,
        oauth.None(),
        ended.refreshToken,
        requestOptions(ended),
      )
      .then(oauth.processRevocationResponse)
      .catch((e) =>
        log.warn("Refresh token revocation failed:", errorSummary(e)),
      );
    // Ends the browser session too, so the next sign-in can pick another account.
    const endSessionUrl = new URL(as.end_session_endpoint!);
    endSessionUrl.searchParams.set("client_id", ended.clientId);
    if (ended.idToken) {
      endSessionUrl.searchParams.set("id_token_hint", ended.idToken);
    }
    endSessionUrl.searchParams.set(
      "post_logout_redirect_uri",
      await showSignedOutPage(),
    );
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
    cancelPendingLogin();
  }
  if (session && !isSameAuthProvider(session, provider)) {
    dropSession();
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
