import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import ProfilePage from "./page";

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
const mockUseAuth = jest.fn();
const mockUpdateProfile = jest.fn();
const mockFetchMyPosts = jest.fn();
const mockFetchBookmarkedPosts = jest.fn();
const mockFetchOwnProfile = jest.fn();
const mockFetchFollowers = jest.fn();
const mockFetchFollowing = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn() }),
  usePathname: () => "/profile",
}));

jest.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/lib/auth/api", () => ({
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
}));

jest.mock("@/lib/offers/api", () => ({
  fetchMyPosts: (...args: unknown[]) => mockFetchMyPosts(...args),
  fetchBookmarkedPosts: (...args: unknown[]) => mockFetchBookmarkedPosts(...args),
}));

jest.mock("@/lib/paycheck/api", () => ({
  formatSavedItemTimestamp: () => "recently",
}));

jest.mock("@/lib/profile/api", () => ({
  fetchOwnProfile: (...args: unknown[]) => mockFetchOwnProfile(...args),
  fetchFollowers: (...args: unknown[]) => mockFetchFollowers(...args),
  fetchFollowing: (...args: unknown[]) => mockFetchFollowing(...args),
}));

const sampleUser = {
  id: 1,
  username: "alice",
  email: "alice@example.com",
  role: "STUDENT",
  firstName: "Alice",
  lastName: "Smith",
};

const sampleProfile = {
  id: 1,
  username: "alice",
  email: "alice@example.com",
  role: "STUDENT",
  firstName: "Alice",
  lastName: "Smith",
  createdAt: "2024-01-01T00:00:00Z",
  followerCount: 3,
  followingCount: 2,
};

function createAuth(overrides = {}) {
  return {
    user: sampleUser,
    token: "tok",
    isAuthenticated: true,
    isLoading: false,
    updateUser: jest.fn(),
    ...overrides,
  };
}

