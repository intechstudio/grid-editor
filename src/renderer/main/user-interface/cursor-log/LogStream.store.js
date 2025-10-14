import { writable, get } from "svelte/store";
import { logger } from "../../../runtime/runtime.store";

export let logStreamStore = createLogStream();

let logClearTimeout = undefined;

function createLogStream() {
  const logStream = writable([]);
  let isTimeoutEnabled = true;

  function clearLogs(force = false) {
    if (isTimeoutEnabled || force) {
      logStream.set([]);
      logger.set(undefined);
    } else {
      logClearTimeout = setTimeout(clearLogs, 500);
    }
  }

  function dismissLog({ index }) {
    logStream.update((s) => {
      s.splice(index, 1);
      return s;
    });
  }

  function enableTimeout(value) {
    isTimeoutEnabled = value;
  }

  const unsubscribe = logger.subscribe((l) => {
    if (typeof l !== "undefined") {
      if (
        get(logStream)
          .map((l) => l.classname)
          .includes("pagechange") &&
        l.classname == "strict"
      ) {
        logStream.set([]);
      }

      clearTimeout(logClearTimeout);

      logStream.update((ls) => {
        const last = ls.at(-1);
        if (typeof last !== "undefined" && last.data.message === l.message) {
          last.count++;
          return ls;
        } else {
          if (ls.length >= 6) {
            ls.shift();
          }

          return [
            ...ls,
            {
              data: get(logger),
              count: 1,
            },
          ];
        }
      });

      logClearTimeout = setTimeout(clearLogs, 5000);
    }
  });

  return {
    ...logStream,
    dismissLog: dismissLog,
    enableTimeout: enableTimeout,
  };
}
