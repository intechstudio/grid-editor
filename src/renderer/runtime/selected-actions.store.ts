import { writable, type Writable } from "svelte/store";
import { GridAction } from "./runtime";

export const selected_actions: Writable<GridAction[]> = writable([]);
