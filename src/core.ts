export { detectMathExpression, detectMathExpressionAtCursor } from "./detectMath";
export type { MathExpressionResult } from "./detectMath";

// Also export the internal functions for advanced users
export { tokenize, evaluateTokens } from "./detectMath";
