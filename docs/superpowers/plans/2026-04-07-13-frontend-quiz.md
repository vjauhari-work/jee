# Frontend Quiz & Results Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the timed Quiz page (countdown, question navigation, answer submission) and Quiz Results page (score, topic breakdown, weak topics).

**Architecture:** Quiz page fetches the session, displays one question at a time with a navigation panel. Timer component manages countdown and triggers auto-submit. Results page shows score, per-topic bars, and highlights weak topics.

**Tech Stack:** React 19, TypeScript, react-router-dom, KaTeX

---

### Task 1: Timer Component

**Files:**
- Create: `frontend/src/components/Timer.tsx`

- [ ] **Step 1: Create Timer component**

```tsx
import { useState, useEffect, useRef } from "react";

interface Props {
  initialSeconds: number;
  onTimeUp: () => void;
}

export default function Timer({ initialSeconds, onTimeUp }: Props) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    if (seconds <= 0) {
      onTimeUpRef.current();
      return;
    }

    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUpRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds]);

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const isLow = seconds < 300; // less than 5 minutes

  return (
    <div
      style={{
        background: isLow ? "#3a1a1a" : "#1a1a2e",
        color: isLow ? "#ff6b6b" : "#e0e0e0",
        padding: "8px 16px",
        borderRadius: 8,
        fontWeight: "bold",
        fontSize: 16,
        fontFamily: "monospace",
        border: `1px solid ${isLow ? "#ff6b6b" : "#2a2a4a"}`,
      }}
    >
      {String(hours).padStart(2, "0")}:{String(mins).padStart(2, "0")}:
      {String(secs).padStart(2, "0")}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/Timer.tsx
git commit -m "feat: add Timer component with countdown and low-time warning"
```

---

### Task 2: Quiz Navigation Panel

**Files:**
- Create: `frontend/src/components/QuizNavPanel.tsx`

- [ ] **Step 1: Create QuizNavPanel component**

```tsx
interface Props {
  totalQuestions: number;
  currentIndex: number;
  answeredQuestions: Set<string>;
  questionIds: string[];
  onNavigate: (index: number) => void;
}

export default function QuizNavPanel({
  totalQuestions,
  currentIndex,
  answeredQuestions,
  questionIds,
  onNavigate,
}: Props) {
  return (
    <div style={styles.container}>
      <div style={styles.label}>Questions</div>
      <div style={styles.grid}>
        {Array.from({ length: totalQuestions }, (_, i) => {
          const isAnswered = answeredQuestions.has(questionIds[i]);
          const isCurrent = i === currentIndex;

          return (
            <button
              key={i}
              onClick={() => onNavigate(i)}
              style={{
                ...styles.btn,
                background: isCurrent
                  ? "#6c9bff"
                  : isAnswered
                  ? "#2a4a2a"
                  : "#1a1a2e",
                borderColor: isCurrent ? "#6c9bff" : isAnswered ? "#4a9a4a" : "#333",
                color: isCurrent || isAnswered ? "#fff" : "#888",
              }}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div style={styles.legend}>
        <span style={{ color: "#6c9bff" }}>Current</span>
        <span style={{ color: "#4a9a4a" }}>Answered</span>
        <span style={{ color: "#888" }}>Unanswered</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: "#1a1a2e",
    borderRadius: 10,
    padding: 16,
    border: "1px solid #2a2a4a",
  },
  label: {
    fontSize: 12,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 6,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    border: "1px solid #333",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  legend: {
    display: "flex",
    gap: 12,
    marginTop: 10,
    fontSize: 11,
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/QuizNavPanel.tsx
git commit -m "feat: add QuizNavPanel component for question navigation"
```

---

### Task 3: Quiz Page

**Files:**
- Modify: `frontend/src/pages/Quiz.tsx`

- [ ] **Step 1: Implement Quiz page**

Replace `frontend/src/pages/Quiz.tsx` with:

