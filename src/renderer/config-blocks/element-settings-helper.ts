import { ElementType } from "@intechstudio/grid-protocol";
import { GridElement, GridEvent } from "../runtime/runtime";

export namespace ElementSettingsHelper {
  /**
   * Element settings extracted from configuration actions
   */
  export interface ElementSettings {
    mode: string | null;
    min: string | null;
    max: string | null;
    modeInfo: string | null;
  }

  /**
   * Suggested settings that an action recommends for optimal operation
   */
  export interface SuggestedSettings {
    mode?: string;
    min?: string;
    max?: string;
    reason?: string; // Optional explanation of why these settings are suggested
  }

  /**
   * Default settings when no element settings action is found
   */
  const DEFAULTS: Partial<Record<ElementType, ElementSettings>> = {
    [ElementType.BUTTON]: {
      mode: "0",
      min: "0",
      max: "127",
      modeInfo: "Momentary",
    },
    [ElementType.ENCODER]: {
      mode: "0",
      min: "0",
      max: "127",
      modeInfo: "Absolute",
    },
    [ElementType.POTMETER]: {
      mode: "7",
      min: "0",
      max: "127",
      modeInfo: "7 bit",
    },
    [ElementType.FADER]: {
      mode: "7",
      min: "0",
      max: "127",
      modeInfo: "7 bit",
    },
    [ElementType.ENDLESS]: {
      mode: "0",
      min: "0",
      max: "127",
      modeInfo: "Absolute",
    },
    [ElementType.SYSTEM]: {
      mode: null,
      min: null,
      max: null,
      modeInfo: null,
    },
  };

