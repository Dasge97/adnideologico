import { MessageSquareHeart, Network, Scale, Search, Shield, Users } from "lucide-react";
import { Button } from "./ui/button";

interface LandingPageProps {
  onStartTest: () => void;
  onViewExample: () => void;
  onViewCollective: () => void;
  onViewLegal: () => void;
}

export function LandingPage({ onStartTest, onViewExample, onViewCollective, onViewLegal }: LandingPageProps) {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12 mb-8">
          <div className="text-center mb-12">
            <div className="mb-8 flex justify-center">
              <div className="relative w-24 h-24 md:w-32 md:h-32">
                <div className="absolute inset-0 bg-purple-100 rounded-full opacity-50 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Network className="w-12 h-12 md:w-16 md:h-16 text-purple-600" strokeWidth={1.5} />
                </div>
              </div>
            </div>

            <h1 className="text-3xl md:text-5xl mb-6 text-gray-900 max-w-3xl mx-auto leading-tight">
              Seguro que sabes como piensas politicamente?
            </h1>

            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Muchas personas se definen como izquierda o derecha.
              <br className="hidden md:block" />
              Cuando miramos valores concretos, el resultado suele ser mas complejo.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4">
              <Button
                onClick={onStartTest}
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg"
              >
                Descubrir mi ADN ideologico
              </Button>
              <Button
                onClick={onViewExample}
                variant="outline"
                size="lg"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-6 text-lg"
              >
                Ver ejemplo
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={onViewCollective} variant="ghost" className="text-gray-700 hover:text-purple-700">
                <Users className="w-4 h-4 mr-2" />
                Ver fotografia colectiva
              </Button>
              <Button onClick={onViewLegal} variant="ghost" className="text-gray-700 hover:text-purple-700">
                <Shield className="w-4 h-4 mr-2" />
                Privacidad y transparencia
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12 text-center">
          <p className="text-sm uppercase tracking-wide text-purple-700 mb-3">
            Herramienta de reflexion, no de persuasion
          </p>
          <h2 className="text-2xl md:text-3xl text-gray-900 mb-5 leading-tight">
            No te dice a quien votar: te ayuda a entender tu mapa de valores
          </h2>
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed">
            ADN Ideologico propone una forma simple de explorar como piensas en economia, libertades, cultura,
            globalizacion, tecnologia y medio ambiente.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left mb-8">
            <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
              <Search className="w-5 h-5 text-purple-600 mb-2" />
              <p className="text-sm text-gray-700">Preguntas neutrales sobre situaciones reales.</p>
            </div>
            <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
              <Scale className="w-5 h-5 text-purple-600 mb-2" />
              <p className="text-sm text-gray-700">Perfil multidimensional sin etiquetas simplistas.</p>
            </div>
            <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
              <MessageSquareHeart className="w-5 h-5 text-purple-600 mb-2" />
              <p className="text-sm text-gray-700">Enfoque orientado a conciencia y pensamiento critico.</p>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative w-48 h-48" aria-hidden="true">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <circle cx="100" cy="100" r="80" fill="none" stroke="#e5e7eb" strokeWidth="1" />
                <circle cx="100" cy="100" r="60" fill="none" stroke="#e5e7eb" strokeWidth="1" />
                <circle cx="100" cy="100" r="40" fill="none" stroke="#e5e7eb" strokeWidth="1" />
                <circle cx="100" cy="100" r="20" fill="none" stroke="#e5e7eb" strokeWidth="1" />

                <line x1="100" y1="100" x2="100" y2="20" stroke="#d1d5db" strokeWidth="1" />
                <line x1="100" y1="100" x2="169.28" y2="50" stroke="#d1d5db" strokeWidth="1" />
                <line x1="100" y1="100" x2="169.28" y2="150" stroke="#d1d5db" strokeWidth="1" />
                <line x1="100" y1="100" x2="100" y2="180" stroke="#d1d5db" strokeWidth="1" />
                <line x1="100" y1="100" x2="30.72" y2="150" stroke="#d1d5db" strokeWidth="1" />
                <line x1="100" y1="100" x2="30.72" y2="50" stroke="#d1d5db" strokeWidth="1" />

                <polygon
                  points="100,40 145,60 155,130 100,150 55,120 60,60"
                  fill="#a78bfa"
                  fillOpacity="0.3"
                  stroke="#7c3aed"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>

          <p className="text-sm text-gray-500 mt-4">Ejemplo de visualizacion de resultados</p>
        </div>
      </div>
    </div>
  );
}
