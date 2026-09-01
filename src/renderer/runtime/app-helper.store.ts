import { writable, get, readable, type Writable } from "svelte/store";
import Welcome from "../main/modals/Welcome.svelte";
import { Grid } from "../lib/_utils";
import { Modal } from "../main/modals/modal.store";
import mossThemeCss from "../../content/theme/moss.css?raw";
import sunsetThemeCss from "../../content/theme/sunset.css?raw";
import icyThemeCss from "../../content/theme/icy.css?raw";

const configuration = window.ctxProcess.configuration();

export enum ColorPickerModel {
  Square,
  Slider,
  Circle,
}

// Sensible starting point for the "Custom" theme editor in Preferences —
// mirrors the dark `:root` block in @intechstudio/grid-uikit's theme.css, so
// the user edits real, currently-applied values instead of a blank slate.
export const DEFAULT_CUSTOM_THEME_CSS = `:root {
  --foreground: #e3e3e3;
  --background: #1f1f1f;
  --shadow: #000;

  --foreground-muted: color-mix(in srgb, var(--foreground) 70%, var(--background) 30%);
  --foreground-soft: color-mix(in srgb, var(--foreground) 50%, var(--background) 50%);
  --foreground-disabled: color-mix(in srgb, var(--foreground) 30%, var(--background) 70%);

  --background-muted: color-mix(in srgb, var(--background), var(--shadow) 20%);
  --background-soft: color-mix(in srgb, var(--background), var(--shadow) 50%);

  --border: #6a6a6a;
  --accent: #0ba484;
  --accent-muted: color-mix(in srgb, var(--accent), var(--shadow) 30%);
  --accent-soft: color-mix(in srgb, var(--accent), var(--shadow) 50%);

  --focus: #ffffff6a;
  --focus-outline: 1px solid var(--focus);
  --focus-offset: 1px;

  --error: #ff0000;

  --popover-background: color-mix(in srgb, var(--background), rgba(0, 0, 0, 1) 70%);
  --popover-selection: var(--background-muted);
  --popover-reference: var(--background-soft);

  --radius: 0em;
  --border-thickness: 1px;
}
`;

// The editor's own named theme presets, each a real .css file under
// src/content/theme/ (imported as raw text via Vite's `?raw` suffix — no
// custom module declaration needed, vite/client already declares `*?raw`).
// grid-uikit's theme.css only ships "dark" (the :root defaults
// DEFAULT_CUSTOM_THEME_CSS mirrors) and "light" (which the editor doesn't
// use) — Moss/Sunset/Icy are defined and owned entirely here, applied at
// runtime by App.svelte's applyThemeCss(), same mechanism as Custom. Each
// is a full, self-contained :root block (every variable explicit, not just
// what differs from dark) so it doesn't depend on cascading from
// grid-uikit's :root, and so every variable is visible and editable in the
// "Show theme source" editor regardless of which preset is selected.
export const THEME_PRESET_CSS: Record<string, string> = {
  dark: DEFAULT_CUSTOM_THEME_CSS,
  moss: mossThemeCss,
  sunset: sunsetThemeCss,
  icy: icyThemeCss,
};

// Single source of truth for every valid `persistent.theme` value — the
// named presets above the editor owns, plus "custom" (not a preset, so not
// a THEME_PRESET_CSS key: its source is the user-owned customThemeCss).
// Drives both the Color Theme radio's options (Preferences.svelte) and the
// stored-value validation below, so adding/removing/renaming a preset only
// means touching THEME_PRESET_CSS.
export const THEME_NAMES = [...Object.keys(THEME_PRESET_CSS), "custom"];