  /**
   * Regex to extract values from parentheses in Lua code
   */
  const PARENTHESIS_REGEX = /\(([^)]+)\)/;

  /**
   * Extract button settings from element configuration
   */
  function extractButtonSettings(element: GridElement): ElementSettings {
    const defaultSettings = DEFAULTS[ElementType.BUTTON];

    // Look for SettingsButton action (short: "sbc")
    for (const event of element.events) {
      const settingsAction = event.data.config.find(
        (action) => action.short === "sbc",
      );
      if (settingsAction) {
        const script = settingsAction.script;
        const parts = script.split("self:").slice(1);

        let mode = defaultSettings.mode;
        let min = defaultSettings.min;
        let max = defaultSettings.max;
        let modeInfo = defaultSettings.modeInfo;

        // Extract bmo (button mode)
        const bmoIndex = parts.findIndex((p) => p.includes("bmo"));
        if (bmoIndex !== -1) {
          const match = PARENTHESIS_REGEX.exec(parts[bmoIndex]);
          if (match) {
            mode = match[1];
            modeInfo = getModeInfo(ElementType.BUTTON, mode);
          }
        }

        // Extract bmi (button min)
        const bmiIndex = parts.findIndex((p) => p.includes("bmi"));
        if (bmiIndex !== -1) {
          const match = PARENTHESIS_REGEX.exec(parts[bmiIndex]);
          if (match) min = match[1];
        }

        // Extract bma (button max)
        const bmaIndex = parts.findIndex((p) => p.includes("bma"));
        if (bmaIndex !== -1) {
          const match = PARENTHESIS_REGEX.exec(parts[bmaIndex]);
          if (match) max = match[1];
        }

        return { mode, min, max, modeInfo };
      }
    }

    return defaultSettings;
  }

  /**
   * Extract encoder settings from element configuration
   */
  function extractEncoderSettings(element: GridElement): ElementSettings {
    const defaultSettings = DEFAULTS[ElementType.ENCODER];

    // Look for SettingsEncoder action (short: "sec")
    for (const event of element.events) {
      const settingsAction = event.data.config.find(
        (action) => action.short === "sec",
      );
      if (settingsAction) {
        const script = settingsAction.script;
        const parts = script.split("self:").slice(1);

        let mode = defaultSettings.mode;
        let min = defaultSettings.min;
        let max = defaultSettings.max;
        let modeInfo = defaultSettings.modeInfo;

        // Extract emo (encoder mode)
        const emoIndex = parts.findIndex((p) => p.includes("emo"));
        if (emoIndex !== -1) {
          const match = PARENTHESIS_REGEX.exec(parts[emoIndex]);
          if (match) {
            mode = match[1];
            modeInfo = getModeInfo(ElementType.ENCODER, mode);
          }
        }

        // Extract emi (encoder min)
        const emiIndex = parts.findIndex((p) => p.includes("emi"));
        if (emiIndex !== -1) {
          const match = PARENTHESIS_REGEX.exec(parts[emiIndex]);
          if (match) min = match[1];
        }

        // Extract ema (encoder max)
        const emaIndex = parts.findIndex((p) => p.includes("ema"));
        if (emaIndex !== -1) {
          const match = PARENTHESIS_REGEX.exec(parts[emaIndex]);
          if (match) max = match[1];
        }

        return { mode, min, max, modeInfo };
      }
    }

    return defaultSettings;
  }

  /**
   * Extract potmeter settings from element configuration
   */
  function extractPotmeterSettings(element: GridElement): ElementSettings {
    const defaultSettings = DEFAULTS[ElementType.POTMETER];

    // Look for SettingsPotmeter action (short: "spc")
    for (const event of element.events) {
      const settingsAction = event.data.config.find(
        (action) => action.short === "spc",
      );
      if (settingsAction) {
        const script = settingsAction.script;
        const parts = script.split("self:").slice(1);

        let mode = defaultSettings.mode;
        let min = defaultSettings.min;
        let max = defaultSettings.max;
        let modeInfo = defaultSettings.modeInfo;

        // Extract pmo (potmeter mode)
        const pmoIndex = parts.findIndex((p) => p.includes("pmo"));
        if (pmoIndex !== -1) {
          const match = PARENTHESIS_REGEX.exec(parts[pmoIndex]);
          if (match) {
            mode = match[1];
            modeInfo = getModeInfo(ElementType.POTMETER, mode);
          }
        }

        // Extract pmi (potmeter min)
        const pmiIndex = parts.findIndex((p) => p.includes("pmi"));
        if (pmiIndex !== -1) {
          const match = PARENTHESIS_REGEX.exec(parts[pmiIndex]);
          if (match) min = match[1];
        }

        // Extract pma (potmeter max)
        const pmaIndex = parts.findIndex((p) => p.includes("pma"));
        if (pmaIndex !== -1) {
          const match = PARENTHESIS_REGEX.exec(parts[pmaIndex]);
          if (match) max = match[1];
        }

        return { mode, min, max, modeInfo };
      }
    }

    return defaultSettings;
  }

  /**
   * Get human-readable mode info based on element type and mode value
   */
  export function getModeInfo(
    elementType: ElementType,
    mode: string,
  ): string | null {
    const modeMap: Partial<Record<ElementType, Record<string, string>>> = {
      [ElementType.BUTTON]: {
        "-2": "Pressure",
        "-1": "Velocity",
        "0": "Momentary",
        "1": "Toggle",
        "2": "3-step",
        "3": "4-step",
      },
      [ElementType.ENCODER]: {
        "0": "Absolute",
        "1": "Relative BinOffset",
        "2": "Relative 2's Comp",
      },
      [ElementType.ENDLESS]: {
        "0": "Absolute",
        "1": "Relative",
      },
      [ElementType.POTMETER]: {
        "7": "7 bit",
        "8": "8 bit",
        "9": "9 bit",
        "10": "10 bit",
        "11": "11 bit",
        "12": "12 bit",
      },
      [ElementType.FADER]: {
        "7": "7 bit",
        "8": "8 bit",
        "9": "9 bit",
        "10": "10 bit",
        "11": "11 bit",
        "12": "12 bit",
      },
    };

    return modeMap[elementType]?.[mode] || mode;
  }

  /**
   * Get element settings based on element type
   */
  export function getElementSettings(
    element: GridElement,
  ): ElementSettings | null {
    if (!element) return null;

    switch (element.type) {
      case ElementType.BUTTON:
        return extractButtonSettings(element);
      case ElementType.ENCODER:
      case ElementType.ENDLESS:
        return extractEncoderSettings(element);
      case ElementType.POTMETER:
      case ElementType.FADER:
        return extractPotmeterSettings(element);
      case ElementType.SYSTEM:
        return DEFAULTS[ElementType.SYSTEM];
      default:
        return null;
    }
  }

  /**
   * Create suggestion objects for use in MeltCombo components
   */
  export function createSuggestions(
    settings: ElementSettings | null,
  ): Array<{ value: string; info: string }> {
    if (!settings) return [];

    const suggestions: Array<{ value: string; info: string }> = [];

    if (settings.mode !== null) {
      suggestions.push({
        value: settings.mode,
        info: `Element Mode: ${settings.modeInfo || settings.mode}`,
      });
    }

    if (settings.min !== null) {
      suggestions.push({
        value: settings.min,
        info: `Element Min: ${settings.min}`,
      });
    }

    if (settings.max !== null) {
      suggestions.push({
        value: settings.max,
        info: `Element Max: ${settings.max}`,
      });
    }

    return suggestions;
  }

  /**
   * Format tooltip text comparing current element settings with action's suggested settings
   */
  export function formatSettingsTooltip(
    element: GridElement | undefined,
    currentSettings: ElementSettings | null,
    suggestedSettings: SuggestedSettings | undefined,
  ): string {
    if (!currentSettings || !suggestedSettings) return "";

    const parts: string[] = [];

    // Add suggested reason if provided
    if (suggestedSettings.reason) {
      parts.push(`💡 ${suggestedSettings.reason}`);
      parts.push(""); // Empty line for spacing
    }

    // Mode comparison (only if action suggests a mode)
    if (
      suggestedSettings.mode &&
      currentSettings.mode !== null &&
      currentSettings.modeInfo !== null
    ) {
      const currentMode = `Mode: ${currentSettings.modeInfo} (${currentSettings.mode})`;

      if (suggestedSettings.mode !== currentSettings.mode) {
        const suggestedModeInfo = element
          ? getModeInfo(element.type, suggestedSettings.mode)
          : suggestedSettings.mode;
        parts.push(`⚠️ ${currentMode}`);
        parts.push(
          `   Suggested: ${suggestedModeInfo} (${suggestedSettings.mode})`,
        );
      } else {
        parts.push(`✓ ${currentMode}`);
      }
    }

    // Min comparison (only if action suggests a min)
    if (suggestedSettings.min && currentSettings.min !== null) {
      const currentMin = `Min: ${currentSettings.min}`;

      if (suggestedSettings.min !== currentSettings.min) {
        parts.push(`⚠️ ${currentMin}`);
        parts.push(`   Suggested: ${suggestedSettings.min}`);
      } else {
        parts.push(`✓ ${currentMin}`);
      }
    }

    // Max comparison (only if action suggests a max)
    if (suggestedSettings.max && currentSettings.max !== null) {
      const currentMax = `Max: ${currentSettings.max}`;

      if (suggestedSettings.max !== currentSettings.max) {
        parts.push(`⚠️ ${currentMax}`);
        parts.push(`   Suggested: ${suggestedSettings.max}`);
      } else {
        parts.push(`✓ ${currentMax}`);
      }
    }

    return parts.length > 0 ? parts.join("\n") : "";
  }
}
