<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { fly, fade, slide } from "svelte/transition";

  import { Analytics } from "../runtime/analytics.js";
  import { copyContextMenu } from "./_actions/copy-context-menu.action.js";
  import { appSettings } from "../runtime/app-helper.store";

  const ctxProcess = window.ctxProcess;
  const configuration = ctxProcess.configuration();

  let logelement;
  let text = "";

  let logtext = [];

  let solutions = [];
  let notifications = [];

  function doNotDisplayError(errorMessage, stack, url, line) {
    Analytics.track({
      event: "ErrorConsole",
      payload: {
        message: generateErrorDisplayText(errorMessage, stack, url, line),
        stack: stack,
      },
      mandatory: true,
    });
  }

  function displayError(errorMessage, stack, url, line) {
    if (logtext.length > 4) {
      //logtext.shift();
    }

    console.log(
      "we got exception, but the app has crashed 1",
      url,
      line,
      errorMessage,
    );

    let solution = undefined;

    console.log("solutions:", solutions);

    if (typeof solutions !== "undefined") {
      solutions.forEach((s) => {
        if (errorMessage.toString().indexOf(s.match) !== -1) {
          solution = s;
        }
      });
    }

    logtext = [
      ...logtext,
      {
        reason: generateErrorDisplayText(errorMessage, stack, url, line),
        solution: solution,
      },
    ];

    Analytics.track({
      event: "ErrorConsole",
      payload: {
        message: generateErrorDisplayText(errorMessage, stack, url, line),
        stack: stack,
      },
      mandatory: true,
    });
  }

  function generateErrorDisplayText(errorMessage, stack, url, line) {
    let displaytext = "";

    if (url !== undefined && line !== undefined) {
      displaytext =
        errorMessage +
        " at line " +
        line +
        " in " +
        url.split("/")[url.split("/").length - 1] +
        " ";
    } else if (stack !== undefined) {
      displaytext = errorMessage + " " + stack.split("\n")[0] + " ";
    } else {
      displaytext = errorMessage + " ";
    }

    return displaytext;
  }

  onMount(async () => {
    // check for errors

    // Mirroring console.error into the overlay is opt-in via the
    // "Console Error Overlay" developer preference, checked on every call so
    // toggling the setting takes effect without a restart.
    const originalConsoleError = console.error;
    console.error = function (...args) {
      originalConsoleError.apply(console, args);
      if (!get(appSettings).persistent.consoleErrorOverlayEnabled) {
        return;
      }
      const error = args.find((a) => a instanceof Error);
      const message = args
        .map((a) =>
          a instanceof Error
            ? a.message
            : typeof a === "object"
              ? JSON.stringify(a)
              : String(a),
        )
        .join(" ");
      displayError(message, error?.stack);
    };

    window.onerror = function myErrorHandler(errorMsg, url, lineNumber) {
      // Supress unhandled but not harmful errors
      if (errorMsg.startsWith("ResizeObserver loop completed")) {
        console.warn("Supressed notification: ", errorMsg);
        doNotDisplayError(
          "Suppressed: " + errorMsg,
          Error().stack,
          url,
          lineNumber,
        );
        return;
      }

      displayError(errorMsg, Error().stack, url, lineNumber);
      return false;
    };

    window.onunhandledrejection = (e) => {
      console.log("we got exception, but the app has crashed 2", e);
      const reason = e.reason;

      const message =
        reason?.message || // Error objects
        reason?.text || // Custom error objects with .text
        (typeof reason === "object" ? JSON.stringify(reason) : reason) || // Objects or primitives
        "Unknown Promise rejection";

      const stack = reason?.stack || e.stack;

      if (message.startsWith("Serial Write Error 3")) {
        console.warn("Supressed notification: ", message);
        doNotDisplayError("Suppressed: " + message, stack);
        return;
      }

      // LuaLS bridge connection errors are expected when the binary is
      // unavailable (e.g. Linux AppImage read-only FS). The fallback
      // autocomplete handles these gracefully — no toast needed.
      if (
        message.includes("Client is not running and can't be stopped") ||
        message.includes(
          "Pending response rejected since connection got disposed",
        )
      ) {
        console.warn("[LuaLS] Suppressed connection error:", message);
        doNotDisplayError("Suppressed: " + message, stack);
        return;
      }

      displayError(message, stack);
    };

    if (ctxProcess.platform() == "darwin") {
      text = "Command + Shift + R";
    } else {
      text = "Ctrl + Shift + R";
    }

    window.electron
      .fetchUrlJSON(configuration.NOTIFICATION_JSON_URL)
      .then((data) => {
        console.log("RESPONSE", data);

        data.forEach((element) => {
          if (element.type === "error") {
            solutions.push(element);
          } else if (element.type === "notification") {
            if (
              typeof element.version === "undefined" ||
              element.version ===
                window.ctxProcess.configuration()?.EDITOR_VERSION
            ) {
              if (typeof element.delay !== "undefined") {
                let delay = parseInt(element.delay);
                setTimeout(() => {
                  notifications = [...notifications, element];
                }, delay);
              } else {
                notifications = [...notifications, element];
              }
            }
          }
        });
      })
      .catch((error) => {
        console.log("Fetching solutions failed", error);
      });
  });

  function refresh() {
    Analytics.track({
      event: "ErrorConsole",
      payload: {
        click: "Refresh",
      },
      mandatory: true,
    });
    window.electron.restartApp();
  }

  function solution(link) {
    window.electron.openInBrowser(link);

    Analytics.track({
      event: "ErrorConsole",
      payload: {
        click: "Solution",
      },
      mandatory: true,
    });
  }

  function dismiss() {
    logtext = [];
    Analytics.track({
      event: "ErrorConsole",
      payload: {
        click: "Dismiss",
      },
      mandatory: true,
    });
  }

  function close_notification(index) {
    let new_not_array = [];

    notifications.forEach((element, i) => {
      if (i !== index) {
        new_not_array.push(element);
      }
    });

    notifications = [...new_not_array];
  }
