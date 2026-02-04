import { useState, useCallback, useRef } from "react";
import { detectMathExpression } from "./detectMath";

// ============================================================================
// Types
// ============================================================================

/**
 * Position for the suggestion tooltip
 */
export interface InlineCalcPosition {
  top: number;
  left: number;
}

/**
 * State returned by the hook
 */
export interface InlineCalcState {
  /** The detected math expression */
  expression: string | null;
  /** The calculated result */
  result: number | null;
  /** Whether to show the suggestion */
  show: boolean;
  /** Position of the suggestion tooltip (viewport coordinates) */
  position: InlineCalcPosition;
}

/**
 * Actions returned by the hook
 */
export interface InlineCalcActions {
  /** Dismiss the current suggestion (won't re-suggest until expression changes) */
  dismiss: () => void;
  /** Apply the calculated result (replace expression with result) */
  apply: () => void;
  /** Clear the suggestion without dismissing (will re-suggest) */
  clear: () => void;
}

/**
 * Handlers returned by the hook
 */
export interface InlineCalcHandlers {
  /**
   * Handle keyboard events for inline calc.
   * - Tab: Apply the result (replace expression with calculated value)
   * - Space: Dismiss the suggestion
   *
   * @returns true if the event was handled (Tab), false otherwise
   *
   * @example
   * ```tsx
   * <div
   *   contentEditable
   *   onKeyDown={(e) => {
   *     if (handleKeyDown(e)) return; // Tab was pressed, event handled
   *     // ... other key handlers
   *   }}
   * />
   * ```
   */
  handleKeyDown: (e: React.KeyboardEvent) => boolean;

  /**
   * Handle input events to detect math expressions.
   * Call this on every input change.
   *
   * @param text - The text content to scan for math expressions
   * @param textNodes - Array of Text nodes to find position (for contenteditable)
   * @returns true if a math expression was detected
   *
   * @example
   * ```tsx
   * // For contenteditable
   * const handleInput = () => {
   *   const text = editorRef.current?.textContent || "";
   *   const walker = document.createTreeWalker(
   *     editorRef.current!,
   *     NodeFilter.SHOW_TEXT
   *   );
   *   const textNodes: Text[] = [];
   *   while (walker.nextNode()) textNodes.push(walker.currentNode as Text);
   *   inlineCalc.handleInput(text, textNodes);
   * };
   *
   * // For regular input (simpler)
   * const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
   *   inlineCalc.handleInput(e.target.value, []);
   * };
   * ```
   */
  handleInput: (text: string, textNodes?: Text[]) => boolean;
}

/**
 * Combined return type of the hook
 */
export interface InlineCalcReturn
  extends InlineCalcState,
    InlineCalcActions,
    InlineCalcHandlers {}

/**
 * Options for configuring the hook
 */
export interface InlineCalcOptions {
  /**
   * Getter function to access the editor element.
   * Required for applying the result (replacing expression with value).
   */
  getEditor: () => HTMLElement | null;

  /**
   * Callback when result is applied
   */
  onApply?: (result: number, expression: string) => void;

  /**
   * Callback when suggestion is dismissed
   */
  onDismiss?: (expression: string) => void;

  /**
   * Custom position calculator for the tooltip.
   * By default, positions below the expression, centered horizontally.
   *
   * @param rect - Bounding rect of the expression in the editor
   * @returns Position for the tooltip
   */
  getPosition?: (rect: DOMRect) => InlineCalcPosition;

