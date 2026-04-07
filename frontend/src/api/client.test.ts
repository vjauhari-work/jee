import { describe, it, expect } from "vitest";
import api, {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  getSections,
  getQuestionsByYear,
  getQuestionsByTopic,
  getTopics,
  getYears,
  getAnswer,
  startQuiz,
  getQuiz,
  submitAnswer,
  submitQuiz,
  getResults,
  getProgress,
  saveProgress,
  downloadTopicPDF,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkImport,
  upsertAnswer,
} from "./client";

describe("API client configuration", () => {
  it("has baseURL set to /api", () => {
    expect(api.defaults.baseURL).toBe("/api");
  });

  it("has withCredentials set to true", () => {
    expect(api.defaults.withCredentials).toBe(true);
  });

  it("has Content-Type header set to application/json", () => {
    const contentType =
      (api.defaults.headers as Record<string, Record<string, string>>)["Content-Type"] ??
      (api.defaults.headers as Record<string, Record<string, string>>)["common"]?.["Content-Type"] ??
      (api.defaults.headers as Record<string, Record<string, string>>)["post"]?.["Content-Type"];
    expect(contentType).toBe("application/json");
  });
});

describe("API client exported functions", () => {
  it("exports register as a function", () => {
    expect(typeof register).toBe("function");
  });

  it("exports login as a function", () => {
    expect(typeof login).toBe("function");
  });

  it("exports logout as a function", () => {
    expect(typeof logout).toBe("function");
  });

  it("exports getProfile as a function", () => {
    expect(typeof getProfile).toBe("function");
  });

  it("exports updateProfile as a function", () => {
    expect(typeof updateProfile).toBe("function");
  });

  it("exports changePassword as a function", () => {
    expect(typeof changePassword).toBe("function");
  });

  it("exports getSections as a function", () => {
    expect(typeof getSections).toBe("function");
  });

  it("exports getQuestionsByYear as a function", () => {
    expect(typeof getQuestionsByYear).toBe("function");
  });

  it("exports getQuestionsByTopic as a function", () => {
    expect(typeof getQuestionsByTopic).toBe("function");
  });

  it("exports getTopics as a function", () => {
    expect(typeof getTopics).toBe("function");
  });

  it("exports getYears as a function", () => {
    expect(typeof getYears).toBe("function");
  });

  it("exports getAnswer as a function", () => {
    expect(typeof getAnswer).toBe("function");
  });

  it("exports startQuiz as a function", () => {
    expect(typeof startQuiz).toBe("function");
  });

  it("exports getQuiz as a function", () => {
    expect(typeof getQuiz).toBe("function");
  });

  it("exports submitAnswer as a function", () => {
    expect(typeof submitAnswer).toBe("function");
  });

  it("exports submitQuiz as a function", () => {
    expect(typeof submitQuiz).toBe("function");
  });

  it("exports getResults as a function", () => {
    expect(typeof getResults).toBe("function");
  });

  it("exports getProgress as a function", () => {
    expect(typeof getProgress).toBe("function");
  });

  it("exports saveProgress as a function", () => {
    expect(typeof saveProgress).toBe("function");
  });

  it("exports downloadTopicPDF as a function", () => {
    expect(typeof downloadTopicPDF).toBe("function");
  });

  it("exports createQuestion as a function", () => {
    expect(typeof createQuestion).toBe("function");
  });

  it("exports updateQuestion as a function", () => {
    expect(typeof updateQuestion).toBe("function");
  });

  it("exports deleteQuestion as a function", () => {
    expect(typeof deleteQuestion).toBe("function");
  });

  it("exports bulkImport as a function", () => {
    expect(typeof bulkImport).toBe("function");
  });

  it("exports upsertAnswer as a function", () => {
    expect(typeof upsertAnswer).toBe("function");
  });

  it("exports the axios instance as default", () => {
    expect(api).toBeDefined();
    expect(typeof api.get).toBe("function");
    expect(typeof api.post).toBe("function");
    expect(typeof api.put).toBe("function");
    expect(typeof api.delete).toBe("function");
  });
});
