
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Keyboard,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  extractReport,
  type Category,
  type Extracted,
  type Urgency,
} from "../lib/reports";
import { fetchReports, addReport } from "../lib/report-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Worker Assistant – KaamSathi AI" },
      {
        name: "description",
        content:
          "Speak to report machine problems, damaged products and production issues.",
      },
      { property: "og:title", content: "Worker Assistant – KaamSathi AI" },
      {
        property: "og:description",
        content: "Voice-first issue reporting for Indian factory workers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WorkerPage,
});

const LANGS = [
  { code: "en-IN", label: "English" },
  { code: "hi-IN", label: "हिन्दी" },
  { code: "kn-IN", label: "ಕನ್ನಡ" },
  { code: "mr-IN", label: "मराठी" },
];

type SR = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult:
    | ((
        e: {
          resultIndex: number;
          results: ArrayLike<
            ArrayLike<{ transcript: string }> & { isFinal: boolean }
          >;
        },
      ) => void)
    | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

const ERRORS: Record<string, string> = {
  "not-allowed":
    "Microphone permission denied. Allow microphone access in your browser settings.",
  "service-not-allowed":
    "Browser blocked speech service. Please type your report or try Chrome or Edge.",
  "no-speech":
    "No speech was heard. Please speak clearly and try again.",
  "audio-capture":
    "No working microphone found. Please connect a microphone or type your report.",
  network:
    "Network error. Voice needs an internet connection. Please check your connection or type your report.",
  "language-not-supported":
    "Voice is not supported for this language. Please choose another language or type your report.",
};

type VoiceState = "idle" | "starting" | "listening" | "stopping";

