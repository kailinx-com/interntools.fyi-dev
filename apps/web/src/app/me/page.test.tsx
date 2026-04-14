import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import MePage from "./page";

jest.mock("next/link", () => ({
  __esModule: true,
  default({
    children,
    href,
    ...rest
  }: {
    children: ReactNode;
    href: string;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
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
const mockDeletePost = jest.fn();
const mockDeleteComparison = jest.fn();
const mockUnbookmarkPost = jest.fn();
const mockDeleteCalculatorConfig = jest.fn();
const mockDeletePlannerDocument = jest.fn();

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
  deleteComparison: (...args: unknown[]) => mockDeleteComparison(...args),
  deletePost: (...args: unknown[]) => mockDeletePost(...args),
  unbookmarkPost: (...args: unknown[]) => mockUnbookmarkPost(...args),
}));

jest.mock("@/lib/paycheck/api", () => ({
  listCalculatorConfigs: (...args: unknown[]) => mockListCalculatorConfigs(...args),
  listPlannerDocuments: (...args: unknown[]) => mockListPlannerDocuments(...args),
  deleteCalculatorConfig: (...args: unknown[]) => mockDeleteCalculatorConfig(...args),
  deletePlannerDocument: (...args: unknown[]) => mockDeletePlannerDocument(...args),
  formatSavedItemTimestamp: () => "recently",
}));

const sampleDashboardOffer = {
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
};

describe("/me page", () => {
  let mockUpdateUser: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateUser = jest.fn();
    mockUseAuth.mockReturnValue({
      user: { username: "alice", email: "alice@example.com", role: "STUDENT" },
      token: "tok",
      isAuthenticated: true,
      isLoading: false,
      logout: jest.fn().mockResolvedValue(undefined),
      updateUser: mockUpdateUser,
    });
    mockFetchOffers.mockResolvedValue([]);
    mockFetchComparisons.mockResolvedValue([]);
    mockFetchMyPosts.mockResolvedValue([]);
    mockFetchBookmarkedPosts.mockResolvedValue([]);
    mockListCalculatorConfigs.mockResolvedValue([]);
    mockListPlannerDocuments.mockResolvedValue([]);
    mockDeleteOffer.mockResolvedValue(undefined);
    mockDeletePost.mockResolvedValue(undefined);
    mockDeleteComparison.mockResolvedValue(undefined);
    mockUnbookmarkPost.mockResolvedValue(undefined);
    mockDeleteCalculatorConfig.mockResolvedValue(undefined);
    mockDeletePlannerDocument.mockResolvedValue(undefined);
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

  it("does not show Admin console action for students", async () => {
    render(<MePage />);
    await screen.findByText("My account");
    expect(screen.queryByRole("link", { name: /admin console/i })).not.toBeInTheDocument();
    expect(
      screen.queryAllByRole("link").filter((el) => el.getAttribute("href") === "/admin"),
    ).toHaveLength(0);
  });

  it("shows Admin console link for admin users", async () => {
    mockUseAuth.mockReturnValue({
      user: {
        username: "root",
        email: "root@example.com",
        role: "ADMIN",
      },
      token: "tok",
      isAuthenticated: true,
      isLoading: false,
      logout: jest.fn().mockResolvedValue(undefined),
      updateUser: jest.fn(),
    });
    render(<MePage />);
    await screen.findByText("My account");
    const adminConsoleLinks = screen.getAllByRole("link", { name: /admin console/i });
    expect(adminConsoleLinks.some((a) => a.getAttribute("href") === "/admin")).toBe(true);
    expect(
      screen.queryAllByRole("link").filter((el) => el.getAttribute("href") === "/admin"),
    ).not.toHaveLength(0);
  });

  it("shows placeholders on profile edit fields", async () => {
    const user = userEvent.setup({ delay: null });
    render(<MePage />);
    await user.click(await screen.findByRole("button", { name: "Edit" }));
    expect(screen.getByPlaceholderText("your-username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Required to change")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("At least 8 characters")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Re-enter new password")).toBeInTheDocument();
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

  describe("Saved offers vs saved comparisons", () => {
    it("links each saved offer to the saved-offer detail page, not Compare", async () => {
      mockFetchOffers.mockResolvedValue([{ ...sampleDashboardOffer, id: 55 }]);
      mockFetchComparisons.mockResolvedValue([]);
      mockFetchMyPosts.mockResolvedValue([]);
      mockFetchBookmarkedPosts.mockResolvedValue([]);
      mockListCalculatorConfigs.mockResolvedValue([]);
      mockListPlannerDocuments.mockResolvedValue([]);

      render(<MePage />);

      await screen.findByText(/Acme — Intern/);
      const openSaved = screen.getByTitle("View saved offer");
      expect(openSaved.closest("a")).toHaveAttribute("href", "/offers/saved/55");
    });

    it("still lists a saved offer when that offer is also included in a comparison", async () => {
      mockFetchOffers.mockResolvedValue([{ ...sampleDashboardOffer, id: 10, company: "Globex" }]);
      mockFetchComparisons.mockResolvedValue([
        {
          id: 100,
          name: "Globex vs rivals",
          includedOfferIds: [10],
          description: null,
          isPublished: true,
          computedMetrics: null,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-02T00:00:00Z",
        },
      ]);
      mockFetchMyPosts.mockResolvedValue([]);
      mockFetchBookmarkedPosts.mockResolvedValue([]);
      mockListCalculatorConfigs.mockResolvedValue([]);
      mockListPlannerDocuments.mockResolvedValue([]);

      render(<MePage />);

      expect(await screen.findByText(/Globex — Intern/)).toBeInTheDocument();
      expect(screen.getByText("Globex vs rivals")).toBeInTheDocument();
      expect(screen.getByText("Offers: 10")).toBeInTheDocument();
    });

    it("links saved comparisons to Compare with the comparison query param", async () => {
      mockFetchOffers.mockResolvedValue([]);
      mockFetchComparisons.mockResolvedValue([
        {
          id: 42,
          name: "A vs B",
          includedOfferIds: [1, 2],
          description: null,
          isPublished: true,
          computedMetrics: null,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-02T00:00:00Z",
        },
      ]);
      mockFetchMyPosts.mockResolvedValue([]);
      mockFetchBookmarkedPosts.mockResolvedValue([]);
      mockListCalculatorConfigs.mockResolvedValue([]);
      mockListPlannerDocuments.mockResolvedValue([]);

      render(<MePage />);

      await screen.findByText("A vs B");
      const openBtn = screen.getByRole("link", { name: /open comparison/i });
      expect(openBtn).toHaveAttribute("href", "/offers/compare?comparison=42");
    });

    it("empty saved offers state points users to Compare offers to create saves", async () => {
      mockFetchOffers.mockResolvedValue([]);
      mockFetchComparisons.mockResolvedValue([]);
      mockFetchMyPosts.mockResolvedValue([]);
      mockFetchBookmarkedPosts.mockResolvedValue([]);
      mockListCalculatorConfigs.mockResolvedValue([]);
      mockListPlannerDocuments.mockResolvedValue([]);

      render(<MePage />);

      expect(await screen.findByText(/No saved offers yet/)).toBeInTheDocument();
      const emptyBlurb = screen.getByText(/No saved offers yet/).closest("p");
      expect(emptyBlurb).toBeTruthy();
      const compareLink = within(emptyBlurb as HTMLElement).getByRole("link", {
        name: "Compare offers",
      });
      expect(compareLink).toHaveAttribute("href", "/offers/compare");
    });
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

  it("deletes a post after confirmation and refreshes the list", async () => {
    const user = userEvent.setup({ delay: null });
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);

    mockFetchMyPosts
      .mockResolvedValueOnce([
        {
          id: 99,
          type: "acceptance",
          title: "My post title",
          officeLocation: null,
          visibility: "public_post",
          status: "published",
          authorUsername: "alice",
          publishedAt: "2026-01-01T00:00:00Z",
          createdAt: "2026-01-01T00:00:00Z",
          bookmarked: false,
        },
      ])
      .mockResolvedValueOnce([]);

    render(<MePage />);

    await screen.findByText("My posts");
    const row = (await screen.findByText("My post title")).closest("li");
    expect(row).toBeTruthy();
    const buttons = within(row as HTMLElement).getAllByRole("button");
    const deleteBtn = buttons[buttons.length - 1];
    await user.click(deleteBtn);

    await waitFor(() => expect(mockDeletePost).toHaveBeenCalledWith("tok", 99));
    await waitFor(() => expect(mockFetchMyPosts).toHaveBeenCalledTimes(2));

    confirmSpy.mockRestore();
  });

  it("shows an error when deleting a post fails", async () => {
    const user = userEvent.setup({ delay: null });
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
    mockDeletePost.mockRejectedValueOnce(new Error("Server said no"));

    mockFetchMyPosts.mockResolvedValue([
      {
        id: 5,
        type: "acceptance",
        title: "Fragile",
        officeLocation: null,
        visibility: "public_post",
        status: "published",
        authorUsername: "alice",
        publishedAt: "2026-01-01T00:00:00Z",
        createdAt: "2026-01-01T00:00:00Z",
        bookmarked: false,
      },
    ]);

    render(<MePage />);

    await screen.findByText("Fragile");
    const row = screen.getByText("Fragile").closest("li");
    const deleteBtn = within(row as HTMLElement).getAllByRole("button").pop()!;
    await user.click(deleteBtn);

    expect(await screen.findByRole("alert")).toHaveTextContent("Server said no");
    confirmSpy.mockRestore();
  });

  it("deletes a saved comparison after confirmation and refetches comparisons", async () => {
    const user = userEvent.setup({ delay: null });
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);

    mockFetchComparisons
      .mockResolvedValueOnce([
        {
          id: 42,
          name: "Vs Meta",
          includedOfferIds: [1, 2],
          description: null,
          isPublished: true,
          computedMetrics: null,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-02T00:00:00Z",
        },
      ])
      .mockResolvedValueOnce([]);

    render(<MePage />);

    await screen.findByText("Saved comparisons");
    const row = (await screen.findByText("Vs Meta")).closest("li");
    expect(row).toBeTruthy();
    const deleteBtn = within(row as HTMLElement).getAllByRole("button").pop()!;
    await user.click(deleteBtn);

    await waitFor(() => expect(mockDeleteComparison).toHaveBeenCalledWith("tok", 42));
    await waitFor(() => expect(mockFetchComparisons).toHaveBeenCalledTimes(2));
    confirmSpy.mockRestore();
  });

  it("removes a bookmark after confirmation and refetches bookmarks", async () => {
    const user = userEvent.setup({ delay: null });
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);

    mockFetchBookmarkedPosts
      .mockResolvedValueOnce([
        {
          id: 7,
          type: "acceptance",
          title: "Bookmarked read",
          officeLocation: null,
          visibility: "public_post",
          status: "published",
          authorUsername: "bob",
          publishedAt: "2026-06-01T00:00:00Z",
          createdAt: "2026-06-01T00:00:00Z",
          bookmarked: true,
        },
      ])
      .mockResolvedValueOnce([]);

    render(<MePage />);

    await screen.findByText("Bookmarked posts");
    const row = (await screen.findByText("Bookmarked read")).closest("li");
    await user.click(within(row as HTMLElement).getByTitle("Remove bookmark"));

    await waitFor(() => expect(mockUnbookmarkPost).toHaveBeenCalledWith("tok", 7));
    await waitFor(() => expect(mockFetchBookmarkedPosts).toHaveBeenCalledTimes(2));
    confirmSpy.mockRestore();
  });

  it("deletes a paycheck scenario after confirmation and refetches scenarios", async () => {
    const user = userEvent.setup({ delay: null });
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);

    mockListCalculatorConfigs
      .mockResolvedValueOnce([{ id: 3, name: "Bay Area 2026", createdAt: "2026-01-01T00:00:00Z" }])
      .mockResolvedValueOnce([]);

    render(<MePage />);

    await screen.findByText("Paycheck scenarios");
    const row = (await screen.findByText("Bay Area 2026")).closest("li");
    const deleteBtn = within(row as HTMLElement).getAllByRole("button").pop()!;
    await user.click(deleteBtn);

    await waitFor(() => expect(mockDeleteCalculatorConfig).toHaveBeenCalledWith("tok", 3));
    await waitFor(() => expect(mockListCalculatorConfigs).toHaveBeenCalledTimes(2));
    confirmSpy.mockRestore();
  });

  it("deletes a planner document after confirmation and refetches planners", async () => {
    const user = userEvent.setup({ delay: null });
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);

    mockListPlannerDocuments
      .mockResolvedValueOnce([
        { id: "planner-doc-1", name: "Budget A", createdAt: "2026-03-01T00:00:00Z" },
      ])
      .mockResolvedValueOnce([]);

    render(<MePage />);

    await screen.findByText("Planner documents");
    const row = (await screen.findByText("Budget A")).closest("li");
    const deleteBtn = within(row as HTMLElement).getAllByRole("button").pop()!;
    await user.click(deleteBtn);

    await waitFor(() => expect(mockDeletePlannerDocument).toHaveBeenCalledWith("tok", "planner-doc-1"));
    await waitFor(() => expect(mockListPlannerDocuments).toHaveBeenCalledTimes(2));
    confirmSpy.mockRestore();
  });

  it("shows an error when deleting a comparison fails", async () => {
    const user = userEvent.setup({ delay: null });
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
    mockDeleteComparison.mockRejectedValueOnce(new Error("Cannot delete comparison"));

    mockFetchComparisons.mockResolvedValue([
      {
        id: 99,
        name: "Bad comp",
        includedOfferIds: [],
        description: null,
        isPublished: false,
        computedMetrics: null,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ]);

    render(<MePage />);

    await screen.findByText("Bad comp");
    const row = screen.getByText("Bad comp").closest("li");
    await user.click(within(row as HTMLElement).getAllByRole("button").pop()!);

    expect(await screen.findByRole("alert")).toHaveTextContent("Cannot delete comparison");
    confirmSpy.mockRestore();
  });

  it("loads dashboard when listPlannerDocuments rejects (graceful degrade)", async () => {
    mockListPlannerDocuments.mockRejectedValue(new Error("planner unavailable"));
    render(<MePage />);
    await screen.findByText("Saved offers");
    expect(mockFetchOffers).toHaveBeenCalled();
  });

  it("confirms username change and calls updateProfile and updateUser", async () => {
    const user = userEvent.setup({ delay: null });
    const updated = {
      username: "alice2",
      email: "alice@example.com",
      role: "STUDENT",
    };
    mockUpdateProfile.mockResolvedValue(updated);

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
    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith(updated));
  });
});
