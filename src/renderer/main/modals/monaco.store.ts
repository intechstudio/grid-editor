import { writable, type Writable } from "svelte/store";
import { GridAction } from "../../runtime/runtime";

export type MonacoValue = { config: GridAction; index: number } | undefined;

export const monaco_store: Writable<MonacoValue> = writable();
