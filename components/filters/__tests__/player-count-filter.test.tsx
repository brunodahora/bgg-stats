import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlayerCountFilter } from "../player-count-filter";

describe("PlayerCountFilter", () => {
  it("Given 'Any' is selected, When the component is rendered, Then the 'Any' button appears pressed and all count buttons appear unpressed", () => {
    render(
      <PlayerCountFilter
        label="Recommended"
        selected="any"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Any" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "4" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("Given 'Any' is selected, When the user selects 4, Then onChange is called with 4", async () => {
    const onChange = vi.fn();
    render(
      <PlayerCountFilter
        label="Recommended"
        selected="any"
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "4" }));

    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("Given a count is selected, When the user clicks 'Any', Then onChange is called with 'any'", async () => {
    const onChange = vi.fn();
    render(<PlayerCountFilter label="Best" selected={4} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Any" }));

    expect(onChange).toHaveBeenCalledWith("any");
  });

  it("Given count 4 is selected, When the component is rendered, Then the '4' button appears pressed", () => {
    render(<PlayerCountFilter label="Best" selected={4} onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "4" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Any" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("Given the label prop is provided, When the component is rendered, Then the label text is visible", () => {
    render(
      <PlayerCountFilter
        label="Recommended Players"
        selected="any"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Recommended Players")).toBeInTheDocument();
  });

  it("Given the component is rendered, When inspecting the buttons, Then values 1 through 10 and 'Any' are all present", () => {
    render(
      <PlayerCountFilter label="Best" selected="any" onChange={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "Any" })).toBeInTheDocument();
    for (let n = 1; n <= 10; n++) {
      expect(
        screen.getByRole("button", { name: String(n) }),
      ).toBeInTheDocument();
    }
  });
});
