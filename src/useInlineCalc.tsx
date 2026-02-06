import { useReducer, useCallback, useRef, useEffect, type RefObject } from "react";
import { detectMathExpression, detectMathExpressionAtCursor } from "./detectMath";
import { getTextNodes } from "./getTextNodes";
import { InlineCalcTooltip, type InlineCalcTooltipProps } from "./InlineCalcTooltip";

// --- Types ---

export interface InlineCalcPosition {
  top: number;
  left: number;
}

export interface ApplyContext {
  expression: string;
  result: number;
  formattedResult: string;
  startIndex: number;
  endIndex: number;
  preventDefault: () => void;
}

export interface InlineCalcOptions {
  getEditor: () => HTMLElement | null;
  onBeforeApply?: (ctx: ApplyContext) => void;
  onApply?: (result: number, expression: string) => void;
  onDismiss?: (expression: string) => void;
  getPosition?: (rect: DOMRect) => InlineCalcPosition;
  formatResult?: (result: number) => string;
}

export interface InlineCalcRefOptions extends Omit<InlineCalcOptions, "getEditor"> {
  autoAttach?: boolean;
  highlight?: boolean | { color?: string; highlightName?: string };
}

// Discriminated union state
type InlineCalcState =
  | { show: false; expression: null; result: null; position: InlineCalcPosition }
  | { show: true; expression: string; result: number; position: InlineCalcPosition };

export type InlineCalcReturn = InlineCalcState & {
  dismiss: () => void;
  apply: () => void;
  clear: () => void;
  handleKeyDown: (e: React.KeyboardEvent | KeyboardEvent) => boolean;
  handleInput: (text: string, textNodes?: Text[], cursorPosition?: number) => boolean;
  tooltipProps: { result: number; position: InlineCalcPosition; show: boolean };
  Tooltip: React.FC<Partial<InlineCalcTooltipProps>>;
};

// --- Helpers ---

function isRef<T>(
  value: RefObject<T> | InlineCalcOptions
): value is RefObject<T> {
  return value !== null && typeof value === "object" && "current" in value;
}

function defaultGetPosition(rect: DOMRect): InlineCalcPosition {
  return { top: rect.bottom + 4, left: rect.left + rect.width / 2 };
}

const defaultFormatResult = (n: number) => n.toLocaleString();

function replaceExpressionInEditor(
  editor: HTMLElement,
  expression: string,
  replacement: string,
  startIndex: number | null
) {
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null);
  let node: Text | null;
  let currentOffset = 0;

  while ((node = walker.nextNode() as Text | null)) {
    const nodeLength = node.textContent?.length || 0;
    const nodeEnd = currentOffset + nodeLength;

    const localIndex =
      startIndex !== null && startIndex >= currentOffset && startIndex < nodeEnd
        ? startIndex - currentOffset
        : startIndex === null
          ? (node.textContent?.indexOf(expression) ?? -1)
          : -1;

    if (localIndex !== -1) {
      const before = node.textContent?.slice(0, localIndex) || "";
      const after = node.textContent?.slice(localIndex + expression.length) || "";
      node.textContent = before + replacement + after;

      const selection = window.getSelection();
      const range = document.createRange();
      range.setStart(node, before.length + replacement.length);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
      return;
    }

    currentOffset = nodeEnd;
  }
}

function getCursorOffset(el: HTMLElement): number | undefined {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return undefined;
  const range = sel.getRangeAt(0);
  const pre = range.cloneRange();
  pre.selectNodeContents(el);
  pre.setEnd(range.startContainer, range.startOffset);
  return pre.toString().length;
}

// Highlight styles injection
let hlStylesInjected = false;

function injectHighlightStyles(name: string, color: string): void {
  if (typeof window === "undefined" || hlStylesInjected) return;
  if (typeof CSS === "undefined" || !CSS.highlights) return;
  const id = "inline-calc-highlight-styles";
  if (document.getElementById(id)) { hlStylesInjected = true; return; }
  const style = document.createElement("style");
  style.id = id;
  style.textContent = `::highlight(${name}) { background-color: var(--inline-calc-highlight, ${color}); }`;
  document.head.appendChild(style);
  hlStylesInjected = true;
}

// --- Reducer ---

type CalcAction =
  | { type: "detect"; expression: string; result: number; position: InlineCalcPosition }
  | { type: "clear" }
  | { type: "dismiss" };

