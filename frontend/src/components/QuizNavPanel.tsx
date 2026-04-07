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
