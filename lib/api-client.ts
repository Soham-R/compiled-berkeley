/**
 * API client to communicate with the Wren FastAPI backend.
 */

import type { ChildProfile } from "./types/profile";
import type { TelemetryBatch } from "./types/telemetry";
import type { PassageRequest, PassageResponse } from "./types/tutor";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new Error(`API error ${res.status}: ${errorText}`);
  }

  return res.json() as Promise<T>;
}

export const wrenApi = {
  checkHealth: () => fetchJson<{ status: string; version: string; service: string }>("/health"),

  getProfile: (childId: string) => fetchJson<ChildProfile>(`/api/v1/profile/${childId}`),

  saveProfile: (profile: ChildProfile) =>
    fetchJson<ChildProfile>("/api/v1/profile", {
      method: "POST",
      body: JSON.stringify(profile),
    }),

  sendTelemetry: (batch: TelemetryBatch) =>
    fetchJson<{ received: number; status: string }>("/api/v1/telemetry", {
      method: "POST",
      body: JSON.stringify(batch),
    }),

  getNextPassage: (request: PassageRequest) =>
    fetchJson<PassageResponse>("/api/v1/tutor/next-passage", {
      method: "POST",
      body: JSON.stringify(request),
    }),
};
