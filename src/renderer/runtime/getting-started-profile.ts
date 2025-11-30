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

// Types
interface RegisteredProfile {
  data: any;
  displayName: string;
  categoryName: string;
}

// Internal storage: { ModuleType: { displayName: RegisteredProfile } }
const PROFILES: Record<string, Record<string, RegisteredProfile>> = {};

/**
 * Register a profile for a specific module type
 * @param moduleType - The module type (e.g., "BU16", "EN16")
 * @param displayName - The display name shown in dropdown (e.g., "getting-started", "advanced")
 * @param categoryName - Category for grouping (e.g., "file", "custom")
 * @param jsonString - JSON string of the profile data
 */
export function register_getting_started_profile(
  moduleType: string,
  displayName: string,
  categoryName: string,
  jsonString: string
): void {
  try {
    const data = JSON.parse(jsonString);

    if (!PROFILES[moduleType]) {
      PROFILES[moduleType] = {};
    }

    PROFILES[moduleType][displayName] = {
      data,
      displayName,
      categoryName
    };

    // Update available profile types
    updateAvailableProfileTypes();
  } catch (error) {
    console.error(`Failed to register profile "${displayName}" for ${moduleType}:`, error);
  }
}

/**
 * Unregister all profiles from a specific category
 * @param categoryName - The category to unregister (e.g., "file", "custom")
 */
export function unregister_getting_started_category(categoryName: string): void {
  for (const moduleType in PROFILES) {
    for (const displayName in PROFILES[moduleType]) {
      if (PROFILES[moduleType][displayName].categoryName === categoryName) {
        delete PROFILES[moduleType][displayName];
      }
    }
    // Clean up empty module types
    if (Object.keys(PROFILES[moduleType]).length === 0) {
      delete PROFILES[moduleType];
    }
  }

  // Update available profile types
  updateAvailableProfileTypes();
}

// Available profile types (reactive)
let availableProfileTypes: string[] = [];

function updateAvailableProfileTypes() {
  const profileTypeSet = new Set<string>();

  for (const moduleType in PROFILES) {
    for (const displayName in PROFILES[moduleType]) {
      profileTypeSet.add(displayName);
    }
  }

  availableProfileTypes = Array.from(profileTypeSet).sort();

  // Print summary of available profiles grouped by profile type
  console.log('[Getting Started] Available profiles:');
  for (const profileType of availableProfileTypes) {
    const modules = Object.keys(PROFILES)
      .filter(moduleType => PROFILES[moduleType][profileType])
      .sort();
    console.log(`  ${profileType}: ${modules.join(', ')}`);
  }
}

// Export available profile types
export { availableProfileTypes };

/**
 * Loads getting started profiles to all connected modules
 * @param runtime - The GridRuntime instance
 * @param profileType - The profile type to load (e.g., "getting-started", "advanced")
 */
export async function loadGettingStartedProfiles(runtime: GridRuntime, profileType: string) {
  const ui = get(user_input);
  const modules = runtime.modules;

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

    // Clear the page before loading profiles
    logger.set({
      type: "progress",
      mode: 0,
      classname: CLASSNAME,
      message: `Clearing page ${ui.pagenumber}...`,
    });

    await runtime.clearPage(ui.pagenumber);

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
      const registeredProfile = PROFILES[moduleType]?.[profileType];
      if (!registeredProfile) {
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
      const profile = GridProfileData.createFromCloudData(registeredProfile.data);

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

    // Store the configurations to the modules
    logger.set({
      type: "progress",
      mode: 0,
      classname: CLASSNAME,
      message: `Storing configurations to modules...`,
    });

    await runtime.storePage(ui.pagenumber);

    logger.set({
      type: "success",
      mode: 0,
      classname: CLASSNAME,
      message: `Store complete!`,
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
