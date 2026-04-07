import { useState, useEffect, FormEvent } from "react";
import * as api from "../api/client";
import { User } from "../types";

export default function EditProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getProfile()
      .then((res) => {
        const u = res.data as User;
        setUser(u);
        setEmail(u.email);
        setPhone(u.phone);
      })
      .catch(() => setProfileError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMsg("");
    setProfileError("");
    try {
      await api.updateProfile({ email, phone });
      setProfileMsg("Profile updated successfully");
    } catch {
      setProfileError("Failed to update profile");
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordMsg("");
    setPasswordError("");
    if (!currentPassword || !newPassword) {
      setPasswordError("Both fields are required");
      return;
    }
    try {
      await api.changePassword(currentPassword, newPassword);
      setPasswordMsg("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      setPasswordError("Current password is incorrect");
    }
  };

  if (loading) return <p style={{ color: "#888" }}>Loading...</p>;

  return (
    <div style={{ maxWidth: 500 }}>
      <h1 style={{ color: "#fff", margin: "0 0 24px" }}>Edit Profile</h1>

      {/* Profile info */}
      <form onSubmit={handleUpdateProfile} style={styles.section}>
        <h3 style={{ color: "#fff", margin: "0 0 12px" }}>
          Profile Information
        </h3>

        <label style={styles.label}>Username</label>
        <input
          value={user?.username || ""}
          disabled
          style={{ ...styles.input, opacity: 0.5 }}
        />

        <label style={styles.label}>Name</label>
        <input
          value={user?.name || ""}
          disabled
          style={{ ...styles.input, opacity: 0.5 }}
        />

        <label style={styles.label}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <label style={styles.label}>Phone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={styles.input}
        />

        {profileMsg && <div style={styles.success}>{profileMsg}</div>}
        {profileError && <div style={styles.error}>{profileError}</div>}

        <button type="submit" style={styles.button}>
          Save Changes
        </button>
      </form>

      {/* Change password */}
      <form onSubmit={handleChangePassword} style={styles.section}>
        <h3 style={{ color: "#fff", margin: "0 0 12px" }}>Change Password</h3>

        <label style={styles.label}>Current Password</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          style={styles.input}
        />

        <label style={styles.label}>New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={styles.input}
        />

        {passwordMsg && <div style={styles.success}>{passwordMsg}</div>}
        {passwordError && <div style={styles.error}>{passwordError}</div>}

        <button type="submit" style={styles.button}>
          Change Password
        </button>
      </form>
    </div>
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
  label: { color: "#888", fontSize: 12, marginTop: 4 },
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
