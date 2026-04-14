import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { getCurrentUser } from "@/lib/auth/api";
import { getStoredToken } from "@/lib/auth/storage";
import { HomeCta } from "./HomeCta";

jest.mock("@/lib/auth/api", () => ({
  getCurrentUser: jest.fn(),
  loginUser: jest.fn(),
  logoutUser: jest.fn(),
  registerUser: jest.fn(),
}));

jest.mock("@/lib/auth/storage", () => ({
  getStoredToken: jest.fn(),
  setStoredToken: jest.fn(),
  clearStoredToken: jest.fn(),
}));

const mockedGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
const mockedGetStoredToken = getStoredToken as jest.MockedFunction<typeof getStoredToken>;

function renderWithAuth() {
  return render(
    <AuthProvider>
      <HomeCta />
    </AuthProvider>,
  );
}

describe("HomeCta", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows sign-up CTA for anonymous users", async () => {
    mockedGetStoredToken.mockReturnValue(null);

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText("Get started for free")).toBeInTheDocument();
    });

    expect(screen.getByText("Ready to make a smarter offer decision?")).toBeInTheDocument();
    expect(screen.getByText("No credit card required.")).toBeInTheDocument();
    expect(screen.queryByText("My Dashboard")).not.toBeInTheDocument();
  });

  it("shows personalized CTA for logged-in users", async () => {
    mockedGetStoredToken.mockReturnValue("tok");
    mockedGetCurrentUser.mockResolvedValue({
      id: BigInt(1),
      username: "student",
      email: "student@example.com",
      role: "STUDENT",
      firstName: "Alice",
      lastName: "Smith",
    });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText("My Dashboard")).toBeInTheDocument();
    });

    expect(screen.getByText("Keep exploring your tools")).toBeInTheDocument();
    expect(screen.getByText("Compare Offers")).toBeInTheDocument();
    expect(screen.getByText("Browse Community")).toBeInTheDocument();
    expect(screen.queryByText("Get started for free")).not.toBeInTheDocument();
    expect(screen.queryByText("No credit card required.")).not.toBeInTheDocument();
  });

  it("My Dashboard link points to /me", async () => {
    mockedGetStoredToken.mockReturnValue("tok");
    mockedGetCurrentUser.mockResolvedValue({
      id: BigInt(1),
      username: "student",
      email: "student@example.com",
      role: "STUDENT",
      firstName: "Alice",
      lastName: "Smith",
    });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText("My Dashboard")).toBeInTheDocument();
    });

    expect(screen.getByText("My Dashboard").closest("a")).toHaveAttribute("href", "/me");
  });

  it("Get started for free link points to /signup for anonymous users", async () => {
    mockedGetStoredToken.mockReturnValue(null);

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText("Get started for free")).toBeInTheDocument();
    });

    expect(screen.getByText("Get started for free").closest("a")).toHaveAttribute("href", "/signup");
  });
});
