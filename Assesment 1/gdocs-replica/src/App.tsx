// src/App.tsx
import { useEffect, useMemo, useRef, useState } from "react";

type Tool = "bold" | "italic" | "underline";

const STORAGE_KEY = "gdocs_replica_v2";

function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ");
}

function useOnClickOutside(
  refs: Array<React.RefObject<HTMLElement | null>>,
  handler: () => void,
  enabled: boolean = true
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;

    const onPointerDownCapture = (e: PointerEvent) => {
      const path = (e.composedPath?.() ?? []) as EventTarget[];

      const isInside = refs.some((r) => {
        const el = r.current;
        return !!el && path.includes(el);
      });

      if (!isInside) handlerRef.current();
    };

    document.addEventListener("pointerdown", onPointerDownCapture, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDownCapture, true);
    };
  }, [enabled, refs]);
}

function IconButton({
  label,
  active,
  onClick,
  children,
  className,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active ?? false}
      title={label}
      onMouseDown={(e) => e.preventDefault()}  // ⭐ THIS IS CHANGE 2
      onClick={onClick}
      className={cx(
        "h-9 w-9 rounded-md flex items-center justify-center",
        "hover:bg-black/5 active:bg-black/10",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60",
        active && "bg-black/10",
        className
      )}
    >
      {children}
    </button>
  );
}

function TextMenuButton({
  label,
  onClick,
  active,
}: {
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "h-7 px-2 rounded-md text-[13px] leading-none",
        "hover:bg-black/5 active:bg-black/10",
        active && "bg-black/10"
      )}
    >
      {label}
    </button>
  );
}

