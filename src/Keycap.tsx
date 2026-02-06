import type { CSSProperties, ReactNode } from "react";

export interface KeycapProps {
  children: ReactNode;
  style?: CSSProperties;
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
  userSelect: "none",
};

export function Keycap({ children, style, className }: KeycapProps) {
  return (
    <span
      className={className ? `inline-calc-keycap ${className}` : "inline-calc-keycap"}
      style={{ ...baseStyle, ...style }}
    >
      {children}
    </span>
  );
}
