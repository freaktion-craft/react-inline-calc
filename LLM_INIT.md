# LLM Integration Guide

When a user wants to integrate `react-inline-calc` into their project, ask these questions to provide tailored setup instructions.

## Before Asking

Start with:

> "I have a few quick questions to tailor the setup for your project—or I can look at your codebase and figure it out myself. Just let me know which you'd prefer!"

If the user prefers automatic detection, scan their project for:
- `package.json` → detect framework (next, vite, remix, etc.) and animation libs (motion, framer-motion)
- `tailwind.config.*` → Tailwind CSS
- `*.module.css` files → CSS Modules
- `styled-components` or `@emotion` in dependencies → CSS-in-JS
- Existing editor usage (tiptap, slate, lexical in dependencies)

## Questions to Ask (if needed)

### 1. React Framework
> What React framework are you using?

- **Next.js** (App Router / Pages Router)
- **Vite**
- **Remix**
- **Astro**
- **Create React App**
- **Other**

### 2. Styling Approach
> How do you style your components?

- **Tailwind CSS**
- **CSS Modules**
- **styled-components / Emotion**
- **Vanilla CSS**
- **Sass/SCSS**
- **Other**

### 3. Animation Library
> Do you use an animation library?

- **Framer Motion / Motion**
- **React Spring**
- **None (CSS transitions)**
- **Other**

### 4. Editor Type
> What kind of input will users type math into?

- **contentEditable div** (rich text)
- **Regular `<input>` or `<textarea>`**
- **Third-party editor** (Slate, TipTap, Lexical, etc.)

---

## Response Templates

Based on answers, provide the appropriate setup:

### Next.js App Router + Tailwind + Motion

```tsx
"use client";

import { useRef } from "react";
import { useInlineCalc, InlineCalcToast, getTextNodes } from "react-inline-calc";
import { motion, AnimatePresence } from "motion/react";

export function Editor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const inlineCalc = useInlineCalc(editorRef); // Simple: just pass the ref

  const handleInput = () => {
    const text = editorRef.current?.textContent || "";
    inlineCalc.handleInput(text, getTextNodes(editorRef.current));
  };

  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={(e) => { if (inlineCalc.handleKeyDown(e)) return; }}
        className="min-h-[100px] p-4 border rounded-lg focus:outline-none focus:ring-2"
      />

      <AnimatePresence>
        {inlineCalc.show && (
          <InlineCalcToast
            result={inlineCalc.result!}
            position={inlineCalc.position}
            as={motion.div}
            animationProps={{
              initial: { opacity: 0, scale: 0.7, filter: "blur(4px)" },
              animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
              exit: { opacity: 0, scale: 0.7, filter: "blur(4px)" },
              transition: { duration: 0.1, ease: [0.4, 0, 0.2, 1] },
            }}
            style={{ transformOrigin: "top center" }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
```

### Vite + Vanilla CSS (No Animation)

```tsx
import { useRef } from "react";
import { useInlineCalc, InlineCalcToast, getTextNodes } from "react-inline-calc";
import "./editor.css";

export function Editor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const inlineCalc = useInlineCalc(editorRef);

  const handleInput = () => {
    const text = editorRef.current?.textContent || "";
    inlineCalc.handleInput(text, getTextNodes(editorRef.current));
  };

  return (
    <div className="editor-container">
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={(e) => { if (inlineCalc.handleKeyDown(e)) return; }}
        className="editor"
      />

      {inlineCalc.show && (
        <InlineCalcToast
          result={inlineCalc.result!}
          position={inlineCalc.position}
        />
      )}
    </div>
  );
}
```

---

## Simple Inputs (No getTextNodes needed!)

For `<input>` and `<textarea>`, integration is minimal. No `getTextNodes` required.

### Text Input (Simplest)

```tsx
import { useRef } from "react";
import { useInlineCalc, InlineCalcToast } from "react-inline-calc";

export function CalcInput() {
  const inputRef = useRef<HTMLInputElement>(null);
  const inlineCalc = useInlineCalc(inputRef);

  return (
    <div style={{ position: "relative" }}>
      <input
        ref={inputRef}
        onChange={(e) => inlineCalc.handleInput(e.target.value)}
        onKeyDown={(e) => { if (inlineCalc.handleKeyDown(e)) return; }}
      />
      {inlineCalc.show && (
        <InlineCalcToast result={inlineCalc.result!} position={inlineCalc.position} />
      )}
    </div>
  );
}
```

### Textarea (Also Simple)

```tsx
import { useRef } from "react";
import { useInlineCalc, InlineCalcToast } from "react-inline-calc";

export function CalcTextarea() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inlineCalc = useInlineCalc(textareaRef);

  return (
    <div style={{ position: "relative" }}>
      <textarea
        ref={textareaRef}
        onChange={(e) => inlineCalc.handleInput(e.target.value)}
        onKeyDown={(e) => { if (inlineCalc.handleKeyDown(e)) return; }}
      />
      {inlineCalc.show && (
        <InlineCalcToast result={inlineCalc.result!} position={inlineCalc.position} />
      )}
    </div>
  );
}
```

