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
