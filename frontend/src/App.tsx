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
