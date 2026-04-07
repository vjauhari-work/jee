import { useState, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import * as api from "../api/client";

const sections = ["boards_11", "boards_12", "jee_mains", "jee_advanced"];
const subjects = ["physics", "chemistry", "mathematics"];
const difficulties = ["easy", "medium", "hard"];

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user?.role !== "admin") {
    navigate("/");
    return null;
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <h1 style={{ color: "#fff", margin: "0 0 24px" }}>Admin Panel</h1>
      <AddQuestionForm />
      <BulkImportForm />
      <AddAnswerForm />
    </div>
  );
}

function AddQuestionForm() {
  const [form, setForm] = useState({
    section: "jee_mains",
    subject: "physics",
    topic: "",
    year: new Date().getFullYear(),
    question_text: "",
    correct_answer: "A",
    difficulty: "medium",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
  });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg("");
    setError("");
    try {
      await api.createQuestion({
        section: form.section,
        subject: form.subject,
        topic: form.topic,
        year: form.year,
        question_text: form.question_text,
        question_images: [],
        options: [
          { label: "A", text: form.option_a },
          { label: "B", text: form.option_b },
          { label: "C", text: form.option_c },
          { label: "D", text: form.option_d },
        ],
        correct_answer: form.correct_answer,
        difficulty: form.difficulty,
      });
      setMsg("Question added successfully");
    } catch {
      setError("Failed to add question");
    }
  };

  const update = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <form onSubmit={handleSubmit} style={styles.section}>
      <h3 style={{ color: "#fff", margin: "0 0 12px" }}>Add Question</h3>

      <div style={styles.row}>
        <select
          value={form.section}
          onChange={(e) => update("section", e.target.value)}
          style={styles.select}
        >
          {sections.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={form.subject}
          onChange={(e) => update("subject", e.target.value)}
          style={styles.select}
        >
          {subjects.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={form.difficulty}
          onChange={(e) => update("difficulty", e.target.value)}
          style={styles.select}
        >
          {difficulties.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div style={styles.row}>
        <input
          placeholder="Topic"
          value={form.topic}
          onChange={(e) => update("topic", e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="number"
          placeholder="Year"
          value={form.year}
          onChange={(e) => update("year", parseInt(e.target.value))}
          style={{ ...styles.input, width: 100 }}
          required
        />
      </div>

      <textarea
        placeholder="Question text (supports LaTeX with $...$)"
        value={form.question_text}
        onChange={(e) => update("question_text", e.target.value)}
        style={styles.textarea}
        required
        rows={3}
      />

      <div style={styles.row}>
        <input
          placeholder="Option A"
          value={form.option_a}
          onChange={(e) => update("option_a", e.target.value)}
          style={styles.input}
          required
        />
        <input
          placeholder="Option B"
          value={form.option_b}
          onChange={(e) => update("option_b", e.target.value)}
          style={styles.input}
          required
        />
      </div>
      <div style={styles.row}>
        <input
          placeholder="Option C"
          value={form.option_c}
          onChange={(e) => update("option_c", e.target.value)}
          style={styles.input}
          required
        />
        <input
          placeholder="Option D"
          value={form.option_d}
          onChange={(e) => update("option_d", e.target.value)}
          style={styles.input}
          required
        />
      </div>

      <div style={styles.row}>
        <label style={{ color: "#888", fontSize: 12 }}>Correct Answer:</label>
        <select
          value={form.correct_answer}
          onChange={(e) => update("correct_answer", e.target.value)}
          style={styles.select}
        >
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
        </select>
      </div>

      {msg && <div style={styles.success}>{msg}</div>}
      {error && <div style={styles.error}>{error}</div>}

      <button type="submit" style={styles.button}>Add Question</button>
    </form>
  );
}

function BulkImportForm() {
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMsg("");
    setError("");

    try {
      const text = await file.text();
      const questions = JSON.parse(text);
      if (!Array.isArray(questions)) {
        setError("JSON file must contain an array of questions");
        return;
      }
      const res = await api.bulkImport(questions);
      setMsg(`Imported ${res.data.imported} questions`);
    } catch {
      setError("Failed to import — check JSON format");
    }
  };

  return (
    <div style={styles.section}>
      <h3 style={{ color: "#fff", margin: "0 0 12px" }}>Bulk Import</h3>
      <p style={{ color: "#888", fontSize: 13, margin: "0 0 8px" }}>
        Upload a JSON file containing an array of question objects.
      </p>
      <input
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        style={{ color: "#e0e0e0" }}
      />
      {msg && <div style={styles.success}>{msg}</div>}
      {error && <div style={styles.error}>{error}</div>}
    </div>
  );
}

function AddAnswerForm() {
  const [questionId, setQuestionId] = useState("");
  const [finalAnswer, setFinalAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [approachTitle, setApproachTitle] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg("");
    setError("");
    try {
      await api.upsertAnswer({
        question_id: questionId,
        final_answer: finalAnswer,
        approaches: [
          {
            title: approachTitle || "Solution",
            explanation,
            images: [],
          },
        ],
      });
      setMsg("Answer saved successfully");
    } catch {
      setError("Failed to save answer");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.section}>
      <h3 style={{ color: "#fff", margin: "0 0 12px" }}>Add/Update Answer</h3>

      <input
        placeholder="Question ID (ObjectId hex)"
        value={questionId}
        onChange={(e) => setQuestionId(e.target.value)}
        style={styles.input}
        required
      />
      <input
        placeholder="Final Answer (e.g., A)"
        value={finalAnswer}
        onChange={(e) => setFinalAnswer(e.target.value)}
        style={styles.input}
        required
      />
      <input
        placeholder="Approach Title"
        value={approachTitle}
        onChange={(e) => setApproachTitle(e.target.value)}
        style={styles.input}
      />
      <textarea
        placeholder="Explanation (supports LaTeX)"
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
        style={styles.textarea}
        rows={4}
        required
      />

      {msg && <div style={styles.success}>{msg}</div>}
      {error && <div style={styles.error}>{error}</div>}

      <button type="submit" style={styles.button}>Save Answer</button>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    background: "#1a1a2e",
    borderRadius: 10,
    padding: 20,
    border: "1px solid #2a2a4a",
    marginBottom: 20,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  row: { display: "flex", gap: 8, alignItems: "center" },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    border: "1px solid #333",
    background: "#0d0d1a",
    color: "#e0e0e0",
    fontSize: 14,
    outline: "none",
  },
  select: {
    padding: 10,
    borderRadius: 6,
    border: "1px solid #333",
    background: "#0d0d1a",
    color: "#e0e0e0",
    fontSize: 14,
    outline: "none",
  },
  textarea: {
    padding: 10,
    borderRadius: 6,
    border: "1px solid #333",
    background: "#0d0d1a",
    color: "#e0e0e0",
    fontSize: 14,
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },
  button: {
    padding: 10,
    borderRadius: 6,
    border: "none",
    background: "#6c9bff",
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: 8,
  },
  success: {
    background: "#1a3a1a",
    color: "#4a9a4a",
    padding: 8,
    borderRadius: 6,
    fontSize: 13,
  },
  error: {
    background: "#3a1a1a",
    color: "#ff6b6b",
    padding: 8,
    borderRadius: 6,
    fontSize: 13,
  },
};
