# Frontend Auth Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Login and Register pages with form handling and error display.

**Architecture:** Full-screen centered forms (no sidebar). On success, auth context updates and router redirects to home. Dark theme consistent with the rest of the app.

**Tech Stack:** React 19, TypeScript, react-router-dom

---

### Task 1: Login Page

**Files:**
- Modify: `frontend/src/pages/Login.tsx`

- [ ] **Step 1: Implement Login page**

Replace `frontend/src/pages/Login.tsx` with:

```tsx
import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch {
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h1 style={styles.title}>JEE Prep</h1>
        <p style={styles.subtitle}>Sign in to your account</p>

        {error && <div style={styles.error}>{error}</div>}

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p style={styles.link}>
          Don't have an account?{" "}
          <Link to="/register" style={styles.anchor}>
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#0d0d1a",
  },
  form: {
    background: "#1a1a2e",
    padding: 32,
    borderRadius: 12,
    width: 360,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  title: { color: "#fff", margin: 0, textAlign: "center" },
  subtitle: { color: "#888", margin: 0, textAlign: "center", fontSize: 14 },
  error: {
    background: "#3a1a1a",
    color: "#ff6b6b",
    padding: 8,
    borderRadius: 6,
    fontSize: 13,
    textAlign: "center",
  },
  input: {
    padding: 10,
    borderRadius: 6,
    border: "1px solid #333",
    background: "#0d0d1a",
    color: "#e0e0e0",
    fontSize: 14,
    outline: "none",
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
  },
  link: { color: "#888", fontSize: 13, textAlign: "center" },
  anchor: { color: "#6c9bff", textDecoration: "none" },
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/Login.tsx
git commit -m "feat: implement Login page with form and error handling"
```

---

### Task 2: Register Page

**Files:**
- Modify: `frontend/src/pages/Register.tsx`

- [ ] **Step 1: Implement Register page**

Replace `frontend/src/pages/Register.tsx` with:

```tsx
import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as api from "../api/client";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.register(form);
      navigate("/login");
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as Record<string, unknown>).response
      ) {
        const resp = (err as { response: { data: { error?: string } } })
          .response;
        setError(resp.data?.error || "Registration failed");
      } else {
        setError("Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h1 style={styles.title}>JEE Prep</h1>
        <p style={styles.subtitle}>Create your account</p>

        {error && <div style={styles.error}>{error}</div>}

        <input
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={(e) => handleChange("username", e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="text"
          placeholder="Full Name"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => handleChange("email", e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="tel"
          placeholder="Phone Number"
          value={form.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => handleChange("password", e.target.value)}
          style={styles.input}
          required
        />
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Registering..." : "Register"}
        </button>

        <p style={styles.link}>
          Already have an account?{" "}
          <Link to="/login" style={styles.anchor}>
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#0d0d1a",
  },
  form: {
    background: "#1a1a2e",
    padding: 32,
    borderRadius: 12,
    width: 360,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  title: { color: "#fff", margin: 0, textAlign: "center" },
  subtitle: { color: "#888", margin: 0, textAlign: "center", fontSize: 14 },
  error: {
    background: "#3a1a1a",
    color: "#ff6b6b",
    padding: 8,
    borderRadius: 6,
    fontSize: 13,
    textAlign: "center",
  },
  input: {
    padding: 10,
    borderRadius: 6,
    border: "1px solid #333",
    background: "#0d0d1a",
    color: "#e0e0e0",
    fontSize: 14,
    outline: "none",
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
  },
  link: { color: "#888", fontSize: 13, textAlign: "center" },
  anchor: { color: "#6c9bff", textDecoration: "none" },
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/Register.tsx
git commit -m "feat: implement Register page with form and validation"
```
