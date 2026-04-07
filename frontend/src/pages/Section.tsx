import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import * as api from "../api/client";

const sectionNames: Record<string, string> = {
  boards_11: "Boards — Class 11",
  boards_12: "Boards — Class 12",
  jee_mains: "JEE Mains",
  jee_advanced: "JEE Advanced",
};

export default function SectionPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sectionName = sectionNames[sectionId || ""] || sectionId;

  const handleStartQuiz = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.startQuiz(sectionId!, "quiz");
      navigate(`/quiz/${res.data.id}`);
    } catch {
      setError("Failed to start quiz. Are there enough questions?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ color: "#fff", margin: "0 0 8px" }}>{sectionName}</h1>
      <p style={{ color: "#888", margin: "0 0 24px", fontSize: 14 }}>
        Choose how you want to practice
      </p>

      {error && (
        <div style={styles.error}>{error}</div>
      )}

      <div style={styles.grid}>
        <div style={styles.card}>
          <h2 style={{ color: "#fff", margin: "0 0 8px" }}>
            Previous Year Questions
          </h2>
          <p style={{ color: "#888", fontSize: 13, margin: "0 0 16px" }}>
            Browse and practice questions from past exams
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => navigate(`/section/${sectionId}/pyq/years`)}
              style={styles.primaryBtn}
            >
              By Year
            </button>
            <button
              onClick={() => navigate(`/section/${sectionId}/pyq/topics`)}
              style={styles.secondaryBtn}
            >
              By Topic
            </button>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={{ color: "#fff", margin: "0 0 8px" }}>Quiz</h2>
          <p style={{ color: "#888", fontSize: 13, margin: "0 0 16px" }}>
            Timed quiz with random questions (1 hour)
          </p>
          <button
            onClick={handleStartQuiz}
            disabled={loading}
            style={styles.primaryBtn}
          >
            {loading ? "Starting..." : "Start Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  card: {
    background: "#1a1a2e",
    borderRadius: 10,
    padding: 24,
    border: "1px solid #2a2a4a",
  },
  primaryBtn: {
    padding: "8px 16px",
    background: "#6c9bff",
    color: "#fff",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
    border: "none",
    fontWeight: "bold",
  },
  secondaryBtn: {
    padding: "8px 16px",
    background: "#2a2a4a",
    color: "#ccc",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
    border: "none",
  },
  error: {
    background: "#3a1a1a",
    color: "#ff6b6b",
    padding: 8,
    borderRadius: 6,
    fontSize: 13,
    marginBottom: 16,
  },
};
