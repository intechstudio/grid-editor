import mixpanel from "mixpanel-browser";
import { get } from "svelte/store";
import { appSettings } from "./app-helper.store";

const configuration = window.ctxProcess.configuration();
const buildVariables = window.ctxProcess.buildVariables();

console.log("Analytics Hello", get(appSettings));
console.log(get(appSettings).persistent.analyticsEnabled);

mixpanel.init(configuration.MIXPANEL_TOKEN, { debug: true });

// Set this to a unique identifier for the user performing the event.
// eg: their ID in your database or their email address.
mixpanel.identify(get(appSettings).persistent.userId);

export class Analytics {
  static track({ event, payload, mandatory }) {
    try {
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
      console.error(e);
    }
  }
}

Analytics.track({
  event: "App Start",
  payload: {
    Version: get(appSettings).version,
    AnalyticsEnabled: get(appSettings).persistent.analyticsEnabled,
    ...buildVariables,
  },
  mandatory: true,
});
