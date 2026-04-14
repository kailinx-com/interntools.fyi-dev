import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import SavedOfferPage from "./page";

const mockReplace = jest.fn();
const mockFetchOffer = jest.fn();

const mockNav = { offerId: "7" as string };
const mockAuth = {
  token: "tok" as string | null,
  isAuthenticated: true,
  isLoading: false,
};

jest.mock("next/navigation", () => ({
  useParams: () => ({ offerId: mockNav.offerId }),
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => mockAuth,
}));

jest.mock("@/lib/offers/api", () => ({
  fetchOffer: (...args: unknown[]) => mockFetchOffer(...args),
}));

jest.mock("@/lib/paycheck/api", () => ({
  formatSavedItemTimestamp: (iso: string) => `formatted(${iso})`,
}));

jest.mock("@/components/layout/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => (
    <div data-testid="page-shell">{children}</div>
  ),
}));

const sampleOffer = {
  id: 7,
  company: "Acme",
  title: "Intern",
  employmentType: "internship" as const,
  compensationType: "hourly" as const,
  payAmount: 40,
  hoursPerWeek: 40,
  signOnBonus: null,
  relocationAmount: null,
  equityNotes: null,
  officeLocation: "Remote",
  daysInOffice: null as number | null,
  notes: null,
  favorite: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-02T00:00:00Z",
};

describe("Saved offer page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNav.offerId = "7";
    mockAuth.token = "tok";
    mockAuth.isAuthenticated = true;
    mockAuth.isLoading = false;
    mockFetchOffer.mockResolvedValue({ ...sampleOffer });
  });

  it("loads and shows the saved offer with navigation links", async () => {
    render(<SavedOfferPage />);

    await waitFor(() => expect(mockFetchOffer).toHaveBeenCalledWith("tok", 7));
    expect(await screen.findByText(/Acme — Intern/)).toBeInTheDocument();
    expect(screen.getByText(/Saved offer · Updated formatted/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /my account/i })).toHaveAttribute("href", "/me");
    expect(screen.getByRole("link", { name: /compare side-by-side/i })).toHaveAttribute(
      "href",
      "/offers/compare?offer=7",
    );
    expect(screen.getByRole("link", { name: /post an update/i })).toHaveAttribute(
      "href",
      "/offers/submit?offerId=7",
    );
    expect(screen.getByText("Internship")).toBeInTheDocument();
    expect(screen.getByText("Hourly")).toBeInTheDocument();
    expect(screen.getByText("$40/hr")).toBeInTheDocument();
    expect(screen.getByText("Remote")).toBeInTheDocument();
  });

  it("shows days in office when set", async () => {
    mockFetchOffer.mockResolvedValue({
      ...sampleOffer,
      daysInOffice: 3,
    });
    render(<SavedOfferPage />);

    expect(await screen.findByText("Days in office")).toBeInTheDocument();
    const daysRow = screen.getByText("Days in office").closest("div");
    expect(daysRow?.querySelector("dd")).toHaveTextContent("3");
  });

  it("redirects to login when unauthenticated", async () => {
    mockAuth.token = null;
    mockAuth.isAuthenticated = false;

    render(<SavedOfferPage />);

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/login?redirect=/offers/saved/7"),
    );
    expect(mockFetchOffer).not.toHaveBeenCalled();
  });

  it("shows spinner while auth is loading and does not fetch yet", () => {
    mockAuth.isLoading = true;

    render(<SavedOfferPage />);

    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
    expect(mockFetchOffer).not.toHaveBeenCalled();
  });

  it("shows error when offer id is not a valid number", async () => {
    mockNav.offerId = "not-a-number";

    render(<SavedOfferPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid offer.");
    expect(mockFetchOffer).not.toHaveBeenCalled();
  });

  it("shows error when fetchOffer fails", async () => {
    mockFetchOffer.mockRejectedValue(new Error("gone"));

    render(<SavedOfferPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not load this offer. It may have been deleted.",
    );
  });

  it("parses numeric offer id from params", async () => {
    mockNav.offerId = "42";
    mockFetchOffer.mockResolvedValue({ ...sampleOffer, id: 42 });

    render(<SavedOfferPage />);

    await waitFor(() => expect(mockFetchOffer).toHaveBeenCalledWith("tok", 42));
    expect(await screen.findByRole("link", { name: /compare side-by-side/i })).toHaveAttribute(
      "href",
      "/offers/compare?offer=42",
    );
  });
});
