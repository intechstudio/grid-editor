export const PAGE_PATH =
  process.env.CI == "true"
    ? `file://${process.cwd()}/dist-web/index.html`
    : `http://localhost:5173`;
