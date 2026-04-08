import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import MePage from "./page";

jest.mock("next/link", () => ({
  __esModule: true,
  default({ children, href }: { children: ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  },
}));

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockUseAuth = jest.fn();
const mockUpdateProfile = jest.fn();
const mockFetchOffers = jest.fn();
const mockFetchComparisons = jest.fn();
const mockFetchMyPosts = jest.fn();
const mockFetchBookmarkedPosts = jest.fn();
const mockListCalculatorConfigs = jest.fn();
const mockListPlannerDocuments = jest.fn();
const mockDeleteOffer = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  usePathname: () => "/me",
}));

jest.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/lib/auth/api", () => ({
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
}));

jest.mock("@/lib/offers/api", () => ({
  fetchOffers: (...args: unknown[]) => mockFetchOffers(...args),
  fetchComparisons: (...args: unknown[]) => mockFetchComparisons(...args),
  fetchMyPosts: (...args: unknown[]) => mockFetchMyPosts(...args),
  fetchBookmarkedPosts: (...args: unknown[]) => mockFetchBookmarkedPosts(...args),
  deleteOffer: (...args: unknown[]) => mockDeleteOffer(...args),
  deleteComparison: jest.fn(),
  deletePost: jest.fn(),
  unbookmarkPost: jest.fn(),
}));

jest.mock("@/lib/paycheck/api", () => ({
  listCalculatorConfigs: (...args: unknown[]) => mockListCalculatorConfigs(...args),
  listPlannerDocuments: (...args: unknown[]) => mockListPlannerDocuments(...args),
  deleteCalculatorConfig: jest.fn(),
  deletePlannerDocument: jest.fn(),
  formatSavedItemTimestamp: () => "recently",
}));

