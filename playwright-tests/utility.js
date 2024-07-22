export const PAGE_PATH =
  process.env.CI == "true"
    ? 'http://localhost:5173'
    // ? `file://${process.cwd()}/dist-web/index.html`
    : `http://localhost:5173`;
