/**
 * Monaco Editor worker setup for @codingame/monaco-vscode-api.
 *
 * Vite's ?worker suffix bundles the entry point into a self-contained file
 * and gives us a Worker constructor. We set MonacoEnvironment.getWorker so
 * StandaloneWebWorkerService uses it directly — bypassing the blob-URL
 * bootstrap that can't resolve bare specifiers under Electron's file://
 * protocol.
 *
 * This must run before initialize() from @codingame/monaco-vscode-api.
 */
import { useWorkerFactory } from "monaco-languageclient/workerFactory";
import EditorWorker from "@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js?worker";

// useWorkerFactory initialises MonacoEnvironment (viewServiceType, etc.)
useWorkerFactory({ workerLoaders: {} });

// getWorker is checked BEFORE getWorkerUrl in StandaloneWebWorkerService.
// Returning a real Worker bypasses the blob wrapper entirely.
const monacoEnv = (self as any).MonacoEnvironment;
if (monacoEnv) {
  monacoEnv.getWorker = () => new EditorWorker();
}
