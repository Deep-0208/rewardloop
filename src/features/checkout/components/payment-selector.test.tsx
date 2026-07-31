import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PaymentSelector } from "./payment-selector";

describe("PaymentSelector Component", () => {
  it("should render Cash and Online payment options", () => {
    render(<PaymentSelector value="cash" onChange={vi.fn()} />);
    expect(screen.getByText("Cash")).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();
  });

  it("should call onChange with 'online' when Online option is clicked", () => {
    const handleChange = vi.fn();
    render(<PaymentSelector value="cash" onChange={handleChange} />);

    const onlineLabel = screen.getByText("Online");
    fireEvent.click(onlineLabel);

    expect(handleChange).toHaveBeenCalledWith("online");
  });
});
