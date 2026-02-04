"use client";

import { createPortal } from "react-dom";
import type { CSSProperties, ReactNode } from "react";
import { Keycap } from "./Keycap";

// ============================================================================
// Types
// ============================================================================

export interface InlineCalcToastProps {
  /** The calculated result to display */
  result: number;
  /** Position of the toast (viewport coordinates) */
  position: { top: number; left: number };
  /** Whether the toast is visible */
  show?: boolean;
  /** Custom key label (default: "Tab") */
  keyLabel?: string;
  /** Format the result for display (default: toLocaleString) */
  formatResult?: (result: number) => string;
  /** Custom styles for the container */
  style?: CSSProperties;
  /** Custom class name */
  className?: string;
  /** Children to render instead of default content */
  children?: ReactNode;
  /** Use portal to render at document.body (default: true) */
  portal?: boolean;
  /** Animation component wrapper (e.g., motion.div from framer-motion) */
  as?: React.ElementType;
  /** Props to pass to the animation wrapper */
  animationProps?: Record<string, unknown>;
}

// ============================================================================
// Styles
// ============================================================================

const containerStyle: CSSProperties = {
  position: "fixed",
  zIndex: 9999,
  pointerEvents: "none",
  transform: "translateX(-50%)",
};

const toastStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 6px 4px 8px",
  backgroundColor: "white",
  borderRadius: 8,
  border: "1px solid rgba(0, 0, 0, 0.1)",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)",
  fontSize: 12,
  color: "rgba(0, 0, 0, 0.5)",
};

const resultStyle: CSSProperties = {
  lineHeight: 1,
  display: "flex",
  alignItems: "center",
  fontWeight: 500,
  color: "rgba(0, 0, 0, 0.7)",
};

// ============================================================================
// Component
// ============================================================================

/**
 * Default toast UI for displaying math calculation results.
 *
 * Shows "= {result}" with a Tab keycap. Renders via portal by default.
 * Fully customizable - pass children to replace default content,
 * or use the headless hook with your own UI.
 *
 * @example
 * ```tsx
 * // Basic usage
 * {inlineCalc.show && (
 *   <InlineCalcToast
 *     result={inlineCalc.result!}
 *     position={inlineCalc.position}
 *   />
 * )}
 *
 * // With framer-motion
 * import { motion, AnimatePresence } from "framer-motion";
 *
 * <AnimatePresence>
 *   {inlineCalc.show && (
 *     <InlineCalcToast
 *       result={inlineCalc.result!}
 *       position={inlineCalc.position}
 *       as={motion.div}
 *       animationProps={{
 *         initial: { opacity: 0, y: -4, scale: 0.96 },
 *         animate: { opacity: 1, y: 0, scale: 1 },
 *         exit: { opacity: 0, y: -4, scale: 0.96 },
 *         transition: { duration: 0.12 },
 *       }}
 *     />
 *   )}
 * </AnimatePresence>
 *
 * // Custom content
 * <InlineCalcToast result={result} position={position}>
 *   <span>Result: {result}</span>
 *   <button onClick={apply}>Apply</button>
 * </InlineCalcToast>
 * ```
 */
export function InlineCalcToast({
  result,
  position,
  show = true,
  keyLabel = "Tab",
  formatResult = (n) => n.toLocaleString(),
  style,
  className,
  children,
  portal = true,
  as: Component = "div",
  animationProps = {},
}: InlineCalcToastProps) {
  if (!show) return null;

  const content = (
    <Component
      className={className}
      style={{
        ...containerStyle,
        top: position.top,
        left: position.left,
        ...style,
      }}
      {...animationProps}
    >
      <div style={toastStyle}>
        {children ?? (
          <>
            <span style={resultStyle}>= {formatResult(result)}</span>
            <Keycap>{keyLabel}</Keycap>
          </>
        )}
      </div>
    </Component>
  );

  if (portal && typeof document !== "undefined") {
    return createPortal(content, document.body);
  }

  return content;
}
