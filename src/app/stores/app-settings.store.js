import { writable } from 'svelte/store';

import * as grid_protocol from '../../external/grid-protocol/grid_protocol.json';

const GRID = grid_protocol;

export const appSettings = writable({
  size: 2,
  version: {
    major: +GRID.GRID_PROTOCOL_VERSION_MAJOR,
    minor: +GRID.GRID_PROTOCOL_VERSION_MINOR,
    patch: +GRID.GRID_PROTOCOL_VERSION_PATCH
  },
  overlays: {controlName: false},
  debugMode: false,
  selectedDisplay: 'settings'
});