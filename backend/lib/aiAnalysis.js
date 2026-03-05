const db = require("../db");
const { toAxisScores } = require("./scoring");

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value) {
  return UUID_REGEX.test(String(value || ""));
}

function clamp(value) {
  return Math.max(-1, Math.min(1, Number(value || 0)));
}

function directionLabel(value, leftLabel, rightLabel) {
  const numeric = clamp(value);
  if (Math.abs(numeric) < 0.2) return "equilibrio";
  return numeric > 0 ? rightLabel : leftLabel;
}

function buildContextualTitle(context) {
  const topAxes = [...context.axis_scores]
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
    .slice(0, 2);

  if (topAxes.length < 2) {
    return "Perfil reflexivo y equilibrado";
  }

  return `${topAxes[0].label} y ${topAxes[1].label} en balance`;
}

function buildFallbackAnalysis(context) {
  const topAxes = [...context.axis_scores]
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
    .slice(0, 2);
  const primary = topAxes[0];
  const secondary = topAxes[1];

  const paragraphOne = primary && secondary
    ? `Tu perfil muestra una combinacion poco comun: en ${primary.label.toLowerCase()} destacas hacia ${primary.direction_label}, y en ${secondary.label.toLowerCase()} aparece una inclinacion hacia ${secondary.direction_label}. Esto sugiere criterio propio y una forma de pensar que va mas alla de etiquetas cerradas.`
    : "Tu perfil muestra matices reales y una forma de pensar politica propia, con prioridades que no encajan en etiquetas cerradas.";

  const paragraphTwo =
    "Lo valioso de este resultado es que refleja como decides ante dilemas concretos, no como encajas en un bloque fijo. Tu mapa indica capacidad para combinar principios distintos con coherencia personal.";

  return {
    title: buildContextualTitle(context),
    paragraphs: [paragraphOne, paragraphTwo],
    source: "fallback",
  };
}

async function loadAxisScoresRows(sessionId) {
  const { rows } = await db.query(
    `SELECT ax.code,
            ax.name,
            ax.left_label,
            ax.right_label,
            score_data.axis_score
     FROM axes ax
     LEFT JOIN (
       SELECT q.axis_id,
              SUM(
                (CASE WHEN q.is_reversed THEN -1 ELSE 1 END)
                * ((a.value - 4)::numeric / 3)
                * q.weight
              ) / NULLIF(SUM(q.weight), 0) AS axis_score
       FROM answers a
       INNER JOIN questions q ON q.question_id = a.question_id
       WHERE a.session_id = $1
       GROUP BY q.axis_id
     ) AS score_data ON score_data.axis_id = ax.axis_id
     ORDER BY ax.axis_id`,
    [sessionId]
  );

  return rows.map((row) => ({
    code: row.code,
    label: row.name,
    left_label: row.left_label,
    right_label: row.right_label,
    score: row.axis_score === null ? 0 : Number(row.axis_score),
  }));
}

async function loadStrongSignals(sessionId, limit = 6) {
  const { rows } = await db.query(
    `SELECT
       ax.code,
       ax.name AS axis_label,
       q.statement,
       q.context,
       ((CASE WHEN q.is_reversed THEN -1 ELSE 1 END)
         * ((a.value - 4)::numeric / 3)
       )::float8 AS normalized_value,
       ABS((CASE WHEN q.is_reversed THEN -1 ELSE 1 END)
         * ((a.value - 4)::numeric / 3)
       )::float8 AS abs_value
     FROM answers a
     INNER JOIN questions q ON q.question_id = a.question_id
     INNER JOIN axes ax ON ax.axis_id = q.axis_id
     WHERE a.session_id = $1
     ORDER BY abs_value DESC, q.ordinal ASC
     LIMIT $2`,
    [sessionId, limit]
  );

  return rows.map((row) => ({
    axis_code: row.code,
    axis_label: row.axis_label,
    normalized_value: Number(row.normalized_value),
    statement: row.statement,
    context: row.context,
  }));
}

function buildControlledContext(axisScores, strongSignals) {
  return {
    rules: {
      language: "es",
      political_tone: "neutral, reflexivo, no partidista",
      style: "humano y claro",
      forbidden: [
        "recomendar partido o voto",
        "etiquetar al usuario como bueno/malo",
        "afirmaciones absolutas sin matiz",
      ],
    },
    axis_scores: axisScores.map((axis) => ({
      code: axis.code,
      label: axis.label,
      score: Number(clamp(axis.score).toFixed(3)),
      direction_label: directionLabel(axis.score, axis.left_label, axis.right_label),
    })),
    strongest_signals: strongSignals,
  };
}

