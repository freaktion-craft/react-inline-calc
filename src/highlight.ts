/**
 * Shared CSS Custom Highlight API utilities.
 * Used by both useInlineCalc (built-in highlight) and useInlineCalcHighlight (standalone).
 */

const injectedNames = new Set<string>();

/**
 * Inject a <style> tag for a CSS custom highlight name.
 * Each name gets its own tag, keyed by "inline-calc-highlight-styles-{name}".
 */
export function injectHighlightStyles(name: string, color: string): void {
  if (typeof window === "undefined") return;
  if (typeof CSS === "undefined" || !CSS.highlights) return;
  if (injectedNames.has(name)) return;

  const id = `inline-calc-highlight-styles-${name}`;
  if (document.getElementById(id)) {
    injectedNames.add(name);
    return;
  }

  const style = document.createElement("style");
  style.id = id;
  style.textContent = `::highlight(${name}) { background-color: var(--inline-calc-highlight, ${color}); }`;
  document.head.appendChild(style);
  injectedNames.add(name);
}

/**
 * Set a CSS custom highlight on the text matching `expression` inside `editor`.
 * Uses TreeWalker to find the correct text node and offset.
 */
export function setHighlight(editor: HTMLElement, expression: string, name: string): void {
  if (typeof CSS === "undefined" || !CSS.highlights) return;

  const text = editor.textContent || "";
  const index = text.indexOf(expression);

  if (index === -1) {
    CSS.highlights.delete(name);
    return;
  }

  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
  let currentIndex = 0;

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const nodeLength = node.length;

    if (currentIndex + nodeLength > index) {
      const range = new Range();
      const startOffset = index - currentIndex;
      range.setStart(node, startOffset);
      range.setEnd(node, Math.min(startOffset + expression.length, nodeLength));
      CSS.highlights.set(name, new Highlight(range));
      return;
    }

    currentIndex += nodeLength;
  }
}

/**
 * Clear a CSS custom highlight by name.
 */
export function clearHighlight(name: string): void {
  if (typeof CSS === "undefined" || !CSS.highlights) return;
  CSS.highlights.delete(name);
}
