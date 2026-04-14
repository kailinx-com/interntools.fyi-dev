import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PostDetail } from "./PostDetail";


const mockUseAuth = jest.fn();
const mockFetchPost = jest.fn();
const mockFetchComments = jest.fn();
const mockFetchVoteTally = jest.fn();
const mockUpdatePost = jest.fn();
const mockCastVote = jest.fn();
const mockCreateComment = jest.fn();
const mockBookmarkPost = jest.fn();
const mockUnbookmarkPost = jest.fn();

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "1" }),
}));

jest.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/lib/offers/api", () => ({
  fetchPost: (...args: unknown[]) => mockFetchPost(...args),
  fetchComments: (...args: unknown[]) => mockFetchComments(...args),
  fetchVoteTally: (...args: unknown[]) => mockFetchVoteTally(...args),
  updatePost: (...args: unknown[]) => mockUpdatePost(...args),
  castVote: (...args: unknown[]) => mockCastVote(...args),
  createComment: (...args: unknown[]) => mockCreateComment(...args),
  bookmarkPost: (...args: unknown[]) => mockBookmarkPost(...args),
  unbookmarkPost: (...args: unknown[]) => mockUnbookmarkPost(...args),
}));

jest.mock("next/link", () => {
  return function MockLink({ href, children, ...props }: { href: string; children: React.ReactNode }) {
    return <a href={href} {...props}>{children}</a>;
  };
});


function mockOffer(id: number, company: string, officeLocation: string | null = null) {
  return {
    id,
    company,
    title: "SWE",
    employmentType: null,
    compensationType: null,
    payAmount: null,
    hoursPerWeek: null,
    signOnBonus: null,
    relocationAmount: null,
    equityNotes: null,
    officeLocation,
    daysInOffice: null,
    notes: null,
    favorite: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  };
}

function makePost(overrides = {}) {
  return {
    id: 1,
    type: "acceptance" as const,
    title: "Got an offer from Google",
    body: "Excited about this opportunity.",
    officeLocation: null as string | null,
    visibility: "public_post" as const,
    status: "published" as const,
    authorUsername: "author42",
    comparisonId: null,
    offers: [mockOffer(10, "Google")],
    publishedAt: "2024-01-01T00:00:00Z",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    bookmarked: false,
    ...overrides,
  };
}

function anonAuth() {
  return { user: null, token: null, isAuthenticated: false, isLoading: false };
}

function authorAuth() {
  return {
    user: { username: "author42" },
    token: "tok",
    isAuthenticated: true,
    isLoading: false,
  };
}

function otherAuth() {
  return {
    user: { username: "someone_else" },
    token: "tok2",
    isAuthenticated: true,
    isLoading: false,
  };
}


