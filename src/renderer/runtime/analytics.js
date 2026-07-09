import mixpanel from "mixpanel-browser";
import { get } from "svelte/store";
import { appSettings } from "./app-helper.store";

const configuration = window.ctxProcess.configuration();

const isWebBuild = import.meta.env.VITE_BUILD_TARGET === "web";
// Set VITE_IS_TEST=true in the environment that starts the Vite dev server
// and return early before initializing mixpanel in test environment
const isTestEnv = import.meta.env.VITE_IS_TEST === "true";

let _initialized = false;

function ensureInitialized() {
  if (_initialized) return;
  if (isTestEnv) return;
  _initialized = true;
  mixpanel.init(configuration.MIXPANEL_TOKEN, {
    debug: true,
    api_host: configuration.MIXPANEL_API_HOST,
    img: isWebBuild, // web build: use Image GET (no CORS) instead of XHR
    api_method: isWebBuild ? "GET" : "POST", // img mode needs GET or data is lost
  });
  mixpanel.identify(get(appSettings).persistent.userId);
}

export class Analytics {
  static track({ event, payload, mandatory }) {
    try {
      ensureInitialized();

      if (typeof event === "undefined") {
        throw "Event must be provided";
      }

      if (typeof event === "undefined") {
        throw "Payload object must be provided";
      }
      if (typeof event === "undefined") {
        throw "Mandatory flag must be set";
      }

      const trackingEnabled = get(appSettings).persistent.analyticsEnabled;
      if (mandatory || trackingEnabled) {
        mixpanel.track(event, payload);
      }
    } catch (e) {
      console.warn(e);
    }
  }

  static init() {
    ensureInitialized();
    Analytics.track({
      event: "App Start",
      payload: {
        Version: get(appSettings).version,
        AnalyticsEnabled: get(appSettings).persistent.analyticsEnabled,
        ...import.meta.env,
      },
      mandatory: true,
    });
  }
}
