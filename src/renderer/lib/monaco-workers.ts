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
import { Uri } from "monaco-editor";
import { initFile } from "@codingame/monaco-vscode-files-service-override";
import gridApiLua from "../../../build-assets/lua-annotations/grid-api.lua?raw";

// Pre-populate the annotation file in the in-memory filesystem BEFORE initialize()
// from @codingame/monaco-vscode-api runs (which happens in monaco-init.ts after this
// import). initFile called after initialize() throws "Services are already initialized".
initFile(Uri.parse("file:///grid-annotations/grid-api.lua"), gridApiLua);

// useWorkerFactory initialises MonacoEnvironment (viewServiceType, etc.)
useWorkerFactory({ workerLoaders: {} });

// getWorker is checked BEFORE getWorkerUrl in StandaloneWebWorkerService.
// Returning a real Worker bypasses the blob wrapper entirely.
const monacoEnv = (self as any).MonacoEnvironment;
if (monacoEnv) {
  monacoEnv.getWorker = () => new EditorWorker();
}
