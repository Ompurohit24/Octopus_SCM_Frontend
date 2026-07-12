// CSV import/export helpers.
export function toCSV(rows: Record<string, unknown>[], columns?: string[]): string {
  if (!rows.length) return "";
  const keys = columns ?? Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const escape = (v: unknown) => {
    if (v == null) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const head = keys.join(",");
  const body = rows.map((r) => keys.map((k) => escape(r[k])).join(",")).join("\n");
  return `${head}\n${body}`;
}

export function downloadCSV(filename: string, csv: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const splitLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') {
          inQ = false;
        } else {
          cur += ch;
        }
      } else {
        if (ch === ",") {
          out.push(cur);
          cur = "";
        } else if (ch === '"') {
          inQ = true;
        } else {
          cur += ch;
        }
      }
    }
    out.push(cur);
    return out;
  };
  const headers = splitLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = cells[i] ?? ""));
    return row;
  });
}

export async function pickAndReadCSV(): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,text/csv";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve([]);
        return;
      }
      try {
        const text = await file.text();
        resolve(parseCSV(text));
      } catch (e) {
        reject(e);
      }
    };
    input.click();
  });
}

export function formatINR(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n >= 10_000_000) return `₹ ${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `₹ ${(n / 100_000).toFixed(2)} L`;
  return `₹ ${n.toLocaleString("en-IN")}`;
}

export function formatDate(s: string | undefined | null): string {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
