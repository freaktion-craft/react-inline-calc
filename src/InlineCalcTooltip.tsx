"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties, ReactNode } from "react";
import { Keycap } from "./Keycap";

export interface InlineCalcTooltipProps {
  result: number;
  position: { top: number; left: number };
  show?: boolean;
  keyLabel?: string;
  formatResult?: (result: number) => string;
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
  portal?: boolean;
  as?: React.ElementType;
  animationProps?: Record<string, unknown>;
}

const containerStyle: CSSProperties = {
  position: "fixed",
  zIndex: 9999,
  pointerEvents: "none",
  transform: "translateX(-50%)",
};

const tooltipStyle: CSSProperties = {
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

function TooltipContent({
  children,
  keyLabel = "Tab",
  formatResult = (n: number) => n.toLocaleString(),
  result,
}: Pick<InlineCalcTooltipProps, "children" | "keyLabel" | "formatResult" | "result">) {
  return (
    <div className="inline-calc-tooltip" style={tooltipStyle}>
      {children ?? (
        <>
          <span className="inline-calc-result" style={resultStyle}>
            = {formatResult(result)}
          </span>
          <Keycap>{keyLabel}</Keycap>
        </>
      )}
    </div>
  );
}

export function InlineCalcTooltip({
  result,
  position,
  show = true,
  keyLabel = "Tab",
  formatResult = (n) => n.toLocaleString(),
  style,
  className,
  children,
  portal = true,
  as: Component,
  animationProps,
}: InlineCalcTooltipProps) {
  const hasCustomAnimation = !!Component;

  // Built-in CSS animation state
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hasCustomAnimation) return;
    if (show) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 150);
      return () => clearTimeout(t);
    }
  }, [show, hasCustomAnimation]);

  const inner = (
    <TooltipContent result={result} keyLabel={keyLabel} formatResult={formatResult}>
      {children}
    </TooltipContent>
  );

  let content: ReactNode = null;

  if (hasCustomAnimation) {
    if (!show) return null;
    content = (
      <Component
        className={className}
        style={{ ...containerStyle, top: position.top, left: position.left, ...style }}
        {...(animationProps ?? {})}
      >
        {inner}
      </Component>
    );
  } else {
    if (!mounted) return null;
    content = (
      <div
        className={className}
        style={{
          ...containerStyle,
          top: position.top,
          left: position.left,
          opacity: visible ? 1 : 0,
          transform: `translateX(-50%) scale(${visible ? 1 : 0.96})`,
          transition: "opacity 150ms ease-out, transform 150ms ease-out",
          ...style,
        }}
      >
        {inner}
      </div>
    );
  }

  if (portal && typeof document !== "undefined") {
    return createPortal(content, document.body);
  }
  return content;
}
