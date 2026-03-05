import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, CircleCheckBig, LoaderCircle } from "lucide-react";
import { Button } from "./ui/button";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { fetchAiAnalysis, type AiNarrative, type AxisScores } from "../api";
import { AXES, buildCombinationCode, buildResultNarrativePack, describeAxisValue } from "../profile";

interface ResultsScreenProps {
  results: AxisScores;
  sessionId?: string | null;
  onShare: () => void;
  onRepeat: () => void;
  onCollective: () => void;
}

interface RadarTooltipPayload {
  payload: {
    dimension: string;
    value: number;
    leftLabel: string;
    rightLabel: string;
  };
}

const LOADING_PHASES = [
  "Procesando respuestas",
  "Calculando ejes ideologicos",
  "Interpretando matices",
  "Generando analisis narrativo",
];

function RadarTooltip({ active, payload }: { active?: boolean; payload?: RadarTooltipPayload[] }) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0].payload;
  const side = point.value >= 0 ? point.rightLabel : point.leftLabel;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-md">
      <p className="text-sm font-medium text-gray-900">{point.dimension}</p>
      <p className="text-xs text-gray-600">Puntaje: {point.value.toFixed(2)}</p>
      <p className="text-xs text-gray-600">Lectura: {Math.abs(point.value) < 0.2 ? "Equilibrio" : side}</p>
    </div>
  );
}

