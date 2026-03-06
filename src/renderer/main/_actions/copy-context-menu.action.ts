const INLINE_TAGS = new Set([
  "span",
  "a",
  "em",
  "strong",
  "b",
  "i",
  "u",
  "code",
]);

function getTextFromNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const childTexts = Array.from(el.childNodes).map(getTextFromNode);

  // Grid rows: join cells inline with spaces
  if (el.className?.includes?.("grid-cols")) {
    return childTexts.filter((s) => s.trim().length > 0).join("  ");
  }

  // Flex rows that are direct data rows (not layout wrappers): join inline
  if (el.className?.includes?.("flex-row") && el.className?.includes?.("gap")) {
    return childTexts.filter((s) => s.trim().length > 0).join("  ");
  }

  // Inline elements: join without separator to preserve token continuity
  if (INLINE_TAGS.has(tag)) {
    return childTexts.join("");
  }

  // Block elements: join with newlines
  return childTexts.filter((s) => s.trim().length > 0).join("\n");
}

function getSelectionText(): string {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return "";

  const range = selection.getRangeAt(0);
  const fragment = range.cloneContents();

  const texts = Array.from(fragment.childNodes)
    .map(getTextFromNode)
    .filter((s) => s.length > 0);

  return texts.join("\n").trim();
}

export function copyContextMenu(node: HTMLElement) {
  let menu: HTMLElement | null = null;

  function removeMenu() {
    menu?.remove();
    menu = null;
  }

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    removeMenu();

    menu = document.createElement("div");
    menu.className =
      "fixed z-50 bg-primary border border-gray-600 rounded shadow-lg py-1 text-sm text-white";
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;

    const button = document.createElement("button");
    button.textContent = "Copy";
    button.className = "w-full text-left px-4 py-1 hover:bg-gray-700";
    button.onclick = () => {
      navigator.clipboard.writeText(getSelectionText());
      removeMenu();
    };

    menu.appendChild(button);
    document.body.appendChild(menu);
  }

  function handleCopy(e: ClipboardEvent) {
    const text = getSelectionText();
    if (text) {
      e.clipboardData?.setData("text/plain", text);
      e.preventDefault();
    }
  }

  function handleClick() {
    removeMenu();
  }

  node.addEventListener("contextmenu", handleContextMenu);
  node.addEventListener("copy", handleCopy);
  window.addEventListener("click", handleClick);

  return {
    destroy() {
      node.removeEventListener("contextmenu", handleContextMenu);
      node.removeEventListener("copy", handleCopy);
      window.removeEventListener("click", handleClick);
      removeMenu();
    },
  };
}
