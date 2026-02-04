# react-inline-calc

Inline math calculation with Tab-to-complete for React. Type `9439+3299`, see `= 12,738`, press Tab to replace.

https://github.com/user/react-inline-calc/assets/demo.gif

## Features

- **Detects math as you type** — addition, subtraction, multiplication, division
- **Tab to apply** — replaces expression with result
- **Space to dismiss** — won't re-suggest until you change the expression
- **Headless hook** — bring your own UI, or use the default toast
- **Tiny** — ~2KB minified
- **TypeScript** — full type definitions

## Install

```bash
npm install react-inline-calc
```

## Quick Start

```tsx
import { useInlineCalc, InlineCalcToast } from "react-inline-calc";
import { useRef } from "react";

function Editor() {
  const editorRef = useRef<HTMLDivElement>(null);

  const inlineCalc = useInlineCalc({
    getEditor: () => editorRef.current,
  });

  const handleInput = () => {
    const text = editorRef.current?.textContent || "";
    // For contenteditable, pass text nodes for accurate positioning
    const walker = document.createTreeWalker(
      editorRef.current!,
      NodeFilter.SHOW_TEXT
    );
    const textNodes: Text[] = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode as Text);
    inlineCalc.handleInput(text, textNodes);
  };

  return (
    <>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={(e) => {
          if (inlineCalc.handleKeyDown(e)) return;
          // ... other handlers
        }}
        style={{ padding: 16, border: "1px solid #ccc", minHeight: 100 }}
      />

      {inlineCalc.show && (
        <InlineCalcToast
          result={inlineCalc.result!}
          position={inlineCalc.position}
        />
      )}
    </>
  );
}
```

## API

### `useInlineCalc(options)`

Headless hook for inline math calculation.

#### Options

| Option | Type | Description |
|--------|------|-------------|
| `getEditor` | `() => HTMLElement \| null` | **Required.** Returns the editor element |
| `onApply` | `(result, expression) => void` | Called when result is applied |
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

  // Actions
  apply: () => void;          // Apply result (replace expression)
  dismiss: () => void;        // Dismiss (won't re-suggest)
  clear: () => void;          // Clear (will re-suggest)

  // Handlers
  handleKeyDown: (e) => boolean;  // Tab/Space handler
  handleInput: (text, textNodes?) => boolean;  // Detect math
}
```

### `InlineCalcToast`

Default toast component. Optional — use your own UI with the headless hook.

```tsx
<InlineCalcToast
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

Supports: `+`, `-`, `*`, `x`, `×`, `/` with decimals.

## Custom UI Example

```tsx
function CustomToast({ result, position, onApply }) {
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
  <CustomToast
    result={inlineCalc.result}
    position={inlineCalc.position}
    onApply={inlineCalc.apply}
  />
)}
```

## With Framer Motion

```tsx
import { motion, AnimatePresence } from "framer-motion";

<AnimatePresence>
  {inlineCalc.show && (
    <InlineCalcToast
      result={inlineCalc.result!}
      position={inlineCalc.position}
      as={motion.div}
      animationProps={{
        initial: { opacity: 0, y: -4, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -4, scale: 0.96 },
        transition: { duration: 0.12 },
      }}
    />
  )}
</AnimatePresence>
```

## Browser Support

Works in all modern browsers. Uses `contentEditable` and `Selection` APIs.

## License

MIT
