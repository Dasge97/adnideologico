import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchAnalyticsOverview, type AnalyticsOverview } from "../api";

interface CollectiveScreenProps {
  onBack: () => void;
}

const AXIS_COLORS = ["#7c3aed", "#2563eb", "#0f766e", "#9333ea", "#b45309", "#059669"];

export function CollectiveScreen({ onBack }: CollectiveScreenProps) {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchAnalyticsOverview();
        if (!mounted) return;
        setData(response);
      } catch (loadError) {
        console.error("Error loading analytics", loadError);
        if (!mounted) return;
        setError("No se pudieron cargar los datos colectivos. Intenta de nuevo en unos minutos.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const axisBars = useMemo(() => {
    if (!data) return [];
    return data.axis_means.map((axis) => ({
      axis: axis.label,
      mean: Number(axis.mean.toFixed(3)),
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-gray-600">Cargando fotografia colectiva...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-lg text-center">
          <p className="text-gray-700 mb-4">{error || "No hay datos disponibles todavia."}</p>
          <Button onClick={onBack} variant="outline">
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl text-gray-900 text-center mb-4">Fotografia colectiva</h1>
          <p className="text-center text-gray-600 max-w-3xl mx-auto mb-10">
            Vista agregada y anonima de como se posicionan las personas que ya completaron el test.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <article className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500">Perfiles completados</p>
              <p className="text-3xl text-gray-900 mt-2">{data.total_profiles}</p>
            </article>
            <article className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500">Mayor consenso</p>
              <p className="text-xl text-gray-900 mt-2">{data.consensus.most_consensus.label}</p>
              <p className="text-sm text-gray-600">Dispersion: {data.consensus.most_consensus.dispersion.toFixed(3)}</p>
            </article>
            <article className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500">Mayor division</p>
              <p className="text-xl text-gray-900 mt-2">{data.consensus.most_divided.label}</p>
              <p className="text-sm text-gray-600">Dispersion: {data.consensus.most_divided.dispersion.toFixed(3)}</p>
            </article>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <section className="rounded-xl border border-gray-200 p-4 md:p-6">
              <h2 className="text-xl text-gray-900 mb-4">Medias por eje</h2>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={axisBars}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="axis" tick={{ fill: "#4b5563", fontSize: 12 }} />
                    <YAxis domain={[-1, 1]} tick={{ fill: "#6b7280", fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="mean" radius={[6, 6, 0, 0]}>
                      {axisBars.map((entry, index) => (
                        <Cell key={`cell-${entry.axis}`} fill={AXIS_COLORS[index % AXIS_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 p-4 md:p-6">
              <h2 className="text-xl text-gray-900 mb-4">Evolucion temporal</h2>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.timeseries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" tick={{ fill: "#4b5563", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <section className="rounded-xl border border-gray-200 p-5">
              <h2 className="text-xl text-gray-900 mb-4">Consenso y division por eje</h2>
              <div className="space-y-3">
                {data.consensus.axes.map((axis) => (
                  <div key={axis.code} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                    <span className="text-gray-800">{axis.label}</span>
                    <span className="text-gray-600">Dispersion: {axis.dispersion.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 p-5">
              <h2 className="text-xl text-gray-900 mb-4">Combinaciones frecuentes</h2>
              <ol className="space-y-3">
                {data.top_combinations.map((combo) => (
                  <li key={combo.signature} className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2 text-sm">
                    <span className="text-gray-800">{combo.signature}</span>
                    <span className="text-gray-600 whitespace-nowrap">
                      {combo.count} perfiles ({combo.share_pct.toFixed(1)}%)
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <p className="text-xs text-gray-500 mb-6">Actualizado: {new Date(data.generated_at).toLocaleString()}</p>

          <div className="flex justify-center">
            <Button onClick={onBack} variant="outline" className="border-gray-300 text-gray-700">
              Volver
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
