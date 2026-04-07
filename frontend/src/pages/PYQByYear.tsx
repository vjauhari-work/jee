import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import * as api from "../api/client";

export default function PYQByYear() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sectionId) return;
    api
      .getYears(sectionId)
      .then((res) => {
        const sorted = (res.data as number[]).sort((a, b) => b - a);
        setYears(sorted);
      })
      .catch(() => setError("Failed to load years"))
      .finally(() => setLoading(false));
  }, [sectionId]);

  const handleStartPaper = async (year: number) => {
    setStarting(year);
    setError("");
    try {
      const res = await api.startQuiz(sectionId!, "pyq_year", year);
      navigate(`/quiz/${res.data.id}`);
    } catch {
      setError("Failed to start paper");
    } finally {
      setStarting(null);
    }
  };

  if (loading) return <p style={{ color: "#888" }}>Loading years...</p>;

  return (
    <div>
      <h1 style={{ color: "#fff", margin: "0 0 8px" }}>
        Previous Year Papers
      </h1>
      <p style={{ color: "#888", margin: "0 0 24px", fontSize: 14 }}>
        Select a year to start a timed paper (3 hours)
      </p>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.grid}>
        {years.map((year) => (
          <button
            key={year}
            onClick={() => handleStartPaper(year)}
            disabled={starting === year}
            style={styles.yearCard}
          >
            <div style={{ fontSize: 20, fontWeight: "bold", color: "#fff" }}>
              {year}
            </div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
              {starting === year ? "Starting..." : "Start Paper"}
            </div>
          </button>
        ))}
      </div>

      {years.length === 0 && (
        <p style={{ color: "#666" }}>No papers available for this section.</p>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    gap: 12,
  },
  yearCard: {
    background: "#1a1a2e",
    border: "1px solid #2a2a4a",
    borderRadius: 10,
    padding: 20,
    cursor: "pointer",
    textAlign: "center",
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
