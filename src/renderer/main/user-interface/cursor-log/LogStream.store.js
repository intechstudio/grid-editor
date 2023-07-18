import { writable, get } from "svelte/store";
import { logger } from "../../../runtime/runtime.store";

export let logStreamStore = createLogStream();

let logClearTimeout = undefined;

function createLogStream() {
  const logStream = writable([]);

  const unsubscribe = logger.subscribe((store) => {
    const logs = get(logStream);
    if (typeof store !== "undefined") {
      if (
        logs.map((l) => l.classname).includes("pagechange") &&
        store.classname == "strict"
      ) {
        logStream.set([]);
      }

      clearTimeout(logClearTimeout);

      const last = logs.at(-1);
      if (typeof last !== "undefined" && last.data.message === store.message) {
        last.count++;
      } else {
        if (logs.length >= 6) {
          logs.shift();
        }
        logStream.update((store) => {
          return [
            ...logs,
            {
              data: get(logger),
              count: 1,
            },
          ];
        });
      }

      logClearTimeout = setTimeout(() => {
        logStream.set([]);
        logger.set(undefined);
      }, 5000);
    }
  });

  return logStream;
}
