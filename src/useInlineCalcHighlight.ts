"use client";

import { useEffect, type RefObject } from "react";
import { injectHighlightStyles, setHighlight, clearHighlight } from "./highlight";

/**
 * @deprecated Use the `highlight` option on `useInlineCalc` instead.
 * This standalone hook is kept for backward compatibility.
 */
export interface UseInlineCalcHighlightOptions {
  enabled?: boolean;
  highlightName?: string;
  /** Default: "#fef08a". Also customizable via CSS variable --inline-calc-highlight */
  color?: string;
}

/**
 * Highlight the detected math expression using CSS Custom Highlight API.
 * SSR-safe. Styles are injected automatically.
 *
 * @deprecated Use the `highlight` option on `useInlineCalc` instead.
 * This standalone hook is kept for backward compatibility.
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

    if (!enabled || !inlineCalc.expression || !inlineCalc.show || !editorRef.current) {
      clearHighlight(highlightName);
      return;
    }

    setHighlight(editorRef.current, inlineCalc.expression, highlightName);

    return () => { clearHighlight(highlightName); };
  }, [inlineCalc.expression, inlineCalc.show, enabled, highlightName, editorRef]);
}