**Key points for simple inputs:**
- Pass `e.target.value` directly to `handleInput()` — no second argument needed
- No `getTextNodes` import required
- Works with any `<input type="text">` or `<textarea>`

---

## Rich Text Editors (contentEditable)

For `contentEditable` divs and rich text editors, use `getTextNodes()` to enable accurate cursor positioning.

### `onBeforeApply` — Control Text Replacement

Rich text editors (ProseMirror, Slate, Lexical) manage their own state. Use `onBeforeApply` to handle replacement with the editor's native API instead of DOM manipulation:

```tsx
const inlineCalc = useInlineCalc({
  getEditor: () => editorRef.current,
  onBeforeApply: ({ expression, formattedResult, startIndex, endIndex, preventDefault }) => {
    preventDefault(); // Skip default DOM mutation
    // Use your editor's transaction API instead
    editor.commands.insertContent(formattedResult);
  },
});
```

The callback receives:
- `expression` — The detected math expression (e.g., `"100+50"`)
- `result` — The calculated number (e.g., `150`)
- `formattedResult` — The formatted string (e.g., `"150"` or `"1,500"`)
- `startIndex` / `endIndex` — Position in text
- `preventDefault()` — Call to skip default DOM replacement

### With Third-Party Editor (TipTap Example)

```tsx
import { useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useInlineCalc, InlineCalcToast, getTextNodes } from "react-inline-calc";

export function TipTapEditor() {
  const getEditor = useCallback(() => {
    return document.querySelector(".ProseMirror") as HTMLElement | null;
  }, []);

  const editor = useEditor({
    extensions: [StarterKit],
  });

  const inlineCalc = useInlineCalc({
    getEditor,
    onBeforeApply: ({ formattedResult, preventDefault }) => {
      preventDefault(); // Skip DOM mutation
      // Use TipTap's transaction API
      editor?.commands.insertContent(formattedResult);
    },
  });

  return (
    <div>
      <EditorContent
        editor={editor}
        onKeyDown={(e) => { if (inlineCalc.handleKeyDown(e)) return; }}
        onInput={() => {
          const text = editor?.getText() || "";
          const element = document.querySelector(".ProseMirror");
          inlineCalc.handleInput(text, getTextNodes(element));
        }}
      />

      {inlineCalc.show && (
        <InlineCalcToast
          result={inlineCalc.result!}
          position={inlineCalc.position}
        />
      )}
    </div>
  );
}
```

### Slate Example

```tsx
import { useSlate } from "slate-react";
import { Transforms } from "slate";
import { useInlineCalc, getTextNodes } from "react-inline-calc";

export function SlateEditor() {
  const editor = useSlate();

  const inlineCalc = useInlineCalc({
    getEditor: () => document.querySelector("[data-slate-editor]"),
    onBeforeApply: ({ formattedResult, startIndex, endIndex, preventDefault }) => {
      preventDefault();
      // Use Slate's transform API
      Transforms.delete(editor, {
        at: {
          anchor: { path: [0, 0], offset: startIndex },
          focus: { path: [0, 0], offset: endIndex },
        },
      });
      Transforms.insertText(editor, formattedResult);
    },
  });

  // ... rest of setup
}
```

### Lexical Example

```tsx
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection } from "lexical";
import { useInlineCalc, getTextNodes } from "react-inline-calc";

export function LexicalEditor() {
  const [editor] = useLexicalComposerContext();

  const inlineCalc = useInlineCalc({
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

For editors where cursor position matters (multi-paragraph documents), pass it as the third argument:

```tsx
inlineCalc.handleInput(text, textNodes, cursorPosition);
```

This ensures expressions are only detected near the cursor, not elsewhere in the document.

---

## Optional: Expression Highlighting

Highlight the detected expression with the CSS Custom Highlight API. **Styles are auto-injected** - no CSS needed!

```tsx
import { useInlineCalcHighlight } from "react-inline-calc";

// Just call the hook - styles inject automatically!
useInlineCalcHighlight(editorRef, inlineCalc);

// With options
useInlineCalcHighlight(editorRef, inlineCalc, {
  enabled: showHighlight,  // toggle on/off
  color: "#bfdbfe",        // custom color (default: #fef08a yellow)
});

// Or customize via CSS variable (overrides default):
// :root { --inline-calc-highlight: #bfdbfe; }
```

---

## Non-React Usage

For non-React projects, import core utilities directly:

```ts
import { detectMathExpression, tokenize, evaluateTokens } from "react-inline-calc/core";

// Detect and evaluate
const result = detectMathExpression("100+50*2");
// => { expression: "100+50*2", result: 200, startIndex: 0, endIndex: 8 }

// Or tokenize and evaluate separately
const tokens = tokenize("100+50*2");
const value = evaluateTokens(tokens);
// => 200
```

---

## Keyboard Shortcuts

- **Tab** — Apply the result (replace expression with calculated value)
- **Escape** — Dismiss the suggestion (won't re-suggest until expression changes)

---

## Install Command

```bash
npm install react-inline-calc

# With animation support
npm install react-inline-calc motion
```
