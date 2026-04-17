import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import PublicProfilePage from "./page";

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

const mockUseAuth = jest.fn();
const mockUseParams = jest.fn();
const mockFetchPublicProfile = jest.fn();
const mockFetchPublicProfileByUsername = jest.fn();
const mockFetchUserPosts = jest.fn();
const mockFetchFollowers = jest.fn();
const mockFetchFollowing = jest.fn();
const mockFollowUser = jest.fn();
const mockUnfollowUser = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/profile/42",
  useParams: () => mockUseParams(),
}));

jest.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/lib/profile/api", () => ({
  fetchPublicProfile: (...args: unknown[]) => mockFetchPublicProfile(...args),
  fetchPublicProfileByUsername: (...args: unknown[]) =>
    mockFetchPublicProfileByUsername(...args),
  fetchUserPosts: (...args: unknown[]) => mockFetchUserPosts(...args),
  fetchFollowers: (...args: unknown[]) => mockFetchFollowers(...args),
  fetchFollowing: (...args: unknown[]) => mockFetchFollowing(...args),
  followUser: (...args: unknown[]) => mockFollowUser(...args),
  unfollowUser: (...args: unknown[]) => mockUnfollowUser(...args),
}));

jest.mock("@/lib/paycheck/api", () => ({
  formatSavedItemTimestamp: () => "Jan 1, 2024",
}));

const sampleProfile = {
  id: 42,
  username: "bob",
  firstName: "Bob",
  lastName: "Jones",
  createdAt: "2023-06-01T00:00:00Z",
  followerCount: 5,
  followingCount: 3,
  followedByViewer: false,
};

function renderPage(profileId = "42") {
  mockUseParams.mockReturnValue({ profileId });
  return render(<PublicProfilePage />);
}

function createAuth(overrides = {}) {
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    ...overrides,
  };
}

