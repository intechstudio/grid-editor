/**
 * Profile Loading System
 *
 * Filename convention: {module-type}-{profile-type}.json
 * Examples: bu16-getting-started.json, en16-advanced.json
 *
 * This will create dropdown options for each unique profile-type,
 * and load the appropriate file for each module type.
 */

import { get, writable } from "svelte/store";
import { user_input } from "./user-input.store";
import { logger } from "./runtime.store";
import { Analytics } from "./analytics";
import type { GridRuntime } from "./runtime";

// Constants
const PROFILE_PATTERN = '../../content/*.json';
const CLASSNAME = 'gettingstarted';

/**
 * Formats a profile type string for display
 * @example formatProfileTypeTitle("getting-started") => "Getting Started"
 */
export function formatProfileTypeTitle(type: string): string {
  return type.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

// Dynamically import all profile JSON files using Vite's glob import
const profileModules = import.meta.glob('../../content/*.json', {
  eager: true,
  import: 'default'
});

// Build a nested map: { ModuleType: { profileType: profileData } }
const PROFILES: Record<string, Record<string, any>> = {};
const profileTypes = new Set<string>();

for (const path in profileModules) {
  // Extract module type and profile type from filename
  // Example: "../../content/bu16-getting-started.json" -> moduleType: "BU16", profileType: "getting-started"
  const match = path.match(/\/([a-z0-9]+)-(.+)\.json$/i);
  if (match) {
    const moduleType = match[1].toUpperCase();
    const profileType = match[2]; // e.g., "getting-started", "advanced", etc.

    if (!PROFILES[moduleType]) {
      PROFILES[moduleType] = {};
    }
    PROFILES[moduleType][profileType] = profileModules[path];
    profileTypes.add(profileType);
  }
}

const availableProfileTypes = Array.from(profileTypes);

// Print summary of available profiles grouped by profile type
console.log('[Getting Started] Available profiles:');
for (const profileType of availableProfileTypes.sort()) {
  const modules = Object.keys(PROFILES)
    .filter(moduleType => PROFILES[moduleType][profileType])
    .sort();
  console.log(`  ${profileType}: ${modules.join(', ')}`);
}

// Store for selected profile type
export const selectedProfileType = writable<string>(
  availableProfileTypes.length > 0 ? availableProfileTypes[0] : ''
);

// Export available profile types for the dropdown
export { availableProfileTypes };

/**
 * Loads getting started profiles to all connected modules
 */
export async function loadGettingStartedProfiles(runtime: GridRuntime) {
  const ui = get(user_input);
  const modules = runtime.modules;
  const profileType = get(selectedProfileType);

  if (!modules || modules.length === 0) {
    logger.set({
      type: "alert",
      mode: 0,
      classname: CLASSNAME,
      message: "No modules connected. Please connect a module first.",
    });
    return;
  }

  if (!profileType) {
    logger.set({
      type: "alert",
      mode: 0,
      classname: CLASSNAME,
      message: "No profile type selected.",
    });
    return;
  }

  try {
    const { GridProfileData } = await import("./runtime");
    const { loadProfile } = await import("./operations");

    let loadedCount = 0;
    let skippedCount = 0;

    logger.set({
      type: "progress",
      mode: 0,
      classname: CLASSNAME,
      message: `Loading "${profileType}" profiles to ${modules.length} module(s)...`,
    });

    // Process each module
    for (let i = 0; i < modules.length; i++) {
      const module = modules[i];
      const moduleType = module.type;

      // Check if we have this profile type for this module type
      const profileData = PROFILES[moduleType]?.[profileType];
      if (!profileData) {
        console.warn(`No "${profileType}" profile for ${moduleType}, skipping...`);
        skippedCount++;
        continue;
      }

      // Show loading message for this module
      logger.set({
        type: "progress",
        mode: (loadedCount + skippedCount) / modules.length,
        classname: CLASSNAME,
        message: `Loading to ${moduleType} (${module.dx},${module.dy})...`,
      });

      // Convert to GridProfileData
      const profile = GridProfileData.createFromCloudData(profileData);

      // Get the current page for this module
      const page = module.pages[ui.pagenumber];

      // Load the profile (no progress callback to reduce logger spam)
      await loadProfile(profile, page);

      loadedCount++;

      // Show completion message for this module
      logger.set({
        type: "progress",
        mode: (loadedCount + skippedCount) / modules.length,
        classname: CLASSNAME,
        message: `Loaded ${moduleType} (${module.dx},${module.dy}) - ${loadedCount + skippedCount}/${modules.length}`,
      });
    }

    // Show final result
    const resultMessages = [];
    if (loadedCount > 0) {
      resultMessages.push(`Loaded ${loadedCount} module(s)`);
    }
    if (skippedCount > 0) {
      resultMessages.push(`skipped ${skippedCount} (no profile available)`);
    }

    logger.set({
      type: "success",
      mode: 0,
      classname: CLASSNAME,
      message: `Getting started profiles complete! ${resultMessages.join(", ")}`,
    });

    Analytics.track({
      event: "Getting Started Profile",
      payload: {
        modulesLoaded: loadedCount,
        modulesSkipped: skippedCount,
      },
      mandatory: false,
    });

  } catch (error) {
    console.error("Failed to load getting started profiles:", error);
    logger.set({
      type: "alert",
      mode: 0,
      classname: CLASSNAME,
      message: "Failed to load getting started profiles. Please try again.",
    });
  }
}