const persistentDefaultValues = {
  userId: "",
  size: 1.0,
  wssPort: 1337,
  moduleRotation: Grid.Rotation.R0,
  welcomeOnStartup: true,
  lastVersion: "",
  profileFolder: "",
  presetFolder: "",
  packagesDataStorage: {},
  enabledPackages: [],
  githubPackages: {},
  localPackages: {},
  keyboardLayout: "",
  portstateOverlayEnabled: false,
  writeBufferDebugEnabled: false,
  heartbeatDebugEnabled: false,
  messageIdDebugEnabled: false,
  consoleErrorOverlayEnabled: false,
  profileCloudDevFeaturesEnabled: false,
  useProfileCloud: true,
  helperShape: 0,
  helperColor: 0,
  desktopAutomationPackage: false,
  authUser: {},
  authIdToken: "",
  authRefreshToken: "",
  alwaysRunInTheBackground: true,
  startupWindowState: "normal",
  analyticsEnabled: false,
  firstLaunch: true,
  fontSize: 12,
  codeEditorDefaultLines: 7,
  profileCloudUrl: configuration.PROFILE_CLOUD_URL_PROD,
  showPCB: false,
  nightlyFirmware: false,
  nightlyEditor: false,
  disableAutoUpdate: false,
  changeOnEvent: "event",
  sendHeartbeatImmediate: false,
  disableAnimations: false,
  colorfulToolbar: false,
  packageDeveloper: false,
  actionHelperText: true,
  unreleasedVirtualModules: false,
  multiViewEnabled: false,
  colorPicker: ColorPickerModel.Circle,
  allowDevBlocks: false,
  lastActiveVersion: undefined,
  lightMode: false,
  theme: "dark",
  customThemeCss: DEFAULT_CUSTOM_THEME_CSS,
  showThemeSource: false,
  userLevelMinimalist: true,
  minimapToggled: false,
  eventsLoaded: false,
  midiTesterEnabled: false,
  websocketNotificationEnabled: false,
  variantLabelEnabled: false,
};

interface PaneData {
  size: number;
  readonly default: number;
  direction: number;
  component: string;
}

interface SplitPaneData {
  left: PaneData;
  right: PaneData;
  minimap: PaneData;
}

function createSplitPanes(): Writable<SplitPaneData> {
  const obj = {
    left: {
      size: 25,
      default: 25,
      direction: "left",
      component: "profile-cloud",
    },
    right: { size: 25, default: 25, direction: "right" },
    minimap: { size: 0, default: 20, direction: "down" },
  };

  return writable(obj);
}

export const splitpanes = createSplitPanes();

function createAppSettingsStore(persistent) {
  const store = writable({
    version: {
      major: configuration.EDITOR_VERSION.split(".")[0],
      minor: configuration.EDITOR_VERSION.split(".")[1],
      patch: configuration.EDITOR_VERSION.split(".")[2],
    },
    maxSize: 2.6,
    minSize: 0.6,
    stepSize: 0.1,
    defaultSize: 1.0,
    debugMode: false,
    selectedDisplay: "",
    layoutMode: false,
    preferences: false,
    leftPanel: undefined,
    leftPanelVisible: true,
    isMultiView: false,
    trayState: false,
    intervalPause: false,
    firmwareNotificationState: 0,
    legacyCompletionActive: false,
    firmware_d51_required: {
      major: parseInt(configuration.FIRMWARE_GRID_D51_REQUIRED_MAJOR),
      minor: parseInt(configuration.FIRMWARE_GRID_D51_REQUIRED_MINOR),
      patch: parseInt(configuration.FIRMWARE_GRID_D51_REQUIRED_PATCH),
    },
    firmware_esp32_required: {
      major: parseInt(configuration.FIRMWARE_GRID_ESP32_REQUIRED_MAJOR),
      minor: parseInt(configuration.FIRMWARE_GRID_ESP32_REQUIRED_MINOR),
      patch: parseInt(configuration.FIRMWARE_GRID_ESP32_REQUIRED_PATCH),
    },
    sizeChange: 0,
    activeWindowResult: {
      title: undefined,
      owner: { neme: undefined },
    },
    packageList: [],
    packageManagerRunning: false,
    developerPackagesRequested: [],
    packageComponentKeys: {},
    packageDebugLogs: [],
    persistent: structuredClone(persistent),
  });

  return {
    ...store,
  };
}