describe("/profile/[profileId] page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ profileId: "42" });
    mockUseAuth.mockReturnValue(createAuth());
    mockFetchPublicProfile.mockResolvedValue(sampleProfile);
    mockFetchPublicProfileByUsername.mockResolvedValue(sampleProfile);
    mockFetchUserPosts.mockResolvedValue([]);
    mockFetchFollowers.mockResolvedValue([]);
    mockFetchFollowing.mockResolvedValue([]);
    mockFollowUser.mockResolvedValue(undefined);
    mockUnfollowUser.mockResolvedValue(undefined);
  });

  it("renders profile header with username and full name", async () => {
    renderPage();

    expect(await screen.findByText("@bob")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("shows member since year and follower/following counts", async () => {
    renderPage();

    await screen.findByText("@bob");
    expect(screen.getByText(/member since 2023/i)).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("does not show follow button for anonymous users", async () => {
    renderPage();

    await screen.findByText("@bob");
    expect(screen.queryByRole("button", { name: /follow/i })).not.toBeInTheDocument();
  });

  it("shows 'Edit your profile' link when viewing own profile", async () => {
    mockUseAuth.mockReturnValue(
      createAuth({
        user: { id: 42, username: "bob" },
        token: "tok",
        isAuthenticated: true,
      }),
    );

    renderPage("42");

    expect(
      await screen.findByRole("link", { name: /edit your profile/i }),
    ).toHaveAttribute("href", "/profile");
    expect(screen.queryByRole("button", { name: /follow/i })).not.toBeInTheDocument();
  });

  it("shows Follow button when authenticated user views another profile", async () => {
    mockUseAuth.mockReturnValue(
      createAuth({
        user: { id: 1, username: "alice" },
        token: "tok",
        isAuthenticated: true,
      }),
    );

    renderPage("42");

    expect(
      await screen.findByRole("button", { name: /^follow$/i }),
    ).toBeInTheDocument();
  });

  it("clicking Follow calls followUser and increments follower count optimistically", async () => {
    const u = userEvent.setup({ delay: null });
    mockUseAuth.mockReturnValue(
      createAuth({
        user: { id: 1, username: "alice", firstName: "Alice", lastName: "A" },
        token: "tok",
        isAuthenticated: true,
      }),
    );

    renderPage("42");

    const followBtn = await screen.findByRole("button", { name: /^follow$/i });
    await u.click(followBtn);

    await waitFor(() => expect(mockFollowUser).toHaveBeenCalledWith("tok", 42));
    await waitFor(() => expect(screen.getByText("6")).toBeInTheDocument());
    expect(
      await screen.findByRole("button", { name: /unfollow/i }),
    ).toBeInTheDocument();
  });

  it("clicking Unfollow calls unfollowUser and decrements follower count optimistically", async () => {
    const u = userEvent.setup({ delay: null });
    mockFetchPublicProfile.mockResolvedValue({
      ...sampleProfile,
      followedByViewer: true,
    });
    mockUseAuth.mockReturnValue(
      createAuth({
        user: { id: 1, username: "alice" },
        token: "tok",
        isAuthenticated: true,
      }),
    );

    renderPage("42");

    const unfollowBtn = await screen.findByRole("button", { name: /unfollow/i });
    await u.click(unfollowBtn);

    await waitFor(() =>
      expect(mockUnfollowUser).toHaveBeenCalledWith("tok", 42),
    );
    await waitFor(() => expect(screen.getByText("4")).toBeInTheDocument());
    expect(
      await screen.findByRole("button", { name: /^follow$/i }),
    ).toBeInTheDocument();
  });

  it("renders following list with links to /profile/{id}", async () => {
    mockFetchFollowing.mockResolvedValue([
      { id: 10, username: "carol", firstName: "Carol", lastName: "White" },
    ]);

    renderPage();

    const link = await screen.findByRole("link", { name: "@carol" });
    expect(link).toHaveAttribute("href", "/profile/10");
    expect(screen.getByText("Carol White")).toBeInTheDocument();
  });

  it("renders followers list with links to /profile/{id}", async () => {
    mockFetchFollowers.mockResolvedValue([
      { id: 20, username: "dave", firstName: "Dave", lastName: "Brown" },
    ]);

    renderPage();

    const link = await screen.findByRole("link", { name: "@dave" });
    expect(link).toHaveAttribute("href", "/profile/20");
  });

  it("renders posts with links to /offers/{id}", async () => {
    mockFetchUserPosts.mockResolvedValue([
      {
        id: 7,
        title: "Software Intern at Acme",
        type: "internship",
        status: "published",
        officeLocation: "NYC",
        publishedAt: "2024-01-01T00:00:00Z",
        authorUsername: "bob",
      },
    ]);

    renderPage();

    const link = await screen.findByRole("link", {
      name: "Software Intern at Acme",
    });
    expect(link).toHaveAttribute("href", "/offers/7");
  });

  it("shows 'Not following anyone yet' empty state", async () => {
    renderPage();
    expect(
      await screen.findByText(/not following anyone yet/i),
    ).toBeInTheDocument();
  });

  it("shows 'No followers yet' empty state", async () => {
    renderPage();
    expect(await screen.findByText(/no followers yet/i)).toBeInTheDocument();
  });

  it("shows 'No public posts yet' empty state", async () => {
    renderPage();
    expect(
      await screen.findByText(/no public posts yet/i),
    ).toBeInTheDocument();
  });

  it("shows error state when profile fetch fails", async () => {
    mockFetchPublicProfile.mockRejectedValue(new Error("User not found"));

    renderPage();

    expect(await screen.findByText("User not found")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
  });

  it("fetches data without token for anonymous user", async () => {
    renderPage("42");

    await screen.findByText("@bob");

    expect(mockFetchPublicProfile).toHaveBeenCalledWith(42, undefined);
    expect(mockFetchUserPosts).toHaveBeenCalledWith(42, undefined);
    expect(mockFetchFollowers).toHaveBeenCalledWith(42);
    expect(mockFetchFollowing).toHaveBeenCalledWith(42);
  });

  it("fetches data with token for authenticated user", async () => {
    mockUseAuth.mockReturnValue(
      createAuth({
        user: { id: 1, username: "alice" },
        token: "tok",
        isAuthenticated: true,
      }),
    );

    renderPage("42");

    await screen.findByText("@bob");

    expect(mockFetchPublicProfile).toHaveBeenCalledWith(42, "tok");
    expect(mockFetchUserPosts).toHaveBeenCalledWith(42, "tok");
  });

  it("renders profile when param is a username slug", async () => {
    renderPage("bob");

    expect(await screen.findByText("@bob")).toBeInTheDocument();
    expect(mockFetchPublicProfileByUsername).toHaveBeenCalledWith("bob", undefined);
    expect(mockFetchPublicProfile).not.toHaveBeenCalled();
  });

  it("fetches sub-resources using resolved numeric ID from username lookup", async () => {
    renderPage("bob");

    await screen.findByText("@bob");

    expect(mockFetchUserPosts).toHaveBeenCalledWith(42, undefined);
    expect(mockFetchFollowers).toHaveBeenCalledWith(42);
    expect(mockFetchFollowing).toHaveBeenCalledWith(42);
  });

  it("shows 'Edit your profile' when authenticated user visits their own username slug", async () => {
    mockUseAuth.mockReturnValue(
      createAuth({
        user: { id: 42, username: "bob" },
        token: "tok",
        isAuthenticated: true,
      }),
    );

    renderPage("bob");

    expect(
      await screen.findByRole("link", { name: /edit your profile/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /follow/i })).not.toBeInTheDocument();
  });

  it("shows error state when username lookup fails", async () => {
    mockFetchPublicProfileByUsername.mockRejectedValue(new Error("User not found"));

    renderPage("no-such-user");

    expect(await screen.findByText("User not found")).toBeInTheDocument();
  });
});
