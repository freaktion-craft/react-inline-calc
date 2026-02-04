/**
 * Result of math expression detection
 */
export interface MathExpressionResult {
  /** The detected math expression (e.g., "9439+3299") */
  expression: string;
  /** The calculated result */
  result: number;
  /** Start index of the expression in the input text */
  startIndex: number;
  /** End index of the expression in the input text */
  endIndex: number;
}

/**
 * Detects and evaluates simple math expressions in text.
 *
 * Supported formats:
 * - Addition: 9+49, 9 + 49
 * - Subtraction: 100-50, 100 - 50
 * - Multiplication: 39*392, 39 * 392, 9329x3992, 9329×3992
 * - Division: 93299/329293, 93299 / 329293
 * - Decimals: 3.14*2, 10.5+2.5
 *
 * @param text - The text to scan for math expressions
 * @returns The first detected expression with its result, or null if none found
 *
 * @example
 * ```ts
 * detectMathExpression("The total is 100+50 dollars")
 * // => { expression: "100+50", result: 150, startIndex: 13, endIndex: 19 }
 *
 * detectMathExpression("Calculate 3.14x2")
 * // => { expression: "3.14x2", result: 6.28, startIndex: 10, endIndex: 16 }
 *
 * detectMathExpression("No math here")
 * // => null
 * ```
 */
export function detectMathExpression(text: string): MathExpressionResult | null {
  // Match patterns: number (operator) number
  // Operators: +, -, *, x, ×, /
  const mathRegex = /(\d+(?:\.\d+)?)\s*([+\-*/x×])\s*(\d+(?:\.\d+)?)/g;

  let match;
  while ((match = mathRegex.exec(text)) !== null) {
    const [fullMatch, num1Str, operator, num2Str] = match;
    const num1 = parseFloat(num1Str);
    const num2 = parseFloat(num2Str);

    let result: number;
    switch (operator) {
      case "+":
        result = num1 + num2;
        break;
      case "-":
        result = num1 - num2;
        break;
      case "*":
      case "x":
      case "×":
        result = num1 * num2;
        break;
      case "/":
        if (num2 === 0) continue; // Skip division by zero
        result = num1 / num2;
        break;
      default:
        continue;
    }

    // Format result nicely (remove unnecessary decimals)
    const formattedResult = Number.isInteger(result)
      ? result
      : parseFloat(result.toFixed(6));

    return {
      expression: fullMatch,
      result: formattedResult,
      startIndex: match.index,
      endIndex: match.index + fullMatch.length,
    };
  }

  return null;
}
