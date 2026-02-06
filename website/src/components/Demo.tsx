"use client";

import { useRef } from "react";
import { useInlineCalc, Keycap } from "react-inline-calc";
import { motion, AnimatePresence } from "motion/react";

export function Demo() {
  const editorRef = useRef<HTMLDivElement>(null);
  const { Tooltip, show } = useInlineCalc(editorRef, { highlight: true });

  return (
    <section className="mb-16">
      <h2 className="text-base font-medium text-neutral-900 mb-2">Demo</h2>
      <p className="text-sm text-neutral-500 mb-4 select-none">
        Type an expression, see the result.{" "}
        <Keycap>Tab</Keycap> to apply,{" "}
        <Keycap>Space</Keycap> to dismiss.
      </p>
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          className="w-full px-4 text-sm bg-white border border-neutral-200 rounded-lg outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition-all whitespace-nowrap overflow-x-auto [line-height:44px]"
          data-placeholder="e.g. 300+400"
          suppressContentEditableWarning
        />

        <AnimatePresence>
          {show && (
            <Tooltip
              as={motion.div}
              animationProps={{
                initial: { opacity: 0, y: -6, scale: 0.92, filter: "blur(3px)" },
                animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
                exit: { opacity: 0, scale: 0.97, filter: "blur(2px)", transition: { duration: 0.1, ease: "easeIn" } },
                transition: { type: "spring", stiffness: 500, damping: 28, mass: 0.8 },
              }}
              style={{ transformOrigin: "top center" }}
            />
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
