export type Category = "Maintenance" | "Quality";
export type Urgency = "Low" | "Medium" | "High" | "Critical";
export type Status = "Pending" | "In Progress" | "Resolved";

export interface Report {
  id: string;
  createdAt: string;
  transcript: string;
  machine: string;
  problem: string;
  category: Category;
  urgency: Urgency;
  status: Status;
  language: string;
  reporter: string;
}

export interface Extracted {
  machine: string;
  problem: string;
  category: Category;
  urgency: Urgency;
}

const QUALITY_WORDS = [
  "damage", "damaged", "defect", "scratch", "crack", "broken product", "reject", "dent",
  "quality", "wrong size", "misprint", "packing", "packaging", "finish", "colour", "color",
  "खराब माल", "दोष", "टूटा माल", "ಗುಣಮಟ್ಟ", "ದೋಷ", "दोषपूर्ण", "गुणवत्ता",
];
const CRITICAL_WORDS = ["fire", "smoke", "spark", "shock", "injury", "accident", "आग", "धुआं", "धूर", "ಬೆಂಕಿ", "ಹೊಗೆ"];
const HIGH_WORDS = [
  "urgent", "stopped", "not working", "breakdown", "leak", "jam", "emergency", "immediately",
  "बंद", "तुरंत", "ಬಂದ್", "ತಕ್ಷಣ", "लगेच", "गळती",
];
const LOW_WORDS = ["minor", "small", "slight", "later", "थोड़ा", "ಸ್ವಲ್ಪ", "थोडा"];

const NUMBER_WORDS: Record<string, string> = {
  one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
  eleven: "11", twelve: "12", fifteen: "15", twenty: "20",
};

function has(text: string, words: string[]) {
  return words.some((w) => text.includes(w));
}

/** Rule-based extraction (no AI service). Works on English keywords plus common Hindi/Kannada/Marathi words. */
export function extractReport(raw: string): Extracted {
  const text = raw.trim();
  const lower = text.toLowerCase();

  let machine = "";
  const m =
    lower.match(/\b(?:machine|mc|m\/c|press|lathe|cnc|line|unit|मशीन|ಯಂತ್ರ|ಮೆಷಿನ್)\s*(?:number|no\.?|#|नंबर|ನಂಬರ್)?\s*[-:]?\s*([a-z]{0,3}[-\s]?\d+[a-z]?)/i) ??
    lower.match(/\b([a-z]{1,4}-\d{1,4})\b/i);
  if (m?.[1]) {
    machine = m[1].toUpperCase().replace(/\s+/g, "-");
  } else {
    const w = lower.match(/\bmachine\s+(?:number\s+)?([a-z]+)\b/);
    const n = w?.[1] ? NUMBER_WORDS[w[1]] : undefined;
    if (n) machine = n;
  }
  if (machine && /^\d+[A-Z]?$/.test(machine)) machine = `M-${machine}`;

  const category: Category = has(lower, QUALITY_WORDS) ? "Quality" : "Maintenance";

  let urgency: Urgency = "Medium";
  if (has(lower, CRITICAL_WORDS)) urgency = "Critical";
  else if (has(lower, HIGH_WORDS)) urgency = "High";
  else if (has(lower, LOW_WORDS)) urgency = "Low";

  const problem = text.length > 0 ? text.charAt(0).toUpperCase() + text.slice(1) : "";
  return { machine, problem, category, urgency };
}

const KEY = "kaamsathi.reports.v1";

export const SAMPLE_REPORTS: Report[] = [
  { id: "s1", createdAt: "2026-11-26T04:15:00.000Z", transcript: "Machine M-12 hydraulic oil leak, press stopped", machine: "M-12", problem: "Hydraulic oil leak, press stopped", category: "Maintenance", urgency: "High", status: "In Progress", language: "English", reporter: "Ramesh K." },
  { id: "s2", createdAt: "2026-11-26T06:40:00.000Z", transcript: "Line L-3 cartons damaged during packing, around 40 pieces", machine: "L-3", problem: "Cartons damaged during packing, around 40 pieces", category: "Quality", urgency: "Medium", status: "Pending", language: "English", reporter: "Priya S." },
  { id: "s3", createdAt: "2026-11-25T09:05:00.000Z", transcript: "मशीन 7 से धुआं निकल रहा है", machine: "M-7", problem: "मशीन 7 से धुआं निकल रहा है (smoke from machine 7)", category: "Maintenance", urgency: "Critical", status: "Resolved", language: "Hindi", reporter: "Suresh P." },
  { id: "s4", createdAt: "2026-11-25T11:30:00.000Z", transcript: "CNC-4 parts have small scratches on finish", machine: "CNC-4", problem: "Parts have small scratches on finish", category: "Quality", urgency: "Low", status: "Pending", language: "English", reporter: "Anita M." },
];

export function loadReports(): Report[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) {
      localStorage.setItem(KEY, JSON.stringify(SAMPLE_REPORTS));
      return [...SAMPLE_REPORTS];
    }
    return JSON.parse(raw) as Report[];
  } catch {
    return [...SAMPLE_REPORTS];
  }
}

export function saveReports(list: Report[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function resetToSamples() {
  saveReports(SAMPLE_REPORTS);
  return [...SAMPLE_REPORTS];
}