function buildPrompt(controlledContext) {
  return [
    "Eres un analista de perfil psicologico aplicado a respuestas politicas. Responde SOLO en espanol y SOLO con JSON valido.",
    "Objetivo: interpretar patrones de respuesta del usuario como un perfil psicologico, no como ensayo politico.",
    "Formato de salida OBLIGATORIO (exacto):",
    '{"title":"string","paragraph1":"string","paragraph2":"string"}',
    "Reglas de estilo OBLIGATORIAS:",
    "- Debes hablar de las respuestas del usuario: usa expresiones como 'Tus respuestas sugieren', 'Tu perfil indica', 'Parece que valoras', 'Se observa una inclinacion hacia'.",
    "- Usa lenguaje probabilistico: 'tiendes a', 'parece que', 'sugiere', 'indica', 'muestra una inclinacion', 'probablemente valoras'.",
    "- Evita afirmaciones absolutas.",
    "- Prioriza balances y tensiones internas: equilibrio entre mercado y regulacion, libertad y seguridad, apertura con cautela, pragmatismo frente a rigidez.",
    "- NO hagas predica ideologica. NO expliques teorias politicas generales. NO suenes a manifiesto.",
    "- NO empieces con frases generales tipo: 'En el mundo actual', 'La economia es', 'La politica moderna', 'En las sociedades actuales'.",
    "Estructura de contenido:",
    "- title: 4 a 7 palabras, maximo 60 caracteres, descriptivo del patron, no generico.",
    "- paragraph1: interpretacion de dimension economica/estructural basada en respuestas.",
    "- paragraph2: interpretacion de valores, libertades o cultura basada en respuestas.",
    "- Ambos parrafos deben tener el MISMO estilo narrativo y la misma voz (segunda persona singular).",
    "- Ambos parrafos deben empezar con formula de interpretacion: 'Tus respuestas...', 'Tu perfil...', 'Parece que...', o 'Se observa...'.",
    "- Ambos parrafos deben tener longitud y densidad similares, sin que uno sea tecnico y el otro literario.",
    "Limites:",
    "- paragraph1: entre 60 y 90 palabras.",
    "- paragraph2: entre 60 y 90 palabras.",
    "- Sin listas, sin secciones, sin markdown, sin texto fuera del JSON.",
    "Contexto de entrada:",
    JSON.stringify(controlledContext),
  ].join("\n");
}

function buildRetryPrompt(controlledContext) {
  return [
    "Devuelve SOLO JSON VALIDO en espanol.",
    "Schema exacto:",
    '{"title":"string","paragraph1":"string","paragraph2":"string"}',
    "Reglas estrictas:",
    "- Estilo psicologico, no ensayo politico.",
    "- Referencia directa a respuestas del usuario.",
    "- Lenguaje probabilistico: tiendes a, parece que, sugiere.",
    "- paragraph1 y paragraph2 con mismo estilo y voz narrativa.",
    "- title 4-7 palabras, maximo 60 caracteres, no generico.",
    "- paragraph1 y paragraph2 entre 60 y 90 palabras.",
    "- Sin markdown, sin listas, sin texto extra.",
    "Contexto:",
    JSON.stringify(controlledContext),
  ].join("\n");
}

function sanitizeAnalysis(parsed) {
  const normalizeTitle = (value) => {
    if (typeof value !== "string") return "Perfil reflexivo y equilibrado";
    return value.trim().slice(0, 60) || "Perfil reflexivo y equilibrado";
  };
  const limitWords = (text, maxWords = 90) => {
    if (typeof text !== "string") return "";
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return words.join(" ");
    return `${words.slice(0, maxWords).join(" ")}...`;
  };

  const safeParagraphs = [];
  if (typeof parsed.paragraph1 === "string") safeParagraphs.push(parsed.paragraph1);
  if (typeof parsed.paragraph2 === "string") safeParagraphs.push(parsed.paragraph2);
  if (Array.isArray(parsed.paragraphs)) {
    safeParagraphs.push(...parsed.paragraphs.filter((item) => typeof item === "string").slice(0, 2));
  }
  const fallbackParagraphs = [];
  if (typeof parsed.summary === "string") fallbackParagraphs.push(parsed.summary);
  if (typeof parsed.disclaimer === "string") fallbackParagraphs.push(parsed.disclaimer);
  const paragraphs = (safeParagraphs.length >= 2 ? safeParagraphs : fallbackParagraphs).slice(0, 2);

  return {
    title: normalizeTitle(parsed.title),
    paragraphs:
      paragraphs.length === 2
        ? paragraphs.map((item) => limitWords(item, 90))
        : [
            "Tu perfil combina prioridades politicas con matices que no suelen verse juntos en etiquetas clasicas.",
            "Este resultado busca ayudarte a entender como ponderas valores en contextos reales, sin encasillarte.",
          ],
    source: "ollama",
  };
}

