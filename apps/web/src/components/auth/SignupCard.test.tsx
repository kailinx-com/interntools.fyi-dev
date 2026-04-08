import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignupCard } from "./SignupCard";

const mockPush = jest.fn();
const mockRegister = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ register: mockRegister }),
}));

describe("SignupCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("validates mismatched passwords", async () => {
    const user = userEvent.setup({ delay: null });
    render(<SignupCard />);

    await user.type(screen.getByLabelText("Username"), "newuser");
    await user.type(screen.getByLabelText("First name"), "New");
    await user.type(screen.getByLabelText("Last name"), "User");
    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "password456");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("submits valid payload and redirects to login", async () => {
    const user = userEvent.setup({ delay: null });
    mockRegister.mockResolvedValue({ id: 1 });
    render(<SignupCard />);

    await user.type(screen.getByLabelText("Username"), "newuser");
    await user.type(screen.getByLabelText("First name"), "New");
    await user.type(screen.getByLabelText("Last name"), "User");
    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith({
        username: "newuser",
        firstName: "New",
        lastName: "User",
        email: "new@example.com",
        password: "password123",
        role: "STUDENT",
      }),
    );
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("validates minimum password length", async () => {
    const user = userEvent.setup({ delay: null });
    render(<SignupCard />);

    await user.type(screen.getByLabelText("Username"), "newuser");
    await user.type(screen.getByLabelText("First name"), "New");
    await user.type(screen.getByLabelText("Last name"), "User");
    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.type(screen.getByLabelText("Confirm Password"), "short");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(
      await screen.findByText("Password must be at least 8 characters long."),
    ).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("uses generic fallback for unknown signup errors", async () => {
    const user = userEvent.setup({ delay: null });
    mockRegister.mockRejectedValue("boom");
    render(<SignupCard />);

    await user.type(screen.getByLabelText("Username"), "newuser");
    await user.type(screen.getByLabelText("First name"), "New");
    await user.type(screen.getByLabelText("Last name"), "User");
    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(
      await screen.findByText("Something went wrong while creating your account."),
    ).toBeInTheDocument();
  });

  it("extracts backend error from response.data.message shape", async () => {
    const user = userEvent.setup({ delay: null });
    mockRegister.mockRejectedValue({
      response: { data: { message: "Email already in use" } },
    });
    render(<SignupCard />);

    await user.type(screen.getByLabelText("Username"), "newuser");
    await user.type(screen.getByLabelText("First name"), "New");
    await user.type(screen.getByLabelText("Last name"), "User");
    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(await screen.findByText("Email already in use")).toBeInTheDocument();
  });

  it("validates required fields before submit", async () => {
    render(<SignupCard />);
    const form = screen.getByRole("button", { name: "Create Account" }).closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    expect(
      screen.getByText("Please fill in all required fields."),
    ).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("validates email format", async () => {
    const user = userEvent.setup({ delay: null });
    render(<SignupCard />);

    await user.type(screen.getByLabelText("Username"), "newuser");
    await user.type(screen.getByLabelText("First name"), "New");
    await user.type(screen.getByLabelText("Last name"), "User");
    await user.type(screen.getByLabelText("Email"), "x@y");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "password123");
    const form = screen.getByRole("button", { name: "Create Account" }).closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    expect(
      await screen.findByText("Please enter a valid email address."),
    ).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });
});
