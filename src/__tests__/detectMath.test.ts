import { describe, it, expect } from 'vitest';
import { detectMathExpression } from '../detectMath';

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
