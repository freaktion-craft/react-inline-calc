import type { CSSProperties, ReactNode } from "react";

export interface KeycapProps {
  children: ReactNode;
  /** Additional inline styles */
  style?: CSSProperties;
  /** Additional class name */
  className?: string;
}

const baseStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "3px 6px",
  fontSize: 11,
  fontWeight: 500,
  fontFamily: "system-ui, -apple-system, sans-serif",
  color: "rgba(0, 0, 0, 0.4)",
  backgroundColor: "transparent",
  borderRadius: 5,
  border: "1px solid rgba(0, 0, 0, 0.15)",
  lineHeight: 1,
  letterSpacing: "0.02em",
};

/**
 * Keyboard key visual component.
 *
 * Renders text styled as a keyboard key (like ⌘, Tab, Enter).
 * Used in the default toast UI to show the Tab shortcut.
 *
 * @example
 * ```tsx
 * <Keycap>Tab</Keycap>
 * <Keycap>⌘</Keycap>
 * <Keycap>Enter</Keycap>
 * ```
 */
export function Keycap({ children, style, className }: KeycapProps) {
  return (
    <span className={className} style={{ ...baseStyle, ...style }}>
      {children}
    </span>
  );
}
