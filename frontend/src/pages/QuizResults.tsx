import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import * as api from "../api/client";
import { GradeResult } from "../types";
import TopicBreakdown from "../components/TopicBreakdown";

export default function QuizResults() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [results, setResults] = useState<GradeResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    api
      .getResults(sessionId)
      .then((res) => setResults(res.data as GradeResult))
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [sessionId, navigate]);

  if (loading) return <p style={{ color: "#888" }}>Loading results...</p>;
  if (!results) return <p style={{ color: "#888" }}>No results found.</p>;

  return (
    <div>
      <h1 style={{ color: "#fff", margin: "0 0 24px" }}>Quiz Results</h1>

      {/* Overall score */}
      <div style={styles.scoreCard}>
        <div style={styles.scoreValue}>{Math.round(results.score)}%</div>
        <div style={styles.scoreLabel}>Overall Score</div>
      </div>

      {/* Weak topics summary */}
      {results.weak_topics && results.weak_topics.length > 0 && (
        <div style={styles.weakSection}>
          <h3 style={{ color: "#ff6b6b", margin: "0 0 8px" }}>
            Areas for Improvement
          </h3>
          <p style={{ color: "#ccc", fontSize: 13, margin: 0 }}>
            Focus on:{" "}
            {results.weak_topics.join(", ")}
          </p>
        </div>
      )}

      {/* Topic breakdown */}
      <div style={styles.breakdownSection}>
        <h3 style={{ color: "#fff", margin: "0 0 16px" }}>
          Topic Breakdown
        </h3>
        <TopicBreakdown
          breakdown={results.topic_breakdown}
          weakTopics={results.weak_topics || []}
        />
      </div>

      <button onClick={() => navigate("/")} style={styles.backBtn}>
        Back to Home
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  scoreCard: {
    background: "#1a1a2e",
    borderRadius: 12,
    padding: 32,
    textAlign: "center",
    border: "1px solid #2a2a4a",
    marginBottom: 20,
    width: 200,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#6c9bff",
  },
  scoreLabel: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },
  weakSection: {
    background: "#1a1a1a",
    border: "1px solid #3a1a1a",
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  breakdownSection: {
    background: "#1a1a2e",
    borderRadius: 10,
    padding: 20,
    border: "1px solid #2a2a4a",
    marginBottom: 20,
  },
  backBtn: {
    padding: "8px 16px",
    background: "#2a2a4a",
    color: "#ccc",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
  },
};
