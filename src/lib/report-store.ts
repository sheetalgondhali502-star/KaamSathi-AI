import { supabase } from "@/integrations/supabase/client";
import { loadReports, saveReports, SAMPLE_REPORTS, type Report, type Status } from "./reports";

/** "cloud" = shared database (all devices). "local" = demo mode, this browser only. */
export type StoreMode = "cloud" | "local";
export type NewReport = Omit<Report, "id" | "createdAt" | "status">;

type Row = {
  id: string; created_at: string; transcript: string; machine: string; problem: string;
  category: string; urgency: string; status: string; language: string; reporter: string;
};

export function rowToReport(r: Row): Report {
  return {
    id: r.id, createdAt: r.created_at, transcript: r.transcript, machine: r.machine, problem: r.problem,
    category: r.category as Report["category"], urgency: r.urgency as Report["urgency"],
    status: r.status as Status, language: r.language, reporter: r.reporter,
  };
}

function table() {
  return supabase.from("reports");
}

/** Loads reports from the shared database; falls back to local demo mode if it can't be reached. */
export async function fetchReports(): Promise<{ mode: StoreMode; reports: Report[]; reason?: string }> {
  try {
    const { data, error } = await table().select("*").order("created_at", { ascending: false }).limit(1000);
    if (error) throw error;
    return { mode: "cloud", reports: (data ?? []).map(rowToReport) };
  } catch (e) {
    console.warn("[KaamSathi] Shared database unavailable, using local demo mode", e);
    return { mode: "local", reports: loadReports(), reason: e instanceof Error ? e.message : "unreachable" };
  }
}

export async function addReport(mode: StoreMode, r: NewReport): Promise<void> {
  if (mode === "cloud") {
    const { error } = await table().insert({ ...r, status: "Pending" });
    if (error) throw new Error(error.message);
    return;
  }
  const list = loadReports();
  list.unshift({ ...r, id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: "Pending" });
  saveReports(list);
}

export async function updateStatus(mode: StoreMode, id: string, status: Status): Promise<void> {
  if (mode === "cloud") {
    const { error } = await table().update({ status }).eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  saveReports(loadReports().map((r) => (r.id === id ? { ...r, status } : r)));
}

export async function deleteReport(mode: StoreMode, id: string): Promise<void> {
  if (mode === "cloud") {
    const { error } = await table().delete().eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  saveReports(loadReports().filter((r) => r.id !== id));
}

export async function restoreSamples(mode: StoreMode): Promise<void> {
  if (mode === "cloud") {
    const del = await table().delete().not("id", "is", null);
    if (del.error) throw new Error(del.error.message);
    const ins = await table().insert(SAMPLE_REPORTS.map(({ id: _id, createdAt, ...r }) => ({ ...r, created_at: createdAt })));
    if (ins.error) throw new Error(ins.error.message);
    return;
  }
  saveReports(SAMPLE_REPORTS);
}

/** Live updates: shared database changes in cloud mode, other tabs' storage changes in local mode. */
export function subscribeReports(mode: StoreMode, onChange: () => void): () => void {
  if (mode === "local") {
    window.addEventListener("storage", onChange);
    return () => window.removeEventListener("storage", onChange);
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  const ping = () => { clearTimeout(timer); timer = setTimeout(onChange, 250); };
  const channel = supabase
    .channel(`reports-${Math.random().toString(36).slice(2)}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, ping)
    .subscribe();
  return () => { clearTimeout(timer); void supabase.removeChannel(channel); };
}
