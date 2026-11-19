import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResizeHandle } from "./ResizeHandle";

function setup(over: Partial<Parameters<typeof ResizeHandle>[0]> = {}) {
  const onChange = vi.fn();
  render(<ResizeHandle orientation="vertical" direction={1} label="Resize" value={100} min={50} max={200} onChange={onChange} {...over} />);
  return { onChange, handle: screen.getByRole("separator", { name: "Resize" }) };
}

describe("ResizeHandle", () => {
  it("exposes aria values and orientation", () => {
    const { handle } = setup();
    expect(handle).toHaveAttribute("aria-valuenow", "100");
    expect(handle).toHaveAttribute("aria-valuemin", "50");
    expect(handle).toHaveAttribute("aria-valuemax", "200");
    expect(handle).toHaveAttribute("aria-orientation", "vertical");
  });
  it("arrow keys step by 24 and respect direction", async () => {
    const { onChange, handle } = setup();
    handle.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith(124);
    await userEvent.keyboard("{ArrowLeft}");
    expect(onChange).toHaveBeenLastCalledWith(76);
  });
  it("direction -1 inverts the arrows", async () => {
    const { onChange, handle } = setup({ direction: -1 });
    handle.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith(76);
  });
  it("horizontal uses up/down and ignores left/right", async () => {
    const { onChange, handle } = setup({ orientation: "horizontal" });
    handle.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(onChange).toHaveBeenLastCalledWith(124);
    await userEvent.keyboard("{ArrowUp}");
    expect(onChange).toHaveBeenLastCalledWith(76);
    onChange.mockClear();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).not.toHaveBeenCalled();
  });
  it("Home and End jump to min and max; values clamp", async () => {
    const { onChange, handle } = setup({ value: 190 });
    handle.focus();
    await userEvent.keyboard("{Home}");
    expect(onChange).toHaveBeenLastCalledWith(50);
    await userEvent.keyboard("{End}");
    expect(onChange).toHaveBeenLastCalledWith(200);
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith(200);
  });
});
