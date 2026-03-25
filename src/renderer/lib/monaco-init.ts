/**
 * Monaco + @codingame/monaco-vscode-api initialization.
 *
 * This module MUST be imported (and awaited) before any monaco-editor usage:
 * - editor.create()
 * - editor.defineTheme()
 * - languages.register()
 * - languages.setMonarchTokensProvider()
 *
 * It sets up the VSCode service layer that monaco-languageclient requires,
 * using "classic" mode using Monarch tokenizer.
 */

// Worker factory must be configured before initialize()
import "./monaco-workers";

import { initialize } from "@codingame/monaco-vscode-api";
import getConfigurationServiceOverride from "@codingame/monaco-vscode-configuration-service-override";
import getEditorServiceOverride from "@codingame/monaco-vscode-editor-service-override";
import getLanguagesServiceOverride from "@codingame/monaco-vscode-languages-service-override";
import getLogServiceOverride from "@codingame/monaco-vscode-log-service-override";
import getModelServiceOverride from "@codingame/monaco-vscode-model-service-override";
import getMonarchServiceOverride from "@codingame/monaco-vscode-monarch-service-override";

/**
 * Initialize all VSCode services required for monaco-languageclient.
 * Returns a promise that resolves when services are ready.
 */
export const monacoReady: Promise<void> = initialize({
  ...getLogServiceOverride(),
  ...getModelServiceOverride(),
  ...getConfigurationServiceOverride(),
  ...getLanguagesServiceOverride(),
  ...getMonarchServiceOverride(),
  ...getEditorServiceOverride((model, input, sideBySide) => {
    // Single-editor mode: no-op for "open editor" requests
    return undefined;
  }),
}).then(() => {
  console.log("[Monaco] VSCode services initialized (classic mode)");
});
