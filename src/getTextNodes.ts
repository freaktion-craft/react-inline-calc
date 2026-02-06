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

/**
 * Find the text node containing the given character offset within an element.
 * Walks text nodes tracking cumulative offset until the target is found.
 */
export function findTextNodeAtOffset(
  element: Element,
  offset: number
): { node: Text; localOffset: number } | null {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let currentOffset = 0;

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const nodeLength = node.textContent?.length || 0;
    const nodeEnd = currentOffset + nodeLength;

    if (offset >= currentOffset && offset < nodeEnd) {
      return { node, localOffset: offset - currentOffset };
    }

    currentOffset = nodeEnd;
  }

  return null;
}