const initialState: InlineCalcState = {
  expression: null,
  result: null,
  show: false,
  position: { top: 0, left: 0 },
};

function calcReducer(state: InlineCalcState, action: CalcAction): InlineCalcState {
  switch (action.type) {
    case "detect":
      return {
        expression: action.expression,
        result: action.result,
        show: true,
        position: action.position,
      };
    case "clear":
    case "dismiss":
      return initialState;
  }
}

// --- Hook ---

export function useInlineCalc(
  editorRef: RefObject<HTMLElement | null>,
  options?: InlineCalcRefOptions
): InlineCalcReturn;
export function useInlineCalc(options: InlineCalcOptions): InlineCalcReturn;
export function useInlineCalc(
  optionsOrRef: InlineCalcOptions | RefObject<HTMLElement | null>,
  refOptions?: InlineCalcRefOptions
): InlineCalcReturn {
  const [state, dispatch] = useReducer(calcReducer, initialState);

  const editorRefStable = isRef(optionsOrRef) ? optionsOrRef : null;

  const optionsRef = useRef<InlineCalcOptions>(null!);
  optionsRef.current = isRef(optionsOrRef)
    ? { ...refOptions, getEditor: () => editorRefStable!.current }
    : optionsOrRef;

  const expressionStartIndexRef = useRef<number | null>(null);
  const dismissedExpressionsRef = useRef<Set<string>>(new Set());

  const stateRef = useRef(state);
  stateRef.current = state;

  // --- Highlight ---

  const hlOpt = refOptions?.highlight;
  const hlEnabled = editorRefStable !== null && hlOpt != null && hlOpt !== false;
  const hlName = (typeof hlOpt === "object" ? hlOpt.highlightName : undefined) ?? "math-highlight";
  const hlColor = (typeof hlOpt === "object" ? hlOpt.color : undefined) ?? "#fef08a";

  useEffect(() => {
    if (hlEnabled) injectHighlightStyles(hlName, hlColor);
  }, [hlEnabled, hlName, hlColor]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof CSS === "undefined" || !CSS.highlights) return;

    if (!hlEnabled || !state.expression || !state.show || !editorRefStable?.current) {
      CSS.highlights.delete(hlName);
      return;
    }

    const editor = editorRefStable.current;
    const text = editor.textContent || "";
    const index = text.indexOf(state.expression);

    if (index === -1) {
      CSS.highlights.delete(hlName);
      return;
    }

    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    let currentIndex = 0;

    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const nodeLength = node.length;

      if (currentIndex + nodeLength > index) {
        const range = new Range();
        const startOffset = index - currentIndex;
        range.setStart(node, startOffset);
        range.setEnd(node, Math.min(startOffset + state.expression.length, nodeLength));
        CSS.highlights.set(hlName, new Highlight(range));
        break;
      }

      currentIndex += nodeLength;
    }

    return () => {
      if (typeof CSS !== "undefined" && CSS.highlights) {
        CSS.highlights.delete(hlName);
      }
    };
  }, [state.expression, state.show, hlEnabled, hlName, editorRefStable]);

  // --- Callbacks ---

  const dismiss = useCallback(() => {
    const st = stateRef.current;
    if (st.show) {
      dismissedExpressionsRef.current.add(st.expression);
      optionsRef.current.onDismiss?.(st.expression);
    }
    dispatch({ type: "dismiss" });
  }, []);

  const clear = useCallback(() => {
    expressionStartIndexRef.current = null;
    dispatch({ type: "clear" });
  }, []);

  const apply = useCallback(() => {
    const st = stateRef.current;
    if (!st.show) return;

    const { getEditor, formatResult, onBeforeApply, onApply } = optionsRef.current;
    const editor = getEditor();
    if (!editor) return;

    const fmt = formatResult ?? defaultFormatResult;
    const resultText = fmt(st.result);
    const startIndex = expressionStartIndexRef.current;

    let defaultPrevented = false;
    if (onBeforeApply) {
      const startIdx = startIndex ?? 0;
      onBeforeApply({
        expression: st.expression,
        result: st.result,
        formattedResult: resultText,
        startIndex: startIdx,
        endIndex: startIdx + st.expression.length,
        preventDefault: () => { defaultPrevented = true; },
      });
    }

    if (!defaultPrevented) {
      replaceExpressionInEditor(editor, st.expression, resultText, startIndex);
    }

    onApply?.(st.result, st.expression);
    clear();
  }, [clear]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent | KeyboardEvent): boolean => {
      const st = stateRef.current;
      if (!st.show) return false;

      if (e.key === "Escape") {
        e.preventDefault();
        dismiss();
        return true;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        apply();
        return true;
      }

      if (e.key === " ") {
        dismiss();
        return false;
      }

      return false;
    },
    [dismiss, apply]
  );

  const handleInput = useCallback(
    (text: string, textNodes: Text[] = [], cursorPosition?: number): boolean => {
      for (const expr of dismissedExpressionsRef.current) {
        if (!text.includes(expr)) dismissedExpressionsRef.current.delete(expr);
      }

      const mathResult = cursorPosition !== undefined
        ? detectMathExpressionAtCursor(text, cursorPosition)
        : detectMathExpression(text);

      if (mathResult && dismissedExpressionsRef.current.has(mathResult.expression)) {
        clear();
        return false;
      }

      if (mathResult) {
        const { getEditor, getPosition } = optionsRef.current;
        const positionFn = getPosition ?? defaultGetPosition;
        let foundPosition: InlineCalcPosition = { top: 0, left: 0 };

        if (textNodes.length > 0) {
          let currentOffset = 0;
          for (const node of textNodes) {
            const nodeLength = node.textContent?.length || 0;
            const nodeEnd = currentOffset + nodeLength;

            if (mathResult.startIndex >= currentOffset && mathResult.startIndex < nodeEnd) {
              const localIndex = mathResult.startIndex - currentOffset;
              const range = document.createRange();
              range.setStart(node, localIndex);
              range.setEnd(node, localIndex + mathResult.expression.length);
              foundPosition = positionFn(range.getBoundingClientRect());
              break;
            }

            currentOffset = nodeEnd;
          }
        } else {
          const editor = getEditor();
          if (editor) foundPosition = positionFn(editor.getBoundingClientRect());
        }

        expressionStartIndexRef.current = mathResult.startIndex;
        dispatch({
          type: "detect",
          expression: mathResult.expression,
          result: mathResult.result,
          position: foundPosition,
        });
        return true;
      }

      clear();
      return false;
    },
    [clear]
  );

  // --- Auto-attach ---

  const autoAttach = editorRefStable !== null && refOptions?.autoAttach !== false;

  useEffect(() => {
    if (!autoAttach) return;
    const el = editorRefStable?.current;

    if (!el) {
      if (typeof window !== "undefined") {
        console.warn("useInlineCalc: ref is not attached to a DOM element.");
      }
      return;
    }

    if (
      !el.isContentEditable &&
      !(el instanceof HTMLInputElement) &&
      !(el instanceof HTMLTextAreaElement)
    ) {
      console.warn(
        "useInlineCalc: element is not editable. Use contentEditable, <input>, or <textarea>."
      );
    }

    const isInput = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;

    const onInput = () => {
      if (isInput) {
        handleInput(el.value, [], el.selectionStart ?? undefined);
      } else {
        handleInput(el.textContent || "", getTextNodes(el), getCursorOffset(el));
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      handleKeyDown(e);
    };

    el.addEventListener("input", onInput);
    el.addEventListener("keydown", onKeyDown);
    return () => {
      el.removeEventListener("input", onInput);
      el.removeEventListener("keydown", onKeyDown);
    };
  }, [autoAttach, handleInput, handleKeyDown]);

  // --- Bound Tooltip ---

  const tooltipStateRef = stateRef;
  const TooltipRef = useRef<React.FC<Partial<InlineCalcTooltipProps>>>(null!);
  if (!TooltipRef.current) {
    TooltipRef.current = (props: Partial<InlineCalcTooltipProps>) => {
      const s = tooltipStateRef.current;
      return (
        <InlineCalcTooltip
          result={s.show ? s.result : 0}
          position={s.position}
          show={s.show}
          {...props}
        />
      );
    };
  }

  return {
    ...state,
    dismiss,
    apply,
    clear,
    handleKeyDown,
    handleInput,
    tooltipProps: {
      result: state.show ? state.result : 0,
      position: state.position,
      show: state.show,
    },
    Tooltip: TooltipRef.current,
  } as InlineCalcReturn;
}
