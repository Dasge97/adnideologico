import { useEffect, useState } from "react";
import { Check } from "lucide-react";

interface LoadingScreenProps {
  onComplete: () => void;
}

const analysisSteps = [
  "valores económicos",
  "libertades civiles",
  "autoridad y estado",
  "tecnología y sociedad",
  "globalización",
  "sostenibilidad",
];

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [completedSteps, setCompletedSteps] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCompletedSteps((prev) => {
        if (prev < analysisSteps.length) {
          return prev + 1;
        }
        return prev;
      });
    }, 400);

    const timeout = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Loading animation */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl text-gray-900 mb-12">
          Analizando tu ADN ideológico...
        </h2>

        {/* Checklist */}
        <div className="space-y-4">
          {analysisSteps.map((step, index) => (
            <div
              key={step}
              className={`flex items-center justify-center gap-3 transition-all duration-300 ${
                index < completedSteps ? "opacity-100" : "opacity-30"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                  index < completedSteps
                    ? "bg-purple-600"
                    : "border-2 border-gray-300"
                }`}
              >
                {index < completedSteps && (
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                )}
              </div>
              <span className="text-lg text-gray-700">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
