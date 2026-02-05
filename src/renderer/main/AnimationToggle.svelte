<script lang="ts">
  import { appSettings } from "../runtime/app-helper.store";
  import {
    reduced_motion_store,
    setDocumentAnimationsEnabled,
  } from "../runtime/animations";

  // Track user preference and OS reduced-motion signal.
  const disablePreference = $state<
    "auto" | "enabled" | "disabled" | boolean | undefined
  >();
  const prefersReducedMotion = $state(false);

  const stopSettings = appSettings.subscribe((value) => {
    disablePreference = value.persistent.disableAnimations;
  });

  const stopReducedMotion = reduced_motion_store.subscribe((value) => {
    prefersReducedMotion = value;
  });

  $effect(() => {
    switch (disablePreference) {
      case "auto": {
        setDocumentAnimationsEnabled(!prefersReducedMotion);
        break;
      }
      case "enabled": {
        setDocumentAnimationsEnabled(true);
        break;
      }
      case "disabled": {
        setDocumentAnimationsEnabled(false);
        break;
      }
      default: {
        // Keep current animation state for unrecognized values (existing behavior).
      }
    }

    // instead of onDestroy, return from $effecct for cleanup.
    return {
        stopSettings?.();
        stopReducedMotion?.();
    }
  });
</script>
