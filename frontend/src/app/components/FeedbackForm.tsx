import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

interface FeedbackFormProps {
  onSubmit: (message: string) => Promise<void> | void;
  onBackToHome: () => void;
}

export function FeedbackForm({ onSubmit, onBackToHome }: FeedbackFormProps) {
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!feedback.trim() || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit(feedback.trim());
      setSubmitted(true);
    } catch (submitError) {
      console.error("Error sending feedback:", submitError);
      setError("No se pudo enviar tu opinion. Intentalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl text-gray-900 mb-2">Gracias por tu opinion</h2>
          <p className="text-gray-600">Nos ayudas a mejorar el test.</p>
          <div className="mt-8">
            <Button onClick={onBackToHome} size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
              Volver al inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12 md:py-16">
        <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl text-gray-900 mb-4">Te esperabas este perfil?</h1>
            <p className="text-lg text-gray-600">Tu opinion nos ayuda a mejorar el test.</p>
          </div>

          <div className="mb-8">
            <label htmlFor="feedback-message" className="sr-only">
              Comentario sobre tu resultado
            </label>
            <Textarea
              id="feedback-message"
              placeholder="Cuentanos que te ha sorprendido de tu resultado..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[200px] text-lg resize-none border-gray-300 focus:border-purple-500 focus:ring-purple-500"
            />
            {error && (
              <p className="mt-3 text-sm text-red-600" role="alert" aria-live="assertive">
                {error}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleSubmit}
              disabled={!feedback.trim() || submitting}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white flex-1 disabled:bg-gray-300"
            >
              {submitting ? "Enviando..." : "Enviar"}
            </Button>
            <Button
              onClick={onBackToHome}
              variant="outline"
              size="lg"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 flex-1"
            >
              Volver al inicio
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
