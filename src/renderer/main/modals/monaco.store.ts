import { writable, type Writable } from "svelte/store";
import { ConfigObject } from "../panels/configuration/Configuration.store";

export type MonacoValue = { config: ConfigObject; index: number } | undefined;

export const monaco_store: Writable<MonacoValue> = writable();
