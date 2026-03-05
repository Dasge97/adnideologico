import { lazy, Suspense, useState } from "react";
import { finishSession, sendFeedback, type AxisScores } from "./api";

const LandingPage = lazy(() =>
  import("./components/LandingPage").then((module) => ({ default: module.LandingPage }))
);
const TestScreen = lazy(() =>
  import("./components/TestScreen").then((module) => ({ default: module.TestScreen }))
);
const LoadingScreen = lazy(() =>
  import("./components/LoadingScreen").then((module) => ({ default: module.LoadingScreen }))
);
const ResultsScreen = lazy(() =>
  import("./components/ResultsScreen").then((module) => ({ default: module.ResultsScreen }))
);
const ShareScreen = lazy(() =>
  import("./components/ShareScreen").then((module) => ({ default: module.ShareScreen }))
);
const FeedbackForm = lazy(() =>
  import("./components/FeedbackForm").then((module) => ({ default: module.FeedbackForm }))
);
const CollectiveScreen = lazy(() =>
  import("./components/CollectiveScreen").then((module) => ({ default: module.CollectiveScreen }))
);
const LegalScreen = lazy(() =>
  import("./components/LegalScreen").then((module) => ({ default: module.LegalScreen }))
);

type Screen =
  | "landing"
  | "test"
  | "loading"
  | "results"
  | "share"
  | "feedback"
  | "collective"
  | "legal";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("landing");
  const [results, setResults] = useState<AxisScores>({
    economy: 0.2,
    liberties: 0.5,
    culture: -0.2,
    ecology: 0.3,
    global: 0.1,
    tech: 0.4,
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [pendingFinishSessionId, setPendingFinishSessionId] = useState<string | null>(null);

  const handleStartTest = () => {
    setCurrentScreen("test");
  };

  const handleViewExample = () => {
    setActiveSessionId(null);
    setResults({
      economy: 0.35,
      liberties: 0.1,
      culture: -0.25,
      ecology: 0.42,
      global: -0.12,
      tech: 0.5,
    });
    setCurrentScreen("results");
  };

  const handleTestComplete = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setPendingFinishSessionId(sessionId);
    setCurrentScreen("loading");
  };

  const handleLoadingComplete = async () => {
    if (!pendingFinishSessionId) {
      setCurrentScreen("results");
      return;
    }

    try {
      const scores = await finishSession({ session_id: pendingFinishSessionId });
      setResults(scores);
      setCurrentScreen("results");
    } catch (error) {
      console.error("Error finishing session:", error);
      alert("No se pudo calcular el resultado. Intenta repetir el test.");
      setCurrentScreen("landing");
    } finally {
      setPendingFinishSessionId(null);
    }
  };

  const handleShare = () => {
    setCurrentScreen("share");
  };

  const handleRepeatTest = () => {
    setCurrentScreen("landing");
  };

  const handleFeedback = () => {
    setCurrentScreen("feedback");
  };

  const handleFeedbackSubmit = async (message: string) => {
    await sendFeedback({ session_id: activeSessionId, message });
  };

  const handleBackToHome = () => {
    setCurrentScreen("landing");
  };

  const handleBackFromTest = () => {
    setCurrentScreen("landing");
  };

  const handleViewCollective = () => {
    setCurrentScreen("collective");
  };

  const handleViewLegal = () => {
    setCurrentScreen("legal");
  };

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center px-6">
          <p className="text-gray-600">Cargando...</p>
        </div>
      }
    >
      <div className="min-h-screen">
        {currentScreen === "landing" && (
          <LandingPage
            onStartTest={handleStartTest}
            onViewExample={handleViewExample}
            onViewCollective={handleViewCollective}
            onViewLegal={handleViewLegal}
          />
        )}

        {currentScreen === "test" && <TestScreen onComplete={handleTestComplete} onBack={handleBackFromTest} />}

        {currentScreen === "loading" && <LoadingScreen onComplete={handleLoadingComplete} />}

        {currentScreen === "results" && (
        <ResultsScreen
          results={results}
          sessionId={activeSessionId}
          onShare={handleShare}
          onRepeat={handleRepeatTest}
          onCollective={handleViewCollective}
          />
        )}

        {currentScreen === "share" && (
          <ShareScreen results={results} onFeedback={handleFeedback} onCollective={handleViewCollective} />
        )}

        {currentScreen === "feedback" && (
          <FeedbackForm onSubmit={handleFeedbackSubmit} onBackToHome={handleBackToHome} />
        )}

        {currentScreen === "collective" && <CollectiveScreen onBack={handleBackToHome} />}

        {currentScreen === "legal" && <LegalScreen onBack={handleBackToHome} />}
      </div>
    </Suspense>
  );
}
