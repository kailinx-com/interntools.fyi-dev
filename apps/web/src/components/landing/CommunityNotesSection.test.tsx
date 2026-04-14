import { render, screen, waitFor } from "@testing-library/react";
import { CommunityNotesSection } from "./CommunityNotesSection";

const mockFetchPublishedPosts = jest.fn();
const mockFetchPost = jest.fn();

jest.mock("@/lib/offers/api", () => ({
  fetchPublishedPosts: (...args: unknown[]) => mockFetchPublishedPosts(...args),
  fetchPost: (...args: unknown[]) => mockFetchPost(...args),
}));

describe("CommunityNotesSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders provided notes without fetching", () => {
    render(
      <CommunityNotesSection
        notes={[
          {
            tag: "Advice",
            title: "Provided note",
            excerpt: "provided",
            href: "/offers/2",
          },
        ]}
      />,
    );

    expect(screen.getByText("Provided note")).toBeInTheDocument();
    expect(mockFetchPublishedPosts).not.toHaveBeenCalled();
  });

  it("loads live notes when no notes prop is provided", async () => {
    mockFetchPublishedPosts.mockResolvedValue({
      content: [
        {
          id: 3,
          type: "comparison",
          title: "Live post",
          authorUsername: "alice",
          publishedAt: "2026-01-01T00:00:00Z",
          createdAt: "2026-01-01T00:00:00Z",
        },
      ],
    });
    mockFetchPost.mockResolvedValue({
      body: "Detail body",
      offers: [],
    });

    render(<CommunityNotesSection />);

    await waitFor(() => expect(screen.getByText("Live post")).toBeInTheDocument());
    expect(mockFetchPublishedPosts).toHaveBeenCalledWith(0, 3);
    expect(mockFetchPost).toHaveBeenCalledWith(3);
  });

  it("falls back when live fetch fails", async () => {
    mockFetchPublishedPosts.mockRejectedValue(new Error("boom"));
    render(<CommunityNotesSection />);
    await waitFor(() =>
      expect(screen.getByText("Capitol Hill vs. SLU for a summer SWE intern")).toBeInTheDocument(),
    );
  });

  it("uses fallback notes when API returns no posts", async () => {
    mockFetchPublishedPosts.mockResolvedValue({ content: [] });
    render(<CommunityNotesSection />);
    await waitFor(() =>
      expect(screen.getByText("Capitol Hill vs. SLU for a summer SWE intern")).toBeInTheDocument(),
    );
  });

  it("maps acceptance posts and builds excerpt from offer snapshots when body is empty", async () => {
    mockFetchPublishedPosts.mockResolvedValue({
      content: [
        {
          id: 10,
          type: "acceptance",
          title: "Snap title",
          authorUsername: "bob",
          publishedAt: "2026-01-15T12:00:00Z",
          createdAt: "2026-01-15T12:00:00Z",
        },
      ],
    });
    mockFetchPost.mockResolvedValue({
      body: "",
      offers: [{ company: "CoA" }, { company: "CoB" }],
    });

    render(<CommunityNotesSection />);

    await waitFor(() => expect(screen.getByText("Snap title")).toBeInTheDocument());
    expect(screen.getByText(/Comparing CoA vs CoB/)).toBeInTheDocument();
  });

  it("uses generic excerpt when post detail has no body or snapshots", async () => {
    mockFetchPublishedPosts.mockResolvedValue({
      content: [
        {
          id: 11,
          type: "comparison",
          title: "Thin post",
          authorUsername: "c",
          publishedAt: null,
          createdAt: "2026-01-10T00:00:00Z",
        },
      ],
    });
    mockFetchPost.mockResolvedValue({
      body: null,
      offers: [],
    });

    render(<CommunityNotesSection />);

    await waitFor(() => expect(screen.getByText("Thin post")).toBeInTheDocument());
    expect(screen.getByText("View this post for full details.")).toBeInTheDocument();
  });

  it("shows skeletons while loading live notes", () => {
    mockFetchPublishedPosts.mockImplementation(() => new Promise(() => {}));
    const { container } = render(<CommunityNotesSection />);
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });
});
