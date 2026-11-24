import { writable, type Writable } from "svelte/store";

export interface ModuleProgress {
  available: boolean;
  operationTotal: number;
  operationCompleted: number;
  // set while files are being uploaded: overall upload progress, 0-100
  filePercent?: number;
}

export type ModuleProgressMap = Record<string, ModuleProgress>;

export const profileLoadProgress: Writable<ModuleProgressMap | undefined> =
  writable(undefined);
