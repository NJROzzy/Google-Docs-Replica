# gdocs-replica — Delivery-Focused Build

A high-fidelity **Google Docs–style editor prototype** built with React + TypeScript.  
This implementation prioritizes **delivery quality**: “feels like Docs” interactions, correct selection behavior, and a clean UI that’s stable during demos.

---

## What We Focused On Delivering

### 1) Google Docs–like Editing Experience (the “feel”)
We focused on the core behaviors that make Docs feel real:

- **Content-editable page editor** with paper layout
- **Docs-like toolbar** (icons, pill shape, spacing, hover)
- **Ruler** with margin markers for realism
- **Zoom scaling** (page scales, toolbar stays fixed)

---

### 2) Correct Selection Behavior (most important part)
The biggest problem in contentEditable toolbars is:  
**clicking a toolbar button destroys your selection**.

To solve that, the editor uses **selection persistence**:

- `saveSelection()` on mouse/key up inside editor
- `restoreSelection()` before applying any formatting command
- toolbar buttons use `onMouseDown(e => e.preventDefault())` to avoid blur/selection loss

Result:
✅ Bold/Italic/Underline/Color/Font size apply to the correct selection — like Google Docs.

---

### 3) Rich Formatting That Works Reliably in a Prototype
We delivered formatting features with stable behavior:

- **Bold / Italic / Underline**
  - Uses `document.execCommand(...)`
  - Tracks active tool state using `queryCommandState(...)`

- **Font Size**
  - Applies to *selected text only* via wrapping in `<span style="font-size: ...">`
  - If caret is collapsed, inserts a typing span + zero-width-space so next typing inherits size

- **Text Color**
  - Docs-like swatch palette
  - Same “wrap selection / create typing span” strategy as font size

---

### 4) Links that Behave Like Google Docs
We focused on delivering the exact expected link interaction:

- Insert link via a popover anchored to the caret (`getCaretRect()`)
- Create link using `execCommand("createLink")`
- **Cmd/Ctrl + click opens link** (Docs behavior)
- Link styling matches Docs:
  - blue
  - underlined
  - underline offset

---

### 5) Autosave & Restore (demo-proof)
We made the prototype **safe to refresh** and stable for evaluation:

- Autosave to `localStorage`
- Restore `title` and editor HTML on reload
- Shows “Saved” status (UI mimic)

---

## Why These Technical Choices?
This is a **prototype optimized for speed + fidelity**.

- `contentEditable` + `execCommand` were chosen because:
  - fast to implement
  - native selection handling
  - acceptable for a high-fidelity UI prototype

> In production, we’d likely move to ProseMirror/Slate/Lexical for a structured document model.

---

## Key Files / Structure

- `src/App.tsx`
  - UI layout (top bar, menu row, toolbar, ruler, page)
  - editor logic (selection save/restore, formatting, autosave)
  - popovers and dropdowns

---

## How to Run

```bash
npm install
npm run dev