function WorkerPage() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [lang, setLang] = useState("en-IN");
  const [voice, setVoice] = useState<VoiceState>("idle");
  const listening = voice !== "idle";

  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const [heard, setHeard] = useState<string | null>(null);
  const [draft, setDraft] = useState<Extracted | null>(null);
  const [reporter, setReporter] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const recRef = useRef<SR | null>(null);

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;

    setSupported(
      Boolean(w["SpeechRecognition"] ?? w["webkitSpeechRecognition"]) &&
        window.isSecureContext,
    );

    setReporter(localStorage.getItem("kaamsathi.reporter") ?? "");

    return () => {
      recRef.current?.stop();
      recRef.current = null;
    };
  }, []);

  async function start() {
    const w = window as unknown as Record<string, unknown>;
    const Ctor = (
      w["SpeechRecognition"] ?? w["webkitSpeechRecognition"]
    ) as (new () => SR) | undefined;

    if (!Ctor || listening) return;

    setError("");
    setSaved(false);
    setInterim("");
    setHeard(null);

    if (!navigator.onLine) {
      setError(ERRORS["network"] ?? "");
      return;
    }

    setVoice("starting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      stream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      setError(
        name === "NotFoundError"
          ? ERRORS["audio-capture"] ?? ""
          : ERRORS["not-allowed"] ?? "",
      );
      setVoice("idle");
      return;
    }

    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;

    let recognized = "";

    rec.onresult = (e) => {
      if (recRef.current !== rec) return;

      let fin = "";
      let tmp = "";

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r?.[0]?.transcript ?? "";

        if (r?.isFinal) fin += t;
        else tmp += t;
      }

      const clean = fin.trim();

      if (clean) {
        recognized = (recognized + " " + clean).trim();
        setTranscript((p) => (p.trim() ? p.trim() + " " : "") + clean);
      }

      setInterim(tmp);
    };

    rec.onerror = (e) => {
      if (recRef.current !== rec || e.error === "aborted") return;
      setError(
        ERRORS[e.error] ??
          `Voice input stopped (${e.error}). Please try again or type your report.`,
      );
    };

    rec.onend = () => {
      if (recRef.current !== rec) return;

      recRef.current = null;
      setVoice("idle");
      setInterim("");
      setHeard(recognized || null);
    };

    try {
      recRef.current = rec;
      rec.start();
      setVoice("listening");
    } catch {
      recRef.current = null;
      setVoice("idle");
      setError(
        "Could not start voice input. Please try again or type your report.",
      );
    }
  }

  function stop() {
    if (!recRef.current) {
      setVoice("idle");
      return;
    }

    setVoice("stopping");
    recRef.current.stop();
  }

  function analyse() {
    if (!transcript.trim()) {
      setError("Please speak or type what the problem is first.");
      return;
    }

    setError("");
    setDraft(extractReport(transcript));
  }

  async function confirm() {
    if (!draft || saving) return;

    if (!draft.machine.trim()) {
      toast.error("Please enter the machine number.");
      return;
    }

    if (!draft.problem.trim()) {
      toast.error("Please describe the problem.");
      return;
    }

    setSaving(true);

    try {
      const result = await fetchReports();

      await addReport(result.mode, {
        transcript,
        machine: draft.machine.trim().toUpperCase(),
        problem: draft.problem.trim(),
        category: draft.category,
        urgency: draft.urgency,
        language:
          LANGS.find((l) => l.code === lang)?.label ?? lang,
        reporter: reporter.trim() || "Anonymous",
      });

      localStorage.setItem("kaamsathi.reporter", reporter.trim());

      if (result.mode === "cloud") {
        toast.success("Report saved to shared cloud storage.");
      } else {
        toast.success(
          "Report saved in this browser. Cloud storage is unavailable.",
        );
      }

      setSaved(true);
      setDraft(null);
      setTranscript("");
      setInterim("");
      setHeard(null);
    } catch (err) {
      console.error("[KaamSathi] Report save failed:", err);
      toast.error("Could not save the report. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const btn =
    "inline-flex min-h-14 items-center justify-center gap-2 rounded-xl px-6 text-lg font-bold transition-colors disabled:opacity-50";

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-primary">
        Report a problem
      </h1>

      <p className="mt-1 text-muted-foreground">
        Tap the microphone and say the machine number and what is wrong.
      </p>

      {saved && (
        <div
          role="status"
          className="mt-5 flex items-center gap-3 rounded-xl border border-success bg-success/10 p-4 font-semibold text-foreground"
        >
          <CheckCircle2 className="h-6 w-6 shrink-0 text-success" />
          Your report was saved successfully.
        </div>
      )}

      <div
        className="mt-6 flex flex-wrap gap-2"
        role="group"
        aria-label="Language"
      >
        {LANGS.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            disabled={listening}
            className={`min-h-12 rounded-xl border-2 px-4 text-base font-semibold ${
              lang === l.code
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border bg-card p-6 text-center shadow-sm">
        {supported === false ? (
          <div className="flex items-start gap-3 rounded-xl bg-warning/20 p-4 text-left">
            <MicOff className="h-6 w-6 shrink-0" />
            <p>
              <strong>Voice input is not available in this browser.</strong>{" "}
              Please type your report below. Voice works best in Google Chrome
              or Microsoft Edge.
            </p>
          </div>
        ) : (
          <>
            <button
              onClick={listening ? stop : start}
              disabled={
                supported === null ||
                voice === "starting" ||
                voice === "stopping"
              }
              aria-label={listening ? "Stop recording" : "Start recording"}
              className={`mx-auto grid h-40 w-40 sm:h-48 sm:w-48 place-items-center rounded-full shadow-xl transition-transform active:scale-95 disabled:opacity-70 ${
                listening
                  ? "animate-pulse bg-destructive text-destructive-foreground"
                  : "bg-accent text-accent-foreground hover:scale-105"
              }`}
            >
              {listening ? (
                <MicOff className="h-20 w-20" />
              ) : (
                <Mic className="h-20 w-20" />
              )}
            </button>

            <p className="mt-4 text-lg font-semibold" aria-live="polite">
              {voice === "starting"
                ? "Starting microphone…"
                : voice === "listening"
                  ? `Listening in ${LANGS.find((l) => l.code === lang)?.label ?? lang}… speak now`
                  : voice === "stopping"
                    ? "Stopping…"
                    : "Press Start Listening and speak"}
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => void start()}
                disabled={supported === null || listening}
                className="inline-flex min-h-14 items-center gap-2 rounded-xl bg-accent px-6 text-lg font-bold text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
              >
                <Mic className="h-5 w-5" />
                Start Listening
              </button>

              <button
                onClick={stop}
                disabled={voice !== "listening"}
                className="inline-flex min-h-14 items-center gap-2 rounded-xl border-2 border-border bg-card px-6 text-lg font-bold hover:bg-muted disabled:opacity-50"
              >
                <MicOff className="h-5 w-5" />
                Stop Listening
              </button>
            </div>

            {heard && !listening && (
              <p
                role="status"
                className="mt-4 flex items-center justify-center gap-2 font-semibold text-success"
              >
                <CheckCircle2 className="h-5 w-5" />
                Voice recognized and added to the text box below.
              </p>
            )}

            <p className="mt-3 text-xs text-muted-foreground">
              Uses your browser's built-in speech recognition (needs internet).
              Hindi, Kannada and Marathi work only where your browser supports
              them. You can always type instead.
            </p>
          </>
        )}
      </section>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-3 rounded-xl border border-destructive bg-destructive/10 p-4"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
          <span>{error}</span>
        </div>
      )}

      <section className="mt-6">
        <label
          htmlFor="transcript"
          className="flex items-center gap-2 font-bold"
        >
          <Keyboard className="h-5 w-5" />
          What you said (you can type or edit)
        </label>

        <textarea
          id="transcript"
          rows={4}
          value={
            transcript + (interim ? (transcript ? " " : "") + interim : "")
          }
          onChange={(e) => {
            setTranscript(e.target.value);
            setInterim("");
          }}
          placeholder="e.g. Machine 12 oil leak, press stopped"
          className="mt-2 w-full rounded-xl border-2 border-input bg-card p-4 text-lg focus:border-ring focus:outline-hidden"
        />

        <div className="mt-3 flex flex-wrap gap-3">
          <button
            onClick={analyse}
            className={`${btn} bg-primary text-primary-foreground hover:bg-primary/90`}
          >
            Prepare report
          </button>

          <button
            onClick={() => {
              setTranscript("");
              setDraft(null);
              setError("");
              setInterim("");
            }}
            className={`${btn} border-2 border-border bg-card hover:bg-muted`}
          >
            <RotateCcw className="h-5 w-5" />
            Clear
          </button>
        </div>
      </section>

      {draft && (
        <section className="mt-8 rounded-2xl border-2 border-primary bg-card p-5 shadow-md sm:p-6">
          <h2 className="text-xl font-extrabold text-primary">
            Check your report
          </h2>

          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4 shrink-0" />
            Filled in automatically using keyword rules (no AI service).
            Please correct anything wrong.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Machine number">
              <input
                value={draft.machine}
                onChange={(e) =>
                  setDraft({ ...draft, machine: e.target.value })
                }
                placeholder="e.g. M-12"
                className={inputCls}
              />
            </Field>

            <Field label="Your name (optional)">
              <input
                value={reporter}
                onChange={(e) => setReporter(e.target.value)}
                placeholder="e.g. Ramesh"
                className={inputCls}
              />
            </Field>

            <Field label="Category">
              <Choice
                options={["Maintenance", "Quality"]}
                value={draft.category}
                onChange={(v) =>
                  setDraft({ ...draft, category: v as Category })
                }
              />
            </Field>

            <Field label="Urgency">
              <Choice
                options={["Low", "Medium", "High", "Critical"]}
                value={draft.urgency}
                onChange={(v) =>
                  setDraft({ ...draft, urgency: v as Urgency })
                }
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Problem description">
                <textarea
                  rows={3}
                  value={draft.problem}
                  onChange={(e) =>
                    setDraft({ ...draft, problem: e.target.value })
                  }
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => void confirm()}
              disabled={saving}
              className={`${btn} bg-accent text-accent-foreground hover:bg-accent/90`}
            >
              <CheckCircle2 className="h-6 w-6" />
              {saving ? "Sending..." : "Confirm & send"}
            </button>

            <button
              onClick={() => setDraft(null)}
              disabled={saving}
              className={`${btn} border-2 border-border bg-card hover:bg-muted`}
            >
              Cancel
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

const inputCls =
  "w-full rounded-xl border-2 border-input bg-background p-3 text-lg focus:border-ring focus:outline-hidden";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-semibold">{label}</span>
      {children}
    </label>
  );
}

function Choice({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          type="button"
          key={o}
          onClick={() => onChange(o)}
          aria-pressed={value === o}
          className={`min-h-12 rounded-lg border-2 px-3 font-semibold ${
            value === o
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:border-primary"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

    
