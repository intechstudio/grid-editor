import mixpanel from "mixpanel-browser";
import { get } from "svelte/store";
import { appSettings } from "./app-helper.store";

const configuration = window.ctxProcess.configuration();
const buildVariables = window.ctxProcess.buildVariables();

console.log("Analytics Hello", get(appSettings));
console.log(get(appSettings).persistant.analyticsEnabled);

mixpanel.init(configuration.MIXPANEL_TOKEN, { debug: true });

// Set this to a unique identifier for the user performing the event.
// eg: their ID in your database or their email address.
mixpanel.identify(get(appSettings).persistant.userId);

export class Analytics {
  static track({ event, payload, mandatory }) {
    const trackingEnabled = get(appSettings).persistant.analyticsEnabled;
    if (mandatory || trackingEnabled) {
      mixpanel.track(event, payload);
    }
  }
}

Analytics.track({
  event: "App Start",
  payload: {
    Version: get(appSettings).version,
    AnalyticsEnabled: get(appSettings).persistant.analyticsEnabled,
    ...buildVariables,
  },
  mandatory: true,
});
