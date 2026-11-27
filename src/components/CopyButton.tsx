import { useEffect, useState } from "react";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older phones / non-secure contexts: hidden input + execCommand.
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      el.setSelectionRange(0, text.length);
      const ok = document.execCommand("copy");
      el.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

interface Props {
  text: string;
  /** What is being copied, for screen readers: "arrival code", "share link"… */
  what: string;
  /** "dark" for use on the cocoa code card. */
  tone?: "light" | "dark";
  testId?: string;
  className?: string;
}

/** Small copy-to-clipboard button: "Copy" → "Copied ✓" for 2 seconds. */
export function CopyButton({ text, what, tone = "light", testId, className = "" }: Props) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const t = window.setTimeout(() => setState("idle"), 2000);
    return () => window.clearTimeout(t);
  }, [state]);

  const styles =
    tone === "dark"
      ? "border-cream-100/40 text-cream-50 hover:bg-cream-100/10"
      : "border-cocoa-900/25 bg-white text-cocoa-900 hover:bg-cream-100";

  return (
    <>
      <button
        type="button"
        onClick={async () => setState((await copyText(text)) ? "ok" : "fail")}
        className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-full border-2 px-4 text-sm font-semibold ${styles} ${className}`}
        data-testid={testId}
      >
        {state === "ok" ? "Copied ✓" : state === "fail" ? "Couldn’t copy" : "Copy"}
        <span className="sr-only"> {what}</span>
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {state === "ok" ? `${what} copied to clipboard` : state === "fail" ? `Couldn’t copy the ${what}. Select it and copy it manually.` : ""}
      </span>
    </>
  );
}
