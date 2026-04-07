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
