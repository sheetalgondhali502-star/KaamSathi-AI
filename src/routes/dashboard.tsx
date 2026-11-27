import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RotateCcw, Trash2 } from "lucide-react";
import { loadReports, saveReports, resetToSamples, type Report, type Status } from "../lib/reports";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Supervisor Dashboard – KaamSathi AI" },
      { name: "description", content: "Track machine and quality reports from the factory floor and update their status." },
      { property: "og:title", content: "Supervisor Dashboard – KaamSathi AI" },
      { property: "og:description", content: "All factory issue reports with category, urgency and status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  Critical: "bg-destructive text-destructive-foreground", High: "bg-destructive/15 text-destructive",
  Medium: "bg-warning/30 text-foreground", Low: "bg-muted text-muted-foreground",
};

function Dashboard() {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [filter, setFilter] = useState<"All" | Status>("All");
  const [cat, setCat] = useState<"All" | "Maintenance" | "Quality">("All");

  useEffect(() => {
    setReports(loadReports());
    const onStorage = () => setReports(loadReports());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const shown = useMemo(() => (reports ?? []).filter((r) => (filter === "All" || r.status === filter) && (cat === "All" || r.category === cat)), [reports, filter, cat]);

  function update(next: Report[], msg: string) {
    try { saveReports(next); setReports(next); toast.success(msg); }
    catch { toast.error("Could not save changes to browser storage."); }
  }
  const setStatus = (id: string, s: Status) => update((reports ?? []).map((r) => (r.id === id ? { ...r, status: s } : r)), `Status changed to ${s}`);
  const remove = (id: string) => { if (confirm("Delete this report?")) update((reports ?? []).filter((r) => r.id !== id), "Report deleted"); };

  const count = (s: Status) => (reports ?? []).filter((r) => r.status === s).length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary">Supervisor Dashboard</h1>
          <p className="text-muted-foreground">Reports are saved in this browser. Sample reports are included.</p>
        </div>
        <button onClick={() => { if (confirm("Replace all reports with the sample reports?")) { setReports(resetToSamples()); toast.success("Sample reports restored"); } }}
          className="inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-border bg-card px-4 font-semibold hover:bg-muted"><RotateCcw className="h-4 w-4" /> Reset samples</button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total" value={reports?.length ?? 0} cls="bg-card" />
        {STATUSES.map((s) => <Stat key={s} label={s} value={count(s)} cls="bg-card" dot={statusCls[s]} />)}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(["All", ...STATUSES] as const).map((s) => <Chip key={s} on={filter === s} onClick={() => setFilter(s)}>{s}</Chip>)}
        <span className="mx-1 w-px bg-border" />
        {(["All", "Maintenance", "Quality"] as const).map((c) => <Chip key={c} on={cat === c} onClick={() => setCat(c)}>{c === "All" ? "All categories" : c}</Chip>)}
      </div>

      {reports === null ? <p className="mt-8 text-muted-foreground">Loading reports…</p> :
        shown.length === 0 ? <p className="mt-8 rounded-xl border bg-card p-6 text-center text-muted-foreground">No reports match these filters.</p> : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {shown.map((r) => (
            <li key={r.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <p className="text-xl font-extrabold text-primary">{r.machine || "—"}</p>
                  <p className="text-sm text-muted-foreground">{new Date(r.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · {r.reporter} · {r.language}</p>
                </div>
                <button onClick={() => remove(r.id)} aria-label="Delete report" className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive"><Trash2 className="h-5 w-5" /></button>
              </div>
              <p className="mt-3 text-base">{r.problem}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
                <span className={`rounded-full px-3 py-1 ${r.category === "Quality" ? "bg-secondary text-secondary-foreground" : "bg-primary/10 text-primary"}`}>{r.category}</span>
                <span className={`rounded-full px-3 py-1 ${urgCls[r.urgency] ?? ""}`}>{r.urgency}</span>
                <span className={`rounded-full px-3 py-1 ${statusCls[r.status]}`}>{r.status}</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2" role="group" aria-label={`Status for ${r.machine}`}>
                {STATUSES.map((s) => (
                  <button key={s} onClick={() => setStatus(r.id, s)} disabled={r.status === s}
                    className={`min-h-12 rounded-lg border-2 px-2 text-sm font-bold ${r.status === s ? "border-transparent " + statusCls[s] : "border-border hover:border-primary"}`}>{s}</button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function Stat({ label, value, cls, dot }: { label: string; value: number; cls: string; dot?: string }) {
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">{dot && <span className={`h-3 w-3 rounded-full ${dot}`} />}{label}</p>
      <p className="text-3xl font-extrabold text-primary">{value}</p>
    </div>
  );
}
function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={`min-h-11 rounded-full border-2 px-4 font-semibold ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"}`}>{children}</button>;
}