  /**
   * Format the result before inserting into the editor.
   * By default uses toLocaleString() for number formatting.
   *
   * @param result - The calculated result
   * @returns Formatted string to insert
   */
  formatResult?: (result: number) => string;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Headless hook for inline math calculation with Tab-to-complete.
 *
 * Detects math expressions as you type and shows the calculated result.
 * Press Tab to replace the expression with the result, or Space to dismiss.
 *
 * @param options - Configuration options
 * @returns State, actions, and handlers for inline calc
 *
 * @example
 * ```tsx
 * function Calculator() {
 *   const editorRef = useRef<HTMLDivElement>(null);
 *   const inlineCalc = useInlineCalc({
 *     getEditor: () => editorRef.current,
 *     onApply: (result) => console.log('Applied:', result),
 *   });
 *
 *   return (
 *     <div style={{ position: 'relative' }}>
 *       <div
 *         ref={editorRef}
 *         contentEditable
 *         onInput={() => {
 *           const text = editorRef.current?.textContent || "";
 *           inlineCalc.handleInput(text);
 *         }}
 *         onKeyDown={(e) => {
 *           if (inlineCalc.handleKeyDown(e)) return;
 *         }}
 *       />
 *       {inlineCalc.show && (
 *         <InlineCalcToast
 *           result={inlineCalc.result!}
 *           position={inlineCalc.position}
 *         />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useInlineCalc(options: InlineCalcOptions): InlineCalcReturn {
  const {
    getEditor,
    onApply,
    onDismiss,
    getPosition,
    formatResult = (n) => n.toLocaleString(),
  } = options;

  // State
  const [expression, setExpression] = useState<string | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState<InlineCalcPosition>({
    top: 0,
    left: 0,
  });

  // Track dismissed expressions to avoid re-suggesting
  const dismissedExpressionsRef = useRef<Set<string>>(new Set());

  /**
   * Dismiss the current suggestion (add to dismissed set)
   */
  const dismiss = useCallback(() => {
    if (expression) {
      dismissedExpressionsRef.current.add(expression);
      onDismiss?.(expression);
    }
    setExpression(null);
    setResult(null);
    setShow(false);
  }, [expression, onDismiss]);

  /**
   * Clear the suggestion without adding to dismissed set
   */
  const clear = useCallback(() => {
    setExpression(null);
    setResult(null);
    setShow(false);
  }, []);

  /**
   * Apply the calculated result by replacing the expression in the editor
   */
  const apply = useCallback(() => {
    if (!expression || result === null) return;

    const editor = getEditor();
    if (!editor) return;

    const expressionToReplace = expression;
    const resultText = formatResult(result);

    // Find and replace the expression in text nodes
    const walker = document.createTreeWalker(
      editor,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      const index = node.textContent?.indexOf(expressionToReplace) ?? -1;
      if (index !== -1) {
        const before = node.textContent?.slice(0, index) || "";
        const after =
          node.textContent?.slice(index + expressionToReplace.length) || "";
        node.textContent = before + resultText + after;

        // Move cursor after the result
        const selection = window.getSelection();
        const range = document.createRange();
        range.setStart(node, before.length + resultText.length);
        range.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(range);
        break;
      }
    }

    onApply?.(result, expressionToReplace);
    clear();
  }, [expression, result, getEditor, onApply, clear, formatResult]);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): boolean => {
      if (!show || !expression) return false;

      // Space key - dismiss the suggestion
      if (e.key === " ") {
        dismiss();
        // Don't prevent default - let space be typed normally
        return false;
      }

      // Tab key - apply the result
      if (e.key === "Tab") {
        e.preventDefault();
        apply();
        return true;
      }

      return false;
    },
    [show, expression, dismiss, apply]
  );

  /**
   * Handle input events to detect math expressions
   */
  const handleInput = useCallback(
    (text: string, textNodes: Text[] = []): boolean => {
      // Clean up dismissed expressions that are no longer in the text
      for (const dismissedExpr of dismissedExpressionsRef.current) {
        if (!text.includes(dismissedExpr)) {
          dismissedExpressionsRef.current.delete(dismissedExpr);
        }
      }

      const mathResult = detectMathExpression(text);

      // Check if expression was previously dismissed
      if (
        mathResult &&
        dismissedExpressionsRef.current.has(mathResult.expression)
      ) {
        clear();
        return false;
      }

      if (mathResult) {
        // Calculate position from text nodes (contenteditable)
        let foundPosition: InlineCalcPosition = { top: 0, left: 0 };

        if (textNodes.length > 0) {
          for (const node of textNodes) {
            const index = node.textContent?.indexOf(mathResult.expression) ?? -1;
            if (index !== -1) {
              const range = document.createRange();
              range.setStart(node, index);
              range.setEnd(node, index + mathResult.expression.length);
              const rect = range.getBoundingClientRect();

              foundPosition = getPosition
                ? getPosition(rect)
                : {
                    top: rect.bottom + 4,
                    left: rect.left + rect.width / 2,
                  };
              break;
            }
          }
        } else {
          // Fallback for regular inputs - position relative to editor
          const editor = getEditor();
          if (editor) {
            const rect = editor.getBoundingClientRect();
            foundPosition = getPosition
              ? getPosition(rect)
              : {
                  top: rect.bottom + 4,
                  left: rect.left + rect.width / 2,
                };
          }
        }

        setExpression(mathResult.expression);
        setResult(mathResult.result);
        setShow(true);
        setPosition(foundPosition);
        return true;
      }

      clear();
      return false;
    },
    [clear, getEditor, getPosition]
  );

  return {
    // State
    expression,
    result,
    show,
    position,
    // Actions
    dismiss,
    apply,
    clear,
    // Handlers
    handleKeyDown,
    handleInput,
  };
}
