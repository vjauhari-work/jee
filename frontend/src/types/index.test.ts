import { describe, it, expect } from "vitest";
import type {
  User,
  Option,
  Question,
  Approach,
  Answer,
  TopicScore,
  QuizSession,
  QuizResponse,
  GradeResult,
  UserProgress,
  Section,
  LoginResponse,
} from "./index";

// These tests verify that sample objects conforming to each interface compile
// correctly, and their runtime shape is as expected.

describe("Type: User", () => {
  it("creates a valid User object", () => {
    const user: User = {
      id: "u1",
      username: "alice",
      name: "Alice",
      email: "alice@example.com",
      phone: "1234567890",
      role: "student",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
    };
    expect(user.role).toBe("student");
    expect(user.username).toBe("alice");
  });

  it("accepts admin role", () => {
    const admin: User = {
      id: "u2",
      username: "admin",
      name: "Admin User",
      email: "admin@example.com",
      phone: "0000000000",
      role: "admin",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
    };
    expect(admin.role).toBe("admin");
  });
});

describe("Type: Option", () => {
  it("creates a valid Option object", () => {
    const option: Option = { label: "A", text: "Some option text" };
    expect(option.label).toBe("A");
    expect(option.text).toBe("Some option text");
  });
});

describe("Type: Question", () => {
  it("creates a valid Question object", () => {
    const question: Question = {
      id: "q1",
      section: "JEE Main",
      subject: "Mathematics",
      topic: "Algebra",
      year: 2023,
      question_text: "Solve for x",
      question_images: [],
      options: [
        { label: "A", text: "1" },
        { label: "B", text: "2" },
      ],
      difficulty: "medium",
    };
    expect(question.subject).toBe("Mathematics");
    expect(question.options).toHaveLength(2);
    expect(question.year).toBe(2023);
  });
});

describe("Type: Approach", () => {
  it("creates a valid Approach object", () => {
    const approach: Approach = {
      title: "Method 1",
      explanation: "Use substitution",
      images: [],
    };
    expect(approach.title).toBe("Method 1");
  });
});

describe("Type: Answer", () => {
  it("creates a valid Answer object", () => {
    const answer: Answer = {
      id: "a1",
      question_id: "q1",
      final_answer: "B",
      approaches: [
        { title: "Direct", explanation: "Straightforward", images: [] },
      ],
    };
    expect(answer.final_answer).toBe("B");
    expect(answer.approaches).toHaveLength(1);
  });
});

describe("Type: TopicScore", () => {
  it("creates a valid TopicScore object", () => {
    const score: TopicScore = { correct: 7, total: 10 };
    expect(score.correct).toBe(7);
    expect(score.total).toBe(10);
  });
});

describe("Type: QuizSession", () => {
  it("creates a valid in-progress QuizSession", () => {
    const session: QuizSession = {
      id: "s1",
      user_id: "u1",
      section: "JEE Main",
      type: "quiz",
      questions: ["q1", "q2"],
      answers_given: { q1: "A" },
      status: "in_progress",
      score: null,
      topic_breakdown: null,
      started_at: "2024-01-01T10:00:00Z",
      expires_at: "2024-01-01T13:00:00Z",
      completed_at: null,
    };
    expect(session.status).toBe("in_progress");
    expect(session.score).toBeNull();
  });

  it("creates a completed QuizSession with score", () => {
    const session: QuizSession = {
      id: "s2",
      user_id: "u1",
      section: "JEE Main",
      type: "pyq_year",
      questions: ["q1"],
      answers_given: { q1: "B" },
      status: "completed",
      score: 4,
      topic_breakdown: { Algebra: { correct: 1, total: 1 } },
      started_at: "2024-01-01T10:00:00Z",
      expires_at: "2024-01-01T13:00:00Z",
      completed_at: "2024-01-01T11:00:00Z",
    };
    expect(session.status).toBe("completed");
    expect(session.score).toBe(4);
  });
});

describe("Type: QuizResponse", () => {
  it("creates a valid QuizResponse object", () => {
    const session: QuizSession = {
      id: "s1",
      user_id: "u1",
      section: "JEE Main",
      type: "quiz",
      questions: ["q1"],
      answers_given: {},
      status: "in_progress",
      score: null,
      topic_breakdown: null,
      started_at: "2024-01-01T10:00:00Z",
      expires_at: "2024-01-01T13:00:00Z",
      completed_at: null,
    };
    const response: QuizResponse = {
      session,
      questions: [],
      time_remaining: 10800,
    };
    expect(response.time_remaining).toBe(10800);
  });
});

describe("Type: GradeResult", () => {
  it("creates a valid GradeResult object", () => {
    const result: GradeResult = {
      score: 72,
      topic_breakdown: {
        Algebra: { correct: 8, total: 10 },
        Calculus: { correct: 4, total: 10 },
      },
      weak_topics: ["Calculus"],
    };
    expect(result.score).toBe(72);
    expect(result.weak_topics).toContain("Calculus");
  });
});

describe("Type: UserProgress", () => {
  it("creates a valid UserProgress object", () => {
    const progress: UserProgress = {
      id: "p1",
      user_id: "u1",
      section: "JEE Main",
      type: "quiz",
      filter_value: "2023",
      last_question_index: 5,
      quiz_session_id: "s1",
      updated_at: "2024-01-01T12:00:00Z",
    };
    expect(progress.last_question_index).toBe(5);
  });
});

describe("Type: Section", () => {
  it("creates a valid Section object", () => {
    const section: Section = {
      id: "sec1",
      name: "JEE Main",
      description: "Joint Entrance Examination Main",
    };
    expect(section.name).toBe("JEE Main");
  });
});

describe("Type: LoginResponse", () => {
  it("creates a valid LoginResponse object", () => {
    const response: LoginResponse = {
      message: "Login successful",
      user_id: "u1",
      username: "alice",
      name: "Alice",
      role: "student",
    };
    expect(response.message).toBe("Login successful");
    expect(response.role).toBe("student");
  });
});
