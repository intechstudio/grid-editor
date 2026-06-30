import { writable, type Writable } from "svelte/store";

export interface ModuleProgress {
  available: boolean;
  operationTotal: number;
  operationCompleted: number;
}

export type ModuleProgressMap = Record<string, ModuleProgress>;

export const profileLoadProgress: Writable<ModuleProgressMap | undefined> =
  writable(undefined);
