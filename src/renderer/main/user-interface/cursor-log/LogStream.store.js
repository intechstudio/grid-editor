import { createLogStream } from "@intechstudio/grid-uikit";
import { logger } from "../../../runtime/runtime.store";

export const logStreamStore = createLogStream();

// Approximates the old rule "clear the stream when a strict-validation log
// follows a pagechange log" using just the most recently pushed log's
// classname, rather than mirroring every currently-visible entry — the
// uikit store doesn't carry `classname` through, and a parallel array would
// drift out of sync with dismiss-by-click and count aggregation happening
// inside it.
let lastClassname;

logger.subscribe((l) => {
  if (typeof l === "undefined") return;

  if (lastClassname === "pagechange" && l.classname === "strict") {
    logStreamStore.reset();
  }
  lastClassname = l.classname;

  // grid-editor logs use "info" where uikit's LogMessageType uses "normal".
  logStreamStore.push({
    type: l.type === "info" ? "normal" : l.type,
    message: l.message,
  });
});
