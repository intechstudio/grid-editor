/**
 * Profile Loading System
 *
 * Filename convention: {profile-type}-{module-type}.json
 * Examples: pressure-sensitive-defaults-bu16.json
 *
 * This will create dropdown options for each unique profile-type,
 * and load the appropriate file for each module type.
 */

import { get, writable } from "svelte/store";
import { user_input } from "./user-input.store";
import { logger } from "./runtime.store";
import { Analytics } from "./analytics";
import { moduleOverlay, ModuleOverlay } from "./moduleOverlay";
import { profileLoadProgress } from "./profileLoadProgress";
import type { GridRuntime } from "./runtime";

// Constants
const PROFILE_PATTERN = "../../content/*.json";
const CLASSNAME = "gettingstarted";

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
  jsonString: string,
): void {
  try {
    const data = JSON.parse(jsonString);

    if (!PROFILES[moduleType]) {
      PROFILES[moduleType] = {};
    }

    PROFILES[moduleType][displayName] = {
      data,
      displayName,
      categoryName,
    };

    // Update available profile types
    updateAvailableProfileTypes();
  } catch (error) {
    console.error(
      `Failed to register profile "${displayName}" for ${moduleType}:`,
      error,
    );
  }
}

/**
 * Unregister all profiles from a specific category
 * @param categoryName - The category to unregister (e.g., "file", "custom")
 */
export function unregister_getting_started_category(
  categoryName: string,
): void {
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
  console.log("[Getting Started] Available profiles:");
  for (const profileType of availableProfileTypes) {
    const modules = Object.keys(PROFILES)
      .filter((moduleType) => PROFILES[moduleType][profileType])
      .sort();
    console.log(`  ${profileType}: ${modules.join(", ")}`);
  }
}

// Export available profile types
export { availableProfileTypes };

/**
 * Loads getting started profiles to all connected modules
 * @param runtime - The GridRuntime instance
 * @param profileType - The profile type to load (e.g., "getting-started", "advanced")
 */
export function initProfileLoadOverlay(
  runtime: GridRuntime,
  profileType?: string,
) {
  const modules = runtime.modules;
  if (!modules || modules.length === 0) return;

  const progressMap: Record<
    string,
    { available: boolean; operationTotal: number; operationCompleted: number }
  > = {};
  for (const m of modules) {
    const hasProfile = profileType ? !!PROFILES[m.type]?.[profileType] : true;
    progressMap[`${m.dx},${m.dy}`] = {
      available: hasProfile,
      operationTotal: 0,
      operationCompleted: 0,
    };
  }
  profileLoadProgress.set(progressMap);
  moduleOverlay.show(ModuleOverlay.Types.PROFILE_LOAD_PROGRESS);
}

export function loadGettingStartedProfiles(
  runtime: GridRuntime,
  profileType: string,
) {
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

  return Promise.all([import("./runtime"), import("./operations")])
    .then(([{ GridProfileData }, { loadProfile }]) => {
      let loadedCount = 0;
      let skippedCount = 0;
      let chain = Promise.resolve();

      const loadableModules = modules.filter(
        (m) => PROFILES[m.type]?.[profileType],
      );

      profileLoadProgress.update((map) => {
        if (map) return map;
        const newMap: Record<
          string,
          {
            available: boolean;
            operationTotal: number;
            operationCompleted: number;
          }
        > = {};
        for (const m of modules) {
          newMap[`${m.dx},${m.dy}`] = {
            available: !!PROFILES[m.type]?.[profileType],
            operationTotal: 0,
            operationCompleted: 0,
          };
        }
        return newMap;
      });
      moduleOverlay.show(ModuleOverlay.Types.PROFILE_LOAD_PROGRESS);

      for (let i = 0; i < modules.length; i++) {
        const module = modules[i];
        const moduleType = module.type;

        const registeredProfile = PROFILES[moduleType]?.[profileType];
        if (!registeredProfile) {
          console.warn(
            `No "${profileType}" profile for ${moduleType}, skipping...`,
          );
          skippedCount++;
          continue;
        }

        const profile = GridProfileData.createFromCloudData(
          registeredProfile.data,
        );
        const page = module.pages[ui.pagenumber];
        const key = `${module.dx},${module.dy}`;

        chain = chain
          .then(() =>
            loadProfile(profile, page, (status) => {
              profileLoadProgress.update((map) => {
                if (!map) return map;
                map[key] = {
                  available: true,
                  operationTotal: status.total || 0,
                  operationCompleted: status.completed || 0,
                };
                return map;
              });
            }),
          )
          .then(() => {
            loadedCount++;
          });
      }

      return chain
        .then(() => runtime.storePage(ui.pagenumber))
        .then(() => ({ loadedCount, skippedCount }));
    })
    .then(({ loadedCount, skippedCount }) => {
      return new Promise((r) => setTimeout(r, 1000)).then(() => ({
        loadedCount,
        skippedCount,
      }));
    })
    .then(({ loadedCount, skippedCount }) => {
      moduleOverlay.close();
      profileLoadProgress.set(undefined);
      Analytics.track({
        event: "Getting Started Profile",
        payload: {
          modulesLoaded: loadedCount,
          modulesSkipped: skippedCount,
        },
        mandatory: false,
      });
    })
    .catch((error) => {
      moduleOverlay.close();
      profileLoadProgress.set(undefined);
      console.error("Failed to load getting started profiles:", error);
      logger.set({
        type: "alert",
        mode: 0,
        classname: CLASSNAME,
        message: "Failed to load getting started profiles. Please try again.",
      });
    });
}
