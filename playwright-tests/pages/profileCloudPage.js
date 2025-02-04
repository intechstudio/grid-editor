export class ProfileCloudPage {
  constructor(page) {
    this.page = page;
    this.searchBar = page.getByPlaceholder("Find...");

    this.recommendedConfigsNumbers = page.getByRole("treeitem", {
      name: "Recommended Configs (66)",
    });

    this.mainConfigCategory = {
      community: page.getByRole("treeitem", {
        name: "Community Configs",
      }),
      my: page.getByRole("treeitem", { name: "My Configs" }),
      recommended: page.getByRole("treeitem", { name: "Recommended Configs" }),
    };

    this.saveConfig = page.getByRole("button", { name: "+" });
    this.saveElement = page.getByRole("button", { name: "Element" });
    this.saveModule = page.getByRole("button", { name: "Module", exact: true });
    this.saveCancelButton = page.getByRole("button", { name: "Cancel" });
    this.saveNextButton = page.getByRole("button", { name: "Next" });
    this.saveBackButton = page.getByRole("button", { name: "Back" });
    this.saveProfileNamePlaceholder = page.getByPlaceholder(
      "Your Profile/Preset name..."
    );

    this.loginButton = page.getByRole("button", { name: "Login" });
    this.emailField = page.getByPlaceholder("email@example.com");
    this.passwordField = page.getByPlaceholder("********");
    this.popupLoginButton = page.getByRole("button", {
      name: "login",
      exact: true,
    });
    this.logoutPopup = page.getByRole("button", { name: "logout" });
    this.closePopup = page.getByRole("button", { name: "close" });
    this.logoutButton = page.getByRole("button", { name: "Logout" }).first();

    this.loginFailWarning = page.getByText("Invalid email or password");
  }

  async waitForProfilesLoad() {
    // betoltott szam valtozhat!
    await this.recommendedConfigsNumbers.waitFor({ state: "visible" });
  }

  async searchProfile(name) {
    await this.searchBar.fill(name);
  }
  async clickMainProfileCategory(category) {
    await this.mainConfigCategory[category].click();
  }
  async saveProcess() {
    await this.saveConfig.click();
    await this.saveElement.click();
    await this.saveModule.click();
    await this.saveNextButton.click();
    await this.saveProfileNamePlaceholder.fill("asd");
    await this.saveBackButton.click();
    await this.saveNextButton.click();
    await this.saveBackButton.click();
    await this.saveCancelButton.click();
  }

  async loginProcess(email, password) {
    await this.loginButton.click();
    await this.emailField.fill(email);
    await this.passwordField.fill(password);
    await this.popupLoginButton.click();
  }
}
