// Core hook
export { useInlineCalc } from "./useInlineCalc";
export type {
  InlineCalcState,
  InlineCalcActions,
  InlineCalcHandlers,
  InlineCalcOptions,
  InlineCalcReturn,
  InlineCalcPosition,
} from "./useInlineCalc";

// Pure utility (framework-agnostic)
export { detectMathExpression } from "./detectMath";
export type { MathExpressionResult } from "./detectMath";

// Default UI components (optional)
export { InlineCalcToast } from "./InlineCalcToast";
export type { InlineCalcToastProps } from "./InlineCalcToast";

export { Keycap } from "./Keycap";
export type { KeycapProps } from "./Keycap";