describe("PostDetail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBookmarkPost.mockResolvedValue(undefined);
    mockUnbookmarkPost.mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue(anonAuth());
    mockFetchPost.mockResolvedValue(makePost());
    mockFetchComments.mockResolvedValue([]);
    mockFetchVoteTally.mockResolvedValue(null);
    mockUpdatePost.mockResolvedValue(makePost());
  });

  it("renders post title and body after loading", async () => {
    render(<PostDetail />);

    await waitFor(() => {
      expect(screen.getByText("Got an offer from Google")).toBeInTheDocument();
    });
    expect(screen.getByText("Excited about this opportunity.")).toBeInTheDocument();
  });

  it("does NOT show edit button for anonymous users", async () => {
    mockUseAuth.mockReturnValue(anonAuth());
    render(<PostDetail />);

    await waitFor(() => expect(screen.getByText("Got an offer from Google")).toBeInTheDocument());

    expect(screen.queryByTitle("Edit post")).not.toBeInTheDocument();
  });

  it("does NOT show edit button for non-author authenticated users", async () => {
    mockUseAuth.mockReturnValue(otherAuth());
    render(<PostDetail />);

    await waitFor(() => expect(screen.getByText("Got an offer from Google")).toBeInTheDocument());

    expect(screen.queryByTitle("Edit post")).not.toBeInTheDocument();
  });

  it("shows edit button for the post author", async () => {
    mockUseAuth.mockReturnValue(authorAuth());
    render(<PostDetail />);

    await waitFor(() => expect(screen.getByText("Got an offer from Google")).toBeInTheDocument());

    expect(screen.getByTitle("Edit post")).toBeInTheDocument();
  });

  it("clicking Edit replaces title with input and body with textarea", async () => {
    mockUseAuth.mockReturnValue(authorAuth());
    const user = userEvent.setup();
    render(<PostDetail />);

    await waitFor(() => expect(screen.getByTitle("Edit post")).toBeInTheDocument());

    await user.click(screen.getByTitle("Edit post"));

    expect(screen.getByTestId("edit-title-input")).toHaveValue("Got an offer from Google");
    expect(screen.getByTestId("edit-body-input")).toHaveValue("Excited about this opportunity.");
  });

  it("Save Changes calls updatePost with edited values", async () => {
    mockUseAuth.mockReturnValue(authorAuth());
    const user = userEvent.setup();

    mockFetchPost
      .mockResolvedValueOnce(makePost())
      .mockResolvedValue(makePost({ title: "Updated Title" }));
    mockUpdatePost.mockResolvedValue(makePost({ title: "Updated Title" }));

    render(<PostDetail />);

    await waitFor(() => expect(screen.getByTitle("Edit post")).toBeInTheDocument());

    await user.click(screen.getByTitle("Edit post"));

    const titleInput = screen.getByTestId("edit-title-input");
    await user.clear(titleInput);
    await user.type(titleInput, "Updated Title");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mockUpdatePost).toHaveBeenCalledWith(
        "tok",
        1,
        expect.objectContaining({ title: "Updated Title" }),
      );
    });
  });

  it("Cancel edit restores original content", async () => {
    mockUseAuth.mockReturnValue(authorAuth());
    const user = userEvent.setup();
    render(<PostDetail />);

    await waitFor(() => expect(screen.getByTitle("Edit post")).toBeInTheDocument());

    await user.click(screen.getByTitle("Edit post"));

    const titleInput = screen.getByTestId("edit-title-input");
    await user.clear(titleInput);
    await user.type(titleInput, "Something else");

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByTestId("edit-title-input")).not.toBeInTheDocument();
    expect(screen.getByText("Got an offer from Google")).toBeInTheDocument();
  });

  it("shows Draft badge and Publish button for draft posts viewed by author", async () => {
    mockUseAuth.mockReturnValue(authorAuth());
    mockFetchPost.mockResolvedValue(makePost({ status: "draft", publishedAt: null }));

    render(<PostDetail />);

    await waitFor(() => {
      expect(screen.getByTestId("publish-draft-btn")).toBeInTheDocument();
    });
  });

  it("clicking Publish on draft calls updatePost with status=published", async () => {
    mockUseAuth.mockReturnValue(authorAuth());
    mockFetchPost.mockResolvedValue(makePost({ status: "draft", publishedAt: null }));
    mockUpdatePost.mockResolvedValue(makePost({ status: "published" }));

    const user = userEvent.setup();
    render(<PostDetail />);

    await waitFor(() => expect(screen.getByTestId("publish-draft-btn")).toBeInTheDocument());

    await user.click(screen.getByTestId("publish-draft-btn"));

    await waitFor(() => {
      expect(mockUpdatePost).toHaveBeenCalledWith(
        "tok",
        1,
        expect.objectContaining({ status: "published" }),
      );
    });
  });

  it("does NOT show Draft badge or Publish button for non-authors", async () => {
    mockUseAuth.mockReturnValue(otherAuth());
    mockFetchPost.mockResolvedValue(makePost({ status: "draft", publishedAt: null }));

    render(<PostDetail />);

    await waitFor(() => expect(screen.getByText("Got an offer from Google")).toBeInTheDocument());

    expect(screen.queryByTestId("publish-draft-btn")).not.toBeInTheDocument();
  });

  it("shows loading spinner initially", () => {
    mockFetchPost.mockReturnValue(new Promise(() => {}));
    render(<PostDetail />);

    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("shows error state when fetchPost fails", async () => {
    mockFetchPost.mockRejectedValue(new Error("Not found"));
    render(<PostDetail />);

    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument();
    });
  });

  it("allows authenticated user to create a top-level comment", async () => {
    mockUseAuth.mockReturnValue(authorAuth());
    mockCreateComment.mockResolvedValue({
      id: 9,
      postId: 1,
      parentId: null,
      authorUsername: "author42",
      body: "New comment",
      editedAt: null,
      createdAt: "2026-01-01T00:00:00Z",
    });
    const user = userEvent.setup();
    render(<PostDetail />);

    await waitFor(() => expect(screen.getByText("Got an offer from Google")).toBeInTheDocument());
    await user.type(screen.getByPlaceholderText(/share your perspective/i), "New comment");
    await user.click(screen.getByRole("button", { name: /post comment/i }));

    await waitFor(() =>
      expect(mockCreateComment).toHaveBeenCalledWith("tok", 1, { body: "New comment" }),
    );
  });

  it("shows joined offer office locations in the location line for comparison posts", async () => {
    mockFetchPost.mockResolvedValue(
      makePost({
        type: "comparison",
        officeLocation: "ignored on comparison",
        offers: [
          mockOffer(1, "A", "Seattle"),
          mockOffer(2, "B", "Portland"),
        ],
      }),
    );
    render(<PostDetail />);

    await waitFor(() => {
      expect(screen.getByText("Seattle · Portland")).toBeInTheDocument();
    });
    expect(screen.queryByText("ignored on comparison")).not.toBeInTheDocument();
  });

  it("does not show the edit location picker for comparison posts", async () => {
    mockUseAuth.mockReturnValue(authorAuth());
    mockFetchPost.mockResolvedValue(
      makePost({
        type: "comparison",
        offers: [mockOffer(1, "A"), mockOffer(2, "B")],
      }),
    );
    const user = userEvent.setup();
    render(<PostDetail />);

    await waitFor(() => expect(screen.getByTitle("Edit post")).toBeInTheDocument());

    await user.click(screen.getByTitle("Edit post"));

    expect(screen.queryByTestId("edit-office-location-input")).not.toBeInTheDocument();
  });

  it("calls bookmarkPost when a signed-in reader bookmarks the post", async () => {
    mockUseAuth.mockReturnValue(otherAuth());
    mockFetchPost.mockResolvedValue(makePost({ bookmarked: false }));
    const user = userEvent.setup();
    render(<PostDetail />);

    await waitFor(() => expect(screen.getByTitle("Bookmark")).toBeInTheDocument());
    await user.click(screen.getByTitle("Bookmark"));

    await waitFor(() =>
      expect(mockBookmarkPost).toHaveBeenCalledWith("tok2", 1),
    );
  });

  it("shows community vote for comparison posts and casts vote", async () => {
    mockUseAuth.mockReturnValue(authorAuth());
    mockFetchPost.mockResolvedValue(
      makePost({
        type: "comparison",
        offers: [mockOffer(1, "A"), mockOffer(2, "B")],
      }),
    );
    mockFetchVoteTally.mockResolvedValue({
      postId: 1,
      totalVotes: 0,
      tally: {},
    });
    mockCastVote.mockResolvedValue({
      postId: 1,
      totalVotes: 1,
      tally: { "0": 1 },
    });
    const user = userEvent.setup();
    render(<PostDetail />);

    await waitFor(() => expect(screen.getByText("Community Vote")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /A 0%/ }));
    await waitFor(() =>
      expect(mockCastVote).toHaveBeenCalledWith("tok", 1, { selectedOfferIndex: 0 }),
    );
  });

  // ── Profile links ─────────────────────────────────────────────────────────

  it("renders post author username as a link to /profile/{username}", async () => {
    mockUseAuth.mockReturnValue(authorAuth());
    render(<PostDetail />);

    const link = await screen.findByRole("link", { name: /@author42/i });
    expect(link).toHaveAttribute("href", "/profile/author42");
  });

  it("renders comment author username as a link to /profile/{username}", async () => {
    mockUseAuth.mockReturnValue(otherAuth());
    mockFetchComments.mockResolvedValue([
      {
        id: 5,
        postId: 1,
        parentId: null,
        authorUsername: "someone_else",
        body: "Great post!",
        editedAt: null,
        createdAt: "2024-01-02T00:00:00Z",
      },
    ]);
    render(<PostDetail />);

    const link = await screen.findByRole("link", { name: /@someone_else/i });
    expect(link).toHaveAttribute("href", "/profile/someone_else");
  });
});
