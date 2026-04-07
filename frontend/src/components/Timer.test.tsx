import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Timer from "./Timer";

describe("Timer", () => {
  it("renders initial time formatted as HH:MM:SS", () => {
    // 1 hour, 23 minutes, 45 seconds = 5025 seconds
    render(<Timer initialSeconds={5025} onTimeUp={vi.fn()} />);
    expect(screen.getByText("01:23:45")).toBeInTheDocument();
  });

  it("renders zero time as 00:00:00", () => {
    render(<Timer initialSeconds={0} onTimeUp={vi.fn()} />);
    expect(screen.getByText("00:00:00")).toBeInTheDocument();
  });

  it("renders time above 1 hour correctly", () => {
    // 2 hours exactly = 7200 seconds
    render(<Timer initialSeconds={7200} onTimeUp={vi.fn()} />);
    expect(screen.getByText("02:00:00")).toBeInTheDocument();
  });

  it("shows red styling (isLow) when time is below 5 minutes (under 300 seconds)", () => {
    render(<Timer initialSeconds={299} onTimeUp={vi.fn()} />);
    // The Timer div has background #3a1a1a when isLow
    const el = screen.getByText("00:04:59");
    expect(el).toHaveStyle({ color: "rgb(255, 107, 107)" });
  });

  it("shows normal styling when time is above 5 minutes", () => {
    render(<Timer initialSeconds={300} onTimeUp={vi.fn()} />);
    const el = screen.getByText("00:05:00");
    expect(el).toHaveStyle({ color: "rgb(224, 224, 224)" });
  });

  it("shows normal styling for a large time value", () => {
    render(<Timer initialSeconds={3600} onTimeUp={vi.fn()} />);
    const el = screen.getByText("01:00:00");
    expect(el).toHaveStyle({ background: "rgb(26, 26, 46)" });
  });

  it("shows red background when time is critically low", () => {
    render(<Timer initialSeconds={60} onTimeUp={vi.fn()} />);
    const el = screen.getByText("00:01:00");
    expect(el).toHaveStyle({ background: "rgb(58, 26, 26)" });
  });
});
