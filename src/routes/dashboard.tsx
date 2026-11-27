
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RotateCcw, Trash2 } from "lucide-react";
import {
  type Report,
  type Status,
} from "../lib/reports";
import {
  fetchReports,
  updateStatus as saveStatus,
  deleteReport,
  restoreSamples,
  subscribeReports,
  type StoreMode,
} from "../lib/report-store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Supervisor Dashboard – KaamSathi AI" },
      {
        name: "description",
        content: "Track factory machine and quality reports.",
      },
    ],
  }),
  component: Dashboard,
});

const STATUSES: Status[] = ["Pending", "In Progress", "Resolved"];

const statusCls: Record<Status, string> = {
  Pending: "bg-warning text-warning-foreground",
  "In Progress": "bg-primary text-primary-foreground",
  Resolved: "bg-success text-success-foreground",
};

const urgCls: Record<string, string> = {
  Critical: "bg-destructive text-destructive-foreground",
  High: "bg-destructive/15 text-destructive",
  Medium: "bg-warning/30 text-foreground",
  Low: "bg-muted text-muted-foreground",
};

function Dashboard() {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [mode, setMode] = useState<StoreMode | null>(null);
  const [filter, setFilter] = useState<"All" | Status>("All");
  const [cat, setCat] = useState<"All" | "Maintenance" | "Quality">("All");
  const [busy, setBusy] = useState(false);

  async function refreshReports() {
    const result = await fetchReports();
    setReports(result.reports);
    setMode(result.mode);
  }

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    async function initialize() {
      try {
        const result = await fetchReports();
        if (!active) return;

        setReports(result.reports);
        setMode(result.mode);

        unsubscribe = subscribeReports(result.mode, () => {
          void refreshReports();
        });
      } catch {
        if (active) {
          setReports([]);
          setMode("local");
          toast.error("Could not load reports.");
        }
      }
    }

    void initialize();

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const shown = useMemo(
    () =>
      (reports ?? []).filter(
        (r) =>
          (filter === "All" || r.status === filter) &&
          (cat === "All" || r.category === cat),
      ),
    [reports, filter, cat],
  );

  async function changeStatus(id: string, status: Status) {
    if (!mode || busy) return;

    setBusy(true);
    try {
      await saveStatus(mode, id, status);
      await refreshReports();
      toast.success(`Status changed to ${status}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update status.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!mode || busy) return;
    if (!confirm("Delete this report?")) return;

    setBusy(true);
    try {
      await deleteReport(mode, id);
      await refreshReports();
      toast.success("Report deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete report.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!mode || busy) return;

    if (!confirm("Replace all reports with sample reports?")) return;

    setBusy(true);
    try {
      await restoreSamples(mode);
      await refreshReports();
      toast.success("Sample reports restored");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not restore samples.",
      );
    } finally {
      setBusy(false);
    }
  }

  const count = (status: Status) =>
    (reports ?? []).filter((r) => r.status === status).length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-primary sm:text-3xl">
            Supervisor Dashboard
          </h1>
          <p className="text-muted-foreground">
            View and manage factory issue reports.
          </p>
          {mode && (
            <p className="mt-2 text-sm font-semibold">
              Storage mode:{" "}
              <span
                className={
                  mode === "cloud" ? "text-success" : "text-warning"
                }
              >
                {mode === "cloud" ? "Cloud (Supabase)" : "Local (This browser)"}
              </span>
            </p>
          )}
        </div>

        <button
          onClick={reset}
          disabled={!mode || busy}
          className="inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-border bg-card px-4 font-semibold hover:bg-muted disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          Reset samples
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total" value={reports?.length ?? 0} cls="bg-card" />
        {STATUSES.map((s) => (
          <Stat
            key={s}
            label={s}
            value={count(s)}
            cls="bg-card"
            dot={statusCls[s]}
          />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(["All", ...STATUSES] as const).map((s) => (
          <Chip
            key={s}
            on={filter === s}
            onClick={() => setFilter(s)}
          >
            {s}
          </Chip>
        ))}

        <span className="mx-1 w-px bg-border" />

        {(["All", "Maintenance", "Quality"] as const).map((c) => (
          <Chip
            key={c}
            on={cat === c}
            onClick={() => setCat(c)}
          >
            {c === "All" ? "All categories" : c}
          </Chip>
        ))}
      </div>

      {reports === null ? (
        <p className="mt-8 text-muted-foreground">Loading reports...</p>
      ) : shown.length === 0 ? (
        <p className="mt-8 rounded-xl border bg-card p-6 text-center text-muted-foreground">
          No reports match these filters.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {shown.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border bg-card p-5 shadow-sm"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <p className="text-xl font-extrabold text-primary">
                    {r.machine || "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}{" "}
                    · {r.reporter} · {r.language}
                  </p>
                </div>

                <button
                  onClick={() => void remove(r.id)}
                  disabled={busy}
                  aria-label="Delete report"
                  className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-50"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              <p className="mt-3 text-base">{r.problem}</p>

              <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
                <span
                  className={`rounded-full px-3 py-1 ${
                    r.category === "Quality"
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {r.category}
                </span>

                <span
                  className={`rounded-full px-3 py-1 ${urgCls[r.urgency] ?? ""}`}
                >
                  {r.urgency}
                </span>

                <span
                  className={`rounded-full px-3 py-1 ${statusCls[r.status]}`}
                >
                  {r.status}
                </span>
              </div>

              <div
                className="mt-4 grid grid-cols-3 gap-2"
                role="group"
                aria-label={`Status for ${r.machine}`}
              >
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => void changeStatus(r.id, s)}
                    disabled={busy || r.status === s}
                    className={`min-h-12 rounded-lg border-2 px-2 text-sm font-bold ${
                      r.status === s
                        ? "border-transparent " + statusCls[s]
                        : "border-border hover:border-primary"
                    } disabled:opacity-60`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function Stat({
  label,
  value,
  cls,
  dot,
}: {
  label: string;
  value: number;
  cls: string;
  dot?: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        {dot && <span className={`h-3 w-3 rounded-full ${dot}`} />}
        {label}
      </p>
      <p className="text-3xl font-extrabold text-primary">{value}</p>
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`min-h-11 rounded-full border-2 px-4 font-semibold ${
        on
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:border-primary"
      }`}
    >
      {children}
    </button>
  );
}
