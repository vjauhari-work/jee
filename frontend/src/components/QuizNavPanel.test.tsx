import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import QuizNavPanel from "./QuizNavPanel";

const makeIds = (n: number) =>
  Array.from({ length: n }, (_, i) => `q${i + 1}`);

describe("QuizNavPanel", () => {
  it("renders correct number of question buttons", () => {
    const questionIds = makeIds(5);
    render(
      <QuizNavPanel
        totalQuestions={5}
        currentIndex={0}
        answeredQuestions={new Set()}
        questionIds={questionIds}
        onNavigate={vi.fn()}
      />
    );
    // Buttons are labeled 1-5
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByRole("button", { name: String(i) })).toBeInTheDocument();
    }
  });

  it("renders exactly the correct number of buttons", () => {
    const questionIds = makeIds(10);
    render(
      <QuizNavPanel
        totalQuestions={10}
        currentIndex={0}
        answeredQuestions={new Set()}
        questionIds={questionIds}
        onNavigate={vi.fn()}
      />
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(10);
  });

  it("highlights current question with distinct background", () => {
    const questionIds = makeIds(5);
    render(
      <QuizNavPanel
        totalQuestions={5}
        currentIndex={2}
        answeredQuestions={new Set()}
        questionIds={questionIds}
        onNavigate={vi.fn()}
      />
    );
    // Current question button (index 2 = label "3") has background #6c9bff
    const currentBtn = screen.getByRole("button", { name: "3" });
    expect(currentBtn).toHaveStyle({ background: "rgb(108, 155, 255)" });
  });

  it("gives non-current questions a different background", () => {
    const questionIds = makeIds(5);
    render(
      <QuizNavPanel
        totalQuestions={5}
        currentIndex={2}
        answeredQuestions={new Set()}
        questionIds={questionIds}
        onNavigate={vi.fn()}
      />
    );
    const otherBtn = screen.getByRole("button", { name: "1" });
    expect(otherBtn).not.toHaveStyle({ background: "rgb(108, 155, 255)" });
  });

  it("calls onNavigate with correct index when clicking a question button", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const questionIds = makeIds(5);
    render(
      <QuizNavPanel
        totalQuestions={5}
        currentIndex={0}
        answeredQuestions={new Set()}
        questionIds={questionIds}
        onNavigate={onNavigate}
      />
    );
    await user.click(screen.getByRole("button", { name: "3" }));
    expect(onNavigate).toHaveBeenCalledOnce();
    expect(onNavigate).toHaveBeenCalledWith(2);
  });

  it("calls onNavigate with index 0 when clicking the first button", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const questionIds = makeIds(5);
    render(
      <QuizNavPanel
        totalQuestions={5}
        currentIndex={2}
        answeredQuestions={new Set()}
        questionIds={questionIds}
        onNavigate={onNavigate}
      />
    );
    await user.click(screen.getByRole("button", { name: "1" }));
    expect(onNavigate).toHaveBeenCalledWith(0);
  });

  it("shows answered questions with different styling from unanswered", () => {
    const questionIds = makeIds(5);
    const answeredQuestions = new Set(["q2"]);
    render(
      <QuizNavPanel
        totalQuestions={5}
        currentIndex={0}
        answeredQuestions={answeredQuestions}
        questionIds={questionIds}
        onNavigate={vi.fn()}
      />
    );
    // Answered question (q2 = button "2") has background #2a4a2a
    const answeredBtn = screen.getByRole("button", { name: "2" });
    expect(answeredBtn).toHaveStyle({ background: "rgb(42, 74, 42)" });
    // Unanswered question (q3 = button "3") has background #1a1a2e
    const unansweredBtn = screen.getByRole("button", { name: "3" });
    expect(unansweredBtn).toHaveStyle({ background: "rgb(26, 26, 46)" });
  });

  it("renders legend labels", () => {
    const questionIds = makeIds(3);
    render(
      <QuizNavPanel
        totalQuestions={3}
        currentIndex={0}
        answeredQuestions={new Set()}
        questionIds={questionIds}
        onNavigate={vi.fn()}
      />
    );
    expect(screen.getByText("Current")).toBeInTheDocument();
    expect(screen.getByText("Answered")).toBeInTheDocument();
    expect(screen.getByText("Unanswered")).toBeInTheDocument();
  });
});
