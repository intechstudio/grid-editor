/**
 * Monaco Editor worker setup for @codingame/monaco-vscode-api.
 *
 * Uses useWorkerFactory from monaco-languageclient to configure the
 * editor worker service. This must be called before initialize()
 * from @codingame/monaco-vscode-api.
 */
import {
  useWorkerFactory,
  Worker as MCWorker,
} from "monaco-languageclient/workerFactory";

useWorkerFactory({
  workerLoaders: {
    editorWorkerService: () =>
      new MCWorker(
        new URL(
          "@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js",
          import.meta.url,
        ),
      ),
  },
});
