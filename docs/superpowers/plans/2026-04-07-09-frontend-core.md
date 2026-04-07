# Frontend Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up frontend dependencies, TypeScript types, API client, auth context, routing, and the sidebar layout shell.

**Architecture:** React Router handles all client-side routing. AuthContext manages JWT state (user info from login response, not the token itself since it's httpOnly). Axios client is configured with `withCredentials: true` to send cookies. Layout component wraps authenticated pages with the sidebar.

**Tech Stack:** React 19, TypeScript, Vite, react-router-dom, axios, KaTeX

---

### Task 1: Install Frontend Dependencies

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Install dependencies**

Run:
```bash
cd /home/user/jee/frontend
npm install react-router-dom axios katex react-katex
npm install -D @types/katex @types/react-katex eslint @eslint/js typescript-eslint
```

- [ ] **Step 2: Add lint and test scripts to package.json**

Add to the `"scripts"` section of `frontend/package.json`:
```json
"lint": "eslint src/",
"test": "echo \"No tests configured yet\""
```

- [ ] **Step 3: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "feat: install frontend deps (router, axios, katex, eslint)"
```

---

### Task 2: TypeScript Types

**Files:**
- Create: `frontend/src/types/index.ts`

- [ ] **Step 1: Create shared types**

```typescript
export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  role: "student" | "admin";
  created_at: string;
  updated_at: string;
}

export interface Option {
  label: string;
  text: string;
}

export interface Question {
  id: string;
  section: string;
  subject: string;
  topic: string;
  year: number;
  question_text: string;
  question_images: string[];
  options: Option[];
  difficulty: string;
}

export interface Approach {
  title: string;
  explanation: string;
  images: string[];
}

export interface Answer {
  id: string;
  question_id: string;
  final_answer: string;
  approaches: Approach[];
}

export interface TopicScore {
  correct: number;
  total: number;
}

export interface QuizSession {
  id: string;
  user_id: string;
  section: string;
  type: "quiz" | "pyq_year" | "pyq_topic";
  questions: string[];
  answers_given: Record<string, string>;
  status: "in_progress" | "completed" | "timed_out";
  score: number | null;
  topic_breakdown: Record<string, TopicScore> | null;
  started_at: string;
  expires_at: string;
  completed_at: string | null;
}

export interface QuizResponse {
  session: QuizSession;
  questions: Question[];
  time_remaining: number;
}

export interface GradeResult {
  score: number;
  topic_breakdown: Record<string, TopicScore>;
  weak_topics: string[];
}

export interface UserProgress {
  id: string;
  user_id: string;
  section: string;
  type: string;
  filter_value: string;
  last_question_index: number;
  quiz_session_id: string;
  updated_at: string;
}

export interface Section {
  id: string;
  name: string;
  description: string;
}