export const appSettings = createAppSettingsStore(persistentDefaultValues);

// structuredClone (used both to seed store.persistent and by update handlers
// that clone-then-mutate) always produces a new object/array reference, so a
// `!==` check is true even when the content is identical. Compare by value
// instead, or every object/array-valued setting looks "changed" on every
// unrelated store update.
function valuesDiffer(a, b) {
  if (a === b) return false;
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) return true;
  return JSON.stringify(a) !== JSON.stringify(b);
}

// Persists a persistent-setting change to disk. Registered only after the
// initial disk read has hydrated the store (see init_appsettings), so the
// values we just loaded aren't immediately written straight back out.
function persistChangedSettings(store) {
  let instore = store.persistent;

  Object.entries(persistentDefaultValues).forEach((entry) => {
    const [key] = entry;

    if (valuesDiffer(persistentDefaultValues[key], instore[key])) {
      persistentDefaultValues[key] = instore[key];
      let settings = {};
      settings[key] = instore[key];
      window.electron.persistentStorage.set(settings);
    }
  });
}

init_appsettings();

async function init_appsettings() {
  let request = [];
  Object.entries(persistentDefaultValues).forEach((entry) => {
    const [key, value] = entry;
    request.push(key);
  });

  await window.electron.persistentStorage
    .get(request)
    .then(async (response) => {
      appSettings.update((s) => {
        Object.entries(response).forEach(async (entry) => {
          let [key, value] = entry;

          // validate values, append default behavior

          if (key === "profileFolder" && value === undefined) {
            value = await window.electron.library.defaultDirectory();
          }

          if (key === "presetFolder" && value === undefined) {
            value = await window.electron.library.defaultDirectory();
          }

          if (key === "moduleRotation" && value === undefined) {
            value = persistentDefaultValues[key];
          }

          if (
            key === "theme" &&
            (typeof value !== "string" || !THEME_NAMES.includes(value))
          ) {
            value = "dark";
          }

          if (
            key === "customThemeCss" &&
            (typeof value !== "string" || value.trim() === "")
          ) {
            value = DEFAULT_CUSTOM_THEME_CSS;
          }

          if (key === "pageActivatorInterval" && value === undefined) {
            value = 1000;
          }

          if (value !== undefined) {
            // If something already changed this setting before hydration
            // finished, it's diverged from its default - that change is
            // more recent than the value we just read from disk, so don't
            // clobber it. It'll get persisted once we subscribe below.
            if (valuesDiffer(s.persistent[key], persistentDefaultValues[key])) {
              return;
            }

            s.persistent[key] = value;
            // Keep the comparison cache in sync with what we just loaded so
            // that subscribing below doesn't treat hydration as a change.
            persistentDefaultValues[key] = value;
          }
        });

        return s;
      });

      // Only now start watching for real changes to persist, now that the
      // cache above matches the freshly hydrated store.
      appSettings.subscribe(persistChangedSettings);

      // show welcome modal if it is not disabled, but always show after version update
      if (
        get(appSettings).persistent.welcomeOnStartup === undefined ||
        get(appSettings).persistent.welcomeOnStartup === true ||
        get(appSettings).persistent.lastVersion === undefined ||
        get(appSettings).persistent.lastVersion !=
          configuration["EDITOR_VERSION"]
      ) {
        appSettings.update((s) => {
          s.persistent.lastVersion = configuration["EDITOR_VERSION"];
          s.persistent.welcomeOnStartup = true;
          return s;
        });
        new Modal.Window(Welcome).show();
      }

      //TODO
      /*if (get(appSettings).persistent.desktopAutomationPackage === true) {
        console.log("start package");

        window.electron.package.start("desktopAutomation");
      } else {
        console.log("stop package");
        window.electron.package.stop("desktopAutomation");
      }*/
    });
}
