import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchPageClient } from "./SearchPageClient";
import {
  encodeLocationDescriptionForPath,
} from "@/lib/places/client";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/components/layout/PageShell", () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/lib/places/client", () => {
  const actual = jest.requireActual("@/lib/places/client");
  return {
    ...actual,
    getPlacesApiKey: jest.fn(() => "test-key"),
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
    localStorage.clear();
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = "test-key";
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.useRealTimers();
    global.fetch = originalFetch;
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = originalKey;
  });

  it("navigates to /details with encoded description text on submit", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchPageClient />);

    await user.type(screen.getByTestId("place-search-input"), "Boston MA");
    await user.click(screen.getByRole("button", { name: /^search$/i }));

    expect(mockPush).toHaveBeenCalledWith(
      `/details/${encodeLocationDescriptionForPath("Boston MA")}`,
    );
  });

  it("pushes to details using autocomplete description (not Places id)", async () => {
    mockFetch.mockResolvedValueOnce(
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

    expect(mockPush).toHaveBeenCalledWith(
      `/details/${encodeLocationDescriptionForPath("Seattle, WA, USA")}`,
    );
  });

  it("lists saved locations from localStorage with links to details", () => {
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
});
