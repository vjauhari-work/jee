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