describe("/me page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { username: "alice", email: "alice@example.com", role: "STUDENT" },
      token: "tok",
      isAuthenticated: true,
      isLoading: false,
      logout: jest.fn().mockResolvedValue(undefined),
      updateUser: jest.fn(),
    });
    mockFetchOffers.mockResolvedValue([]);
    mockFetchComparisons.mockResolvedValue([]);
    mockFetchMyPosts.mockResolvedValue([]);
    mockFetchBookmarkedPosts.mockResolvedValue([]);
    mockListCalculatorConfigs.mockResolvedValue([]);
    mockListPlannerDocuments.mockResolvedValue([]);
    mockDeleteOffer.mockResolvedValue(undefined);
  });

  it("redirects unauthenticated users to login", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      logout: jest.fn(),
      updateUser: jest.fn(),
    });

    render(<MePage />);

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/login?redirect=/me"),
    );
  });

  it("shows profile section for authenticated user", async () => {
    render(<MePage />);
    expect(await screen.findByText("My account")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("validates password change requires current password", async () => {
    const user = userEvent.setup({ delay: null });
    render(<MePage />);

    await user.click(await screen.findByRole("button", { name: "Edit" }));
    await user.type(screen.getByLabelText("New Password"), "new-pass");
    await user.type(screen.getByLabelText("Confirm Password"), "new-pass");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(
      await screen.findByText("Current password is required to set a new password."),
    ).toBeInTheDocument();
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it("shows a loading state while dashboard data is in flight", async () => {
    let finish!: () => void;
    const gate = new Promise<unknown[]>((resolve) => {
      finish = () => resolve([]);
    });
    mockFetchOffers.mockImplementation(() => gate);
    mockFetchComparisons.mockImplementation(() => gate);
    mockFetchMyPosts.mockImplementation(() => gate);
    mockFetchBookmarkedPosts.mockImplementation(() => gate);
    mockListCalculatorConfigs.mockImplementation(() => gate);
    mockListPlannerDocuments.mockImplementation(() => gate);

    render(<MePage />);

    expect(await screen.findAllByRole("status", { name: /loading/i })).not.toHaveLength(0);
    finish();
    await waitFor(() => expect(screen.queryAllByRole("status", { name: /loading/i })).toHaveLength(0));
  });

  it("shows load error and retries successfully", async () => {
    const user = userEvent.setup({ delay: null });
    mockFetchOffers
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValue([]);
    mockFetchComparisons.mockResolvedValue([]);
    mockFetchMyPosts.mockResolvedValue([]);
    mockFetchBookmarkedPosts.mockResolvedValue([]);
    mockListCalculatorConfigs.mockResolvedValue([]);
    mockListPlannerDocuments.mockResolvedValue([]);

    render(<MePage />);

    expect(await screen.findByText("Could not load saved data")).toBeInTheDocument();
    expect(screen.getByText("network down")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /try again/i }));

    await waitFor(() => expect(mockFetchOffers).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Saved offers")).toBeInTheDocument();
  });

  it("lists saved offers when data returns", async () => {
    mockFetchOffers.mockResolvedValue([
      {
        id: 1,
        company: "Acme",
        title: "Intern",
        employmentType: "internship",
        compensationType: "hourly",
        payAmount: 40,
        hoursPerWeek: 40,
        signOnBonus: null,
        relocationAmount: null,
        equityNotes: null,
        officeLocation: "Remote",
        daysInOffice: null,
        notes: null,
        favorite: null,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-02T00:00:00Z",
      },
    ]);
    mockFetchComparisons.mockResolvedValue([]);
    mockFetchMyPosts.mockResolvedValue([]);
    mockFetchBookmarkedPosts.mockResolvedValue([]);
    mockListCalculatorConfigs.mockResolvedValue([]);
    mockListPlannerDocuments.mockResolvedValue([]);

    render(<MePage />);

    expect(await screen.findByText(/Acme — Intern/)).toBeInTheDocument();
    expect(screen.getByText(/Internship/)).toBeInTheDocument();
  });

  it("requires current password when changing email", async () => {
    const user = userEvent.setup({ delay: null });
    render(<MePage />);

    await user.click(await screen.findByRole("button", { name: "Edit" }));
    const emailInput = screen.getByDisplayValue("alice@example.com");
    await user.clear(emailInput);
    await user.type(emailInput, "new@example.com");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(
      await screen.findByText("Current password is required to change your username or email."),
    ).toBeInTheDocument();
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it("deletes a saved offer after confirmation", async () => {
    const user = userEvent.setup({ delay: null });
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);

    mockFetchOffers.mockResolvedValue([
      {
        id: 1,
        company: "Acme",
        title: "Intern",
        employmentType: "internship",
        compensationType: "hourly",
        payAmount: 40,
        hoursPerWeek: 40,
        signOnBonus: null,
        relocationAmount: null,
        equityNotes: null,
        officeLocation: "Remote",
        daysInOffice: null,
        notes: null,
        favorite: null,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-02T00:00:00Z",
      },
    ]);

    render(<MePage />);

    await screen.findByText("Saved offers");
    const row = (await screen.findByText(/Acme/)).closest("li");
    expect(row).toBeTruthy();
    const buttons = within(row as HTMLElement).getAllByRole("button");
    const deleteBtn = buttons[buttons.length - 1];
    await user.click(deleteBtn);

    await waitFor(() =>
      expect(mockDeleteOffer).toHaveBeenCalledWith("tok", 1),
    );
    confirmSpy.mockRestore();
  });

  it("loads dashboard when listPlannerDocuments rejects (graceful degrade)", async () => {
    mockListPlannerDocuments.mockRejectedValue(new Error("planner unavailable"));
    render(<MePage />);
    await screen.findByText("Saved offers");
    expect(mockFetchOffers).toHaveBeenCalled();
  });

  it("confirms username change and calls updateProfile", async () => {
    const user = userEvent.setup({ delay: null });
    mockUpdateProfile.mockResolvedValue({
      username: "alice2",
      email: "alice@example.com",
      role: "STUDENT",
    });

    render(<MePage />);
    await user.click(await screen.findByRole("button", { name: "Edit" }));

    const usernameInput = screen.getByDisplayValue("alice");
    await user.clear(usernameInput);
    await user.type(usernameInput, "alice2");
    await user.type(screen.getByLabelText(/^Current Password$/i), "current-secret");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await user.click(await screen.findByRole("button", { name: /yes, save changes/i }));

    await waitFor(() =>
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        "tok",
        expect.objectContaining({
          username: "alice2",
          currentPassword: "current-secret",
        }),
      ),
    );
  });
});
