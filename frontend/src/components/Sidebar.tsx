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
