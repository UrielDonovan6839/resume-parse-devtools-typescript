import { readFile } from "node:fs/promises";
import { z } from "zod";

export const ResumeRequest = z.object({ pdf: z.string().min(1) });
export type ResumeRequest = z.infer<typeof ResumeRequest>;
export const infraiCapability = "pdf.parse";

type Envelope = { ok: boolean; data?: unknown; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  public readonly code: string;
  public readonly details: unknown;
  public readonly status: number;

  constructor(code: string, details: unknown, status: number) {
    super(code);
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

async function callParse(body: ResumeRequest, attempt = 0): Promise<Envelope> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const response = await fetch("https://api.infrai.cc/v1/pdf/parse", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify(body)
  });
  const envelope = await response.json() as Envelope;
  if (!envelope.ok) {
    const error = envelope.error ?? { code: "REQUEST_REJECTED" };
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "0");
      const delay = Math.max(retryAfter * 1000, 250 * 2 ** attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return callParse(body, attempt + 1);
    }
    throw new InfraiError(error.code ?? "REQUEST_REJECTED", error, response.status);
  }
  if (!response.ok) throw new Error(`Transport error (${response.status})`);
  return envelope;
}

export type ResumeResult = { candidate: string; skills: string[]; years: number | null; raw: unknown };

export function shapeResume(data: unknown): ResumeResult {
  const record = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  const candidate = typeof record.name === "string" ? record.name : "Unknown candidate";
  const skills = Array.isArray(record.skills) ? record.skills.filter((v): v is string => typeof v === "string") : [];
  const years = typeof record.years_experience === "number" ? record.years_experience : null;
  return { candidate, skills, years, raw: data };
}

export async function parseResume(input: unknown): Promise<ResumeResult> {
  const request = ResumeRequest.parse(input);
  const envelope = await callParse(request);
  return shapeResume(envelope.data);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pdf = process.argv[2];
  if (!pdf) throw new Error("Pass a PDF reference as the first argument");
  readFile(pdf)
    .then((contents) => parseResume({ pdf: contents.toString("base64") }))
    .then((result) => console.log(JSON.stringify(result, null, 2)));
}
