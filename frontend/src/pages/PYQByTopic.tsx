import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import * as api from "../api/client";
import { Question } from "../types";
import QuestionCard from "../components/QuestionCard";

const subjects = [
  { id: "physics", name: "Physics" },
  { id: "chemistry", name: "Chemistry" },
  { id: "mathematics", name: "Mathematics" },
];

export default function PYQByTopic() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const [activeSubject, setActiveSubject] = useState("physics");
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!sectionId) return;
    setLoadingTopics(true);
    setSelectedTopic(null);
    setQuestions([]);
    api
      .getTopics(sectionId, activeSubject)
      .then((res) => setTopics(res.data as string[]))
      .catch(() => setTopics([]))
      .finally(() => setLoadingTopics(false));
  }, [sectionId, activeSubject]);

  const handleSelectTopic = async (topic: string) => {
    setSelectedTopic(topic);
    setLoadingQuestions(true);
    try {
      const res = await api.getQuestionsByTopic(sectionId!, activeSubject, topic);
      setQuestions(res.data as Question[]);
    } catch {
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedTopic) return;
    setDownloading(true);
    try {
      const res = await api.downloadTopicPDF(sectionId!, activeSubject, selectedTopic);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${sectionId}_${activeSubject}_${selectedTopic}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <h1 style={{ color: "#fff", margin: "0 0 8px" }}>
        Questions by Topic
      </h1>

      {/* Subject tabs */}
      <div style={styles.tabs}>
        {subjects.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSubject(s.id)}
            style={{
              ...styles.tab,
              ...(activeSubject === s.id ? styles.tabActive : {}),
            }}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Topic list or question view */}
      {!selectedTopic ? (
        <div>
          {loadingTopics ? (
            <p style={{ color: "#888" }}>Loading topics...</p>
          ) : topics.length === 0 ? (
            <p style={{ color: "#666" }}>No topics found.</p>
          ) : (
            <div style={styles.topicGrid}>
              {topics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => handleSelectTopic(topic)}
                  style={styles.topicCard}
                >
                  {topic}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div style={styles.topicHeader}>
            <button
              onClick={() => {
                setSelectedTopic(null);
                setQuestions([]);
              }}
              style={styles.backBtn}
            >
              Back to Topics
            </button>
            <h2 style={{ color: "#fff", margin: 0 }}>{selectedTopic}</h2>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              style={styles.downloadBtn}
            >
              {downloading ? "Downloading..." : "Download PDF"}
            </button>
          </div>

          {loadingQuestions ? (
            <p style={{ color: "#888" }}>Loading questions...</p>
          ) : questions.length === 0 ? (
            <p style={{ color: "#666" }}>No questions found.</p>
          ) : (
            questions.map((q, i) => (
              <QuestionCard key={q.id} question={q} index={i} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  tabs: { display: "flex", gap: 8, marginBottom: 20 },
  tab: {
    padding: "8px 16px",
    borderRadius: 6,
    border: "1px solid #333",
    background: "#1a1a2e",
    color: "#ccc",
    cursor: "pointer",
    fontSize: 13,
  },
  tabActive: {
    background: "#6c9bff",
    color: "#fff",
    borderColor: "#6c9bff",
  },
  topicGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: 12,
  },
  topicCard: {
    background: "#1a1a2e",
    border: "1px solid #2a2a4a",
    borderRadius: 8,
    padding: 16,
    color: "#e0e0e0",
    cursor: "pointer",
    fontSize: 14,
    textAlign: "left",
  },
  topicHeader: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  backBtn: {
    padding: "6px 12px",
    background: "#2a2a4a",
    color: "#ccc",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
  },
  downloadBtn: {
    padding: "6px 12px",
    background: "#4a9a4a",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
    marginLeft: "auto",
  },
};
