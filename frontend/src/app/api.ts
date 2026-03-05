export interface ApiQuestion {
  question_id: number;
  axis_id: number;
  ordinal: number;
  context: string;
  statement: string;
  scale: {
    min: number;
    max: number;
    neutral: number;
  };
}

export interface AxisScores {
  economy: number;
  liberties: number;
  culture: number;
  global: number;
  tech: number;
  ecology: number;
}

export interface AnalyticsAxisMean {
  code: string;
  label: string;
  mean: number;
}

export interface AnalyticsTimeseriesPoint {
  day: string;
  count: number;
  cumulative: number;
}

export interface AnalyticsAxisDispersion {
  code: string;
  label: string;
  dispersion: number;
}

export interface AnalyticsOverview {
  total_profiles: number;
  axis_means: AnalyticsAxisMean[];
  timeseries: AnalyticsTimeseriesPoint[];
  consensus: {
    axes: AnalyticsAxisDispersion[];
    most_consensus: AnalyticsAxisDispersion;
    most_divided: AnalyticsAxisDispersion;
  };
  top_combinations: Array<{
    signature: string;
    count: number;
    share_pct: number;
  }>;
  generated_at: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = typeof body.error === "string" ? body.error : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function fetchQuestions() {
  return apiRequest<ApiQuestion[]>("/api/questions");
}

export function createSession(payload?: { ip_hash?: string; user_agent?: string }) {
  return apiRequest<{ session_id: string }>("/api/session", {
    method: "POST",
    body: JSON.stringify({
      ip_hash: payload?.ip_hash ?? null,
      user_agent: payload?.user_agent ?? navigator.userAgent,
    }),
  });
}

export function saveAnswer(payload: { session_id: string; question_id: number; value: number }) {
  return apiRequest<{ ok: boolean }>("/api/answer", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function finishSession(payload: { session_id: string }) {
  return apiRequest<AxisScores>("/api/finish", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function sendFeedback(payload: { session_id?: string | null; message: string }) {
  return apiRequest<{ ok: boolean }>("/api/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchAnalyticsOverview() {
  return apiRequest<AnalyticsOverview>("/api/analytics/overview");
}

export interface AiNarrative {
  title: string;
  paragraphs: string[];
  source: "ollama" | "fallback";
}

export interface AiAnalysisResponse {
  ok: boolean;
  session_id: string;
  model: string;
  scores: AxisScores;
  controlled_context: {
    rules: {
      language: string;
      political_tone: string;
      style: string;
      forbidden: string[];
    };
    axis_scores: Array<{
      code: string;
      label: string;
      score: number;
      direction_label: string;
    }>;
    strongest_signals: Array<{
      axis_code: string;
      axis_label: string;
      normalized_value: number;
      statement: string;
      context: string;
    }>;
  };
  analysis: AiNarrative;
  warning?: string;
}

export function fetchAiAnalysis(payload: { session_id: string }) {
  return apiRequest<AiAnalysisResponse>("/api/ai-analysis", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
