import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Article } from "./Article";

const mockBookmarkPost = jest.fn();
const mockUnbookmarkPost = jest.fn();
const mockUseAuth = jest.fn();

jest.mock("@/lib/offers/api", () => ({
  bookmarkPost: (...args: unknown[]) => mockBookmarkPost(...args),
  unbookmarkPost: (...args: unknown[]) => mockUnbookmarkPost(...args),
}));

jest.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

function makePost(overrides = {}) {
  return {
    id: 1,
    type: "acceptance" as const,
    title: "Offer update",
    visibility: "public_post" as const,
    status: "published" as const,
    authorUsername: "alice",
    publishedAt: "2026-01-01T00:00:00Z",
    createdAt: "2026-01-01T00:00:00Z",
    bookmarked: false,
    ...overrides,
  };
}

describe("Article", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ token: "tok" });
  });

  it("renders single snapshot card details", () => {
    render(
      <Article
        post={makePost()}
        offerSnapshots={JSON.stringify([
          { label: "Acceptance", company: "Google", role: "SWE", compensation: "$60/hr" },
        ])}
      />,
    );

    expect(screen.getByText("Google")).toBeInTheDocument();
    expect(screen.getByText("$60/hr")).toBeInTheDocument();
  });

  it("bookmarks when currently unbookmarked", async () => {
    const user = userEvent.setup();
    render(<Article post={makePost({ bookmarked: false })} offerSnapshots={null} />);

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[buttons.length - 1]);

    await waitFor(() => expect(mockBookmarkPost).toHaveBeenCalledWith("tok", 1));
  });

  it("unbookmarks when currently bookmarked", async () => {
    const user = userEvent.setup();
    render(<Article post={makePost({ bookmarked: true })} offerSnapshots={null} />);

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[buttons.length - 1]);

    await waitFor(() => expect(mockUnbookmarkPost).toHaveBeenCalledWith("tok", 1));
  });

  it("does not toggle bookmark when unauthenticated", async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({ token: null });
    render(<Article post={makePost({ bookmarked: false })} offerSnapshots={null} />);

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[buttons.length - 1]);

    expect(mockBookmarkPost).not.toHaveBeenCalled();
    expect(mockUnbookmarkPost).not.toHaveBeenCalled();
  });

  it("renders comparison snapshots and handles invalid snapshot JSON", () => {
    const { rerender } = render(
      <Article
        post={makePost({ type: "comparison" })}
        offerSnapshots={JSON.stringify([
          { label: "Option A", company: "A", role: "SWE", compensation: "$50/hr" },
          { label: "Option B", company: "B", role: "PM", compensation: "$55/hr" },
        ])}
      />,
    );
    expect(screen.getByText("Option A")).toBeInTheDocument();
    expect(screen.getByText("Option B")).toBeInTheDocument();

    rerender(<Article post={makePost()} offerSnapshots={"not-json"} />);
    expect(screen.queryByText("Option A")).not.toBeInTheDocument();
  });
});
