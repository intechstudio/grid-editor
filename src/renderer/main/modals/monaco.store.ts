import { writable, type Writable } from "svelte/store";
import { ConfigObject } from "../panels/configuration/Configuration.store";

export const monaco_store: Writable<{ config: ConfigObject; index: number }> =
  writable();
