export namespace SettingsButton {
  export function calculateStepValuesFirmwareStyle(
    steps: number,
    min: number,
    max: number,
  ): number[] {
    if (steps < 2) return [Math.round(min)];

    const [tmin, tmax] = [min, max];
    const res = [tmin];
    let last = tmin;
    for (let i = 1; i < steps; ++i) {
      let new_value = last + Math.trunc((tmax - tmin) / (steps - 1));

      last = new_value;

      res.push(new_value);
    }
    return res;
  }
}
