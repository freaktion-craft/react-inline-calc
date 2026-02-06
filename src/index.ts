export { useInlineCalc } from "./useInlineCalc";
export type {
  ApplyContext,
  InlineCalcOptions,
  InlineCalcRefOptions,
  InlineCalcReturn,
  InlineCalcPosition,
} from "./useInlineCalc";

export { InlineCalcTooltip } from "./InlineCalcTooltip";
export type { InlineCalcTooltipProps } from "./InlineCalcTooltip";

export { Keycap } from "./Keycap";
export type { KeycapProps } from "./Keycap";

export { detectMathExpression, detectMathExpressionAtCursor } from "./detectMath";
export type { MathExpressionResult } from "./detectMath";

/**
 * @deprecated Use the `highlight` option on `useInlineCalc` instead.
 * This standalone hook is kept for backward compatibility.
 */
export { useInlineCalcHighlight } from "./useInlineCalcHighlight";
export type { UseInlineCalcHighlightOptions } from "./useInlineCalcHighlight";
