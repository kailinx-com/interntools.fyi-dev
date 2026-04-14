import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OffersFeed, parseFeedFilterParam } from "./OffersFeed";

const mockReplace = jest.fn();
let mockSearchParams = "";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/offers",
  useSearchParams: () => new URLSearchParams(mockSearchParams),
}));

jest.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
  }),
}));

const mockFetchPublishedPosts = jest.fn();
const mockFetchPost = jest.fn();

jest.mock("@/lib/offers/api", () => ({
  fetchPublishedPosts: (...args: unknown[]) => mockFetchPublishedPosts(...args),
  fetchPost: (...args: unknown[]) => mockFetchPost(...args),
}));

jest.mock("./Article", () => ({
  Article: () => <div data-testid="article" />,
}));
jest.mock("./OffersFeedHeader", () => ({
  OffersFeedHeader: () => <div>Header</div>,
}));
jest.mock("./OutcomeCTA", () => ({
  OutcomeCTA: () => <div>CTA</div>,
}));

const sampleSummary = {
  id: 1,
  type: "acceptance" as const,
  title: "Hello",
  officeLocation: null,
  visibility: "public_post" as const,
  status: "published" as const,
  authorUsername: "u",
  publishedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  bookmarked: false,
};

describe("parseFeedFilterParam", () => {
  it("maps acceptances and comparisons", () => {
    expect(parseFeedFilterParam("acceptance")).toBe("acceptance");
    expect(parseFeedFilterParam("comparison")).toBe("comparison");
  });

  it("defaults to all when missing or invalid", () => {
    expect(parseFeedFilterParam(null)).toBe("all");
    expect(parseFeedFilterParam("")).toBe("all");
    expect(parseFeedFilterParam("all")).toBe("all");
    expect(parseFeedFilterParam("nope")).toBe("all");
  });
});

describe("OffersFeed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = "";
    mockFetchPublishedPosts.mockResolvedValue({
      content: [sampleSummary],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
      last: true,
      first: true,
    });
    mockFetchPost.mockResolvedValue({
      ...sampleSummary,
      body: null,
      comparisonId: null,
      offers: [],
      updatedAt: "2026-01-01T00:00:00Z",
    });
  });

  it("selects Acceptances when URL has filter=acceptance", async () => {
    mockSearchParams = "filter=acceptance";
    render(<OffersFeed />);

    await waitFor(() => {
      expect(screen.getByLabelText("Acceptances")).toBeChecked();
    });
    expect(screen.getByLabelText("All Activities")).not.toBeChecked();
  });

  it("updates URL when user selects Comparisons", async () => {
    const user = userEvent.setup();
    render(<OffersFeed />);

    await waitFor(() => {
      expect(screen.getByLabelText("All Activities")).toBeChecked();
    });

    await user.click(screen.getByLabelText("Comparisons"));

    expect(mockReplace).toHaveBeenCalledWith("/offers?filter=comparison", { scroll: false });
  });

  it("clears filter from URL when All Activities is selected", async () => {
    mockSearchParams = "filter=comparison";
    const user = userEvent.setup();
    render(<OffersFeed />);

    await waitFor(() => {
      expect(screen.getByLabelText("Comparisons")).toBeChecked();
    });

    await user.click(screen.getByLabelText("All Activities"));

    expect(mockReplace).toHaveBeenCalledWith("/offers", { scroll: false });
  });
});
