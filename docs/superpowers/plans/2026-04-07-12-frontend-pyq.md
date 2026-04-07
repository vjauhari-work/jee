# Frontend PYQ Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement PYQ by Year page (year list, start timed paper) and PYQ by Topic page (subject tabs, topic list, browse questions, download PDF).

**Architecture:** PYQ by Year fetches available years, clicking one starts a timed pyq_year quiz session. PYQ by Topic shows 3 subject tabs, each listing topics. Clicking a topic loads questions without timer and offers PDF download. QuestionCard component renders LaTeX via KaTeX.

**Tech Stack:** React 19, TypeScript, react-router-dom, KaTeX, axios

---

### Task 1: QuestionCard Component

**Files:**
- Create: `frontend/src/components/QuestionCard.tsx`

- [ ] **Step 1: Create QuestionCard with KaTeX rendering**

```tsx
import "katex/dist/katex.min.css";
import katex from "katex";
import { Question } from "../types";

interface Props {
  question: Question;
  index: number;
  selectedAnswer?: string;
  onAnswer?: (questionId: string, answer: string) => void;
  showAnswer?: boolean;
  correctAnswer?: string;
}

function renderLatex(text: string): string {
  // Replace $...$ with rendered KaTeX HTML
  return text.replace(/\$([^$]+)\$/g, (_, math) => {
    try {
      return katex.renderToString(math, { throwOnError: false });
    } catch {
      return math;
    }
  });
}

export default function QuestionCard({
  question,
  index,
  selectedAnswer,
  onAnswer,
  showAnswer,
  correctAnswer,
}: Props) {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.number}>Q{index + 1}</span>
        <span style={styles.meta}>
          {question.topic} | {question.year} | {question.difficulty}
        </span>
      </div>

      <div
        style={styles.questionText}
        dangerouslySetInnerHTML={{ __html: renderLatex(question.question_text) }}
      />

      {question.question_images?.map((img, i) => (
        <img
          key={i}
          src={`/uploads/${img}`}
          alt={`Question ${index + 1} image ${i + 1}`}
          style={styles.image}
        />
      ))}

      <div style={styles.options}>
        {question.options.map((opt) => {
          const isSelected = selectedAnswer === opt.label;
          const isCorrect = showAnswer && opt.label === correctAnswer;
          const isWrong = showAnswer && isSelected && opt.label !== correctAnswer;

          let bg = "#0d0d1a";
          if (isCorrect) bg = "#1a3a1a";
          else if (isWrong) bg = "#3a1a1a";
          else if (isSelected) bg = "#2a2a4a";

          return (
            <button
              key={opt.label}
              onClick={() => onAnswer?.(question.id, opt.label)}
              disabled={showAnswer}
              style={{
                ...styles.option,
                background: bg,
                borderColor: isSelected ? "#6c9bff" : "#333",
              }}
            >
              <span style={styles.optionLabel}>{opt.label}</span>
              <span
                dangerouslySetInnerHTML={{ __html: renderLatex(opt.text) }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "#1a1a2e",
    borderRadius: 10,
    padding: 20,
    border: "1px solid #2a2a4a",
    marginBottom: 16,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  number: { color: "#6c9bff", fontWeight: "bold", fontSize: 14 },
  meta: { color: "#666", fontSize: 12 },
  questionText: { color: "#e0e0e0", fontSize: 14, lineHeight: 1.6, marginBottom: 12 },
  image: { maxWidth: "100%", borderRadius: 6, marginBottom: 12 },
  options: { display: "flex", flexDirection: "column", gap: 8 },
  option: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 6,
    border: "1px solid #333",
    color: "#e0e0e0",
    cursor: "pointer",
    fontSize: 13,
    textAlign: "left",
  },
  optionLabel: {
    fontWeight: "bold",
    color: "#6c9bff",
    minWidth: 20,
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/QuestionCard.tsx
git commit -m "feat: add QuestionCard component with KaTeX rendering"
```

---

### Task 2: PYQ by Year Page

**Files:**
- Modify: `frontend/src/pages/PYQByYear.tsx`

- [ ] **Step 1: Implement PYQ by Year page**

Replace `frontend/src/pages/PYQByYear.tsx` with:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/PYQByYear.tsx
git commit -m "feat: implement PYQ by Year page with year selection"
```

---

### Task 3: PYQ by Topic Page

**Files:**
- Modify: `frontend/src/pages/PYQByTopic.tsx`

- [ ] **Step 1: Implement PYQ by Topic page**

Replace `frontend/src/pages/PYQByTopic.tsx` with:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/PYQByTopic.tsx
git commit -m "feat: implement PYQ by Topic page with subject tabs, topic list, and PDF download"
```
