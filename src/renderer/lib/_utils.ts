export class Grid {
  static toFirstCase(value: string) {
    return value[0].toUpperCase() + value.slice(1, value.length);
  }
}
