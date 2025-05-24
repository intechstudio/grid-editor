import {
  writable,
  type Writable,
  type Readable,
  type Subscriber,
  type Unsubscriber,
  type Updater,
} from "svelte/store";
import { Analytics } from "../runtime/analytics";
import { UpdateInfo } from "builder-util-runtime";

export namespace AppUpdater {
  export enum State {
    UPTODATE = "update to date",
    AVAILABLE = "available",
    DOWNLOADING = "downloading",
    SUCCESS = "success",
    ERROR = "error",
  }

  interface AppUpdateData {
    state: State;
    progress: number;
    info: UpdateInfo | undefined;
    error: string | undefined;
    updateFromStableToNightly: boolean;
  }

  class AppUpdateStore implements Readable<AppUpdateData> {
    private readonly defaultValue: AppUpdateData = {
      state: State.UPTODATE,
      progress: 0,
      info: undefined,
      error: undefined,
      updateFromStableToNightly: false,
    };

    private store: Writable<AppUpdateData>;

    constructor() {
      this.store = writable(this.defaultValue);
      window.electron.updater.onAppUpdate(this.handleAppUpdate.bind(this));
    }

    public subscribe(
      run: Subscriber<AppUpdateData>,
      invalidate?: (value?: AppUpdateData) => void,
    ): Unsubscriber {
      return this.store.subscribe(run, invalidate);
    }

    private set(value: AppUpdateData) {
      this.store.set(value);
    }

    private update(updater: Updater<AppUpdateData>) {
      this.store.update(updater);
    }

    public handleAppUpdate(_event: unknown, value: any) {
      switch (value.code) {
        case "update-available": {
          this.update((s) => ({
            ...s,
            state: State.AVAILABLE,
            info: value,
            updateFromStableToNightly:
              import.meta.env.VITE_BUILD_ENV === "production" &&
              value.version.includes("nightly"),
          }));
          break;
        }

        case "update-downloaded": {
          this.update((s) => ({ ...s, state: State.SUCCESS }));
          break;
        }

        case "update-progress": {
          this.update((s) => ({
            ...s,
            state: State.DOWNLOADING,
            progress: Math.floor(value.percent),
          }));
          break;
        }

        case "update-error": {
          Analytics.track({
            event: "AppUpdate",
            payload: { message: "Update Error" },
            mandatory: false,
          });
          this.update((s) => ({
            ...s,
            state: State.ERROR,
            error: value.error,
          }));
          break;
        }
      }
    }

    public reset() {
      this.set(this.defaultValue);
    }
  }

  export const stateManager = new AppUpdateStore();

  export function abortUpdate() {
    Analytics.track({
      event: "AppUpdate",
      payload: {
        message: "Skip Update",
      },
      mandatory: false,
    });
    stateManager.reset();
  }

  export function restartApp() {
    window.electron.updater.restartAfterUpdate();
  }

  export function installUpdate() {
    Analytics.track({
      event: "AppUpdate",
      payload: {
        message: "Start Update",
      },
      mandatory: false,
    });
    window.electron.installUpdate();
  }

  export function openDownloads() {
    Analytics.track({
      event: "AppUpdate",
      payload: {
        message: "Manual Download",
      },
      mandatory: false,
    });
    const configuration = window.ctxProcess.configuration();
    window.electron.openInBrowser(configuration.EDITOR_DOWNLOAD_URL);
  }
}