export function ResultsScreen({ results, sessionId, onShare, onRepeat, onCollective }: ResultsScreenProps) {
  const [aiNarrative, setAiNarrative] = useState<AiNarrative | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiFallbackNotice, setAiFallbackNotice] = useState<string | null>(null);
  const [showMethodology, setShowMethodology] = useState(false);
  const [activeLoadingPhase, setActiveLoadingPhase] = useState(2);
  const [revealedAxes, setRevealedAxes] = useState(2);

  const chartData = AXES.map((axis) => ({
    dimension: axis.label,
    value: results[axis.key],
    leftLabel: axis.leftLabel,
    rightLabel: axis.rightLabel,
  }));

  const narrativePack = buildResultNarrativePack(results);
  const combinationCode = buildCombinationCode(results);

  useEffect(() => {
    let mounted = true;

    async function loadAi() {
      if (!sessionId) {
        setAiNarrative(null);
        setAiError(null);
        setAiFallbackNotice(null);
        return;
      }

      try {
        setAiLoading(true);
        setAiError(null);
        const response = await fetchAiAnalysis({ session_id: sessionId });
        if (!mounted) return;
        setAiNarrative(response.analysis);
        setAiFallbackNotice(response.warning ? "La IA no esta disponible ahora. Mostrando analisis base." : null);
      } catch (_error) {
        if (!mounted) return;
        setAiError("No se pudo cargar el analisis IA. Mostrando analisis base.");
        setAiNarrative(null);
      } finally {
        if (mounted) setAiLoading(false);
      }
    }

    loadAi();

    return () => {
      mounted = false;
    };
  }, [sessionId]);

  const showingLoadingStage = Boolean(sessionId && aiLoading);

  useEffect(() => {
    if (!showingLoadingStage) {
      setActiveLoadingPhase(2);
      setRevealedAxes(2);
      return;
    }

    const phaseTimer = window.setInterval(() => {
      setActiveLoadingPhase((prev) => (prev < LOADING_PHASES.length - 1 ? prev + 1 : prev));
    }, 5500);

    const axisTimer = window.setInterval(() => {
      setRevealedAxes((prev) => (prev < AXES.length ? prev + 1 : prev));
    }, 2600);

    return () => {
      window.clearInterval(phaseTimer);
      window.clearInterval(axisTimer);
    };
  }, [showingLoadingStage]);

  const animatedChartData = chartData.map((point, index) => ({
    ...point,
    value: showingLoadingStage && index >= revealedAxes ? 0 : point.value,
  }));

  const title = aiNarrative?.title || narrativePack.profileName;
  const narrativeParagraphs =
    aiNarrative?.paragraphs?.length === 2
      ? aiNarrative.paragraphs
      : [narrativePack.profileSubtitle, narrativePack.opening];
  const reflectionQuestions = narrativePack.reflectionQuestions;

  return (
    <div className="min-h-screen">
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-6 py-10 md:py-14">
        <div className="rounded-3xl bg-white shadow-sm p-6 md:p-10">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <p className="text-xs uppercase tracking-[0.25em] text-purple-700">Analisis final personalizado</p>
            {sessionId && (
              <>
                {aiLoading && (
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-700">Generando analisis IA...</span>
                )}
                {!aiLoading && aiNarrative?.source === "ollama" && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">Analisis IA activo</span>
                )}
                {!aiLoading && aiNarrative?.source === "fallback" && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-800">Modo respaldo</span>
                )}
                {aiError && <span className="rounded-full bg-rose-100 px-3 py-1 text-xs text-rose-700">{aiError}</span>}
                {aiFallbackNotice && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-800">{aiFallbackNotice}</span>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
            <section
              className="xl:col-span-6 rounded-2xl bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 p-6 md:p-8 text-white"
              style={{
                backgroundSize: "170% 170%",
                animation: showingLoadingStage ? "gradientShift 9s ease-in-out infinite" : undefined,
              }}
            >
              {showingLoadingStage ? (
                <>
                  <h1 className="text-3xl md:text-4xl leading-tight mb-4 text-center">Construyendo tu mapa ideologico</h1>
                  <p className="text-purple-50 text-lg leading-relaxed mb-5 text-center">
                    Tu mapa base ya esta calculado. Ahora estamos interpretando los matices de tu perfil a partir de tus
                    respuestas.
                  </p>

                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <article className="rounded-xl bg-white/10 border border-white/15 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-purple-100">Respuestas</p>
                      <p className="text-2xl font-semibold leading-none mt-2">36</p>
                    </article>
                    <article className="rounded-xl bg-white/10 border border-white/15 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-purple-100">Ejes</p>
                      <p className="text-2xl font-semibold leading-none mt-2">6</p>
                    </article>
                    <article className="rounded-xl bg-white/10 border border-white/15 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-purple-100">Estado</p>
                      <p className="text-base font-semibold leading-none mt-3">Analizando...</p>
                    </article>
                  </div>

                  <article className="rounded-xl bg-white/10 border border-white/15 p-4">
                    <ul className="space-y-2">
                      {LOADING_PHASES.map((phase, index) => {
                        const isCompleted = index < activeLoadingPhase;
                        const isActive = index === activeLoadingPhase;
                        return (
                          <li key={phase} className="flex items-center gap-2 text-sm">
                            {isCompleted ? (
                              <CircleCheckBig className="h-4 w-4 text-emerald-200" />
                            ) : isActive ? (
                              <LoaderCircle className="h-4 w-4 animate-spin text-purple-100" />
                            ) : (
                              <span className="h-4 w-4 rounded-full border border-white/40" />
                            )}
                            <span className={isCompleted ? "text-emerald-100" : isActive ? "text-white" : "text-purple-200"}>
                              {phase}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </article>

                  <p className="text-sm text-purple-100 mt-4 text-center">
                    La IA esta comparando tu perfil con distintos patrones ideologicos para generar una interpretacion mas
                    precisa.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl md:text-4xl leading-tight mb-4">{title}</h1>
                  <p className="text-purple-50 text-lg leading-relaxed mb-5">{narrativeParagraphs[0]}</p>
                  <p className="text-purple-50 text-lg leading-relaxed">{narrativeParagraphs[1]}</p>
                </>
              )}
            </section>

            <aside className="xl:col-span-6 rounded-2xl border border-gray-200 bg-gray-50 p-5 md:p-6">
              <h2 className="text-xl text-gray-900 mb-2">Tu mapa en 6 dimensiones</h2>
              <p className="text-sm text-gray-600 mb-4">Esta forma muestra que tu perfil es una mezcla, no una etiqueta unica.</p>

              <div className="w-full h-[340px] md:h-[420px]" role="img" aria-label="Radar con seis ejes ideologicos y valores de -1 a 1">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={animatedChartData}>
                    <PolarGrid stroke="#d1d5db" />
                    <PolarAngleAxis
                      dataKey="dimension"
                      tick={({ x, y, payload, index }) =>
                        showingLoadingStage && index >= revealedAxes ? null : (
                          <text x={x} y={y} textAnchor="middle" fill="#374151" fontSize={12}>
                            {payload?.value}
                          </text>
                        )
                      }
                    />
                    <PolarRadiusAxis angle={90} domain={[-1, 1]} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                    <Tooltip content={<RadarTooltip />} />
                    <Radar
                      name="Tu perfil"
                      dataKey="value"
                      stroke="#7c3aed"
                      fill="#a78bfa"
                      fillOpacity={0.55}
                      strokeWidth={2}
                      isAnimationActive
                      animationDuration={1600}
                      animationEasing="ease-out"
                      className={showingLoadingStage ? "animate-pulse" : ""}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <p className="text-xs text-gray-500 mt-3">Vista recomendada para captura y compartir.</p>
            </aside>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={onShare}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8"
              disabled={showingLoadingStage}
            >
              Compartir mi perfil
            </Button>
            <Button
              onClick={onCollective}
              variant="outline"
              size="lg"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8"
              disabled={showingLoadingStage}
            >
              Ver fotografia colectiva
            </Button>
            <Button
              onClick={onRepeat}
              variant="outline"
              size="lg"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8"
              disabled={showingLoadingStage}
            >
              Repetir test
            </Button>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => setShowMethodology((value) => !value)}
              className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-purple-700"
            >
              {showMethodology ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Ver detalle de lectura y metodologia
            </button>

            {showMethodology && (
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <article className="rounded-xl border border-gray-200 p-4 bg-white">
                  <h3 className="text-gray-900 mb-2">Como leer los datos</h3>
                  <p className="text-sm text-gray-700 mb-3">
                    Cada eje va de -1 a +1. Valores cercanos a 0 indican equilibrio. Los extremos reflejan prioridad mas clara.
                  </p>
                  <p className="text-xs text-gray-500">Codigo de combinacion: {combinationCode}</p>
                  <div className="mt-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Preguntas de reflexion</p>
                    <ul className="space-y-1">
                      {reflectionQuestions.slice(0, 3).map((question) => (
                        <li key={question} className="text-sm text-gray-700">
                          {question}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>

                <article className="rounded-xl border border-gray-200 p-4 bg-white">
                  <h3 className="text-gray-900 mb-2">Leyenda de ejes</h3>
                  <ul className="space-y-2">
                    {AXES.map((axis) => {
                      const info = describeAxisValue(axis, results[axis.key]);
                      return (
                        <li key={axis.key} className="text-sm text-gray-700">
                          <strong>{axis.label}:</strong> {info.sideLabel} ({axis.leftLabel} / {axis.rightLabel})
                        </li>
                      );
                    })}
                  </ul>
                </article>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
