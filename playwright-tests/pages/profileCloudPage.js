export class ProfileCloudPage {
  constructor(page) {
    this.page = page;
    this.searchBar = page.getByPlaceholder("Find...");

    this.communityConfigNumbers = page.getByRole("treeitem", {
      name: "Community Configs (176)",
    });

    this.mainConfigCategory = {
      community: page.getByRole("treeitem", {
        name: "Community Configs",
      }),
      my: page.getByRole("treeitem", { name: "My Configs" }),
      recommended: page.getByRole("treeitem", { name: "Recommended Configs" }),
    };
  }

  async waitForProfilesLoad() {
    // betoltott szam valtozhat!
    await this.communityConfigNumbers.waitFor({ state: "visible" });
  }

  async searchProfile(name) {
    await this.searchBar.fill(name);
  }
  async clickMainProfileCategory(category) {
    await this.mainConfigCategory[category].click();
  }
}
