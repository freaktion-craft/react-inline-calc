"use client";

import { useState } from "react";

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth="2" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
  </svg>
);

export function Installation() {
  const command = "npm install react-inline-calc";
  const [copied, setCopied] = useState(false);
  const [scaled, setScaled] = useState(false);
  const [blurred, setBlurred] = useState(false);

  const reset = () => {
    setCopied(false);
    setScaled(false);
    setBlurred(false);
  };

  const handleClick = async () => {
    if (scaled) return;
    await navigator.clipboard.writeText(command);
    setScaled(true);
    setTimeout(() => setBlurred(true), 20);
    setTimeout(() => setCopied(true), 80);
    setTimeout(() => setScaled(false), 60);
    setTimeout(() => setBlurred(false), 120);
  };

  return (
    <section className="mb-16">
      <h2 className="text-base font-medium text-neutral-900 mb-4">Installation</h2>
      <button
        onClick={handleClick}
        onMouseLeave={reset}
        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-100 rounded-lg font-mono text-sm border border-neutral-200 hover:bg-neutral-200 cursor-pointer"
        style={{
          transform: scaled ? "scale(0.99)" : "scale(1)",
          transition: "transform 50ms ease-out, background-color 150ms",
        }}
      >
        <span className="text-neutral-700">{command}</span>
        <span
          className="text-neutral-400"
          style={{
            transition: "transform 70ms ease-out, filter 70ms ease-out",
            transform: scaled ? "scale(0.8)" : "scale(1)",
            filter: blurred ? "blur(2px)" : "blur(0px)",
          }}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </span>
      </button>
    </section>
  );
}
