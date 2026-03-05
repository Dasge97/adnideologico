import { useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Copy, Download, Share2, Users } from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { AxisScores } from "../api";
import { AXES, buildCombinationCode, buildShareCopy, describeAxisValue } from "../profile";

interface ShareScreenProps {
  results: AxisScores;
  onFeedback: () => void;
  onCollective: () => void;
}

function drawShareCard(title: string, summary: string, code: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, "#faf5ff");
  gradient.addColorStop(1, "#f3f4f6");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#5b21b6";
  ctx.fillRect(0, 0, 1200, 18);

  ctx.fillStyle = "#111827";
  ctx.font = "700 58px Arial";
  ctx.fillText("ADN Ideologico", 72, 130);

  ctx.fillStyle = "#374151";
  ctx.font = "500 30px Arial";
  ctx.fillText(title, 72, 190);

  ctx.fillStyle = "#1f2937";
  ctx.font = "400 28px Arial";

  const words = summary.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > 1040) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  lines.slice(0, 5).forEach((line, index) => {
    ctx.fillText(line, 72, 270 + index * 44);
  });

  ctx.fillStyle = "#4b5563";
  ctx.font = "500 24px Arial";
  ctx.fillText(`Combinacion: ${code}`, 72, 540);

  ctx.fillStyle = "#6b7280";
  ctx.font = "400 20px Arial";
  ctx.fillText("No es una etiqueta. Es un mapa para reflexionar.", 72, 585);

  return canvas;
}

export function ShareScreen({ results, onFeedback, onCollective }: ShareScreenProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const chartData = AXES.map((axis) => ({
    dimension: axis.label,
    value: results[axis.key],
  }));

  const shareUrl = `${window.location.origin}${window.location.pathname}`;
  const shareText = useMemo(() => buildShareCopy(results), [results]);
  const combinationCode = useMemo(() => buildCombinationCode(results), [results]);

  const topHighlights = useMemo(() => {
    return AXES.map((axis) => ({ axis, value: results[axis.key] }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 2)
      .map(({ axis, value }) => `${axis.label}: ${describeAxisValue(axis, value).sideLabel}`);
  }, [results]);

  const handleShareNetwork = (platform: "whatsapp" | "twitter") => {
    if (platform === "whatsapp") {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }

    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch (error) {
      console.error("Error copying share text", error);
      setCopyState("failed");
      window.setTimeout(() => setCopyState("idle"), 2000);
    }
  };

  const handleDownloadCard = async () => {
    const cardTitle = `Mis ejes mas marcados: ${topHighlights.join(" | ")}`;
    const canvas = drawShareCard(cardTitle, shareText, combinationCode);
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "adn-ideologico-share-card.png";
    link.click();
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl text-gray-900 text-center mb-4">Comparte tu mapa ideologico</h1>
          <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
            Comparte tu resultado para abrir conversacion sobre valores, no para encasillarte.
          </p>

          <div className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-2xl p-6 md:p-8 mb-8 shadow-lg">
            <div className="text-center mb-4">
              <h2 className="text-2xl text-gray-900 mb-2">ADN Ideologico</h2>
              <p className="text-gray-600">{topHighlights.join(" | ")}</p>
            </div>

            <div className="w-full h-[280px] mb-4" role="img" aria-label="Vista previa del perfil para compartir">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData}>
                  <PolarGrid stroke="#d1d5db" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fill: "#4b5563", fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[-1, 1]} tick={false} />
                  <Radar dataKey="value" stroke="#7c3aed" fill="#a78bfa" fillOpacity={0.5} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <p className="text-sm text-gray-700">{shareText}</p>
            <p className="text-xs text-gray-500 mt-2">Combinacion: {combinationCode}</p>
          </div>

          <div className="space-y-3 mb-8">
            <Button
              onClick={() => handleShareNetwork("whatsapp")}
              variant="outline"
              size="lg"
              className="w-full border-gray-300 hover:bg-gray-50 justify-start"
            >
              <Share2 className="w-5 h-5 mr-3 text-green-600" />
              <span className="text-gray-900">Compartir en WhatsApp</span>
            </Button>

            <Button
              onClick={() => handleShareNetwork("twitter")}
              variant="outline"
              size="lg"
              className="w-full border-gray-300 hover:bg-gray-50 justify-start"
            >
              <Share2 className="w-5 h-5 mr-3 text-blue-500" />
              <span className="text-gray-900">Compartir en X / Twitter</span>
            </Button>

            <Button
              onClick={handleCopy}
              variant="outline"
              size="lg"
              className="w-full border-gray-300 hover:bg-gray-50 justify-start"
            >
              <Copy className="w-5 h-5 mr-3 text-purple-600" />
              <span className="text-gray-900">
                {copyState === "copied"
                  ? "Texto copiado"
                  : copyState === "failed"
                    ? "No se pudo copiar"
                    : "Copiar texto para compartir"}
              </span>
            </Button>

            <Button
              onClick={handleDownloadCard}
              variant="outline"
              size="lg"
              className="w-full border-gray-300 hover:bg-gray-50 justify-start"
            >
              <Download className="w-5 h-5 mr-3 text-gray-700" />
              <span className="text-gray-900">Descargar share card (.png)</span>
            </Button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-900">
              Tu perfil es una mezcla de posiciones. Compartelo para conversar, no para etiquetar personas.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={onCollective} variant="outline" className="border-gray-300 text-gray-700">
              <Users className="w-4 h-4 mr-2" />
              Ver datos colectivos
            </Button>
            <Button onClick={onFeedback} variant="ghost" className="text-gray-600 hover:text-purple-700">
              Cuentanos si te esperabas este resultado
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
