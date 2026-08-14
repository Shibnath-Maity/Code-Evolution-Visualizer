import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";

import API from "../services/api";

const AnalysisContext = createContext(null);

export function AnalysisProvider({ children }) {
  const [analysis, setAnalysisState] = useState(null);
  const [repositoryId, setRepositoryId] = useState(null);
  const [loading, setLoading] = useState(false);

  const pollingRef = useRef(null);

  const repoUrl = analysis?.repoUrl || "";
  const repository = analysis?.repository || null;

  // Enhanced setAnalysis to automatically sync repositoryId
  const setAnalysis = useCallback((data) => {
    setAnalysisState(data);
    if (data) {
      const extractedId =
        data.repositoryId ||
        data._id ||
        data.id ||
        data.repository?._id ||
        data.repository?.id;

      if (extractedId) {
        setRepositoryId(extractedId);
      }
    }
  }, []);

  const clearPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    clearPolling();
    setAnalysisState(null);
    setRepositoryId(null);
  }, [clearPolling]);

  /*
   * Start polling background analysis.
   */
  useEffect(() => {
    if (!repositoryId) return;

    clearPolling();

    const poll = async () => {
      try {
        const response = await API.get(
          `/repository/analytics/${repositoryId}/status`
        );

        // Unwrap response data safely depending on backend structure
        const status =
          response.data?.data ||
          response.data?.session ||
          response.data;

        if (!status) return;

        setAnalysisState((prev) => {
          if (!prev) return prev;

          return {
            ...prev,

            architecture:
              status.architecture !== undefined
                ? status.architecture
                : prev.architecture,
            architecturePending:
              status.architecturePending ?? prev.architecturePending,
            architectureError:
              status.architectureError ?? prev.architectureError,

            codeEvolution:
              status.codeEvolution !== undefined
                ? status.codeEvolution
                : prev.codeEvolution,
            codeEvolutionPending:
              status.codeEvolutionPending ?? prev.codeEvolutionPending,
            codeEvolutionError:
              status.codeEvolutionError ?? prev.codeEvolutionError,

            hotspotInsights:
              status.hotspotInsights !== undefined
                ? status.hotspotInsights
                : status.hotspotInsight !== undefined
                ? status.hotspotInsight
                : prev.hotspotInsights,

            hotspotInsightsPending:
              status.hotspotInsightsPending ?? prev.hotspotInsightsPending,
            hotspotInsightsError:
              status.hotspotInsightsError ?? prev.hotspotInsightsError,

            vectorIndexingPending:
              status.vectorIndexingPending ?? prev.vectorIndexingPending,
            vectorIndexingError:
              status.vectorIndexingError ?? prev.vectorIndexingError,

            healthScore:
              status.healthScore !== undefined
                ? status.healthScore
                : prev.healthScore,
            healthScorePending:
              status.healthScorePending ?? prev.healthScorePending,
            healthScoreError:
              status.healthScoreError ?? prev.healthScoreError,
          };
        });

        /*
         * Stop polling when every active background task has finished.
         *
         * Treat an omitted pending flag the same as `false` (finished) -
         * some backend responses stop sending a *Pending field once that
         * job completes instead of explicitly sending false. Without this,
         * polling could run forever if the backend ever omits a flag on
         * completion instead of sending false.
         */
        const isFinished = (pending) => pending === undefined || pending === false;

        const backgroundFinished =
          isFinished(status.architecturePending) &&
          isFinished(status.codeEvolutionPending) &&
          isFinished(status.hotspotInsightsPending) &&
          isFinished(status.vectorIndexingPending) &&
          isFinished(status.healthScorePending);

        if (backgroundFinished) {
          console.log("✅ All background analysis completed");
          clearPolling();
        }
      } catch (error) {
        console.error("❌ Background analysis polling failed:", error);
      }
    };

    // Get latest state immediately
    poll();

    // Then poll every 2 seconds
    pollingRef.current = setInterval(poll, 2000);

    return () => {
      clearPolling();
    };
  }, [repositoryId, clearPolling]);

  const value = useMemo(
    () => ({
      analysis,
      setAnalysis,

      repositoryId,
      setRepositoryId,

      loading,
      setLoading,

      clearAnalysis,

      repoUrl,
      repository,
    }),
    [
      analysis,
      setAnalysis,
      repositoryId,
      loading,
      clearAnalysis,
      repoUrl,
      repository,
    ]
  );

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);

  if (!context) {
    throw new Error(
      "useAnalysis must be used inside AnalysisProvider"
    );
  }

  return context;
}