export interface LoginResponse {
  message: string;
  user_id: string;
  username: string;
  name: string;
  role: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/types/index.ts
git commit -m "feat: add shared TypeScript types"
```

---

### Task 3: API Client

**Files:**
- Create: `frontend/src/api/client.ts`

- [ ] **Step 1: Create axios API client**

```typescript
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Auth
export const register = (data: {
  username: string;
  name: string;
  email: string;
  phone: string;
  password: string;
}) => api.post("/auth/register", data);

export const login = (username: string, password: string) =>
  api.post("/auth/login", { username, password });

export const logout = () => api.post("/auth/logout");

// Profile
export const getProfile = () => api.get("/profile");
export const updateProfile = (data: { email: string; phone: string }) =>
  api.put("/profile", data);
export const changePassword = (currentPassword: string, newPassword: string) =>
  api.put("/profile/password", {
    current_password: currentPassword,
    new_password: newPassword,
  });

// Sections
export const getSections = () => api.get("/sections");

// Questions
export const getQuestionsByYear = (section: string, year: number) =>
  api.get(`/questions/by-year?section=${section}&year=${year}`);
export const getQuestionsByTopic = (
  section: string,
  subject: string,
  topic: string
) =>
  api.get(
    `/questions/by-topic?section=${section}&subject=${subject}&topic=${topic}`
  );
export const getTopics = (section: string, subject: string) =>
  api.get(`/questions/topics?section=${section}&subject=${subject}`);
export const getYears = (section: string) =>
  api.get(`/questions/years?section=${section}`);
export const getAnswer = (questionId: string) =>
  api.get(`/questions/${questionId}/answer`);

// Quiz
export const startQuiz = (section: string, type: string, year?: number) =>
  api.post("/quiz/start", { section, type, year });
export const getQuiz = (sessionId: string) => api.get(`/quiz/${sessionId}`);
export const submitAnswer = (
  sessionId: string,
  questionId: string,
  answer: string
) => api.put(`/quiz/${sessionId}/answer`, { question_id: questionId, answer });
export const submitQuiz = (sessionId: string) =>
  api.post(`/quiz/${sessionId}/submit`);
export const getResults = (sessionId: string) =>
  api.get(`/quiz/${sessionId}/results`);

// Progress
export const getProgress = (section: string) =>
  api.get(`/progress?section=${section}`);
export const saveProgress = (data: {
  section: string;
  type: string;
  filter_value: string;
  last_question_index: number;
  quiz_session_id?: string;
}) => api.put("/progress", data);

// Download
export const downloadTopicPDF = (
  section: string,
  subject: string,
  topic: string
) =>
  api.get(`/download/topic-pdf?section=${section}&subject=${subject}&topic=${topic}`, {
    responseType: "blob",
  });

// Admin
export const createQuestion = (data: Record<string, unknown>) =>
  api.post("/admin/questions", data);
export const updateQuestion = (id: string, data: Record<string, unknown>) =>
  api.put(`/admin/questions/${id}`, data);
export const deleteQuestion = (id: string) =>
  api.delete(`/admin/questions/${id}`);
export const bulkImport = (questions: Record<string, unknown>[]) =>
  api.post("/admin/questions/bulk", questions);
export const upsertAnswer = (data: {
  question_id: string;
  final_answer: string;
  approaches: { title: string; explanation: string; images: string[] }[];
}) => api.post("/admin/answers", data);

export default api;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/api/client.ts
git commit -m "feat: add API client with all endpoint functions"
```

---

### Task 4: Auth Context

**Files:**
- Create: `frontend/src/context/AuthContext.tsx`

- [ ] **Step 1: Create auth context provider**

```tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import * as api from "../api/client";

interface AuthUser {
  user_id: string;
  username: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to restore session by fetching profile
    api
      .getProfile()
      .then((res) => {
        const u = res.data;
        setUser({
          user_id: u.id,
          username: u.username,
          name: u.name,
          role: u.role,
        });
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.login(username, password);
    setUser(res.data);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/context/AuthContext.tsx
git commit -m "feat: add auth context with session restore"
```

---

### Task 5: Sidebar Component

**Files:**
- Create: `frontend/src/components/Sidebar.tsx`

- [ ] **Step 1: Create sidebar component**

```tsx
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const sections = [
  { id: "boards_11", name: "Boards — Class 11" },
  { id: "boards_12", name: "Boards — Class 12" },
  { id: "jee_mains", name: "JEE Mains" },
  { id: "jee_advanced", name: "JEE Advanced" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.profile}>
        <div style={styles.avatar}>
          {user?.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div style={styles.name}>{user?.name}</div>
        <div style={styles.username}>@{user?.username}</div>
        <NavLink to="/profile/edit" style={styles.editLink}>
          Edit Profile
        </NavLink>
      </div>

      <div style={styles.sectionLabel}>Sections</div>

      {sections.map((s) => (
        <NavLink
          key={s.id}
          to={`/section/${s.id}`}
          style={({ isActive }) => ({
            ...styles.navLink,
            ...(isActive ? styles.navLinkActive : {}),
          })}
        >
          {s.name}
        </NavLink>
      ))}

      {user?.role === "admin" && (
        <NavLink
          to="/admin"
          style={({ isActive }) => ({
            ...styles.navLink,
            ...(isActive ? styles.navLinkActive : {}),
          })}
        >
          Admin Panel
        </NavLink>
      )}

      <button onClick={handleLogout} style={styles.logoutBtn}>
        Logout
      </button>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 220,
    minHeight: "100vh",
    background: "#1a1a2e",
    color: "#e0e0e0",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    flexShrink: 0,
  },
  profile: {
    textAlign: "center",
    paddingBottom: 12,
    borderBottom: "1px solid #333",
    marginBottom: 8,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: "50%",
    background: "#4a4a6a",
    margin: "0 auto 8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: "bold",
  },
  name: { fontWeight: "bold", fontSize: 14 },
  username: { fontSize: 12, color: "#888" },
  editLink: {
    fontSize: 12,
    color: "#6c9bff",
    textDecoration: "none",
    display: "block",
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 11,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 8,
  },
  navLink: {
    padding: "8px 10px",
    borderRadius: 6,
    color: "#ccc",
    textDecoration: "none",
    fontSize: 13,
    display: "block",
  },
  navLinkActive: {
    background: "#2a2a4a",
    borderLeft: "3px solid #6c9bff",
    color: "#fff",
  },
  logoutBtn: {
    marginTop: "auto",
    padding: "8px 10px",
    background: "none",
    border: "none",
    borderTop: "1px solid #333",
    color: "#888",
    cursor: "pointer",
    fontSize: 13,
    textAlign: "left",
    paddingTop: 12,
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/Sidebar.tsx
git commit -m "feat: add Sidebar component with profile and section nav"
```

---

### Task 6: App Router and Layout

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Update App.tsx with routes and layout**

Replace `frontend/src/App.tsx` with:

```tsx
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import SectionPage from "./pages/Section";
import PYQByYear from "./pages/PYQByYear";
import PYQByTopic from "./pages/PYQByTopic";
import Quiz from "./pages/Quiz";
import QuizResults from "./pages/QuizResults";
import EditProfile from "./pages/EditProfile";
import AdminPanel from "./pages/AdminPanel";

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <div style={styles.layout}>
      <Sidebar />
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

function PublicRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (user) return <Navigate to="/" />;
  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/section/:sectionId" element={<SectionPage />} />
          <Route path="/section/:sectionId/pyq/years" element={<PYQByYear />} />
          <Route path="/section/:sectionId/pyq/topics" element={<PYQByTopic />} />
          <Route path="/quiz/:sessionId" element={<Quiz />} />
          <Route path="/quiz/:sessionId/results" element={<QuizResults />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    background: "#0d0d1a",
    color: "#e0e0e0",
  },
  main: {
    flex: 1,
    padding: 24,
    overflowY: "auto",
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "#0d0d1a",
    color: "#e0e0e0",
    fontSize: 18,
  },
};
```

- [ ] **Step 2: Update main.tsx to wrap with AuthProvider**

Replace `frontend/src/main.tsx` with:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./context/AuthContext";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
```

- [ ] **Step 3: Create placeholder page files so App.tsx compiles**

Create each of these files with a minimal placeholder:

`frontend/src/pages/Login.tsx`:
```tsx
export default function Login() {
  return <div>Login page — to be implemented</div>;
}
```

`frontend/src/pages/Register.tsx`:
```tsx
export default function Register() {
  return <div>Register page — to be implemented</div>;
}
```

`frontend/src/pages/Home.tsx`:
```tsx
export default function Home() {
  return <div>Home page — to be implemented</div>;
}
```

`frontend/src/pages/Section.tsx`:
```tsx
export default function SectionPage() {
  return <div>Section page — to be implemented</div>;
}
```

`frontend/src/pages/PYQByYear.tsx`:
```tsx
export default function PYQByYear() {
  return <div>PYQ by Year — to be implemented</div>;
}
```

`frontend/src/pages/PYQByTopic.tsx`:
```tsx
export default function PYQByTopic() {
  return <div>PYQ by Topic — to be implemented</div>;
}
```

`frontend/src/pages/Quiz.tsx`:
```tsx
export default function Quiz() {
  return <div>Quiz — to be implemented</div>;
}
```

`frontend/src/pages/QuizResults.tsx`:
```tsx
export default function QuizResults() {
  return <div>Quiz Results — to be implemented</div>;
}
```

`frontend/src/pages/EditProfile.tsx`:
```tsx
export default function EditProfile() {
  return <div>Edit Profile — to be implemented</div>;
}
```

`frontend/src/pages/AdminPanel.tsx`:
```tsx
export default function AdminPanel() {
  return <div>Admin Panel — to be implemented</div>;
}
```

- [ ] **Step 4: Verify it compiles**

Run: `cd /home/user/jee/frontend && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/
git commit -m "feat: add app router, layout, sidebar, auth context, placeholder pages"
```
