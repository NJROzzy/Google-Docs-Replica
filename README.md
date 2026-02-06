# Google Docs UI Replica (Rapid Prototype)

## Reference
Replicated the core **Google Docs document editor** interface (toolbar + page editing surface), focusing on high visual fidelity, realistic interactions, and fast execution.

## What’s Included
- Docs-like top bar with editable document title
- Toolbar with **Bold / Italic / Underline** (applies to selected text)
- Editable document surface (contentEditable)
- Autosave + restore via `localStorage`
- Hover / active / focus-visible states for UI controls

## Tech Stack
- React + TypeScript (Vite)
- Tailwind CSS (+ Typography plugin)
- LocalStorage persistence (simple full-stack-style state persistence)

## Tools & Libraries Used
- Tailwind CSS for rapid pixel-accurate styling
- @tailwindcss/typography for realistic document text rendering
- Browser DevTools to compare spacing, colors, and hover states
- ChatGPT for scaffolding components, refactoring, and iteration speed

## Workflow Efficiency Report
To maximize fidelity under a strict time window, I used two accelerators:
1. **Utility-first styling + rapid iteration**: Tailwind allowed fast micro-adjustments (spacing, radius, borders, hover states) without context switching into large CSS files.
2. **AI-assisted scaffolding & refactors**: Used ChatGPT for quick component scaffolding (toolbar buttons, editor shell), then manually refined details using DevTools measurements and targeted edits.

## Running Locally
```bash
npm install
npm run dev