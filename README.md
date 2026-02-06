# react-inline-calc

Inline math calculation with Tab-to-complete for React. Type `9439+3299`, see `= 12,738`, press Tab to replace.

https://github.com/freaktion-craft/react-inline-calc/raw/main/demo.mp4

## Features

- **Detects math as you type** — addition, subtraction, multiplication, division
- **Tab to apply** — replaces expression with result
- **Space to dismiss** — won't re-suggest until you change the expression
- **Headless hook** — bring your own UI, or use the default tooltip
- **Tiny** — ~2KB minified
- **TypeScript** — full type definitions

## Install

```bash
npm install react-inline-calc
```

## Quick Start

```tsx
import { useInlineCalc } from "react-inline-calc";
import { useRef } from "react";

function Editor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const { Tooltip, show } = useInlineCalc(editorRef);

  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable
        style={{ padding: 16, border: "1px solid #ccc", minHeight: 100 }}
      />
      {show && <Tooltip />}
    </div>
  );
}
```

## API

### `useInlineCalc(ref)` or `useInlineCalc(options)`

Headless hook for inline math calculation. Two ways to call:

```tsx
// Simple: pass ref directly (auto-attaches input/keydown listeners)
const { Tooltip, show } = useInlineCalc(editorRef);

// With options
const { Tooltip, show } = useInlineCalc(editorRef, { highlight: true, onApply: ... });

// Manual mode: pass options with getEditor
const inlineCalc = useInlineCalc({ getEditor: () => editorRef.current });
```

#### Options

