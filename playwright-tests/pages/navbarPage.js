export class NavbarPage {
  constructor(page) {
    this.page = page;
    this.configuration = page.getByTestId("nav-configuration");
    this.preferences = page.getByTestId("nav-preferences");
    this.profileCloud = page.getByTestId("nav-profile-cloud");
    this.debugMonitor = page.getByTestId("nav-debug-monitor");
    this.midiMonitor = page.getByTestId("nav-midi-monitor");
    this.packageManager = page.getByTestId("nav-packages");
  }

  async clickNavItem(itemName) {
    const navItems = {
      configuration: this.configuration,
      preferences: this.preferences,
      profileCloud: this.profileCloud,
      debugMonitor: this.debugMonitor,
      midiMonitor: this.midiMonitor,
      packageManager: this.packageManager,
    };

    if (navItems[itemName]) {
      await navItems[itemName].click();
    } else {
      throw new Error(`Nav item "${itemName}" not found`);
    }
  }
}
