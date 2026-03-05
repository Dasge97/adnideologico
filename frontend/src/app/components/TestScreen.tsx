import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { ChevronDown, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { createSession, fetchQuestions, saveAnswer, type ApiQuestion } from "../api";

interface TestScreenProps {
  onComplete: (sessionId: string) => void;
  onBack: () => void;
}

export function TestScreen({ onComplete, onBack }: TestScreenProps) {
  const [questions, setQuestions] = useState<ApiQuestion[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [showContext, setShowContext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const initializeTest = async () => {
    try {
      setLoading(true);
      setError(null);
      setSaveError(null);

      const [questionsData, session] = await Promise.all([fetchQuestions(), createSession()]);

      setQuestions(questionsData);
      setSessionId(session.session_id);
      setCurrentQuestion(0);
      setAnswers({});
      setSelectedValue(null);
      setShowContext(false);
    } catch (err) {
      console.error("Error loading test:", err);
      setError("No se pudo iniciar el test. Revisa tu conexion e intentalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeTest();
  }, []);

  useEffect(() => {
    const hasProgress = Object.keys(answers).length > 0 && currentQuestion < questions.length - 1;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasProgress) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [answers, currentQuestion, questions.length]);

  const question = questions[currentQuestion];
  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  const handleNext = async () => {
    if (selectedValue === null || !question || !sessionId || savingAnswer) {
      return;
    }

    setSaveError(null);
    const newAnswers = { ...answers, [question.question_id]: selectedValue };
    setAnswers(newAnswers);

    try {
      setSavingAnswer(true);
      await saveAnswer({
        session_id: sessionId,
        question_id: question.question_id,
        value: selectedValue,
      });
    } catch (err) {
      console.error("Error saving answer:", err);
      setSaveError("No se pudo guardar la respuesta. Intentalo otra vez.");
      setSavingAnswer(false);
      return;
    }

    if (currentQuestion < questions.length - 1) {
      const nextQuestion = questions[currentQuestion + 1];
      setCurrentQuestion(currentQuestion + 1);
      setSelectedValue(newAnswers[nextQuestion.question_id] ?? null);
      setShowContext(false);
    } else {
      onComplete(sessionId);
    }

    setSavingAnswer(false);
  };

  const handlePrevious = () => {
    if (savingAnswer) return;

    if (currentQuestion > 0) {
      const previousQuestion = questions[currentQuestion - 1];
      setCurrentQuestion(currentQuestion - 1);
      setSelectedValue(answers[previousQuestion.question_id] ?? null);
      setShowContext(false);
      setSaveError(null);
    } else {
      onBack();
    }
  };

  useEffect(() => {
    const handleKeys = (event: KeyboardEvent) => {
      if (loading || !question || savingAnswer) return;
      if (event.key >= "1" && event.key <= "7") {
        setSelectedValue(Number(event.key));
      }
      if (event.key === "Enter" && selectedValue !== null) {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [loading, question, savingAnswer, selectedValue]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-gray-600">Cargando preguntas...</p>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-lg">
          <p className="text-gray-700 mb-4">{error || "No hay preguntas disponibles."}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={initializeTest}>Reintentar</Button>
            <Button onClick={onBack} variant="outline">
              Volver
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="max-w-3xl mx-auto px-6 py-8 md:py-12 flex-1 flex flex-col">
        <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 flex-1 flex flex-col">
          <div className="mb-12">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-600">
                Pregunta {currentQuestion + 1} de {questions.length}
              </span>
              <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Puedes responder con teclas 1-7 y avanzar con Enter.
            </p>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-2xl md:text-3xl text-gray-900 text-center mb-8 leading-relaxed max-w-2xl mx-auto">
              {question.statement}
            </h2>

            <div className="flex justify-center mb-8">
              <button
                type="button"
                onClick={() => setShowContext(!showContext)}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 text-sm font-medium transition-colors"
              >
                Ver contexto
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    showContext ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            <div
              className={`overflow-hidden transition-all duration-300 mb-8 ${
                showContext ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 max-w-2xl mx-auto">
                <p className="text-gray-700 text-sm leading-relaxed">{question.context}</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-4 px-2">
                {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => !savingAnswer && setSelectedValue(value)}
                    className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                      selectedValue === value
                        ? "border-purple-600 bg-purple-600 text-white scale-110"
                        : "border-gray-300 hover:border-purple-400 text-gray-600"
                    }`}
                    aria-label={`Seleccionar valor ${value}`}
                  >
                    {value}
                  </button>
                ))}
              </div>

              <div className="flex justify-between text-sm text-gray-600 px-2 mb-4">
                <span className="text-left max-w-[120px]">Muy en desacuerdo</span>
                <span className="text-right max-w-[120px]">Muy de acuerdo</span>
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <Info className="w-4 h-4 text-gray-500 mt-0.5" />
                <p className="text-xs text-gray-600">
                  No hay respuestas correctas o incorrectas. Responde segun lo que realmente piensas.
                </p>
              </div>
            </div>
          </div>

          {saveError && (
            <p className="text-sm text-red-600 mb-4" role="alert" aria-live="assertive">
              {saveError}
            </p>
          )}

          <div className="flex justify-between items-center gap-4">
            <Button
              onClick={handlePrevious}
              variant="outline"
              size="lg"
              className="border-gray-300 text-gray-700"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Volver
            </Button>

            <Button
              onClick={handleNext}
              disabled={selectedValue === null || savingAnswer}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-300"
            >
              {savingAnswer
                ? "Guardando..."
                : currentQuestion < questions.length - 1
                  ? "Siguiente"
                  : "Finalizar"}
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