function Dropdown({
  anchorRef,
  open,
  onClose,
  children,
  widthClass = "w-56",
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  widthClass?: string;
}) {
  const popRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useOnClickOutside([popRef, anchorRef], onClose, open);

  const updatePos = () => {
    const a = anchorRef.current;
    if (!a) return;
    const r = a.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: r.left });
  };

  useEffect(() => {
    if (!open) return;
    updatePos();

    const onScroll = () => updatePos();
    const onResize = () => updatePos();

    window.addEventListener("scroll", onScroll, true); // true catches scroll in nested containers too
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  if (!open || !pos) return null;

  return (
    <div
      ref={popRef}
      className={cx(
        "fixed z-[99999]",
        "bg-white border border-black/10 shadow-lg rounded-md",
        widthClass
      )}
      style={{ top: pos.top, left: pos.left }}
      role="menu"
    >
      {children}
    </div>
  );
}

function Divider() {
  return <div className="mx-2 h-6 w-px bg-black/10" aria-hidden />;
}

function ToolbarPill({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1 bg-[#f8f9fa] border border-black/10 rounded-full px-2 py-1 w-fit">
      {children}
    </div>
  );
}

function ToolDropdownButton({
  label,
  value,
  onClick,
  rightIcon = "▾",
}: {
  label: string;
  value: string;
  onClick?: () => void;
  rightIcon?: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="h-9 px-3 rounded-full hover:bg-black/5 active:bg-black/10 text-sm flex items-center gap-2"
      aria-label={label}
      title={label}
    >
      <span>{value}</span>
      <span className="text-black/50">{rightIcon}</span>
    </button>
  );
}

function SmallIcon({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className="text-[16px] leading-none">{children}</span>;
}

function Ruler() {
  // Visual-only ruler with ticks + blue margin markers
  const ticks = Array.from({ length: 41 }, (_, i) => i); // 0..40
  return (
    <div className="relative bg-[#f8f9fa] border-t border-b border-black/10 h-7 select-none">
      {/* blue margin markers (static) */}
      <div className="absolute left-[120px] top-[3px] h-0 w-0 border-l-[6px] border-r-[6px] border-t-[10px] border-l-transparent border-r-transparent border-t-blue-600" />
      <div className="absolute right-[120px] top-[3px] h-0 w-0 border-l-[6px] border-r-[6px] border-t-[10px] border-l-transparent border-r-transparent border-t-blue-600" />

      <div className="mx-auto max-w-[1200px] px-4 h-full flex items-end">
        {/* The ruler aligns with the paper width */}
        <div className="mx-auto w-full max-w-[850px] px-16">
          <div className="flex items-end gap-0.5 h-full">
            {ticks.map((i) => {
              const big = i % 5 === 0;
              const mid = i % 5 === 0 ? false : i % 1 === 0; // keep small ticks
              return (
                <div key={i} className="relative flex-1 h-full">
                  <div
                    className={cx(
                      "absolute bottom-0 left-1/2 -translate-x-1/2 bg-black/20",
                      big ? "h-4 w-[1px]" : mid ? "h-2.5 w-[1px]" : "h-2 w-[1px]"
                    )}
                  />
                  {big && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-black/45">
                      {i / 5}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function getCaretRect(): DOMRect | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;

  const range = sel.getRangeAt(0).cloneRange();

  // If range has no rect (caret), inject a temporary marker
  const rects = range.getClientRects();
  if (!rects || rects.length === 0) {
    const span = document.createElement("span");
    span.textContent = "\u200b"; // zero-width space
    span.style.position = "fixed";
    span.style.pointerEvents = "none";

    range.insertNode(span);
    const rect = span.getBoundingClientRect();
    span.remove();

    return rect;
  }

  return range.getBoundingClientRect();
}
function LinkPopover({
  open,
  position,
  onClose,
  onApply,
}: {
  open: boolean;
  position: { top: number; left: number } | null;
  onClose: () => void;
  onApply: (text: string, url: string) => void;
}) {
  const popRef = useRef<HTMLDivElement | null>(null);
  useOnClickOutside([popRef], onClose);

  const [text, setText] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    setText("");
    setUrl("");
  }, [open]);

  if (!open || !position) return null;

  return (
    <div
      ref={popRef}
      className="fixed z-[9999] bg-white border border-black/10 shadow-lg rounded-xl p-3 w-[340px]"
      style={{
        top: position.top + 28,
        left: Math.min(position.left, window.innerWidth - 360),
      }}
    >
      <div className="space-y-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Text"
          className="w-full h-9 px-3 rounded-md border border-black/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
        />

        <div className="flex items-center gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Search or paste a link"
            className="flex-1 h-9 px-3 rounded-md border border-black/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
          />
          <button
            type="button"
            className={cx(
              "text-sm font-medium",
              url ? "text-blue-600" : "text-black/40"
            )}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (!url) return;
              onApply(text, url);
              onClose();
            }}
          >
            Apply
          </button>
        </div>

        <button
          type="button"
          className="text-xs text-black/50 hover:text-black"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

type BlockStyle =
  | "normal"
  | "title"
  | "subtitle"
  | "h1"
  | "h2"
  | "h3";

function styleLabel(s: BlockStyle) {
  switch (s) {
    case "normal":
      return "Normal text";
    case "title":
      return "Title";
    case "subtitle":
      return "Subtitle";
    case "h1":
      return "Heading 1";
    case "h2":
      return "Heading 2";
    case "h3":
      return "Heading 3";
  }
}



function applyBlockStyle(style: BlockStyle) {
  // execCommand expects HTML tags for formatBlock
  const tag =
    style === "normal"
      ? "p"
      : style === "title"
      ? "h1"
      : style === "subtitle"
      ? "h2"
      : style === "h1"
      ? "h1"
      : style === "h2"
      ? "h2"
      : "h3";

  // Some browsers want <tag> not just tag
  document.execCommand("formatBlock", false, `<${tag}>`);
}

function TextStyleMenu({
  open,
  onClose,
  anchorRef,
  value,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  value: BlockStyle;
  onPick: (s: BlockStyle) => void;
}) {
  const popRef = useRef<HTMLDivElement | null>(null);
  useOnClickOutside([popRef, anchorRef], onClose);

  if (!open) return null;

  const items: Array<{ key: BlockStyle; left: React.ReactNode; right?: boolean }> =
    [
      { key: "normal", left: <span className="text-[14px]">Normal text</span>, right: true },
      { key: "title", left: <span className="text-[34px] font-semibold leading-none">Title</span>, right: true },
      { key: "subtitle", left: <span className="text-[20px] text-black/55 font-semibold">Subtitle</span>, right: true },
      { key: "h1", left: <span className="text-[28px] font-semibold leading-none">Heading 1</span>, right: true },
      { key: "h2", left: <span className="text-[20px] font-semibold">Heading 2</span>, right: true },
      { key: "h3", left: <span className="text-[16px] font-semibold text-black/65">Heading 3</span>, right: true },
    ];

  return (
    <div
      ref={popRef}
      className="absolute z-50 mt-2 w-[240px] bg-white border border-black/10 shadow-[0_8px_24px_rgba(60,64,67,.15)] rounded-md overflow-hidden"
      style={{ left: 0 }}
      role="menu"
      aria-label="Text styles"
    >
      <div className="py-1">
        {items.map((it) => {
          const active = it.key === value;
          return (
            <button
              key={it.key}
              type="button"
              onMouseDown={(e) => e.preventDefault()} // keep editor selection
              onClick={() => {
                onPick(it.key);
                onClose();
              }}
              className={cx(
                "w-full flex items-center justify-between gap-3 px-4 py-3 text-left",
                "hover:bg-black/5 active:bg-black/10",
                active && "bg-black/5"
              )}
            >
              <div className="flex items-center gap-3">
                {active ? (
                  <span className="text-black/60 text-[18px] leading-none">✓</span>
                ) : (
                  <span className="w-[18px]" />
                )}
                <div className="min-w-0">{it.left}</div>
              </div>

              {it.right ? (
                <span className="text-black/35 text-[16px] leading-none">›</span>
              ) : null}
            </button>
          );
        })}

        <div className="h-px bg-black/10 my-1" />

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-black/5 active:bg-black/10"
          onClick={() => onClose()}
        >
          <span className="text-[13px] text-black/70">Options</span>
          <span className="text-black/35 text-[16px] leading-none">›</span>
        </button>
      </div>
    </div>
  );
}

type FontKey =
  | "Arial"
  | "Times New Roman"
  | "Courier New"
  | "Verdana"
  | "Trebuchet MS"
  | "Georgia"
  | "Comic Sans MS"
  | "Impact"
  | "Roboto"
  | "Roboto Mono"
  | "Roboto Serif"
  | "Montserrat"
  | "Nunito"
  | "Lora"
  | "Merriweather"
  | "Oswald"
  | "Pacifico";

const FONT_ITEMS: Array<{
  key: FontKey;
  label: string;
  css: string; // used for preview + fallback
  right?: boolean; // show chevron like Docs (visual-only)
}> = [
  { key: "Arial", label: "Arial", css: "Arial, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" },
  { key: "Caveat" as any, label: "Caveat", css: '"Caveat", cursive', right: true }, // optional
  { key: "Comfortaa" as any, label: "Comfortaa", css: '"Comfortaa", cursive', right: true }, // optional
  { key: "Comic Sans MS", label: "Comic Sans MS", css: '"Comic Sans MS", "Comic Sans", cursive' },
  { key: "Courier New", label: "Courier New", css: '"Courier New", Courier, monospace' },
  { key: "EB Garamond" as any, label: "EB Garamond", css: '"EB Garamond", Garamond, serif', right: true }, // optional
  { key: "Georgia", label: "Georgia", css: "Georgia, serif" },
  { key: "Impact", label: "Impact", css: "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif" },
  { key: "Lexend" as any, label: "Lexend", css: '"Lexend", system-ui, sans-serif', right: true }, // optional
  { key: "Lobster" as any, label: "Lobster", css: '"Lobster", cursive', right: true }, // optional
  { key: "Lora", label: "Lora", css: '"Lora", Georgia, serif', right: true },
  { key: "Merriweather", label: "Merriweather", css: '"Merriweather", Georgia, serif', right: true },
  { key: "Montserrat", label: "Montserrat", css: '"Montserrat", system-ui, sans-serif', right: true },
  { key: "Nunito", label: "Nunito", css: '"Nunito", system-ui, sans-serif', right: true },
  { key: "Oswald", label: "Oswald", css: '"Oswald", system-ui, sans-serif', right: true },
  { key: "Pacifico", label: "Pacifico", css: '"Pacifico", cursive', right: true },
  { key: "Roboto", label: "Roboto", css: 'Roboto, system-ui, -apple-system, Segoe UI, sans-serif', right: true },
  { key: "Roboto Mono", label: "Roboto Mono", css: '"Roboto Mono", ui-monospace, SFMono-Regular, Menlo, monospace', right: true },
  { key: "Roboto Serif", label: "Roboto Serif", css: '"Roboto Serif", Georgia, serif', right: true },
  { key: "Spectral" as any, label: "Spectral", css: '"Spectral", Georgia, serif', right: true }, // optional
  { key: "Times New Roman", label: "Times New Roman", css: '"Times New Roman", Times, serif' },
  { key: "Trebuchet MS", label: "Trebuchet MS", css: '"Trebuchet MS", system-ui, sans-serif' },
  { key: "Verdana", label: "Verdana", css: "Verdana, Geneva, sans-serif" },
];

// Apply font to current selection/caret
function applyFont(fontFamily: string) {
  // execCommand wants a font name (not a CSS stack). Use the first family name.
  // Example: '"Roboto Mono", ...' -> Roboto Mono
  const first = fontFamily
    .split(",")[0]
    .trim()
    .replace(/^["']|["']$/g, "");

  document.execCommand("fontName", false, first);
}

function FontMenu({
  open,
  onClose,
  anchorRef,
  value,
  onPick,
  onMoreFonts,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  value: string;
  onPick: (label: string, css: string) => void;
  onMoreFonts?: () => void;
}) {
  const popRef = useRef<HTMLDivElement | null>(null);
  useOnClickOutside([popRef, anchorRef], onClose);

  if (!open) return null;

  return (
    <div
      ref={popRef}
      className="absolute z-50 mt-2 w-[250px] bg-white border border-black/10 shadow-[0_8px_24px_rgba(60,64,67,.15)] rounded-md overflow-hidden"
      style={{ left: 0 }}
      role="menu"
      aria-label="Font"
    >
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          onMoreFonts?.();
          onClose();
        }}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-black/5 active:bg-black/10"
      >
        <div className="flex items-center gap-3">
          <span className="text-black/60 text-[18px] leading-none">A+</span>
          <span className="text-[13px]">More fonts</span>
        </div>
      </button>

      <div className="h-px bg-black/10" />

      <div className="max-h-[420px] overflow-auto py-1">
        {FONT_ITEMS.map((f) => {
          const active = f.label === value;
          return (
            <button
              key={f.label}
              type="button"
              onMouseDown={(e) => e.preventDefault()} // keep selection
              onClick={() => {
                onPick(f.label, f.css);
                onClose();
              }}
              className={cx(
                "w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left",
                "hover:bg-black/5 active:bg-black/10",
                active && "bg-black/5"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                {active ? (
                  <span className="text-black/60 text-[18px] leading-none">✓</span>
                ) : (
                  <span className="w-[18px]" />
                )}

                <span
                  className="text-[15px] truncate"
                  style={{ fontFamily: f.css }}
                >
                  {f.label}
                </span>
              </div>

              {f.right ? (
                <span className="text-black/35 text-[16px] leading-none">›</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SvgIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center">
      {children}
    </span>
  );
}

function DocsColorPicker({
  open,
  anchorRef,
  onClose,
  value,
  onPick,
}: {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  value: string;
  onPick: (hex: string) => void;
}) {
  const popRef = useRef<HTMLDivElement | null>(null);
  // close when clicking outside the picker or anchor
  useOnClickOutside([popRef, anchorRef], onClose, open);

  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const a = anchorRef.current;
    if (!a) return;
    const r = a.getBoundingClientRect();
    setPos({ top: r.bottom + 8 + window.scrollY, left: r.left + window.scrollX });
  }, [open, anchorRef]);

  if (!open || !pos) return null;

  // basic palette (visual-only, small selection)
  const palette = [
    "#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#efefef", "#ffffff",
    "#e60000", "#ff9900", "#ffd700", "#00a600", "#00aaff", "#0066ff", "#6600cc", "#ff00ff"
  ];

  return (
    <div
      ref={popRef}
      className="fixed z-[9999] bg-white border border-black/10 shadow-lg rounded-md p-3"
      style={{ top: pos.top, left: Math.min(pos.left, window.innerWidth - 220) }}
      role="dialog"
      aria-label="Text color"
    >
      <div className="grid grid-cols-8 gap-2">
        {palette.map((hex) => (
          <button
            key={hex}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onPick(hex);
              onClose();
            }}
            aria-label={`Pick color ${hex}`}
            title={hex}
            className="h-6 w-6 rounded"
            style={{
              backgroundColor: hex,
              border: hex.toLowerCase() === value.toLowerCase() ? "2px solid #111" : "1px solid rgba(0,0,0,0.08)",
            }}
          />
        ))}
      </div>

      <div className="mt-2 flex justify-between items-center">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClose}
          className="text-xs text-black/60"
        >
          Close
        </button>
        <div className="text-xs text-black/50">Text color</div>
      </div>
    </div>
  );
}

function IconUndo() {
  return (
    <SvgIcon>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M9 7H5v4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 11c1.5-3 4.5-5 8-5a8 8 0 1 1 0 16"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </SvgIcon>
  );
}

function IconRedo() {
  return (
    <SvgIcon>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M15 7h4v4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19 11c-1.5-3-4.5-5-8-5a8 8 0 1 0 0 16"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </SvgIcon>
  );
}

function IconPrint() {
  return (
    <SvgIcon>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M7 7V3h10v4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M7 17v4h10v-4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M6 9h12a3 3 0 0 1 3 3v3h-3"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M6 15H3v-3a3 3 0 0 1 3-3"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </SvgIcon>
  );
}

export default function App() {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const pageContainerRef = useRef<HTMLDivElement | null>(null);

  // -------------------------
  // Document state
  // -------------------------
  const [title, setTitle] = useState("Untitled document");
  const [loaded, setLoaded] = useState(false);

  const [tool, setTool] = useState<Record<Tool, boolean>>({
    bold: false,
    italic: false,
    underline: false,
  });

  // -------------------------
  // Menus / anchors
  // -------------------------
  const [openMenu, setOpenMenu] = useState<null | "file">(null);
  const fileAnchorRef = useRef<HTMLDivElement | null>(null);

  const [openToolbarMenu, setOpenToolbarMenu] = useState<null | "zoom" | "align">(null);
  const zoomAnchorRef = useRef<HTMLDivElement | null>(null);
  const alignAnchorRef = useRef<HTMLDivElement | null>(null);

  const [openColor, setOpenColor] = useState(false);
  const colorAnchorRef = useRef<HTMLDivElement | null>(null);
  const [lastColor, setLastColor] = useState("#000000");

  const [blockStyle, setBlockStyle] = useState<BlockStyle>("normal");
  const [openStyleMenu, setOpenStyleMenu] = useState(false);
  const styleAnchorRef = useRef<HTMLDivElement | null>(null);

  const [fontLabel, setFontLabel] = useState("Arial");
  const [openFontMenu, setOpenFontMenu] = useState(false);
  const fontAnchorRef = useRef<HTMLDivElement | null>(null);

  // -------------------------
  // Zoom
  // -------------------------
  const [zoom, setZoom] = useState(100);

  const applyFitZoom = () => {
    const pageWidth = 850;
    const padding = 32;
    const available = (pageContainerRef.current?.clientWidth ?? pageWidth) - padding;
    const z = Math.max(50, Math.min(200, Math.floor((available / pageWidth) * 100)));
    setZoom(z);
  };

  const selectionInsideEditor = () => {
    const editor = editorRef.current;
    const sel = window.getSelection();
    if (!editor || !sel || sel.rangeCount === 0) return false;
  
    const range = sel.getRangeAt(0);
    const node = range.commonAncestorContainer;
    const el = node.nodeType === 1 ? (node as Element) : node.parentElement;
    return !!el && editor.contains(el);
  };

  // -------------------------
  // Autosave
  // -------------------------
  const saveEditorNow = () => {
    const html = editorRef.current?.innerHTML ?? "";
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ title, html }));
  };

  // -------------------------
  // Link popover (caret)
  // -------------------------
  const [openLink, setOpenLink] = useState(false);
  const [linkPos, setLinkPos] = useState<{ top: number; left: number } | null>(null);

  // -------------------------
  // Font size (Docs-like)
  // -------------------------
  const FONT_SIZES = useMemo(() => [8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72, 96], []);

  const [fontSize, setFontSize] = useState(11);
  const [openFontSizeMenu, setOpenFontSizeMenu] = useState(false);
  const fontSizeAnchorRef = useRef<HTMLDivElement | null>(null);

  // Save/restore selection so toolbar clicks don't destroy it
  const savedRangeRef = useRef<Range | null>(null);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    savedRangeRef.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreSelection = () => {
    const r = savedRangeRef.current;
    if (!r) return;

    const sel = window.getSelection();
    if (!sel) return;

    sel.removeAllRanges();
    sel.addRange(r);
    editorRef.current?.focus();
  };

  // Apply font size to ONLY selected text (or caret typing span)
  const applyFontSize = (sizePt: number) => {
    const editor = editorRef.current;
    if (!editor) return;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);

    // Ensure selection is inside editor
    const container = range.commonAncestorContainer;
    const containerEl =
      container.nodeType === 1 ? (container as Element) : container.parentElement;
    if (!containerEl || !editor.contains(containerEl)) return;

    editor.focus();

    if (!range.collapsed) {
      // Wrap ONLY the selected content
      const span = document.createElement("span");
      span.style.fontSize = `${sizePt}pt`;

      try {
        range.surroundContents(span);
      } catch {
        const frag = range.extractContents();
        span.appendChild(frag);
        range.insertNode(span);
      }

      sel.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.addRange(newRange);
    } else {
      // Caret only -> create a typing span
      const span = document.createElement("span");
      span.style.fontSize = `${sizePt}pt`;

      const zwsp = document.createTextNode("\u200b");
      span.appendChild(zwsp);

      range.insertNode(span);

      const newRange = document.createRange();
      newRange.setStart(zwsp, 1);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }

    setFontSize(sizePt);
    requestAnimationFrame(saveEditorNow);
  };

  // --- Google-Docs-like color palette ---------------------------------

type Swatch = { hex: string; border?: boolean };

const DOCS_SWATCH_ROWS: Swatch[][] = [
  // Grays row (Docs-like)
  [
    { hex: "#000000" },
    { hex: "#434343" },
    { hex: "#666666" },
    { hex: "#999999" },
    { hex: "#B7B7B7" },
    { hex: "#CCCCCC" },
    { hex: "#D9D9D9" },
    { hex: "#EFEFEF" },
    { hex: "#F3F3F3" },
    { hex: "#FFFFFF", border: true },
  ],

  // Bright row
  [
    { hex: "#980000" },
    { hex: "#FF0000" },
    { hex: "#FF9900" },
    { hex: "#FFFF00", border: true },
    { hex: "#00FF00" },
    { hex: "#00FFFF", border: true },
    { hex: "#4A86E8" },
    { hex: "#0000FF" },
    { hex: "#9900FF" },
    { hex: "#FF00FF" },
  ],

  // Pastels row 1
  [
    { hex: "#E6B8AF" },
    { hex: "#F4CCCC" },
    { hex: "#FCE5CD" },
    { hex: "#FFF2CC" },
    { hex: "#D9EAD3" },
    { hex: "#D0E0E3" },
    { hex: "#C9DAF8" },
    { hex: "#CFE2F3" },
    { hex: "#D9D2E9" },
    { hex: "#EAD1DC" },
  ],

  // Pastels row 2
  [
    { hex: "#DD7E6B" },
    { hex: "#EA9999" },
    { hex: "#F9CB9C" },
    { hex: "#FFE599" },
    { hex: "#B6D7A8" },
    { hex: "#A2C4C9" },
    { hex: "#A4C2F4" },
    { hex: "#9FC5E8" },
    { hex: "#B4A7D6" },
    { hex: "#D5A6BD" },
  ],

  // Mid row
  [
    { hex: "#CC4125" },
    { hex: "#E06666" },
    { hex: "#F6B26B" },
    { hex: "#FFD966" },
    { hex: "#93C47D" },
    { hex: "#76A5AF" },
    { hex: "#6D9EEB" },
    { hex: "#6FA8DC" },
    { hex: "#8E7CC3" },
    { hex: "#C27BA0" },
  ],

  // Dark row
  [
    { hex: "#A61C00" },
    { hex: "#CC0000" },
    { hex: "#E69138" },
    { hex: "#F1C232" },
    { hex: "#6AA84F" },
    { hex: "#45818E" },
    { hex: "#3C78D8" },
    { hex: "#3D85C6" },
    { hex: "#674EA7" },
    { hex: "#A64D79" },
  ],

  // Deeper row
  [
    { hex: "#85200C" },
    { hex: "#990000" },
    { hex: "#B45F06" },
    { hex: "#BF9000" },
    { hex: "#38761D" },
    { hex: "#134F5C" },
    { hex: "#1155CC" },
    { hex: "#0B5394" },
    { hex: "#351C75" },
    { hex: "#741B47" },
  ],
];

function ColorSwatchButton({
  hex,
  selected,
  border,
  onPick,
}: {
  hex: string;
  selected: boolean;
  border?: boolean;
  onPick: (hex: string) => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // keep editor selection
      onClick={() => onPick(hex)}
      className={[
        "h-5 w-5 rounded-[3px] relative",
        "hover:outline hover:outline-2 hover:outline-blue-500/60",
        selected ? "outline outline-2 outline-blue-600" : "outline-none",
      ].join(" ")}
      title={hex}
      aria-label={`Color ${hex}`}
      style={{
        backgroundColor: hex,
        border: border ? "1px solid rgba(0,0,0,.15)" : "1px solid transparent",
      }}
    />
  );
}

function DocsColorMenu({
  lastColor,
  onPick,
  onClose,
}: {
  lastColor: string;
  onPick: (hex: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="p-2">
      {/* palette grid */}
      <div className="space-y-1">
        {DOCS_SWATCH_ROWS.map((row, idx) => (
          <div key={idx} className="grid grid-cols-10 gap-1">
            {row.map((s) => (
              <ColorSwatchButton
                key={s.hex}
                hex={s.hex}
                border={s.border}
                selected={s.hex.toLowerCase() === lastColor.toLowerCase()}
                onPick={(hex) => {
                  onPick(hex);
                  onClose();
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* custom area */}
      <div className="mt-3 pt-2 border-t border-black/10">
        <div className="text-[10px] tracking-[0.14em] text-black/55 font-semibold mb-2">
          CUSTOM
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              // basic stub: for now just closes.
              // Later you can open a real color picker / input here.
              onClose();
            }}
            className="h-7 w-7 rounded-full border border-black/15 hover:bg-black/5 active:bg-black/10 flex items-center justify-center text-black/60"
            aria-label="Add custom color"
            title="Add custom color"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
  
  
  const sameHex = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

  const applyTextColor = (hex: string) => {
    const editor = editorRef.current;
    if (!editor) return;
  
    restoreSelection();
  
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
  
    const range = sel.getRangeAt(0);
  
    // ensure selection is inside editor
    const container = range.commonAncestorContainer;
    const containerEl =
      container.nodeType === 1 ? (container as Element) : container.parentElement;
    if (!containerEl || !editor.contains(containerEl)) return;
  
    editor.focus();
  
    // CASE 1: selection exists -> wrap selected contents
    if (!range.collapsed) {
      const span = document.createElement("span");
      span.style.color = hex;
  
      try {
        range.surroundContents(span);
      } catch {
        const frag = range.extractContents();
        span.appendChild(frag);
        range.insertNode(span);
      }
  
      // keep selection on the styled content
      sel.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.addRange(newRange);
    }
    // CASE 2: caret only -> create a typing span
    else {
      const span = document.createElement("span");
      span.style.color = hex;
  
      const zwsp = document.createTextNode("\u200b");
      span.appendChild(zwsp);
      range.insertNode(span);
  
      const newRange = document.createRange();
      newRange.setStart(zwsp, 1);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }
  
    setLastColor(hex);
    requestAnimationFrame(() => {
      saveSelection();   // keep the new colored caret/selection
      saveEditorNow();
    });
  };

  // Single entry point the toolbar should call:
  const applySize = (pt: number) => {
    restoreSelection();        // apply to what user selected before clicking toolbar
    applyFontSize(pt);         // per-selection/caret sizing
    setOpenFontSizeMenu(false);
  };

  // -------------------------
  // Typing class (bold/italic only)
  // -------------------------
  // const typingClass = useMemo(() => {
  //   return [tool.bold ? "font-bold" : "", tool.italic ? "italic" : ""].join(" ");
  // }, [tool.bold, tool.italic]);

  // Load from localStorage (same as your existing logic)
  const exec = (command: "bold" | "italic" | "underline") => {
    restoreSelection();          // ✅ apply to what user selected before toolbar click
    editorRef.current?.focus();
  
    document.execCommand(command);
  
    requestAnimationFrame(() => {
      syncToolStateFromSelection();
      saveSelection();           // ✅ keep caret/selection updated
      saveEditorNow();
    });
  };



  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { title?: string; html?: string };
        if (parsed.title) setTitle(parsed.title);
        if (parsed.html && editorRef.current) editorRef.current.innerHTML = parsed.html;
      } else {
        if (editorRef.current) {
          editorRef.current.innerHTML = `
            <p>Start typing…</p>
            <p><br/></p>
            <p>This is a high-fidelity prototype of a Google Docs–style editor UI.</p>
          `;
        }
      }
    } catch {
      // ignore
    } finally {
      setLoaded(true);
    }
  }, []);

  // Save on title change (debounced)
  useEffect(() => {
    if (!loaded) return;
    const id = window.setTimeout(() => {
      saveEditorNow();
    }, 250);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, loaded]);

  const [pendingFontSize, setPendingFontSize] = useState<number | null>(null);

  const onEditorInput = () => {
    if (!loaded) return;
  
    if (pendingFontSize !== null) {
      document.execCommand("fontSize", false, "7"); // dummy
      const fontElements = editorRef.current?.getElementsByTagName("font");
      const last = fontElements?.[fontElements.length - 1];
  
      if (last) {
        last.removeAttribute("size");
        last.style.fontSize = `${pendingFontSize}pt`;
      }
  
      setPendingFontSize(null); // ✅ important
    }
  
    saveEditorNow();
  };

  const syncToolStateFromSelection = () => {
    setTool({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
    });
  };

  // Duplicate `exec` removed — the earlier `exec` (which restores selection and saves state)
  // is kept to handle bold/italic/underline so toolbar/shortcuts use a single implementation.

  const execWithStateSync = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    if (value !== undefined) document.execCommand(cmd, false, value);
    else document.execCommand(cmd);
    requestAnimationFrame(() => {
      syncToolStateFromSelection();
      saveEditorNow();
    });
  };

  const applyZoom = (z: number) => {
    setZoom(z);
  };

  const clearDoc = () => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = "<p><br/></p>";
    saveEditorNow();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      const k = e.key.toLowerCase();
      if (k === "b") {
        e.preventDefault();
        exec("bold");
      } else if (k === "i") {
        e.preventDefault();
        exec("italic");
      } else if (k === "u") {
        e.preventDefault();
        exec("underline");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#f1f3f4] text-[#202124]">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-white border-b border-black/10">
        <div className="mx-auto max-w-[1200px] px-4">
          <div className="flex items-center gap-3 h-14">
            {/* Docs logo placeholder */}
            <div className="h-8 w-8 rounded bg-blue-600" aria-hidden />

            {/* Title */}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 px-2 rounded-md bg-transparent hover:bg-black/5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 w-[280px] text-[16px]"
            />

            {/* star + folder + cloud (visual-only) */}
            <div className="flex items-center gap-1 text-black/70">
              <IconButton label="Star" className="h-8 w-8">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 17.3l-5.4 3 1-6.1L3 9.6l6.2-.9L12 3l2.8 5.7 6.2.9-4.6 4.6 1 6.1-5.4-3z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                </svg>
              </IconButton>
              <IconButton label="Move" className="h-8 w-8">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 7h7l2 2h7v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </IconButton>
              <IconButton label="Saved to Drive" className="h-8 w-8">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 4a7 7 0 1 0 7 7"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 7v5l3 2"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </IconButton>
            </div>

            <div className="flex-1" />

            {/* Right side actions */}
            <div className="flex items-center gap-1">
              <IconButton label="History">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 12a9 9 0 1 0 3-6.7"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M3 4v4h4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 7v6l4 2"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </IconButton>
              <IconButton label="Comments">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 5h16v11H7l-3 3V5z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </IconButton>

              <button
                type="button"
                className="h-9 px-4 rounded-full bg-[#c2e7ff] hover:bg-[#b7ddf7] active:bg-[#a9d4f0] text-sm font-medium flex items-center gap-2"
              >
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/70">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 3a4 4 0 0 1 4 4v3h2a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h2V7a4 4 0 0 1 4-4z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                Share
                <span className="text-black/50">▾</span>
              </button>

              <div className="ml-2 h-9 w-9 rounded-full bg-orange-500 text-white flex items-center justify-center font-semibold">
                n
              </div>
            </div>
          </div>

          {/* Menu row */}
          <div className="flex items-center gap-1 pb-2">
            <div className="relative" ref={fileAnchorRef}>
              <TextMenuButton
                label="File"
                active={openMenu === "file"}
                onClick={() => setOpenMenu((m) => (m === "file" ? null : "file"))}
              />
              <Dropdown
                anchorRef={fileAnchorRef}
                open={openMenu === "file"}
                onClose={() => setOpenMenu(null)}
                widthClass="w-60"
              >
                <div className="py-1 text-[13px]">
                  {[
                    "New",
                    "Open",
                    "Make a copy",
                    "Download",
                    "Rename",
                    "Move",
                    "Trash",
                  ].map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-black/5 active:bg-black/10"
                      onClick={() => setOpenMenu(null)}
                    >
                      {item}
                    </button>
                  ))}
                  <div className="my-1 h-px bg-black/10" />
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-black/5 active:bg-black/10"
                    onClick={() => {
                      setOpenMenu(null);
                      clearDoc();
                    }}
                  >
                    Clear document
                  </button>
                </div>
              </Dropdown>
            </div>

            {["Edit", "View", "Insert", "Format", "Tools", "Extensions", "Help"].map(
              (label) => (
                <TextMenuButton key={label} label={label} />
              )
            )}
          </div>

          {/* Toolbar */}
          {/* Toolbar */}
<div className="pb-3">
  {/* FULL-WIDTH positioning container (keeps pill centered like Google Docs) */}
  
    {/* CENTERED toolbar pill */}
    <div className="relative w-full h-11 flex items-center justify-center">
      <ToolbarPill>
        {/* Undo / Redo */}
        <IconButton label="Undo" onClick={() => execWithStateSync("undo")}>
          <IconUndo />
        </IconButton>
        <IconButton label="Redo" onClick={() => execWithStateSync("redo")}>
          <IconRedo />
        </IconButton>

        <Divider />

        <IconButton label="Print" onClick={() => window.print()}>
          <IconPrint />
        </IconButton>

        <Divider />

        {/* Zoom dropdown */}
        <div className="relative" ref={zoomAnchorRef}>
          <ToolDropdownButton
            label="Zoom"
            value={`${zoom}%`}
            onClick={() =>
              setOpenToolbarMenu((m) => (m === "zoom" ? null : "zoom"))
            }
          />

          <Dropdown
            anchorRef={zoomAnchorRef}
            open={openToolbarMenu === "zoom"}
            onClose={() => setOpenToolbarMenu(null)}
            widthClass="w-44"
          >
            <div className="py-1 text-[13px]">
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-black/5 active:bg-black/10"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  applyFitZoom();
                  setOpenToolbarMenu(null);
                }}
              >
                Fit
              </button>

              <div className="my-1 h-px bg-black/10" />

              {[50, 75, 90, 100, 110, 125, 150, 200].map((z) => (
                <button
                  key={z}
                  type="button"
                  className={cx(
                    "w-full text-left px-3 py-2 hover:bg-black/5 active:bg-black/10",
                    z === zoom && "bg-black/5"
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setZoom(z);
                    setOpenToolbarMenu(null);
                  }}
                >
                  {z}%
                </button>
              ))}
            </div>
          </Dropdown>
        </div>

        <Divider />

        {/* Font size control + dropdown */}
        <div className="relative" ref={fontSizeAnchorRef}>
          <div className="flex items-center gap-1 bg-white/60 border border-black/10 rounded-full px-2 h-9">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applySize(Math.max(6, fontSize - 1))}
              className="h-7 w-7 flex items-center justify-center rounded hover:bg-black/5 active:bg-black/10"
            >
              −
            </button>

            {/* Make number clickable to open dropdown */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection(); // keep selection
              }}
              onClick={() => setOpenFontSizeMenu((v) => !v)}
              className="w-10 text-center text-sm rounded hover:bg-black/5 active:bg-black/10 select-none"
              title="Font size"
              aria-label="Font size"
            >
              {fontSize}
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applySize(Math.min(96, fontSize + 1))}
              className="h-7 w-7 flex items-center justify-center rounded hover:bg-black/5 active:bg-black/10"
            >
              +
            </button>
          </div>

          <Dropdown
            anchorRef={fontSizeAnchorRef}
            open={openFontSizeMenu}
            onClose={() => setOpenFontSizeMenu(false)}
            widthClass="w-[84px]"
          >
            <div className="py-1 text-[13px] max-h-[320px] overflow-auto">
              {FONT_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={cx(
                    "w-full text-left px-3 py-2 hover:bg-black/5 active:bg-black/10",
                    s === fontSize && "bg-black/5"
                  )}
                  onMouseDown={(e) => e.preventDefault()} // keep selection
                  onClick={() => applySize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </Dropdown>
        </div>

        <Divider />

        {/* Bold / Italic / Underline */}
        <IconButton label="Bold" active={tool.bold} onClick={() => exec("bold")}>
          <span className="font-bold">B</span>
        </IconButton>
        <IconButton
          label="Italic"
          active={tool.italic}
          onClick={() => exec("italic")}
        >
          <span className="italic">I</span>
        </IconButton>
        <IconButton
          label="Underline"
          active={tool.underline}
          onClick={() => exec("underline")}
        >
          <span className="underline">U</span>
        </IconButton>

        <Divider />

        {/* Text color (prototype) */}
        {/* Text color */}
        {/* Text color */}
        <div className="relative" ref={colorAnchorRef}>
  <IconButton
    label="Text color"
    onClick={() => {
      saveSelection();               // keep editor selection
      setOpenColor((v) => !v);
    }}
  >
    <span className="relative font-semibold">
      A
      <span
        className="absolute left-0 right-0 -bottom-[2px] h-[2px]"
        style={{ backgroundColor: lastColor }}
      />
    </span>
  </IconButton>

  <Dropdown
    anchorRef={colorAnchorRef}
    open={openColor}
    onClose={() => setOpenColor(false)}
    widthClass="w-[260px]"
  >
    <DocsColorMenu
      lastColor={lastColor}
      onClose={() => setOpenColor(false)}
      onPick={(hex) => {
        applyTextColor(hex);   // your existing wrapper-based logic
        setLastColor(hex);
      }}
    />
  </Dropdown>
</div>

          {/* simple popover */}
          <div className="relative" ref={styleAnchorRef}>
            <IconButton
              label="Paragraph styles"
              onClick={() =>
                setOpenStyleMenu((v) => (v ? false : true))
              }
            >
              <SmallIcon>¶</SmallIcon>
            </IconButton>

            {openStyleMenu && (
              <div className="absolute top-full mt-1 w-40 bg-white rounded shadow-lg p-2 text-sm">
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-black/5 active:bg-black/10"
                  onClick={() => {
                    document.execCommand("formatBlock", false, "p");
                    setOpenStyleMenu(false);
                  }}
                >
                  Normal text
                </button>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-black/5 active:bg-black/10"
                  onClick={() => {
                    document.execCommand("formatBlock", false, "h1");
                    setOpenStyleMenu(false);
                  }}
                >
                  Heading 1
                </button>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-black/5 active:bg-black/10"
                  onClick={() => {
                    document.execCommand("formatBlock", false, "h2");
                    setOpenStyleMenu(false);
                  }}
                >
                  Heading 2
                </button>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-black/5 active:bg-black/10"
                  onClick={() => {
                    document.execCommand("formatBlock", false, "h3");
                    setOpenStyleMenu(false);
                  }}
                >
                  Heading 3
                </button>
              </div>
            )}              
</div>

        {/* Link */}
        <IconButton
          label="Insert link"
          onClick={() => {
            const rect = getCaretRect();
            if (!rect) return;

            setLinkPos({
              top: rect.top + window.scrollY,
              left: rect.left + window.scrollX,
            });

            setOpenLink(true);
          }}
        >
          <span className="material-symbols-outlined">link</span>
        </IconButton>

        <Divider />

        {/* Align dropdown */}
        <div className="relative" ref={alignAnchorRef}>
          <IconButton
            label="Align"
            onClick={() =>
              setOpenToolbarMenu((m) => (m === "align" ? null : "align"))
            }
          >
            <SmallIcon>≡</SmallIcon>
          </IconButton>

          <Dropdown
            anchorRef={alignAnchorRef}
            open={openToolbarMenu === "align"}
            onClose={() => setOpenToolbarMenu(null)}
            widthClass="w-48"
          >
            <div className="py-1 text-[13px]">
              {[
                { label: "Left", cmd: "justifyLeft" },
                { label: "Center", cmd: "justifyCenter" },
                { label: "Right", cmd: "justifyRight" },
                { label: "Justify", cmd: "justifyFull" },
              ].map((a) => (
                <button
                  key={a.cmd}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-black/5 active:bg-black/10"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    execWithStateSync(a.cmd);
                    setOpenToolbarMenu(null);
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </Dropdown>
        </div>

        {/* Lists */}
        <IconButton
          label="Numbered list"
          onClick={() => execWithStateSync("insertOrderedList")}
        >
          <SmallIcon>1.</SmallIcon>
        </IconButton>
      </ToolbarPill>
    </div>

    {/* RIGHT-SIDE status (outside the pill, like Docs) */}
    <div className="absolute right-0 top-1/2 -translate-y-1/2 pr-1">
      <span className="text-xs text-black/50 select-none">Saved</span>
    </div>
  </div>
</div>

{/* Ruler */}
<Ruler />

{/* Page area */}
<main className="mx-auto max-w-[1200px] px-4 py-8">
  <div id="page-container" ref={pageContainerRef} className="mx-auto w-full">
    <div className="flex justify-center">
      <div
        className="origin-top"
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: "top center",
          width: 850,
        }}
      >
        <div className="bg-white shadow-[0_1px_3px_rgba(60,64,67,.15),0_4px_8px_rgba(60,64,67,.15)] rounded-sm">
          <div className="px-16 py-14">
            <div className="text-[28px] font-semibold mb-6">{title}</div>

            <div
  ref={editorRef}
  className={cx(
    "min-h-[520px] leading-[1.7] outline-none",
    "prose max-w-none prose-p:my-0 prose-p:leading-[1.7]",

    // ✅ Google Docs–style links
    "prose-a:text-[#1a73e8]",
    "prose-a:underline",
    "prose-a:underline-offset-2",
    "prose-a:decoration-[#1a73e8]"
  )}
  contentEditable
  suppressContentEditableWarning
  spellCheck

  onInput={onEditorInput}

  onKeyUp={() => {
    syncToolStateFromSelection();
    saveSelection();
  }}

  onMouseUp={() => {
    syncToolStateFromSelection();
    saveSelection();
  }}

  // ✅ Cmd/Ctrl + click opens link (Docs behavior)
  onClick={(e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const a = target.closest("a") as HTMLAnchorElement | null;
    if (!a) return;

    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      e.stopPropagation();
      window.open(a.href, "_blank", "noopener,noreferrer");
    }
  }}
/>
          </div>
        </div>
      </div>
    </div>

    <p className="text-xs text-black/45 mt-4 text-center">
      Tip: Select text then use{" "}
      <span className="font-semibold">⌘/Ctrl+B</span>,{" "}
      <span className="font-semibold">⌘/Ctrl+I</span>,{" "}
      <span className="font-semibold">⌘/Ctrl+U</span>. Refresh to confirm autosave.
    </p>
  </div>
</main>

      </header>
      
      {/* Link popover */}
      <LinkPopover
  open={openLink}
  position={linkPos}
  onClose={() => setOpenLink(false)}
  onApply={(text, url) => {
    restoreSelection();
    // simplest: create link on current selection/caret
    document.execCommand("createLink", false, url);
    syncToolStateFromSelection();
    saveEditorNow();
  }}
/>
    </div>
      
  );
}



          