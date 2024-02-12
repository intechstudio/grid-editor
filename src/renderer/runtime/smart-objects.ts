export type EnsureNonOptional<T> = {
  [K in keyof T]: T[K] extends infer U | undefined ? U : T[K];
};