</script>

{#if logtext.length != 0}
  <div
    bind:this={logelement}
    style="background-color: var(--background-soft); color: var(--foreground);"
    class="w-full justify-center flex flex-col items-center"
    transition:fade|global
  >
    {#each logtext as log, index}
      {#if index > logtext.length - 5}
        {#key index === logtext.length}
          <div
            in:fly|global={{ x: -50, delay: 0, duration: 500 }}
            style="background-color: var(--background-soft); color: var(--foreground);"
            class="w-full justify-center flex flex-row items-center h-16"
          >
            <div class="select-text">{log.reason}</div>
            {#if log.solution !== undefined}
              <div class="ml-4 font-bold">{log.solution.message}</div>

              {#if log.solution.link !== undefined && log.solution.link !== ""}
                <button
                  on:click={solution(log.solution.link)}
                  class="relative bg-background-soft mr-3 block hover:bg-background text-foreground ml-3 my-2 py-1 px-2 rounded border-commit-saturate-10 hover:border-commit-desaturate-10 focus:outline-none"
                >
                  Find solution
                </button>
              {/if}
            {/if}
          </div>
        {/key}
      {/if}
    {/each}

    <div
      class="w-full flex flex-row justify-center items-center"
      style="background-color: var(--error); color: var(--foreground);"
    >
      Reload the application using {text} or click

      <button
        on:click={refresh}
        class="relative bg-background-soft mr-3 block hover:bg-background text-foreground ml-3 my-2 py-1 px-2 rounded border-commit-saturate-10 hover:border-commit-desaturate-10 focus:outline-none"
      >
        Restart
      </button>
      <button
        on:click={dismiss}
        class="relative bg-background-soft mr-3 block hover:bg-background text-foreground ml-1 my-2 py-1 px-2 rounded border-commit-saturate-10 hover:border-commit-desaturate-10 focus:outline-none"
      >
        Dismiss
      </button>
    </div>
  </div>
{/if}

{#each notifications as notification, index}
  {#key index === notifications.length}
    <div
      in:fly|global={{ x: -50, delay: 0, duration: 500 }}
      class="w-full {notification.class
        ? notification.class
        : 'bg-green-500'} justify-center flex flex-row items-center h-16 select-text"
    >
      <div use:copyContextMenu class="select-text">{notification.message}</div>

      {#if notification.link !== undefined && notification.link !== ""}
        <button
          on:click={solution(notification.link)}
          class="relative bg-gray-600 mr-3 block hover:bg-gray-300 text-white ml-3 my-2 py-1 px-2 rounded border-commit-saturate-10 hover:border-commit-desaturate-10 focus:outline-none"
        >
          Open Link
        </button>

        {#if notification.dismissable === true}
          <button
            on:click={() => {
              close_notification(index);
            }}
            class="relative bg-gray-600 mr-3 block hover:bg-gray-300 text-white ml-3 my-2 py-1 px-2 rounded border-commit-saturate-10 hover:border-commit-desaturate-10 focus:outline-none"
          >
            Close
          </button>
        {/if}
      {/if}
    </div>
  {/key}
{/each}
