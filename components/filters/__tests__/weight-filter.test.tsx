import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WeightFilter } from "../weight-filter";
import type { WeightCategory } from "@/lib/types";

describe("WeightFilter", () => {
  it("Given no categories selected, When the component is rendered, Then all five weight checkboxes are visible and unchecked", () => {
    render(<WeightFilter selected={[]} onChange={vi.fn()} />);

    expect(screen.getByRole("checkbox", { name: "Light" })).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Medium Light" }),
    ).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Medium" })).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Medium Heavy" }),
    ).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Heavy" })).not.toBeChecked();
  });

  it("Given no categories selected, When the user selects 'Medium', Then onChange is called with ['Medium']", async () => {
    const onChange = vi.fn();
    render(<WeightFilter selected={[]} onChange={onChange} />);

    await userEvent.click(screen.getByRole("checkbox", { name: "Medium" }));

    expect(onChange).toHaveBeenCalledWith(["Medium"]);
  });

  it("Given 'Light' is already selected, When the user selects 'Heavy', Then onChange is called with ['Light', 'Heavy']", async () => {
    const onChange = vi.fn();
    render(<WeightFilter selected={["Light"]} onChange={onChange} />);

    await userEvent.click(screen.getByRole("checkbox", { name: "Heavy" }));

    expect(onChange).toHaveBeenCalledWith(["Light", "Heavy"]);
  });

  it("Given 'Medium' is selected, When the user deselects 'Medium', Then onChange is called with []", async () => {
    const onChange = vi.fn();
    render(<WeightFilter selected={["Medium"]} onChange={onChange} />);

    await userEvent.click(screen.getByRole("checkbox", { name: "Medium" }));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("Given multiple categories are selected, When the component is rendered, Then those checkboxes appear checked", () => {
    const selected: WeightCategory[] = ["Light", "Heavy"];
    render(<WeightFilter selected={selected} onChange={vi.fn()} />);

    expect(screen.getByRole("checkbox", { name: "Light" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Heavy" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Medium" })).not.toBeChecked();
  });
});
