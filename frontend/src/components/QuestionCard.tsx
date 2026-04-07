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
