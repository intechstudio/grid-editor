import { grid } from "@intechstudio/grid-protocol";
import { GridRuntime } from "./runtime";

// A detached, display-only runtime holding one generic module. It is never
// registered in runtime_manager and has no connection: it only gives the
// "no module connected" / firmware update screens something to render.
let mockRuntime: GridRuntime | undefined;

export function getMockRuntime(): GridRuntime {
  if (mockRuntime) {
    return mockRuntime;
  }

  const runtime = new GridRuntime(undefined, true);
  const info = grid
    .module_hwcfgs()
    .reverse()
    .find((e) => e.type === "EN16");

  const module = runtime.create_module(
    { DX: 0, DY: 0, SX: 0, SY: 0 },
    { HWCFG: info.hwcfg },
    true,
  );
  runtime.modules = [module];

  mockRuntime = runtime;
  return runtime;
}
