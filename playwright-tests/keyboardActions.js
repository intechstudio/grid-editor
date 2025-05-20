class KeyboardActions {
  constructor(page) {
    this.page = page;
  }
  async selectAll() {
    await this.page.keyboard.press("ControlOrMeta+A");
  }
  async copy() {
    await this.page.keyboard.press("ControlOrMeta+C");
  }
  async paste() {
    await this.page.keyboard.press("ControlOrMeta+V");
  }
  async esc() {
    await this.page.keyboard.press("Escape");
  }
  async enter() {
    await this.page.keyboard.press("Enter");
  }

  async type(text) {
    await this.page.keyboard.type(text);
  }
}

module.exports = KeyboardActions;
