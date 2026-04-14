import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { getStoredToken } from "@/lib/auth/storage";
import HomePage from "./page";

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

jest.mock("@/components/layout/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => (
    <div data-testid="page-shell">{children}</div>
  ),
}));

jest.mock("@/components/landing", () => ({
  HomeLandingSections: () => (
    <>
      <div>Hero Section</div>
      <div>Stats Bar</div>
    </>
  ),
  CommunityNotesSection: () => <div>Community Notes Section</div>,
  FeatureHighlights: () => <div>Feature Highlights</div>,
}));

const mockedGetStoredToken = getStoredToken as jest.MockedFunction<typeof getStoredToken>;

describe("Home page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetStoredToken.mockReturnValue(null);
  });

  it("renders landing sections and CTA links", async () => {
    render(
      <AuthProvider>
        <HomePage />
      </AuthProvider>,
    );

    expect(screen.getByTestId("page-shell")).toBeInTheDocument();
    expect(screen.getByText("Hero Section")).toBeInTheDocument();
    expect(screen.getByText("Stats Bar")).toBeInTheDocument();
    expect(screen.getByText("Community Notes Section")).toBeInTheDocument();
    expect(screen.getByText("Feature Highlights")).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: /get started for free/i }),
      ).toHaveAttribute("href", "/signup");
    });
    expect(screen.getByRole("link", { name: /browse the community/i })).toHaveAttribute(
      "href",
      "/offers",
    );
  });
});
