import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Offer } from "@/lib/offers/api";
import { Article } from "./Article";

const mockPush = jest.fn();
const mockBookmarkPost = jest.fn();
const mockUnbookmarkPost = jest.fn();
const mockUseAuth = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

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
    officeLocation: null as string | null,
    visibility: "public_post" as const,
    status: "published" as const,
    authorUsername: "alice",
    publishedAt: "2026-01-01T00:00:00Z",
    createdAt: "2026-01-01T00:00:00Z",
    bookmarked: false,
    ...overrides,
  };
}

function offer(overrides: Partial<Offer> & Pick<Offer, "id" | "company">): Offer {
  return {
    title: "",
    employmentType: "internship",
    compensationType: "hourly",
    payAmount: 60,
    hoursPerWeek: null,
    signOnBonus: null,
    relocationAmount: null,
    equityNotes: null,
    officeLocation: null,
    daysInOffice: null,
    notes: null,
    favorite: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("Article", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ token: "tok" });
  });

  it("renders single-offer card details", () => {
    render(
      <Article
        post={makePost()}
        offers={[
          offer({
            id: 1,
            company: "Google",
            title: "SWE",
            compensationType: "hourly",
            payAmount: 60,
          }),
        ]}
      />,
    );

    expect(screen.getByText("Google")).toBeInTheDocument();
    expect(screen.getByText("$60/hr")).toBeInTheDocument();
  });

  it("bookmarks when currently unbookmarked", async () => {
    const user = userEvent.setup();
    render(<Article post={makePost({ bookmarked: false })} offers={[]} />);

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[buttons.length - 1]);

    await waitFor(() => expect(mockBookmarkPost).toHaveBeenCalledWith("tok", 1));
  });

  it("unbookmarks when currently bookmarked", async () => {
    const user = userEvent.setup();
    render(<Article post={makePost({ bookmarked: true })} offers={[]} />);

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[buttons.length - 1]);

    await waitFor(() => expect(mockUnbookmarkPost).toHaveBeenCalledWith("tok", 1));
  });

  it("does not toggle bookmark when unauthenticated", async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({ token: null });
    render(<Article post={makePost({ bookmarked: false })} offers={[]} />);

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[buttons.length - 1]);

    expect(mockBookmarkPost).not.toHaveBeenCalled();
    expect(mockUnbookmarkPost).not.toHaveBeenCalled();
  });

  it("shows joined offer office locations in the subtitle for comparison posts", () => {
    render(
      <Article
        post={makePost({ type: "comparison", officeLocation: "Stale post office" })}
        offers={[
          offer({
            id: 1,
            company: "A",
            title: "SWE",
            compensationType: "hourly",
            payAmount: 50,
            officeLocation: "Chicago",
          }),
          offer({
            id: 2,
            company: "B",
            title: "PM",
            compensationType: "hourly",
            payAmount: 55,
            officeLocation: "Denver",
          }),
        ]}
      />,
    );
    expect(screen.getByText("Chicago · Denver")).toBeInTheDocument();
    expect(screen.queryByText(/Stale post office/)).not.toBeInTheDocument();
  });

  it("renders multiple offers for comparison posts", () => {
    render(
      <Article
        post={makePost({ type: "comparison" })}
        offers={[
          offer({
            id: 1,
            company: "A",
            title: "SWE",
            compensationType: "hourly",
            payAmount: 50,
          }),
          offer({
            id: 2,
            company: "B",
            title: "PM",
            compensationType: "hourly",
            payAmount: 55,
          }),
        ]}
      />,
    );
    expect(screen.getAllByText("A").length).toBeGreaterThan(0);
    expect(screen.getAllByText("B").length).toBeGreaterThan(0);
  });

  it("renders author username as a clickable link to /profile/{username}", () => {
    render(<Article post={makePost()} />);
    const authorLink = screen.getByRole("link", {
      name: /view profile of @alice/i,
    });
    expect(authorLink).toHaveAttribute("href", "/profile/alice");
  });
});
