import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginForm from "./login-form";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock posthog-js
vi.mock("posthog-js", () => ({
  default: {
    capture: vi.fn(),
  },
}));

// Mock send-otp Server Action
vi.mock("@/features/auth/actions/send-otp", () => ({
  sendOTP: vi.fn(),
}));

import { sendOTP } from "@/features/auth/actions/send-otp";

describe("LoginForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render RewardLoop title and phone input field", () => {
    render(<LoginForm />);
    expect(screen.getByText("RewardLoop")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter 10-digit number")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("should enable Continue button when 10-digit number is entered", async () => {
    render(<LoginForm />);
    const input = screen.getByPlaceholderText("Enter 10-digit number");

    fireEvent.change(input, { target: { value: "9876543210" } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Continue" })).not.toBeDisabled();
    });
  });

  it("should call sendOTP and handle response when form submitted", async () => {
    vi.mocked(sendOTP).mockResolvedValueOnce({
      success: true,
    });

    render(<LoginForm />);
    const input = screen.getByPlaceholderText("Enter 10-digit number");

    fireEvent.change(input, { target: { value: "9876543210" } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Continue" })).not.toBeDisabled();
    });

    const submitBtn = screen.getByRole("button");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(sendOTP).toHaveBeenCalledWith({ phone: "9876543210" });
    });
  });
});

