import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchPageClient } from "./SearchPageClient";
import {
  encodeLocationDescriptionForPath,
  encodePlaceIdForPath,
} from "@/lib/places/client";

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => "/search",
  useSearchParams: () => mockSearchParams,
}));

const mockUseAuth = jest.fn();

jest.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/components/layout/PageShell", () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/lib/places/client", () => {
  const actual = jest.requireActual("@/lib/places/client");
  return {
    ...actual,
    getPlacesApiKey: jest.fn(() => "test-key"),
    searchPlacesByText: jest.fn(),
  };
});

const mockFetch = jest.fn();
const originalFetch = global.fetch;
const originalKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

function placesAutocompleteResponse(
  places: { placeId: string; text: string }[],
) {
  return {
    ok: true,
    json: async () => ({
      suggestions: places.map((p) => ({
        placePrediction: {
          placeId: p.placeId,
          text: { text: p.text },
        },
      })),
    }),
  };
}

describe("SearchPageClient", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });
    localStorage.clear();
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = "test-key";
    global.fetch = mockFetch;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ suggestions: [] }),
    });
    const clientMock = jest.requireMock("@/lib/places/client") as {
      searchPlacesByText: jest.Mock;
    };
    clientMock.searchPlacesByText.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
    global.fetch = originalFetch;
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = originalKey;
  });

  it("pre-fills the search input from the ?criteria= URL param (refresh persists)", () => {
    mockSearchParams = new URLSearchParams("criteria=Boston%2C%20MA");
    render(<SearchPageClient />);
    expect(screen.getByTestId("place-search-input")).toHaveValue("Boston, MA");
  });

  it("still pre-fills from legacy ?q= param", () => {
    mockSearchParams = new URLSearchParams("q=Legacy%20City");
    render(<SearchPageClient />);
    expect(screen.getByTestId("place-search-input")).toHaveValue("Legacy City");
  });

  it("debounces syncing the search query to the URL as the user types", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchPageClient />);

    await user.type(screen.getByTestId("place-search-input"), "Denver");
    expect(mockReplace).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);

    expect(mockReplace).toHaveBeenLastCalledWith(
      "/search?criteria=Denver",
      { scroll: false },
    );
  });

  it("flushes criteria to the URL then navigates to /details on submit", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchPageClient />);

    await user.type(screen.getByTestId("place-search-input"), "Boston MA");
    await user.click(screen.getByRole("button", { name: /^search$/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });

    expect(mockReplace).toHaveBeenCalledWith(
      `/search?${new URLSearchParams({ criteria: "Boston MA" }).toString()}`,
      { scroll: false },
    );
    expect(mockPush).toHaveBeenCalledWith(
      `/details/${encodeLocationDescriptionForPath("Boston MA")}`,
    );
  });

  it("navigates to /details with encoded place id when searchText finds a match", async () => {
    const clientMock = jest.requireMock("@/lib/places/client") as {
      searchPlacesByText: jest.Mock;
    };
    clientMock.searchPlacesByText.mockResolvedValue([
      {
        id: "ChIJ_boston",
        displayName: "Boston",
        formattedAddress: "Boston, MA, USA",
        firstPhotoName: null,
      },
    ]);

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchPageClient />);

    await user.type(screen.getByTestId("place-search-input"), "Boston");
    await user.click(screen.getByRole("button", { name: /^search$/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(`/details/${encodePlaceIdForPath("ChIJ_boston")}`);
    });
  });

  it("pushes to details using encoded Places id from autocomplete", async () => {
    mockFetch.mockResolvedValue(
      placesAutocompleteResponse([
        { placeId: "ChIJ_place", text: "Seattle, WA, USA" },
      ]),
    );

    render(<SearchPageClient />);

    const input = screen.getByTestId("place-search-input");
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(
      input,
      "Sea",
    );
    input.dispatchEvent(new Event("change", { bubbles: true }));

    jest.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByTestId("location-suggestion")).toBeInTheDocument();
    });

    screen.getByTestId("location-suggestion").dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true }),
    );

    expect(mockReplace).toHaveBeenCalledWith(
      `/search?${new URLSearchParams({ criteria: "Seattle, WA, USA" }).toString()}`,
      { scroll: false },
    );
    expect(mockPush).toHaveBeenCalledWith(
      `/details/${encodePlaceIdForPath("ChIJ_place")}`,
    );
  });

  it("lists saved locations from localStorage with links to details", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    localStorage.setItem(
      "interntools.savedLocations",
      JSON.stringify(["Austin, TX, USA"]),
    );
    render(<SearchPageClient />);

    expect(screen.getByText("Saved locations")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Austin, TX, USA" });
    expect(link).toHaveAttribute(
      "href",
      `/details/${encodeLocationDescriptionForPath("Austin, TX, USA")}`,
    );
  });

  it("does not navigate when the search query is empty or whitespace", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchPageClient />);

    await user.click(screen.getByRole("button", { name: /^search$/i }));
    expect(mockPush).not.toHaveBeenCalled();

    await user.type(screen.getByTestId("place-search-input"), "   ");
    await user.click(screen.getByRole("button", { name: /^search$/i }));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows the API key hint when getPlacesApiKey returns empty string", () => {
    const clientMock = jest.requireMock("@/lib/places/client") as {
      getPlacesApiKey: jest.Mock;
    };
    clientMock.getPlacesApiKey.mockReturnValue("");

    render(<SearchPageClient />);

    expect(screen.getByRole("status")).toBeInTheDocument();

    clientMock.getPlacesApiKey.mockReturnValue("test-key");
  });

  it("hides the saved locations section when there are no bookmarks", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    render(<SearchPageClient />);
    expect(screen.queryByText("Saved locations")).not.toBeInTheDocument();
  });

  it("hides saved locations when not logged in even if localStorage has entries", () => {
    localStorage.setItem(
      "interntools.savedLocations",
      JSON.stringify(["Austin, TX, USA"]),
    );
    render(<SearchPageClient />);
    expect(screen.queryByText("Saved locations")).not.toBeInTheDocument();
  });
});
