import { useEffect, RefObject } from "react";

export interface UseInlineCalcHighlightOptions {
  enabled?: boolean;
  highlightName?: string;
  /** Default: "#fef08a". Also customizable via CSS variable --inline-calc-highlight */
  color?: string;
}

let stylesInjected = false;

function injectHighlightStyles(highlightName: string, color: string): void {
  if (typeof window === "undefined" || stylesInjected) return;
  if (typeof CSS === "undefined" || !CSS.highlights) return;

  const styleId = "inline-calc-highlight-styles";
  if (document.getElementById(styleId)) {
    stylesInjected = true;
    return;
  }

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `::highlight(${highlightName}) { background-color: var(--inline-calc-highlight, ${color}); }`;
  document.head.appendChild(style);
  stylesInjected = true;
}

/**
 * Highlight the detected math expression using CSS Custom Highlight API.
 * SSR-safe. Styles are injected automatically.
 */
export function useInlineCalcHighlight(
  editorRef: RefObject<HTMLElement | null>,
  inlineCalc: { expression: string | null; show: boolean },
  options: UseInlineCalcHighlightOptions = {}
): void {
  const {
    enabled = true,
    highlightName = "math-highlight",
    color = "#fef08a",
  } = options;

  useEffect(() => {
    if (enabled) injectHighlightStyles(highlightName, color);
  }, [enabled, highlightName, color]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof CSS === "undefined" || !CSS.highlights) return;

    if (!enabled || !inlineCalc.expression || !inlineCalc.show || !editorRef.current) {
      CSS.highlights.delete(highlightName);
      return;
    }

    const text = editorRef.current.textContent || "";
    const index = text.indexOf(inlineCalc.expression);

    if (index === -1) {
      CSS.highlights.delete(highlightName);
      return;
    }

    const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT);
    let currentIndex = 0;

    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const nodeLength = node.length;

      if (currentIndex + nodeLength > index) {
        const range = new Range();
        const startOffset = index - currentIndex;
        range.setStart(node, startOffset);
        range.setEnd(node, Math.min(startOffset + inlineCalc.expression.length, nodeLength));
        CSS.highlights.set(highlightName, new Highlight(range));
        break;
      }

      currentIndex += nodeLength;
    }

    return () => {
      if (typeof CSS !== "undefined" && CSS.highlights) {
        CSS.highlights.delete(highlightName);
      }
    };
  }, [inlineCalc.expression, inlineCalc.show, enabled, highlightName, editorRef]);
}
