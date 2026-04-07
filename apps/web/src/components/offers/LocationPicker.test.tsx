import { render, screen, waitFor } from "@testing-library/react";
import { LocationPicker } from "./LocationPicker";


const mockFetch = jest.fn();
global.fetch = mockFetch;

const originalApiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;


function fireChange(input: HTMLElement, value: string) {
  Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set?.call(input, value);
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function placesResponse(places: { placeId: string; text: string }[]) {
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


describe("LocationPicker", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = "test-api-key";
  });

  afterEach(() => {
    jest.useRealTimers();
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = originalApiKey;
  });

  it("renders the input with placeholder", () => {
    render(<LocationPicker value="" onChange={jest.fn()} placeholder="Search city…" />);
    expect(screen.getByTestId("location-input")).toHaveAttribute("placeholder", "Search city…");
  });

  it("renders with the provided value", () => {
    render(<LocationPicker value="San Francisco, CA" onChange={jest.fn()} />);
    expect(screen.getByTestId("location-input")).toHaveValue("San Francisco, CA");
  });

  it("calls Google Places API after debounce when user types", async () => {
    mockFetch.mockResolvedValueOnce(placesResponse([]));

    render(<LocationPicker value="" onChange={jest.fn()} />);

    fireChange(screen.getByTestId("location-input"), "San");

    expect(mockFetch).not.toHaveBeenCalled();

    jest.advanceTimersByTime(350);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://places.googleapis.com/v1/places:autocomplete",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "X-Goog-Api-Key": "test-api-key" }),
      }),
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.input).toBe("San");
  });

  it("renders suggestions from the API response", async () => {
    mockFetch.mockResolvedValueOnce(
      placesResponse([
        { placeId: "p1", text: "San Francisco, CA, USA" },
        { placeId: "p2", text: "San Jose, CA, USA" },
      ]),
    );

    render(<LocationPicker value="" onChange={jest.fn()} />);

    fireChange(screen.getByTestId("location-input"), "San");
    jest.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getAllByTestId("location-suggestion")).toHaveLength(2);
    });

    expect(screen.getByText("San Francisco, CA, USA")).toBeInTheDocument();
    expect(screen.getByText("San Jose, CA, USA")).toBeInTheDocument();
  });

  it("calls onChange with description when a suggestion is clicked", async () => {
    mockFetch.mockResolvedValueOnce(
      placesResponse([{ placeId: "p1", text: "San Francisco, CA, USA" }]),
    );

    const onChange = jest.fn();
    render(<LocationPicker value="" onChange={onChange} />);

    fireChange(screen.getByTestId("location-input"), "San Fr");
    jest.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByTestId("location-suggestion")).toBeInTheDocument();
    });

    const suggestion = screen.getByTestId("location-suggestion");
    suggestion.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

    expect(onChange).toHaveBeenCalledWith("San Francisco, CA, USA");
  });

  it("does not call the API for empty input", () => {
    render(<LocationPicker value="" onChange={jest.fn()} />);

    fireChange(screen.getByTestId("location-input"), "");
    jest.advanceTimersByTime(350);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("handles API errors gracefully", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    render(<LocationPicker value="" onChange={jest.fn()} />);

    fireChange(screen.getByTestId("location-input"), "fail");
    jest.advanceTimersByTime(350);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryAllByTestId("location-suggestion")).toHaveLength(0);
  });

  it("shows fallback when no API key is set", () => {
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = "";

    render(<LocationPicker value="" onChange={jest.fn()} />);

    expect(
      screen.getByPlaceholderText("Set NEXT_PUBLIC_GOOGLE_PLACES_API_KEY"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("location-input")).not.toBeInTheDocument();
  });

  it("closes the dropdown on Escape key", async () => {
    mockFetch.mockResolvedValueOnce(
      placesResponse([{ placeId: "p1", text: "San Francisco, CA, USA" }]),
    );

    render(<LocationPicker value="" onChange={jest.fn()} />);

    const input = screen.getByTestId("location-input");
    fireChange(input, "San");
    jest.advanceTimersByTime(350);

    await waitFor(() => {
      expect(screen.getByTestId("location-suggestion")).toBeInTheDocument();
    });

    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );

    await waitFor(() => {
      expect(screen.queryByTestId("location-suggestion")).not.toBeInTheDocument();
    });
  });
});
