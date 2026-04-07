import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import TopicBreakdown from "./TopicBreakdown";
import { TopicScore } from "../types";

describe("TopicBreakdown", () => {
  const breakdown: Record<string, TopicScore> = {
    Algebra: { correct: 8, total: 10 },
    Calculus: { correct: 3, total: 10 },
    Geometry: { correct: 5, total: 10 },
  };

  it("renders all topic names", () => {
    render(<TopicBreakdown breakdown={breakdown} weakTopics={[]} />);
    expect(screen.getByText("Algebra")).toBeInTheDocument();
    expect(screen.getByText("Calculus")).toBeInTheDocument();
    expect(screen.getByText("Geometry")).toBeInTheDocument();
  });

  it("shows Weak badge for weak topics", () => {
    render(<TopicBreakdown breakdown={breakdown} weakTopics={["Calculus"]} />);
    const weakBadges = screen.getAllByText("Weak");
    expect(weakBadges).toHaveLength(1);
    expect(weakBadges[0]).toBeInTheDocument();
  });

  it("does not show Weak badge for non-weak topics", () => {
    render(<TopicBreakdown breakdown={breakdown} weakTopics={["Calculus"]} />);
    // Only one Weak badge should appear
    expect(screen.getAllByText("Weak")).toHaveLength(1);
  });

  it("shows Weak badges for multiple weak topics", () => {
    render(
      <TopicBreakdown
        breakdown={breakdown}
        weakTopics={["Calculus", "Geometry"]}
      />
    );
    expect(screen.getAllByText("Weak")).toHaveLength(2);
  });

  it("calculates and displays correct percentages", () => {
    render(<TopicBreakdown breakdown={breakdown} weakTopics={[]} />);
    // Algebra: 8/10 = 80%
    expect(screen.getByText("8/10 (80%)")).toBeInTheDocument();
    // Calculus: 3/10 = 30%
    expect(screen.getByText("3/10 (30%)")).toBeInTheDocument();
    // Geometry: 5/10 = 50%
    expect(screen.getByText("5/10 (50%)")).toBeInTheDocument();
  });

  it("displays 0% when total is zero", () => {
    const emptyScoreBreakdown: Record<string, TopicScore> = {
      Physics: { correct: 0, total: 0 },
    };
    render(<TopicBreakdown breakdown={emptyScoreBreakdown} weakTopics={[]} />);
    expect(screen.getByText("0/0 (0%)")).toBeInTheDocument();
  });

  it("handles empty breakdown without rendering any rows", () => {
    const { container } = render(
      <TopicBreakdown breakdown={{}} weakTopics={[]} />
    );
    // The root div should be empty when no topics
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv.children).toHaveLength(0);
  });

  it("rounds percentage to nearest integer", () => {
    const oddBreakdown: Record<string, TopicScore> = {
      Chemistry: { correct: 1, total: 3 },
    };
    render(<TopicBreakdown breakdown={oddBreakdown} weakTopics={[]} />);
    // 1/3 = 33.33% => rounds to 33%
    expect(screen.getByText("1/3 (33%)")).toBeInTheDocument();
  });
});
