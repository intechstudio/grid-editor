/**
 * Maps action block categories to their CSS variable.
 * Colors are defined in app.css as --category-* variables,
 * so you can retheme all blocks in one place.
 */
export const categoryColors: Record<string, string> = {
  midi: "var(--category-midi)",
  hid: "var(--category-hid)",
  led: "var(--category-led)",
  variables: "var(--category-variables)",
  condition: "var(--category-condition)",
  loop: "var(--category-loop)",
  code: "var(--category-code)",
  "element settings": "var(--category-element-settings)",
  timer: "var(--category-timer)",
  function: "var(--category-function)",
  special: "var(--category-special)",
  deprecated: "var(--category-deprecated)",
};