```tsx
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import * as api from "../api/client";
import { Question, QuizResponse } from "../types";
import QuestionCard from "../components/QuestionCard";
import Timer from "../components/Timer";
import QuizNavPanel from "../components/QuizNavPanel";

export default function Quiz() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!sessionId) return;
    api
      .getQuiz(sessionId)
      .then((res) => {
        const data = res.data as QuizResponse;
        setQuestions(data.questions);
        setTimeRemaining(data.time_remaining);
        setAnswers(data.session.answers_given || {});
        setStatus(data.session.status);
      })
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [sessionId, navigate]);

  const handleAnswer = useCallback(
    async (questionId: string, answer: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: answer }));
      try {
        await api.submitAnswer(sessionId!, questionId, answer);
      } catch {
        // Silently fail — answer is still tracked in local state
      }
    },
    [sessionId]
  );

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.submitQuiz(sessionId!);
      navigate(`/quiz/${sessionId}/results`);
    } catch {
      alert("Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  }, [sessionId, submitting, navigate]);

  const handleTimeUp = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  if (loading) return <p style={{ color: "#888" }}>Loading quiz...</p>;

  if (status !== "in_progress") {
    navigate(`/quiz/${sessionId}/results`);
    return null;
  }

  const currentQuestion = questions[currentIndex];
  const answeredSet = new Set(Object.keys(answers));

  return (
    <div>
      {/* Header with timer and submit */}
      <div style={styles.header}>
        <h2 style={{ color: "#fff", margin: 0 }}>
          Quiz ({questions.length} questions)
        </h2>
        <Timer initialSeconds={timeRemaining} onTimeUp={handleTimeUp} />
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={styles.submitBtn}
        >
          {submitting ? "Submitting..." : "Submit Quiz"}
        </button>
      </div>

      <div style={styles.body}>
        {/* Question area */}
        <div style={styles.questionArea}>
          {currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              index={currentIndex}
              selectedAnswer={answers[currentQuestion.id]}
              onAnswer={handleAnswer}
            />
          )}

          {/* Prev/Next buttons */}
          <div style={styles.navButtons}>
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              style={styles.navBtn}
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))
              }
              disabled={currentIndex === questions.length - 1}
              style={styles.navBtn}
            >
              Next
            </button>
          </div>
        </div>

        {/* Navigation panel */}
        <div style={styles.navPanel}>
          <QuizNavPanel
            totalQuestions={questions.length}
            currentIndex={currentIndex}
            answeredQuestions={answeredSet}
            questionIds={questions.map((q) => q.id)}
            onNavigate={setCurrentIndex}
          />
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  submitBtn: {
    padding: "8px 16px",
    background: "#4a9a4a",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: 13,
    marginLeft: "auto",
  },
  body: {
    display: "flex",
    gap: 20,
  },
  questionArea: {
    flex: 1,
  },
  navPanel: {
    width: 220,
    flexShrink: 0,
  },
  navButtons: {
    display: "flex",
    gap: 8,
    marginTop: 12,
  },
  navBtn: {
    padding: "8px 16px",
    background: "#2a2a4a",
    color: "#ccc",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/Quiz.tsx
git commit -m "feat: implement Quiz page with timer, navigation, and answer tracking"
```

---

### Task 4: Topic Breakdown Component

**Files:**
- Create: `frontend/src/components/TopicBreakdown.tsx`

- [ ] **Step 1: Create TopicBreakdown component**

```tsx
import { TopicScore } from "../types";

interface Props {
  breakdown: Record<string, TopicScore>;
  weakTopics: string[];
}

export default function TopicBreakdown({ breakdown, weakTopics }: Props) {
  const topics = Object.entries(breakdown).sort(
    ([, a], [, b]) => {
      const pctA = a.total > 0 ? a.correct / a.total : 0;
      const pctB = b.total > 0 ? b.correct / b.total : 0;
      return pctB - pctA;
    }
  );

  return (
    <div>
      {topics.map(([topic, score]) => {
        const pct = score.total > 0 ? (score.correct / score.total) * 100 : 0;
        const isWeak = weakTopics.includes(topic);

        return (
          <div key={topic} style={styles.row}>
            <div style={styles.topicName}>
              {topic}
              {isWeak && <span style={styles.weakBadge}>Weak</span>}
            </div>
            <div style={styles.barContainer}>
              <div
                style={{
                  ...styles.bar,
                  width: `${pct}%`,
                  background: isWeak ? "#ff6b6b" : "#4a9a4a",
                }}
              />
            </div>
            <div style={styles.score}>
              {score.correct}/{score.total} ({Math.round(pct)}%)
            </div>
          </div>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  topicName: {
    width: 160,
    color: "#e0e0e0",
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  weakBadge: {
    background: "#3a1a1a",
    color: "#ff6b6b",
    padding: "2px 6px",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: "bold",
  },
  barContainer: {
    flex: 1,
    height: 12,
    background: "#0d0d1a",
    borderRadius: 6,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 6,
    transition: "width 0.3s ease",
  },
  score: {
    width: 100,
    textAlign: "right",
    color: "#888",
    fontSize: 12,
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/TopicBreakdown.tsx
git commit -m "feat: add TopicBreakdown component with bar chart and weak badges"
```

---

### Task 5: Quiz Results Page

**Files:**
- Modify: `frontend/src/pages/QuizResults.tsx`

- [ ] **Step 1: Implement Quiz Results page**

Replace `frontend/src/pages/QuizResults.tsx` with:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/QuizResults.tsx
git commit -m "feat: implement Quiz Results page with score and topic breakdown"
```
