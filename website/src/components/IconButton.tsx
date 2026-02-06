"use client";

import { ButtonHTMLAttributes, ReactNode, useState } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

interface CopyIconButtonProps extends Omit<IconButtonProps, "children" | "onClick"> {
  copyValue: string;
  copyIcon: ReactNode;
  checkIcon: ReactNode;
}

export const IconButton = ({ children, className = "", ...props }: IconButtonProps) => (
  <button
    className={`p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200 transition-all ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const CopyIconButton = ({
  copyValue,
  copyIcon,
  checkIcon,
  className = "",
  ...props
}: CopyIconButtonProps) => {
  const [copied, setCopied] = useState(false);
  const [animating, setAnimating] = useState(false);

  const reset = () => {
    setCopied(false);
    setAnimating(false);
  };

  const handleClick = async () => {
    if (animating) return;
    await navigator.clipboard.writeText(copyValue);
    setAnimating(true);
    setTimeout(() => setCopied(true), 85);
    setTimeout(() => setAnimating(false), 280);
  };

  return (
    <button
      className={`p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200 transition-all ${className}`}
      onClick={handleClick}
      onMouseLeave={reset}
      aria-label={copied ? "Copied" : "Copy"}
      {...props}
    >
      <span
        className={`block transition-all duration-150 ${animating ? "scale-75 opacity-0" : "scale-100 opacity-100"}`}
      >
        {copied ? checkIcon : copyIcon}
      </span>
    </button>
  );
};
