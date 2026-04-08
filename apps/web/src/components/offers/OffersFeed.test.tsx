import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OffersFeed } from "./OffersFeed";

const mockUseAuth = jest.fn();
const mockFetchPublishedPosts = jest.fn();
const mockFetchPost = jest.fn();

jest.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/lib/offers/api", () => ({
  fetchPublishedPosts: (...args: unknown[]) => mockFetchPublishedPosts(...args),
  fetchPost: (...args: unknown[]) => mockFetchPost(...args),
}));

jest.mock("./Article", () => ({
  Article: ({ post }: { post: { title: string } }) => <div>{post.title}</div>,
}));

describe("OffersFeed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
  });

  it("renders published posts and hydrates detail snapshots", async () => {
    mockFetchPublishedPosts.mockResolvedValue({
      content: [
        {
          id: 1,
          type: "acceptance",
          title: "Accepted",
          visibility: "public_post",
          status: "published",
          authorUsername: "alice",
          publishedAt: "2026-01-01T00:00:00Z",
          createdAt: "2026-01-01T00:00:00Z",
          bookmarked: false,
        },
      ],
      last: true,
    });
    mockFetchPost.mockResolvedValue({ offerSnapshots: "[]" });

    render(<OffersFeed />);

    await waitFor(() => expect(screen.getByText("Accepted")).toBeInTheDocument());
    expect(mockFetchPublishedPosts).toHaveBeenCalledWith(0);
    expect(mockFetchPost).toHaveBeenCalledWith(1);
  });

  it("shows error and supports retry on load failure", async () => {
    const user = userEvent.setup();
    mockFetchPublishedPosts
      .mockRejectedValueOnce(new Error("Boom"))
      .mockResolvedValueOnce({ content: [], last: true });

    render(<OffersFeed />);

    await waitFor(() => expect(screen.getByText("Boom")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(mockFetchPublishedPosts).toHaveBeenCalledTimes(2));
  });

  it("loads more posts for authenticated users", async () => {
    const user = userEvent.setup();
    mockFetchPublishedPosts
      .mockResolvedValueOnce({
        content: [
          {
            id: 1,
            type: "acceptance",
            title: "First",
            visibility: "public_post",
            status: "published",
            authorUsername: "alice",
            publishedAt: null,
            createdAt: "2026-01-01T00:00:00Z",
            bookmarked: false,
          },
        ],
        last: false,
      })
      .mockResolvedValueOnce({
        content: [
          {
            id: 2,
            type: "comparison",
            title: "Second",
            visibility: "public_post",
            status: "published",
            authorUsername: "bob",
            publishedAt: null,
            createdAt: "2026-01-01T00:00:00Z",
            bookmarked: false,
          },
        ],
        last: true,
      });
    mockFetchPost.mockResolvedValue({ offerSnapshots: "[]" });

    render(<OffersFeed />);
    expect(await screen.findByText("First")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /load more activity/i }));
    expect(await screen.findByText("Second")).toBeInTheDocument();
  });
});
