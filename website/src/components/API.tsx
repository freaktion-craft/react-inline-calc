"use client";

import { useState } from "react";
import { highlight } from "sugar-high";

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="p-4 overflow-x-auto text-sm bg-neutral-50 rounded-lg border border-neutral-200">
      <code
        className="text-neutral-800"
        dangerouslySetInnerHTML={{ __html: highlight(code) }}
      />
    </pre>
  );
}

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-neutral-50 border-b border-neutral-200">
            {headers.map((h) => (
              <th
                key={h}
                className="text-left px-4 py-2.5 font-medium text-neutral-600"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={i < rows.length - 1 ? "border-b border-neutral-100" : ""}
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-4 py-2.5 ${
                    j === 0
                      ? "font-mono text-xs text-neutral-800"
                      : j === 1
                      ? "font-mono text-xs text-neutral-500"
                      : "text-neutral-600"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const hookUsage = `// Simple: pass ref directly
const { Tooltip, show } = useInlineCalc(editorRef);

// With options
const { Tooltip, show } = useInlineCalc(editorRef, { highlight: true, onApply: ... });

// Manual mode: pass options with getEditor
const inlineCalc = useInlineCalc({ getEditor: () => editorRef.current });`;

const optionsRows = [
  ["getEditor", "() => HTMLElement | null", "Returns the editor element (not needed if passing ref)"],
  ["autoAttach", "boolean", "Auto-attach input/keydown listeners (default: true when using ref)"],
  ["highlight", "boolean | { color?, highlightName? }", "Enable CSS Custom Highlight API for expression highlighting"],
  ["onApply", "(result, expression) => void", "Called when result is applied"],
  ["onBeforeApply", "(context) => void", "Intercept apply to handle replacement yourself"],
  ["onDismiss", "(expression) => void", "Called when suggestion is dismissed"],
  ["getPosition", "(rect: DOMRect) => { top, left }", "Custom tooltip positioning"],
  ["formatResult", "(result: number) => string", "Custom result formatting (default: toLocaleString)"],
];

const returnCode = `interface InlineCalcReturn {
  // State
  expression: string | null;  // Detected expression (e.g., "100+50")
  result: number | null;      // Calculated result (e.g., 150)
  show: boolean;              // Whether to show the tooltip
  position: { top, left };    // Tooltip position (viewport coords)

  // Bound component
  Tooltip: React.FC;          // Pre-bound tooltip (knows result + position)
  tooltipProps: { ... };      // Or spread these on InlineCalcTooltip manually

  // Actions
  apply: () => void;          // Apply result (replace expression)
  dismiss: () => void;        // Dismiss (won't re-suggest)
  clear: () => void;          // Clear (will re-suggest)

  // Handlers (only needed in manual mode)
  handleKeyDown: (e) => boolean;
  handleInput: (text, textNodes?, cursorPosition?) => boolean;
}`;

const tooltipCode = `<InlineCalcTooltip
  result={150}
  position={{ top: 100, left: 200 }}
  show={true}
  keyLabel="Tab"
  formatResult={(n) => n.toFixed(2)}
  portal={true}
  // For animations (e.g., framer-motion)
  as={motion.div}
  animationProps={{
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  }}
/>`;

const detectCode = `import { detectMathExpression, detectMathExpressionAtCursor } from "react-inline-calc";

detectMathExpression("Total: 100+50 items");
// => { expression: "100+50", result: 150, startIndex: 7, endIndex: 13 }

detectMathExpression("3.14 × 2");
// => { expression: "3.14 × 2", result: 6.28, startIndex: 0, endIndex: 8 }

detectMathExpression("No math here");
// => null

// Cursor-aware: finds expression at/near cursor position
detectMathExpressionAtCursor("price is 100+50 and 20*3", 14);
// => { expression: "100+50", result: 150, startIndex: 9, endIndex: 15 }`;

const coreCode = `import { detectMathExpression, tokenize, evaluateTokens } from "react-inline-calc/core";

// Detect and evaluate in one step
const result = detectMathExpression("100+50*2");
// => { expression: "100+50*2", result: 200, startIndex: 0, endIndex: 8 }

// Or tokenize and evaluate separately for more control
const tokens = tokenize("100+50*2");
// => [100, "+", 50, "*", 2]

const value = evaluateTokens(tokens);
// => 200`;

const richTextEditors = [
  {
    id: "tiptap",
    label: "TipTap / ProseMirror",
    code: `import { useEditor } from "@tiptap/react";
import { useInlineCalc } from "react-inline-calc";

function TipTapEditor() {
  const editor = useEditor({ extensions: [StarterKit] });

  const { Tooltip, show } = useInlineCalc({
    getEditor: () => document.querySelector(".ProseMirror"),
    onBeforeApply: ({ expression, formattedResult, preventDefault }) => {
      preventDefault(); // Skip default DOM mutation
      editor?.commands.insertContent(formattedResult);
    },
  });
}`,
  },
  {
    id: "slate",
    label: "Slate",
    code: `import { useSlate } from "slate-react";
import { Transforms } from "slate";
import { useInlineCalc } from "react-inline-calc";

function SlateEditor() {
  const editor = useSlate();

  const { Tooltip, show } = useInlineCalc({
    getEditor: () => document.querySelector("[data-slate-editor]"),
    onBeforeApply: ({ startIndex, endIndex, formattedResult, preventDefault }) => {
      preventDefault();
      Transforms.delete(editor, {
        at: { anchor: { path: [0, 0], offset: startIndex }, focus: { path: [0, 0], offset: endIndex } },
      });
      Transforms.insertText(editor, formattedResult);
    },
  });
}`,
  },
  {
    id: "lexical",
    label: "Lexical",
    code: `import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection } from "lexical";
import { useInlineCalc } from "react-inline-calc";

function LexicalEditor() {
  const [editor] = useLexicalComposerContext();

  const { Tooltip, show } = useInlineCalc({
    getEditor: () => document.querySelector("[contenteditable]"),
    onBeforeApply: ({ formattedResult, preventDefault }) => {
      preventDefault();
      editor.update(() => {
        const selection = $getSelection();
        selection?.insertText(formattedResult);
      });
    },
  });
}`,
  },
];

export function API() {
  const [activeEditor, setActiveEditor] = useState(richTextEditors[0].id);
  const activeRTE = richTextEditors.find((e) => e.id === activeEditor)!;

  return (
    <section className="mb-16">
      <h2 className="text-base font-medium text-neutral-900 mb-6">API</h2>

      {/* useInlineCalc */}
      <div className="mb-12">
        <h3 className="font-mono text-sm font-medium text-neutral-800 mb-3">
          useInlineCalc(ref, options?)
        </h3>
        <p className="text-sm text-neutral-500 mb-4">
          Headless hook for inline math calculation. Auto-attaches listeners when passing a ref, or use manual mode with <code className="text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded text-xs">getEditor</code>.
        </p>
        <CodeBlock code={hookUsage} />
      </div>

      {/* Options */}
      <div className="mb-12">
        <h3 className="text-sm font-medium text-neutral-800 mb-3">Options</h3>
        <Table
          headers={["Option", "Type", "Description"]}
          rows={optionsRows}
        />
      </div>

      {/* Returns */}
      <div className="mb-12">
        <h3 className="text-sm font-medium text-neutral-800 mb-3">Returns</h3>
        <CodeBlock code={returnCode} />
      </div>

      {/* InlineCalcTooltip */}
      <div className="mb-12">
        <h3 className="font-mono text-sm font-medium text-neutral-800 mb-3">
          InlineCalcTooltip
        </h3>
        <p className="text-sm text-neutral-500 mb-4">
          Default tooltip component. Optional — use your own UI with the headless hook.
        </p>
        <CodeBlock code={tooltipCode} />
      </div>

      {/* detectMathExpression */}
      <div className="mb-12">
        <h3 className="font-mono text-sm font-medium text-neutral-800 mb-3">
          detectMathExpression(text) / detectMathExpressionAtCursor(text, cursor)
        </h3>
        <p className="text-sm text-neutral-500 mb-4">
          Pure utility functions — use them anywhere, no React required. <code className="text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded text-xs">detectMathExpressionAtCursor</code> finds the expression at or nearest to the cursor position. Supports{" "}
          <code className="text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded text-xs">+</code>{" "}
          <code className="text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded text-xs">-</code>{" "}
          <code className="text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded text-xs">*</code>{" "}
          <code className="text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded text-xs">×</code>{" "}
          <code className="text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded text-xs">/</code>{" "}
          with decimals and commas.
        </p>
        <CodeBlock code={detectCode} />
      </div>

      {/* Core Functions */}
      <div className="mb-12">
        <h3 className="text-sm font-medium text-neutral-800 mb-3">
          Core Functions (Non-React)
        </h3>
        <p className="text-sm text-neutral-500 mb-4">
          For non-React projects or custom integrations, import from{" "}
          <code className="text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded text-xs">react-inline-calc/core</code>.
        </p>
        <CodeBlock code={coreCode} />
      </div>

      {/* Rich Text Editors */}
      <div className="mb-12">
        <h3 className="text-sm font-medium text-neutral-800 mb-3">
          Rich Text Editors
        </h3>
        <p className="text-sm text-neutral-500 mb-4">
          Use <code className="text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded text-xs">onBeforeApply</code> to handle text replacement with the editor&apos;s native API instead of DOM manipulation.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {richTextEditors.map((editor) => (
            <button
              key={editor.id}
              onClick={() => setActiveEditor(editor.id)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors border ${
                activeEditor === editor.id
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white text-neutral-400 border-neutral-200 hover:text-neutral-600"
              }`}
            >
              {editor.label}
            </button>
          ))}
        </div>

        <CodeBlock code={activeRTE.code} />
      </div>
    </section>
  );
}
