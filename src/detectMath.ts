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

const OPERATORS: Record<string, string> = { x: "*", "×": "*" };
const OPS: Record<string, (a: number, b: number) => number | null> = {
  "*": (a, b) => a * b,
  "/": (a, b) => (b === 0 ? null : a / b),
  "+": (a, b) => a + b,
  "-": (a, b) => a - b,
};

/**
 * Tokenize a math expression into numbers, operators, and parentheses.
 * Handles negative numbers (e.g., -5, 10*-2) based on context:
 * minus after a number/) is subtraction, otherwise it's a negative sign.
 */
export function tokenize(expr: string): (number | string)[] {
  const tokens: (number | string)[] = [];
  let i = 0;

  while (i < expr.length) {
    const ch = expr[i];

    if (ch === " " || ch === "\t") { i++; continue; }

    if (ch === "(" || ch === ")") { tokens.push(ch); i++; continue; }

    // Negative sign: minus that isn't subtraction (start, after operator, after open paren)
    // But not before '(' — that's handled as unary operator by evaluator
    const isNegative = ch === "-"
      && (tokens.length === 0 || (typeof tokens[tokens.length - 1] === "string" && tokens[tokens.length - 1] !== ")"))
      && i + 1 < expr.length && expr[i + 1] !== "(";

    if (ch >= "0" && ch <= "9" || ch === "." || isNegative) {
      let num = isNegative ? "-" : "";
      if (isNegative) i++;
      let hasDecimal = false;
      while (i < expr.length && ((expr[i] >= "0" && expr[i] <= "9") || expr[i] === "." || expr[i] === ",")) {
        if (expr[i] === ",") { i++; continue; } // skip commas (e.g., 12,738 → 12738)
        if (expr[i] === ".") {
          if (hasDecimal) return []; // e.g. 1.2.3
          hasDecimal = true;
        }
        num += expr[i++];
      }
      tokens.push(parseFloat(num));
      continue;
    }

    // Operators: normalize x/× to *
    if (ch in OPS || ch in OPERATORS) {
      tokens.push(OPERATORS[ch] || ch);
      i++;
      continue;
    }

    i++; // skip unknown
  }

  return tokens;
}

/**
 * Collapse binary operators in a token array (left to right).
 * Mutates and returns the array, or null on error.
 */
function collapseOps(work: (number | string)[], ops: string[]): (number | string)[] | null {
  let i = 0;
  while (i < work.length) {
    const token = work[i];
    if (typeof token === "string" && ops.includes(token)) {
      const left = work[i - 1];
      const right = work[i + 1];
      if (typeof left !== "number" || typeof right !== "number") return null;
      const result = OPS[token]!(left, right);
      if (result === null) return null;
      work.splice(i - 1, 3, result);
    } else {
      i++;
    }
  }
  return work;
}

/**
 * Evaluate tokens with proper operator precedence (PEMDAS).
 * Parentheses → multiply/divide → add/subtract.
 */
export function evaluateTokens(tokens: (number | string)[]): number | null {
  if (tokens.length === 0) return null;
  if (tokens.length === 1) return typeof tokens[0] === "number" ? tokens[0] : null;

  let work = [...tokens];

  // Handle leading unary + or -
  if (work[0] === "+") {
    work.shift();
  } else if (work[0] === "-" && work.length > 1 && (work[1] === "(" || typeof work[1] === "number")) {
    work.shift();
    const rest = evaluateTokens(work);
    return rest !== null ? -rest : null;
  }

  // Resolve parentheses (innermost first)
  while (work.includes("(")) {
    let open = -1, close = -1;
    for (let i = 0; i < work.length; i++) {
      if (work[i] === "(") open = i;
      else if (work[i] === ")") { close = i; break; }
    }
    if (open === -1 || close === -1 || close <= open) return null;

    const inner = evaluateTokens(work.slice(open + 1, close));
    if (inner === null) return null;
    work = [...work.slice(0, open), inner, ...work.slice(close + 1)];
  }

  if (work.includes(")")) return null;

  // Apply operators by precedence
  if (!collapseOps(work, ["*", "/"])) return null;
  if (!collapseOps(work, ["+", "-"])) return null;

  return typeof work[0] === "number" ? work[0] : null;
}

// Broad regex to catch math-like expressions; validation done by tokenizer/evaluator.
// Handles: 10+5, (10+5)*2, +(100*2), etc.
const MATH_REGEX = /[+\-*/x×]\s*\([^)]+\)(?:\s*[+\-*/x×]\s*\(?[^)]*\)?)*|\([^)]+\)(?:\s*[+\-*/x×]\s*\(?[^)]*\)?)+|-?\d[\d,]*(?:\.\d+)?(?:\s*[+\-*/x×]\s*\(?-?\d[\d,]*(?:\.\d+)?\)?|\s*[+\-*/x×]\s*\([^)]+\))+/g;

/**
 * Find all valid math expressions in text.
 * Shared logic for both detectMathExpression and detectMathExpressionAtCursor.
 */
function findAllExpressions(text: string): MathExpressionResult[] {
  const results: MathExpressionResult[] = [];
  const regex = new RegExp(MATH_REGEX.source, MATH_REGEX.flags);
  let match;

  while ((match = regex.exec(text)) !== null) {
    const fullMatch = match[0];
    const matchIndex = match.index;

    // Skip if preceded by digit or decimal (middle of malformed number like "1.2.3+4")
    if (matchIndex > 0 && /[\d.]/.test(text[matchIndex - 1])) continue;

    // Skip if followed by decimal (malformed number continues after match)
    const afterIndex = matchIndex + fullMatch.length;
    if (afterIndex < text.length && text[afterIndex] === ".") continue;

    const tokens = tokenize(fullMatch);
    const result = evaluateTokens(tokens);
    if (result === null) continue;

    const formattedResult = Number.isInteger(result)
      ? result
      : parseFloat(result.toFixed(6));

    results.push({
      expression: fullMatch,
      result: formattedResult,
      startIndex: matchIndex,
      endIndex: matchIndex + fullMatch.length,
    });
  }

  return results;
}

/**
 * Detects and evaluates math expressions in text.
 * Returns the first match. Supports PEMDAS with parentheses.
 *
 * @param text - The text to scan for math expressions
 * @returns The first detected expression with its result, or null if none found
 */
export function detectMathExpression(text: string): MathExpressionResult | null {
  return findAllExpressions(text)[0] ?? null;
}

/**
 * Detects a math expression at or near the cursor position.
 * Returns the expression containing the cursor, or the closest one before it.
 *
 * @param text - The text to scan for math expressions
 * @param cursorPosition - The cursor position in the text
 * @returns The detected expression at/near cursor, or null if none found
 */
export function detectMathExpressionAtCursor(
  text: string,
  cursorPosition: number
): MathExpressionResult | null {
  const allMatches = findAllExpressions(text);
  if (allMatches.length === 0) return null;

  // Expression that contains the cursor
  const containing = allMatches.find(
    (m) => cursorPosition >= m.startIndex && cursorPosition <= m.endIndex
  );
  if (containing) return containing;

  // Closest expression before the cursor
  const beforeMatches = allMatches.filter((m) => m.endIndex <= cursorPosition);
  if (beforeMatches.length > 0) return beforeMatches[beforeMatches.length - 1];

  // Cursor is before all expressions — return first
  return allMatches[0];
}
