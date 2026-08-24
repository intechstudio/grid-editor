import fetch from "node-fetch";
import axios from "axios";
import cheerio from "cheerio";

// using the measurement protocol
export async function fetchUrlJSON(url) {
  console.log("accessing the web...", url);

  return fetch(url, {
    method: "GET",
  }).then((response) => {
    if (!response.ok) {
      console.log("Fetch Error: ", response.status);
      return;
    } else {
      return response.json().catch((error) => {
        console.log("Invalid JSON", error);
      });
    }
  });
}

export interface ReleaseNoteInfo {
  title: string;
  version: string;
  url: string;
  isPreRelease: boolean;
  releaseNotesHtml: string;
  releaseNotesText: string;
}

export async function fetchReleaseNotes(): Promise<ReleaseNoteInfo[]> {
  const url = "https://github.com/intechstudio/grid-editor/releases";

  try {
    const response = await axios.get(url);

    if (!response || !response.data) {
      throw new Error("Failed to fetch data from GitHub.");
    }

    const $ = cheerio.load(response.data);

    const releases = $(".Box")
      .map((i, box) => {
        const boxEl = $(box);

        const titleLink = boxEl.find(".Box-body a.Link--primary");
        const title = titleLink.text().trim();
        const href = titleLink.attr("href") || "";
        const version = href.split("/").pop() || "";
        const fullUrl = `https://github.com${href}`;

        const isPreRelease =
          boxEl.find('.Label--warning:contains("Pre-release")').length > 0;

        const notesHtml = boxEl.find(".markdown-body").html()?.trim() || "";
        const notesText = boxEl.find(".markdown-body").text().trim();

        return {
          title,
          version,
          url: fullUrl,
          isPreRelease,
          releaseNotesHtml: notesHtml,
          releaseNotesText: notesText,
        };
      })
      .get();

    return releases;
  } catch (error) {
    console.error("Error fetching release notes:", error);
    return [];
  }
}
