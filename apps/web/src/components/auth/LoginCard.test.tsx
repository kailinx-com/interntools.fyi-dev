import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginCard } from "./LoginCard";

const mockPush = jest.fn();
const mockLogin = jest.fn();
const mockGet = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: (key: string) => mockGet(key) }),
}));

jest.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ login: mockLogin }),
}));

describe("LoginCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue(null);
  });

  it("shows backend error when login fails", async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error("Invalid username or password"));
    render(<LoginCard />);

    await user.type(screen.getByLabelText("Username or email"), "student");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() =>
      expect(screen.getByText("Invalid username or password")).toBeInTheDocument(),
    );
  });

  it("logs in and redirects to safe redirect path", async () => {
    const user = userEvent.setup();
    mockGet.mockReturnValue("/offers");
    mockLogin.mockResolvedValue({ username: "student" });
    render(<LoginCard />);

    await user.type(screen.getByLabelText("Username or email"), "student");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith({
        identifier: "student",
        password: "password123",
      }),
    );
    expect(mockPush).toHaveBeenCalledWith("/offers");
  });

  it("blocks unsafe redirect and falls back to /", async () => {
    const user = userEvent.setup();
    mockGet.mockReturnValue("https://evil.example.com");
    mockLogin.mockResolvedValue({ username: "student" });
    render(<LoginCard />);

    await user.type(screen.getByLabelText("Username or email"), "student");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));
  });

  it("blocks protocol-relative redirect and falls back to /", async () => {
    const user = userEvent.setup();
    mockGet.mockReturnValue("//evil.example.com");
    mockLogin.mockResolvedValue({ username: "student" });
    render(<LoginCard />);

    await user.type(screen.getByLabelText("Username or email"), "student");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));
  });

  it("shows fallback message when login fails without error message", async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue({});
    render(<LoginCard />);

    await user.type(screen.getByLabelText("Username or email"), "student");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(
      await screen.findByText("Login failed. Please check your credentials and try again."),
    ).toBeInTheDocument();
  });

  it("shows required fields message and does not submit on empty form", async () => {
    render(<LoginCard />);
    const form = screen.getByRole("button", { name: "Login" }).closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    expect(
      screen.getByText("Please enter your username/email and password."),
    ).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("disables inputs and button while submitting", async () => {
    const user = userEvent.setup();
    mockLogin.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ username: "student" }), 50);
        }),
    );
    render(<LoginCard />);

    await user.type(screen.getByLabelText("Username or email"), "student");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(screen.getByRole("button", { name: "Logging in..." })).toBeDisabled();
    expect(screen.getByLabelText("Username or email")).toBeDisabled();
    expect(screen.getByLabelText("Password")).toBeDisabled();
  });
});