describe("/profile page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue(createAuth());
    mockFetchOwnProfile.mockResolvedValue(sampleProfile);
    mockFetchMyPosts.mockResolvedValue([]);
    mockFetchBookmarkedPosts.mockResolvedValue([]);
    mockFetchFollowers.mockResolvedValue([]);
    mockFetchFollowing.mockResolvedValue([]);
  });

  it("redirects unauthenticated users to /login?redirect=/profile", async () => {
    mockUseAuth.mockReturnValue(
      createAuth({ user: null, token: null, isAuthenticated: false }),
    );

    render(<ProfilePage />);

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/login?redirect=/profile"),
    );
  });

  it("renders the My Profile heading for authenticated user", async () => {
    render(<ProfilePage />);
    expect(await screen.findByText("My Profile")).toBeInTheDocument();
  });

  it("shows personal info from auth user context", async () => {
    render(<ProfilePage />);

    await screen.findByText("My Profile");
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Smith")).toBeInTheDocument();
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("STUDENT")).toBeInTheDocument();
  });

  it("shows follower and following counts after profile loads", async () => {
    render(<ProfilePage />);

    // counts appear inside the profile header area after fetchOwnProfile resolves
    expect(await screen.findByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("opens the edit form with pre-filled values when Edit is clicked", async () => {
    const u = userEvent.setup({ delay: null });
    render(<ProfilePage />);

    await u.click(await screen.findByRole("button", { name: /edit/i }));

    expect(screen.getByLabelText("First name")).toHaveValue("Alice");
    expect(screen.getByLabelText("Last name")).toHaveValue("Smith");
    expect(screen.getByLabelText("Username")).toHaveValue("alice");
    expect(screen.getByLabelText("Email")).toHaveValue("alice@example.com");
  });

  it("saves firstName/lastName without requiring current password", async () => {
    const updateUser = jest.fn();
    mockUseAuth.mockReturnValue(createAuth({ updateUser }));
    mockUpdateProfile.mockResolvedValue({ ...sampleUser, firstName: "Alicia" });
    mockFetchOwnProfile
      .mockResolvedValueOnce(sampleProfile)
      .mockResolvedValueOnce({ ...sampleProfile, firstName: "Alicia" });

    const u = userEvent.setup({ delay: null });
    render(<ProfilePage />);

    await u.click(await screen.findByRole("button", { name: /edit/i }));
    await u.clear(screen.getByLabelText("First name"));
    await u.type(screen.getByLabelText("First name"), "Alicia");
    await u.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        "tok",
        expect.objectContaining({ firstName: "Alicia" }),
      ),
    );
    expect(updateUser).toHaveBeenCalled();
  });

  it("closes the edit form on Cancel", async () => {
    const u = userEvent.setup({ delay: null });
    render(<ProfilePage />);

    await u.click(await screen.findByRole("button", { name: /edit/i }));
    expect(screen.getByLabelText("First name")).toBeInTheDocument();

    await u.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByLabelText("First name")).not.toBeInTheDocument();
  });

  it("shows error when new passwords do not match", async () => {
    const u = userEvent.setup({ delay: null });
    render(<ProfilePage />);

    await u.click(await screen.findByRole("button", { name: /edit/i }));
    await u.type(screen.getByLabelText("New password"), "newpass1");
    await u.type(screen.getByLabelText("Confirm password"), "different");
    await u.click(screen.getByRole("button", { name: /save changes/i }));

    expect(
      await screen.findByText("New passwords do not match."),
    ).toBeInTheDocument();
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it("shows error when new password is set without current password", async () => {
    const u = userEvent.setup({ delay: null });
    render(<ProfilePage />);

    await u.click(await screen.findByRole("button", { name: /edit/i }));
    await u.type(screen.getByLabelText("New password"), "newpass1");
    await u.type(screen.getByLabelText("Confirm password"), "newpass1");
    await u.click(screen.getByRole("button", { name: /save changes/i }));

    expect(
      await screen.findByText(
        "Current password is required to set a new password.",
      ),
    ).toBeInTheDocument();
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it("shows error when changing username without current password", async () => {
    const u = userEvent.setup({ delay: null });
    render(<ProfilePage />);

    await u.click(await screen.findByRole("button", { name: /edit/i }));
    await u.clear(screen.getByLabelText("Username"));
    await u.type(screen.getByLabelText("Username"), "alice2");
    await u.click(screen.getByRole("button", { name: /save changes/i }));

    expect(
      await screen.findByText(
        "Current password is required to change your username or email.",
      ),
    ).toBeInTheDocument();
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it("shows 'Not following anyone yet' empty state in Following section", async () => {
    render(<ProfilePage />);

    expect(
      await screen.findByText(/not following anyone yet/i),
    ).toBeInTheDocument();
  });

  it("renders following list items with profile links", async () => {
    mockFetchFollowing.mockResolvedValue([
      { id: 99, username: "bob", firstName: "Bob", lastName: "Jones" },
    ]);

    render(<ProfilePage />);

    const link = await screen.findByRole("link", { name: "@bob" });
    expect(link).toHaveAttribute("href", "/profile/99");
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("renders followers list items with profile links", async () => {
    mockFetchFollowers.mockResolvedValue([
      { id: 55, username: "carol", firstName: "Carol", lastName: "White" },
    ]);

    render(<ProfilePage />);

    const link = await screen.findByRole("link", { name: "@carol" });
    expect(link).toHaveAttribute("href", "/profile/55");
  });

  it("renders My Posts list with offer links", async () => {
    mockFetchMyPosts.mockResolvedValue([
      {
        id: 7,
        title: "My Internship at Acme",
        type: "internship",
        status: "published",
        officeLocation: "NYC",
        publishedAt: "2024-01-01T00:00:00Z",
        authorUsername: "alice",
      },
    ]);

    render(<ProfilePage />);

    const link = await screen.findByRole("link", {
      name: "My Internship at Acme",
    });
    expect(link).toHaveAttribute("href", "/offers/7");
  });

  it("renders Bookmarks list with offer links", async () => {
    mockFetchBookmarkedPosts.mockResolvedValue([
      {
        id: 12,
        title: "Bookmark Post",
        type: "internship",
        status: "published",
        officeLocation: "",
        publishedAt: "2024-01-01T00:00:00Z",
        authorUsername: "bob",
      },
    ]);

    render(<ProfilePage />);

    const link = await screen.findByRole("link", { name: "Bookmark Post" });
    expect(link).toHaveAttribute("href", "/offers/12");
  });

  it("shows load error with Try again button when fetch fails", async () => {
    mockFetchOwnProfile.mockRejectedValue(new Error("Network failure"));

    render(<ProfilePage />);

    expect(await screen.findByText("Network failure")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
  });
});
