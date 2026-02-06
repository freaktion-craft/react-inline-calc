import { describe, it, expect } from 'vitest';
import { detectMathExpression, detectMathExpressionAtCursor, tokenize } from '../detectMath';

describe('detectMathExpression', () => {
  it('evaluates simple addition', () => {
    const result = detectMathExpression('100+50');
    expect(result).not.toBeNull();
    expect(result!.result).toBe(150);
  });

  it('evaluates with PEMDAS precedence (multiplication before addition)', () => {
    const result = detectMathExpression('10+5*2');
    expect(result).not.toBeNull();
    expect(result!.result).toBe(20); // Not 30
  });

  it('handles negative numbers in multiplication', () => {
    const result = detectMathExpression('10*-2');
    expect(result).not.toBeNull();
    expect(result!.result).toBe(-20);
  });

  it('handles leading negative numbers', () => {
    const result = detectMathExpression('-5+10');
    expect(result).not.toBeNull();
    expect(result!.result).toBe(5);
  });

  it('handles decimal numbers', () => {
    const result = detectMathExpression('3.14*2');
    expect(result).not.toBeNull();
    expect(result!.result).toBeCloseTo(6.28, 2);
  });

  it('returns null for division by zero', () => {
    const result = detectMathExpression('10/0');
    expect(result).toBeNull();
  });

  it('finds expression in surrounding text with correct indices', () => {
    const result = detectMathExpression('The total is 100+50 dollars');
    expect(result).not.toBeNull();
    expect(result!.expression).toBe('100+50');
    expect(result!.result).toBe(150);
    expect(result!.startIndex).toBe(13);
    expect(result!.endIndex).toBe(19);
  });

  it('returns null when no math expression is present', () => {
    const result = detectMathExpression('No math here');
    expect(result).toBeNull();
  });

  it('handles numbers with commas (e.g., 12,738+100)', () => {
    const result = detectMathExpression('12,738+100');
    expect(result).not.toBeNull();
    expect(result!.result).toBe(12838);
  });

  it('handles comma numbers on both sides', () => {
    const result = detectMathExpression('1,000*2,500');
    expect(result).not.toBeNull();
    expect(result!.result).toBe(2500000);
  });
});

describe('ReDoS safety', () => {
  it('returns null for input longer than 10,000 characters', () => {
    const longText = '1+2 ' + 'a'.repeat(10_001);
    const result = detectMathExpression(longText);
    expect(result).toBeNull();
  });

  it('returns null for detectMathExpressionAtCursor with long input', () => {
    const longText = '1+2 ' + 'a'.repeat(10_001);
    const result = detectMathExpressionAtCursor(longText, 0);
    expect(result).toBeNull();
  });

  it('still works for input at exactly 10,000 characters', () => {
    const padding = 'a'.repeat(10_000 - 3);
    const text = '1+2' + padding; // exactly 10,000 chars
    expect(text.length).toBe(10_000);
    const result = detectMathExpression(text);
    expect(result).not.toBeNull();
    expect(result!.result).toBe(3);
  });
});

describe('detectMathExpressionAtCursor', () => {
  it('returns expression when cursor is inside it', () => {
    const text = 'hello 10+5 world';
    const result = detectMathExpressionAtCursor(text, 8); // cursor at '+'
    expect(result).not.toBeNull();
    expect(result!.expression).toBe('10+5');
    expect(result!.result).toBe(15);
  });

  it('returns expression when cursor is at the end of it', () => {
    const text = 'hello 10+5 world';
    const result = detectMathExpressionAtCursor(text, 10); // cursor right after '5'
    expect(result).not.toBeNull();
    expect(result!.expression).toBe('10+5');
    expect(result!.result).toBe(15);
  });

  it('returns expression when cursor is at the start of it', () => {
    const text = 'hello 10+5 world';
    const result = detectMathExpressionAtCursor(text, 6); // cursor right at '1'
    expect(result).not.toBeNull();
    expect(result!.expression).toBe('10+5');
    expect(result!.result).toBe(15);
  });

  it('returns closest expression before cursor when cursor is after expression', () => {
    const text = '10+5 some text here';
    const result = detectMathExpressionAtCursor(text, 15);
    expect(result).not.toBeNull();
    expect(result!.expression).toBe('10+5');
  });

  it('returns first expression when cursor is before all expressions', () => {
    const text = 'some text 10+5';
    const result = detectMathExpressionAtCursor(text, 0);
    expect(result).not.toBeNull();
    expect(result!.expression).toBe('10+5');
  });

  it('returns null when no expressions exist', () => {
    const result = detectMathExpressionAtCursor('no math here', 5);
    expect(result).toBeNull();
  });
});

describe('tokenize', () => {
  it('returns empty array for multiple decimals', () => {
    const tokens = tokenize('1.2.3');
    expect(tokens).toEqual([]);
  });

  it('normalizes x to *', () => {
    const tokens = tokenize('3x4');
    expect(tokens).toContain('*');
    expect(tokens).not.toContain('x');
  });

  it('normalizes \u00d7 to *', () => {
    const tokens = tokenize('3\u00d74');
    expect(tokens).toContain('*');
    expect(tokens).not.toContain('\u00d7');
  });

  it('handles commas in numbers by stripping them', () => {
    const tokens = tokenize('12,738+100');
    expect(tokens).toEqual([12738, '+', 100]);
  });

  it('tokenizes simple expression correctly', () => {
    const tokens = tokenize('10+5*2');
    expect(tokens).toEqual([10, '+', 5, '*', 2]);
  });

  it('handles parentheses', () => {
    const tokens = tokenize('(10+5)*2');
    expect(tokens).toEqual(['(', 10, '+', 5, ')', '*', 2]);
  });

  it('handles negative numbers after operator', () => {
    const tokens = tokenize('10*-2');
    expect(tokens).toEqual([10, '*', -2]);
  });

  it('handles leading negative number', () => {
    const tokens = tokenize('-5+10');
    expect(tokens).toEqual([-5, '+', 10]);
  });
});

describe('Infinity/NaN filtering', () => {
  it('filters out expressions producing Infinity via overflow', () => {
    // Overflow: very large multiplication chain
    const result = detectMathExpression('999999999999*999999999999*999999999999*999999999999');
    // If the intermediate or final result is Infinity, it should be filtered out
    if (result !== null) {
      expect(Number.isFinite(result.result)).toBe(true);
    }
  });

  it('filters out expressions that would produce Infinity from large exponent-like chains', () => {
    // Build a string that evaluates to Infinity
    // 1e308 * 10 would overflow — but we need to construct it as a multiplication chain
    const bigNum = '9'.repeat(309);
    const expr = `${bigNum}*${bigNum}`;
    const result = detectMathExpression(expr);
    // Should be null because Infinity is filtered
    if (result !== null) {
      expect(Number.isFinite(result.result)).toBe(true);
    }
  });

  it('still allows valid large results that are finite', () => {
    const result = detectMathExpression('999999*999999');
    expect(result).not.toBeNull();
    expect(result!.result).toBe(999998000001);
    expect(Number.isFinite(result!.result)).toBe(true);
  });

  it('filters out division by zero (already handled by evaluator)', () => {
    const result = detectMathExpression('10/0');
    expect(result).toBeNull();
  });
});
