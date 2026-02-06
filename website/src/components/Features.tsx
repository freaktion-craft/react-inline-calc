"use client";

import { useState } from "react";
import { highlight } from "sugar-high";

const features = [
  {
    id: "setup",
    title: "Setup",
    description: "One import, three lines. Auto-attaches listeners, built-in animation.",
    code: `import { useInlineCalc } from "react-inline-calc";

const ref = useRef<HTMLDivElement>(null);
const { Tooltip } = useInlineCalc(ref, { highlight: true });

<div ref={ref} contentEditable />
<Tooltip />`,
  },
  {
    id: "animation",
    title: "Animation",
    description: "CSS animation built-in. Or bring Framer Motion for spring physics.",
    code: `// Zero-config — CSS animation just works
<Tooltip />

// Custom: pass any animation wrapper
import { motion, AnimatePresence } from "motion/react";

<AnimatePresence>
  {calc.show && (
    <InlineCalcTooltip
      {...calc.tooltipProps}
      as={motion.div}
      animationProps={{
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
      }}
    />
  )}
</AnimatePresence>`,
  },
  {
    id: "rich-text",
    title: "Rich Text",
    description: "Works with TipTap, Slate, ProseMirror, Lexical — intercept and use your editor's API.",
    code: `const calc = useInlineCalc({
  getEditor: () => editorRef.current,
  onBeforeApply: ({ startIndex, endIndex, formattedResult, preventDefault }) => {
    preventDefault(); // Skip default DOM mutation

    // Use your editor's transaction API instead
    editor.chain()
      .deleteRange({ from: startIndex, to: endIndex })
      .insertContentAt(startIndex, formattedResult)
      .run();
  },
});`,
  },
  {
    id: "styling",
    title: "Styling",
    description: "CSS variables for theming. Override highlight color, tooltip appearance.",
    code: `/* Optional stylesheet for class-based customization */
import "react-inline-calc/styles.css";

/* Override with CSS variables */
:root {
  --inline-calc-bg: white;
  --inline-calc-border: rgba(0, 0, 0, 0.1);
  --inline-calc-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  --inline-calc-result: rgba(0, 0, 0, 0.7);
  --inline-calc-highlight: #fef08a;
}`,
  },
  {
    id: "core",
    title: "Core",
    description: "Framework-agnostic math detection. Use without React.",
    code: `import { detectMathExpression, tokenize, evaluateTokens } from "react-inline-calc/core";

const result = detectMathExpression("Total: 100+50");
// => { expression: "100+50", result: 150, startIndex: 7 }

const tokens = tokenize("10 + 5 * 2");
const value = evaluateTokens(tokens); // 20 (PEMDAS)`,
  },
];

export function Features() {
  const [activeFeature, setActiveFeature] = useState(features[0].id);
  const active = features.find((f) => f.id === activeFeature)!;

  return (
    <section className="mb-16">
      <h2 className="text-base font-medium text-neutral-900 mb-4">Features</h2>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {features.map((feature) => (
          <button
            key={feature.id}
            onClick={() => setActiveFeature(feature.id)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors border ${
              activeFeature === feature.id
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-400 border-neutral-200 hover:text-neutral-600"
            }`}
          >
            {feature.title}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-100">
          <p className="text-neutral-600">{active.description}</p>
        </div>
        <pre className="p-4 overflow-x-auto text-sm bg-neutral-50">
          <code
            className="text-neutral-800"
            dangerouslySetInnerHTML={{ __html: highlight(active.code) }}
          />
        </pre>
      </div>
    </section>
  );
}
