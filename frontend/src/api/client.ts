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
