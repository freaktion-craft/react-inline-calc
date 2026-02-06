import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInlineCalc } from '../useInlineCalc';

describe('useInlineCalc', () => {
  it('handleInput detects expression and sets state', () => {
    const { result } = renderHook(() =>
      useInlineCalc({
        getEditor: () => null,
      })
    );

    act(() => {
      result.current.handleInput('100+50');
    });

    expect(result.current.expression).toBe('100+50');
    expect(result.current.result).toBe(150);
    expect(result.current.show).toBe(true);
  });

  it('dismiss prevents re-suggestion of same expression', () => {
    const { result } = renderHook(() =>
      useInlineCalc({
        getEditor: () => null,
      })
    );

    // First, detect an expression
    act(() => {
      result.current.handleInput('100+50');
    });
    expect(result.current.show).toBe(true);

    // Dismiss it
    act(() => {
      result.current.dismiss();
    });
    expect(result.current.show).toBe(false);

    // Try to detect the same expression again
    act(() => {
      result.current.handleInput('100+50');
    });

    // Should not show because it was dismissed
    expect(result.current.show).toBe(false);
    expect(result.current.expression).toBeNull();
  });

  it('clear allows re-suggestion of same expression', () => {
    const { result } = renderHook(() =>
      useInlineCalc({
        getEditor: () => null,
      })
    );

    // First, detect an expression
    act(() => {
      result.current.handleInput('100+50');
    });
    expect(result.current.show).toBe(true);

    // Clear it (not dismiss)
    act(() => {
      result.current.clear();
    });
    expect(result.current.show).toBe(false);

    // Try to detect the same expression again
    act(() => {
      result.current.handleInput('100+50');
    });

    // Should show again because clear doesn't prevent re-suggestion
    expect(result.current.show).toBe(true);
    expect(result.current.expression).toBe('100+50');
    expect(result.current.result).toBe(150);
  });
});