function parseOllamaJson(rawText) {
  if (typeof rawText !== "string") {
    throw new Error("Invalid Ollama response payload");
  }

  const direct = rawText.trim();
  try {
    return JSON.parse(direct);
  } catch (_error) {
    // keep trying
  }

  const withoutFences = direct.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(withoutFences);
  } catch (_error) {
    // keep trying
  }

  const firstBrace = withoutFences.indexOf("{");
  const lastBrace = withoutFences.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = withoutFences.slice(firstBrace, lastBrace + 1);
    return JSON.parse(candidate);
  }

  return JSON.parse(withoutFences);
}

function isJsonParseError(error) {
  return Boolean(error && typeof error.message === "string" && /JSON|Unexpected|Unterminated|property name/i.test(error.message));
}

async function callOllama(prompt, options = {}) {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://ollama:11434";
  const model = process.env.OLLAMA_MODEL || "qwen2.5:7b-instruct";
  const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 120_000);
  const numPredict = Number(process.env.OLLAMA_NUM_PREDICT || 900);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format: "json",
        options: {
          temperature: typeof options.temperature === "number" ? options.temperature : 0.25,
          num_predict: typeof options.num_predict === "number" ? options.num_predict : numPredict,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Ollama error (${response.status}): ${body}`);
    }

    const payload = await response.json();
    if (!payload || typeof payload.response !== "string") {
      throw new Error("Invalid Ollama response payload");
    }

    return payload.response;
  } catch (error) {
    if (error && error.name === "AbortError") {
      throw new Error(`Ollama timeout after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function generateAiAnalysis(sessionId) {
  if (!isValidUuid(sessionId)) {
    const error = new Error("session_id must be a valid UUID");
    error.status = 400;
    throw error;
  }

  const sessionLookup = await db.query(
    `SELECT session_id, finished_at
     FROM sessions
     WHERE session_id = $1`,
    [sessionId]
  );

  if (sessionLookup.rowCount === 0) {
    const error = new Error("Session not found");
    error.status = 404;
    throw error;
  }

  if (!sessionLookup.rows[0].finished_at) {
    const error = new Error("Session must be finished before requesting AI analysis");
    error.status = 400;
    throw error;
  }

  const [axisScoresRows, strongSignals] = await Promise.all([
    loadAxisScoresRows(sessionId),
    loadStrongSignals(sessionId, 6),
  ]);

  const controlledContext = buildControlledContext(axisScoresRows, strongSignals);
  const baseScores = toAxisScores(
    axisScoresRows.map((axis) => ({
      code: axis.code,
      axis_score: axis.score,
    }))
  );

  try {
    const prompt = buildPrompt(controlledContext);
    const primaryRaw = await callOllama(prompt);
    let rawAnalysis;

    try {
      rawAnalysis = parseOllamaJson(primaryRaw);
    } catch (parseError) {
      if (!isJsonParseError(parseError)) {
        throw parseError;
      }

      const retryPrompt = buildRetryPrompt(controlledContext);
      const retryRaw = await callOllama(retryPrompt, { temperature: 0.15, num_predict: 650 });
      rawAnalysis = parseOllamaJson(retryRaw);
    }

    return {
      ok: true,
      session_id: sessionId,
      model: process.env.OLLAMA_MODEL || "qwen2.5:7b-instruct",
      scores: baseScores,
      controlled_context: controlledContext,
      analysis: sanitizeAnalysis(rawAnalysis),
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "warn",
        message: "ai_analysis_fallback",
        session_id: sessionId.slice(0, 8),
        reason: error.message,
      })
    );

    return {
      ok: true,
      session_id: sessionId,
      model: process.env.OLLAMA_MODEL || "qwen2.5:7b-instruct",
      scores: baseScores,
      controlled_context: controlledContext,
      analysis: buildFallbackAnalysis(controlledContext),
      warning: `AI provider unavailable: ${error.message}`,
    };
  }
}

module.exports = {
  generateAiAnalysis,
};
