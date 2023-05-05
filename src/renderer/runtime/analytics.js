import mixpanel from "mixpanel-browser";
import { subscribe } from "svelte/internal";

import { writable, get, readable } from "svelte/store";
import { appSettings } from "/runtime/app-helper.store";

const { env } = window.ctxProcess;

let envs = env();

console.log("Analytics Hello", get(appSettings));

mixpanel.init(envs.MIXPANEL_TOKEN, { debug: true });

// Set this to a unique identifier for the user performing the event.
// eg: their ID in your database or their email address.
mixpanel.identify(get(appSettings).persistant.userId);

mixpanel.track("App Start", {
  Version: get(appSettings).version,
});
