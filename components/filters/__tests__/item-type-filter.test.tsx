import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ItemTypeFilter } from "../item-type-filter";
import type { ItemType } from "@/lib/types";

describe("ItemTypeFilter", () => {
  it("Given no types selected, When rendered, Then both checkboxes are unchecked", () => {
    render(<ItemTypeFilter selected={[]} onChange={() => {}} />);
    expect(
      screen.getByRole("checkbox", { name: "Standalone" }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Expansion" }),
    ).not.toBeChecked();
  });

  it("Given 'standalone' is selected, When rendered, Then only the Standalone checkbox is checked", () => {
    render(<ItemTypeFilter selected={["standalone"]} onChange={() => {}} />);
    expect(screen.getByRole("checkbox", { name: "Standalone" })).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Expansion" }),
    ).not.toBeChecked();
  });

  it("Given no types selected, When user checks 'Expansion', Then onChange is called with ['expansion']", async () => {
    const onChange = vi.fn();
    render(<ItemTypeFilter selected={[]} onChange={onChange} />);
    await userEvent.click(screen.getByRole("checkbox", { name: "Expansion" }));
    expect(onChange).toHaveBeenCalledWith(["expansion"]);
  });

  it("Given 'expansion' is selected, When user unchecks it, Then onChange is called with []", async () => {
    const onChange = vi.fn();
    render(<ItemTypeFilter selected={["expansion"]} onChange={onChange} />);
    await userEvent.click(screen.getByRole("checkbox", { name: "Expansion" }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("Given 'standalone' is selected, When user also checks 'Expansion', Then onChange is called with both types", async () => {
    const onChange = vi.fn();
    render(<ItemTypeFilter selected={["standalone"]} onChange={onChange} />);
    await userEvent.click(screen.getByRole("checkbox", { name: "Expansion" }));
    expect(onChange).toHaveBeenCalledWith(["standalone", "expansion"]);
  });

  it("Given both types selected, When rendered, Then both checkboxes are checked", () => {
    const selected: ItemType[] = ["standalone", "expansion"];
    render(<ItemTypeFilter selected={selected} onChange={() => {}} />);
    expect(screen.getByRole("checkbox", { name: "Standalone" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Expansion" })).toBeChecked();
  });
});
