import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import QuestionCard from "./QuestionCard";
import { Question } from "../types";

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: "q1",
    section: "jee_mains",
    subject: "physics",
    topic: "Kinematics",
    year: 2024,
    question_text: "What is velocity?",
    question_images: [],
    options: [
      { label: "A", text: "Speed with direction" },
      { label: "B", text: "Distance over time" },
    ],
    difficulty: "easy",
    ...overrides,
  };
}

describe("QuestionCard", () => {
  it("renders question text and options", () => {
    render(<QuestionCard question={makeQuestion()} index={0} />);
    expect(screen.getByText("What is velocity?")).toBeInTheDocument();
    expect(screen.getByText("Speed with direction")).toBeInTheDocument();
    expect(screen.getByText("Q1")).toBeInTheDocument();
  });

  it("renders $...$ segments as KaTeX markup", () => {
    const { container } = render(
      <QuestionCard
        question={makeQuestion({ question_text: "Solve $x^2$ now" })}
        index={0}
      />
    );
    expect(container.querySelector(".katex")).not.toBeNull();
    expect(container.textContent).toContain("Solve");
    expect(container.textContent).toContain("now");
  });

  it("escapes HTML in question text (stored XSS)", () => {
    const { container } = render(
      <QuestionCard
        question={makeQuestion({
          question_text: '<img src=x onerror="window.__pwned=1"> hello',
        })}
        index={0}
      />
    );
    expect(container.querySelector("img")).toBeNull();
    expect((window as unknown as Record<string, unknown>).__pwned).toBeUndefined();
    expect(container.textContent).toContain(
      '<img src=x onerror="window.__pwned=1"> hello'
    );
  });

  it("escapes HTML in option text (stored XSS)", () => {
    const { container } = render(
      <QuestionCard
        question={makeQuestion({
          options: [{ label: "A", text: "<script>window.__pwned=2</script>safe" }],
        })}
        index={0}
      />
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain("safe");
  });

  it("escapes HTML outside math while still rendering math", () => {
    const { container } = render(
      <QuestionCard
        question={makeQuestion({
          question_text: "<b>bold</b> and $y = mx$",
        })}
        index={0}
      />
    );
    expect(container.querySelector("b")).toBeNull();
    expect(container.querySelector(".katex")).not.toBeNull();
  });
});
