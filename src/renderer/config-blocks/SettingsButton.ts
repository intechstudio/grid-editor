export namespace SettingsButton {
  export function calculateStepValues(
    steps: number,
    min: number,
    max: number,
  ): number[] {
    if (steps < 2) return [min];

    const stepValue = (max - min) / (steps - 1);
    return Array.from({ length: steps }, (_, i) =>
      Math.round(min + i * stepValue),
    );
  }
}
