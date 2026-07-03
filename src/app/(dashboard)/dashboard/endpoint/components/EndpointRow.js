"use client";

import { Input } from "@/shared/components";

/** Reusable endpoint row component */
export default function EndpointRow({
  label,
  url,
  copyId,
  copied,
  onCopy,
  badge,
  actions,
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="min-w-[88px] shrink-0 rounded bg-surface-2 px-1.5 py-0.5 text-center font-mono text-xs text-text-muted">
        {label}
      </span>
      {badge && (
        <span className="min-w-[72px] shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-center font-mono text-xs text-primary">
          {badge}
        </span>
      )}
      <Input value={url} readOnly className="flex-1 font-mono text-sm" />
      <button
        onClick={() => onCopy(url, copyId)}
        className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded text-text-muted hover:text-primary transition-colors shrink-0"
      >
        <span className="material-symbols-outlined text-[18px]">
          {copied === copyId ? "check" : "content_copy"}
        </span>
      </button>
      {actions}
    </div>
  );
}
