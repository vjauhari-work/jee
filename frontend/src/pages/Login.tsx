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
