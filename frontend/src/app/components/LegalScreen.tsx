import { Button } from "./ui/button";

interface LegalScreenProps {
  onBack: () => void;
}

export function LegalScreen({ onBack }: LegalScreenProps) {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl text-gray-900 mb-6">Privacidad y transparencia</h1>

          <section className="mb-6">
            <h2 className="text-xl text-gray-900 mb-2">Que guardamos</h2>
            <p className="text-gray-700 leading-relaxed">
              Guardamos respuestas del test, fecha/hora de sesion y comentarios voluntarios de feedback. No pedimos
              nombre, email ni registro para participar.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl text-gray-900 mb-2">Como protegemos datos</h2>
            <p className="text-gray-700 leading-relaxed">
              Los datos se analizan en formato agregado y anonimo para generar estadisticas colectivas. No se publican
              perfiles individuales identificables.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl text-gray-900 mb-2">Retencion</h2>
            <p className="text-gray-700 leading-relaxed">
              Conservamos datos anonimos para analisis historico y mejora del test. Si en el futuro se añaden datos
              personales, se habilitara un canal de solicitud de borrado.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl text-gray-900 mb-2">Finalidad</h2>
            <p className="text-gray-700 leading-relaxed">
              ADN Ideologico es una herramienta de reflexion. No ofrece consejo electoral ni clasifica a personas en
              etiquetas fijas.
            </p>
          </section>

          <Button onClick={onBack} variant="outline" className="border-gray-300 text-gray-700">
            Volver
          </Button>
        </div>
      </div>
    </div>
  );
}
