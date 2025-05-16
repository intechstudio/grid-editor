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

  async type(text) {
    await this.page.keyboard.type(text);
  }
}

module.exports = KeyboardActions;
