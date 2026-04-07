# Frontend Home & Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Home page (4 section cards) and Section page (choose PYQ or Quiz).

**Architecture:** Home shows a welcome message and 2x2 grid of section cards. Section page shows two choices: "Previous Year Questions" and "Start Quiz". Both pages use react-router-dom for navigation.

**Tech Stack:** React 19, TypeScript, react-router-dom

---

### Task 1: Home Page

**Files:**
- Modify: `frontend/src/pages/Home.tsx`

- [ ] **Step 1: Implement Home page**

Replace `frontend/src/pages/Home.tsx` with:

```tsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const sections = [
  { id: "boards_11", name: "Boards — Class 11", desc: "CBSE board exam preparation", icon: "\ud83d\udcd8" },
  { id: "boards_12", name: "Boards — Class 12", desc: "CBSE board exam preparation", icon: "\ud83d\udcd7" },
  { id: "jee_mains", name: "JEE Mains", desc: "Joint Entrance Examination", icon: "\ud83c\udfaf" },
  { id: "jee_advanced", name: "JEE Advanced", desc: "Advanced level preparation", icon: "\ud83c\udfc6" },
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      <h1 style={{ color: "#fff", margin: "0 0 4px" }}>
        Welcome back, {user?.name}!
      </h1>
      <p style={{ color: "#888", margin: "0 0 24px", fontSize: 14 }}>
        Choose a section to get started
      </p>

      <div style={styles.grid}>
        {sections.map((s) => (
          <div key={s.id} style={styles.card}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ color: "#fff", fontWeight: "bold", marginBottom: 4 }}>
              {s.name}
            </div>
            <div style={{ color: "#888", fontSize: 12, marginBottom: 12 }}>
              {s.desc}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => navigate(`/section/${s.id}`)}
                style={styles.primaryBtn}
              >
                Previous Year Q
              </button>
              <button
                onClick={() => navigate(`/section/${s.id}`)}
                style={styles.secondaryBtn}
              >
                Start Quiz
              </button>
            </div>
          </div>
        ))}
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
    padding: 20,
    border: "1px solid #2a2a4a",
  },
  primaryBtn: {
    padding: "6px 12px",
    background: "#6c9bff",
    color: "#fff",
    borderRadius: 4,
    fontSize: 12,
    cursor: "pointer",
    border: "none",
  },
  secondaryBtn: {
    padding: "6px 12px",
    background: "#2a2a4a",
    color: "#ccc",
    borderRadius: 4,
    fontSize: 12,
    cursor: "pointer",
    border: "none",
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/Home.tsx
git commit -m "feat: implement Home page with section cards grid"
```

---

### Task 2: Section Page

**Files:**
- Modify: `frontend/src/pages/Section.tsx`

- [ ] **Step 1: Implement Section page**

Replace `frontend/src/pages/Section.tsx` with:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/Section.tsx
git commit -m "feat: implement Section page with PYQ and Quiz options"
```
