/** Get all text nodes within an element (for contentEditable editors). */
export function getTextNodes(element: Element | null): Text[] {
  if (!element) return [];

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  return textNodes;
}