| Option | Type | Description |
|--------|------|-------------|
| `getEditor` | `() => HTMLElement \| null` | Returns the editor element (not needed if passing ref) |
| `autoAttach` | `boolean` | Auto-attach input/keydown listeners (default: `true` when using ref) |
| `highlight` | `boolean \| { color?, highlightName? }` | Enable CSS Custom Highlight API for expression highlighting |
| `onApply` | `(result, expression) => void` | Called when result is applied |
| `onBeforeApply` | `(context) => void` | Intercept apply to handle replacement yourself (see [Rich Text Editors](#rich-text-editors)) |
| `onDismiss` | `(expression) => void` | Called when suggestion is dismissed |
| `getPosition` | `(rect: DOMRect) => { top, left }` | Custom tooltip positioning |
| `formatResult` | `(result: number) => string` | Custom result formatting (default: `toLocaleString`) |

#### Returns

```ts
interface InlineCalcReturn {
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
  handleKeyDown: (e) => boolean;  // Tab/Space handler
  handleInput: (text, textNodes?, cursorPosition?) => boolean;  // Detect math
}
```

### `InlineCalcTooltip`

Default tooltip component. Optional — use your own UI with the headless hook.

```tsx
<InlineCalcTooltip
  result={150}
  position={{ top: 100, left: 200 }}
  show={true}
  keyLabel="Tab"           // Custom key label
  formatResult={(n) => n.toFixed(2)}  // Custom formatting
  portal={true}            // Render in document.body
  // For animations (e.g., framer-motion)
  as={motion.div}
  animationProps={{
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  }}
/>
```

### `detectMathExpression(text)`

Pure utility function — use it anywhere, no React required.

```ts
import { detectMathExpression } from "react-inline-calc";

detectMathExpression("Total: 100+50 items");
// => { expression: "100+50", result: 150, startIndex: 7, endIndex: 13 }

detectMathExpression("3.14 × 2");
// => { expression: "3.14 × 2", result: 6.28, startIndex: 0, endIndex: 8 }

detectMathExpression("No math here");
// => null
```

Supports: `+`, `-`, `*`, `x`, `×`, `/` with decimals and commas (e.g., `12,738+100`).

### Core Functions (Non-React)

For non-React projects or custom integrations, import the core utilities directly:

```ts
import { detectMathExpression, tokenize, evaluateTokens } from "react-inline-calc/core";

// Detect and evaluate in one step
const result = detectMathExpression("100+50*2");
// => { expression: "100+50*2", result: 200, startIndex: 0, endIndex: 8 }

// Or tokenize and evaluate separately for more control
const tokens = tokenize("100+50*2");
// => [100, "+", 50, "*", 2]

const value = evaluateTokens(tokens);
// => 200
```

## Custom UI Example

```tsx
function CustomTooltip({ result, position, onApply }) {
  return (
    <div
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        background: "#1a1a1a",
        color: "#fff",
        padding: "8px 12px",
        borderRadius: 8,
      }}
    >
      <span>= {result}</span>
      <button onClick={onApply}>Apply</button>
    </div>
  );
}

// In your component:
{inlineCalc.show && (
  <CustomTooltip
    result={inlineCalc.result}
    position={inlineCalc.position}
    onApply={inlineCalc.apply}
  />
)}
```

## With Framer Motion

```tsx
import { motion, AnimatePresence } from "motion/react";

const { Tooltip, show } = useInlineCalc(editorRef);

<AnimatePresence>
  {show && (
    <Tooltip
      as={motion.div}
      animationProps={{
        initial: { opacity: 0, y: -6, scale: 0.92 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, scale: 0.97 },
        transition: { type: "spring", stiffness: 500, damping: 28 },
      }}
    />
  )}
</AnimatePresence>
```

## Rich Text Editors

For rich text editors like ProseMirror, Slate, or Lexical, use `onBeforeApply` to handle text replacement with the editor's native API instead of DOM manipulation.

### ProseMirror / TipTap

```tsx
import { useEditor } from "@tiptap/react";
import { useInlineCalc } from "react-inline-calc";

function TipTapEditor() {
  const editor = useEditor({ extensions: [StarterKit] });

  const { Tooltip, show } = useInlineCalc({
    getEditor: () => document.querySelector(".ProseMirror"),
    onBeforeApply: ({ expression, formattedResult, preventDefault }) => {
      preventDefault(); // Skip default DOM mutation
      // Use TipTap's transaction API
      editor?.commands.insertContent(formattedResult);
    },
  });

  // ... rest of setup
}
```

### Slate

```tsx
import { useSlate } from "slate-react";
import { Transforms } from "slate";
import { useInlineCalc } from "react-inline-calc";

function SlateEditor() {
  const editor = useSlate();

  const { Tooltip, show } = useInlineCalc({
    getEditor: () => document.querySelector("[data-slate-editor]"),
    onBeforeApply: ({ expression, formattedResult, startIndex, endIndex, preventDefault }) => {
      preventDefault();
      // Use Slate's transform API
      Transforms.delete(editor, {
        at: { anchor: { path: [0, 0], offset: startIndex }, focus: { path: [0, 0], offset: endIndex } },
      });
      Transforms.insertText(editor, formattedResult);
    },
  });

  // ... rest of setup
}
```

### Lexical

```tsx
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $createTextNode } from "lexical";
import { useInlineCalc } from "react-inline-calc";

function LexicalEditor() {
  const [editor] = useLexicalComposerContext();

  const { Tooltip, show } = useInlineCalc({
    getEditor: () => document.querySelector("[contenteditable]"),
    onBeforeApply: ({ formattedResult, preventDefault }) => {
      preventDefault();
      // Use Lexical's update API
      editor.update(() => {
        const selection = $getSelection();
        selection?.insertText(formattedResult);
      });
    },
  });

  // ... rest of setup
}
```

### Cursor Position for Accurate Detection

For editors where cursor position matters, pass it as the third argument to `handleInput`:

```tsx
inlineCalc.handleInput(text, textNodes, cursorPosition);
```

This ensures math expressions are only detected near the cursor, not elsewhere in the document.

## Browser Support

Works in all modern browsers. Uses `contentEditable` and `Selection` APIs.

## License

MIT
