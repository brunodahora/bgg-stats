import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TimeFilter } from "../time-filter";

describe("TimeFilter", () => {
  it("Given a time range, When the component is rendered, Then the range label is displayed", () => {
    render(
      <TimeFilter min={0} max={300} value={[30, 120]} onChange={vi.fn()} />,
    );

    expect(screen.getByText("30–120 min")).toBeInTheDocument();
  });

  it("Given min equals max in the value, When the component is rendered, Then the label shows the same value for both ends", () => {
    render(
      <TimeFilter min={0} max={300} value={[60, 60]} onChange={vi.fn()} />,
    );

    expect(screen.getByText("60–60 min")).toBeInTheDocument();
  });

  it("Given a range slider, When the user presses ArrowRight on the min handle, Then onChange is called with an increased min value", () => {
    const onChange = vi.fn();
    render(
      <TimeFilter min={0} max={300} value={[30, 120]} onChange={onChange} />,
    );

    const thumbs = screen.getAllByRole("slider");
    fireEvent.keyDown(thumbs[0], { key: "ArrowRight", code: "ArrowRight" });

    expect(onChange).toHaveBeenCalled();
    const [newMin] = onChange.mock.calls[0][0] as [number, number];
    expect(newMin).toBeGreaterThan(30);
  });

  it("Given a range slider, When the user presses ArrowLeft on the max handle, Then onChange is called with a decreased max value", () => {
    const onChange = vi.fn();
    render(
      <TimeFilter min={0} max={300} value={[30, 120]} onChange={onChange} />,
    );

    const thumbs = screen.getAllByRole("slider");
    fireEvent.keyDown(thumbs[1], { key: "ArrowLeft", code: "ArrowLeft" });

    expect(onChange).toHaveBeenCalled();
    const [, newMax] = onChange.mock.calls[0][0] as [number, number];
    expect(newMax).toBeLessThan(120);
  });
});
