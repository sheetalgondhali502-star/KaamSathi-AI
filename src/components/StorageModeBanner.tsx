import { Cloud, HardDrive, RefreshCw } from "lucide-react";
import type { StoreMode } from "../lib/report-store";

export function StorageModeBanner({ mode, onRetry }: { mode: StoreMode | null; onRetry: () => void }) {
  if (mode === null) return null;
  if (mode === "cloud") {
    return (
      <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-success" data-testid="mode-cloud">
        <Cloud className="h-4 w-4 shrink-0" /> Connected to shared database: reports are shared with all devices.
      </p>
    );
  }
  return (
    <div role="status" data-testid="mode-local" className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border-2 border-warning bg-warning/20 p-4">
      <p className="flex min-w-0 items-start gap-2">
        <HardDrive className="mt-0.5 h-5 w-5 shrink-0" />
        <span><strong>Local demo mode.</strong> The shared database can't be reached, so reports are saved only in this browser and other devices won't see them.</span>
      </p>
      <button onClick={onRetry} className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl border-2 border-border bg-card px-4 font-semibold hover:bg-muted">
        <RefreshCw className="h-4 w-4" /> Retry
      </button>
    </div>
  );
}
