import {
  buildMatchTokensFromPlace,
  decodePlaceIdFromPath,
  encodeLocationDescriptionForPath,
  encodePlaceIdForPath,
  fetchPlaceAutocompleteSuggestions,
  getPlaceDetails,
  getPlacePhotoMediaUrl,
  getPlacesApiKey,
  googleMapsSearchUrlForLocation,
  isLegacyLocationDescriptionPath,
  matchTokensFromLocationDescription,
  normalizePlaceId,
  searchPlacesByText,
} from "./client";

const originalFetch = global.fetch;
const originalKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

describe("places client helpers", () => {
  it("normalizePlaceId strips places/ prefix", () => {
    expect(normalizePlaceId("places/ChIJabc")).toBe("ChIJabc");
    expect(normalizePlaceId("ChIJabc")).toBe("ChIJabc");
  });

  it("encodePlaceIdForPath round-trips with decodePlaceIdFromPath", () => {
    const id = "ChIJ test";
    const enc = encodePlaceIdForPath(id);
    expect(decodePlaceIdFromPath(enc)).toBe("ChIJ test");
  });

  it("decodePlaceIdFromPath returns raw segment when decodeURIComponent throws", () => {
    const spy = jest.spyOn(global, "decodeURIComponent").mockImplementation(() => {
      throw new URIError("bad");
    });
    expect(decodePlaceIdFromPath("x")).toBe("x");
    spy.mockRestore();
  });

  it("buildMatchTokensFromPlace collects locality and admin area", () => {
    const tokens = buildMatchTokensFromPlace("Seattle, WA, USA", [
      { longText: "Seattle", shortText: "Seattle", types: ["locality", "political"] },
      {
        longText: "Washington",
        shortText: "WA",
        types: ["administrative_area_level_1", "political"],
      },
    ]);
    expect(tokens).toContain("Seattle");
    expect(tokens).toContain("Washington");
  });
});

describe("fetchPlaceAutocompleteSuggestions", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = "test-key";
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = originalKey;
  });

  it("returns empty array when input is blank", async () => {
    await expect(fetchPlaceAutocompleteSuggestions("   ")).resolves.toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns empty array when API key is missing", async () => {
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = "";
    await expect(fetchPlaceAutocompleteSuggestions("Seattle")).resolves.toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("parses valid suggestions and skips entries missing placeId or description", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        suggestions: [
          {
            placePrediction: {
              placeId: "ChIJ1",
              text: { text: "Seattle, WA, USA" },
            },
          },
          { placePrediction: { placeId: "", text: { text: "Bad" } } },
          { placePrediction: { placeId: "ChIJ2", text: { text: "" } } },
          {},
        ],
      }),
    });

    const out = await fetchPlaceAutocompleteSuggestions("Sea");
    expect(out).toEqual([{ placeId: "ChIJ1", description: "Seattle, WA, USA" }]);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://places.googleapis.com/v1/places:autocomplete",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "X-Goog-Api-Key": "test-key" }),
      }),
    );
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.input).toBe("Sea");
  });

  it("returns empty array on non-OK response", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
    await expect(fetchPlaceAutocompleteSuggestions("x")).resolves.toEqual([]);
  });
});

describe("searchPlacesByText", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = "test-key";
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = originalKey;
  });

  it("returns empty when query or key is missing", async () => {
    await expect(searchPlacesByText("   ")).resolves.toEqual([]);
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = "";
    await expect(searchPlacesByText("Boston")).resolves.toEqual([]);
  });

  it("maps places from searchText response including name-based id and photos", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        places: [
          {
            name: "places/ChIJ_x",
            displayName: { text: "Pizza" },
            formattedAddress: "1 Main",
            photos: [{ name: "places/photo1" }],
          },
          {
            id: "ChIJ_y",
            displayName: { text: "No photos" },
            formattedAddress: "",
          },
        ],
      }),
    });

    const out = await searchPlacesByText("food");
    expect(out).toEqual([
      {
        id: "ChIJ_x",
        displayName: "Pizza",
        formattedAddress: "1 Main",
        firstPhotoName: "places/photo1",
      },
      {
        id: "ChIJ_y",
        displayName: "No photos",
        formattedAddress: "",
        firstPhotoName: null,
      },
    ]);
  });

  it("returns empty on non-OK response", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
    await expect(searchPlacesByText("x")).resolves.toEqual([]);
  });
});

describe("getPlaceDetails", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = "test-key";
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = originalKey;
  });

  it("returns null without API key or place id", async () => {
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = "";
    await expect(getPlaceDetails("ChIJ_x")).resolves.toBeNull();
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = "test-key";
    await expect(getPlaceDetails("   ")).resolves.toBeNull();
  });

  it("returns null when response is not OK", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
    await expect(getPlaceDetails("ChIJ_x")).resolves.toBeNull();
  });

  it("returns mapped details with match tokens from address components", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        name: "places/ChIJ_z",
        displayName: { text: "Cafe" },
        formattedAddress: "123 Road, Town, ST",
        googleMapsUri: "https://maps.example",
        photos: [{ name: "ph1" }],
        addressComponents: [
          {
            longText: "Town",
            shortText: "Town",
            types: ["locality", "political"],
          },
          {
            longText: "Somewhere",
            shortText: "S",
            types: ["country", "political"],
          },
        ],
      }),
    });

    const d = await getPlaceDetails("places/ChIJ_z");
    expect(d).toMatchObject({
      id: "ChIJ_z",
      displayName: "Cafe",
      formattedAddress: "123 Road, Town, ST",
      googleMapsUri: "https://maps.example",
      firstPhotoName: "ph1",
    });
    expect(d?.matchTokens).toContain("Town");
    expect(d?.matchTokens).toContain("Somewhere");
  });
});

describe("getPlacePhotoMediaUrl", () => {
  const originalKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

  afterEach(() => {
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = originalKey;
  });

  it("returns null without photo name or API key", () => {
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = "k";
    expect(getPlacePhotoMediaUrl("")).toBeNull();
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = "";
    expect(getPlacePhotoMediaUrl("places/x")).toBeNull();
  });

  it("prefixes photo path and includes params", () => {
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = "secret";
    const url = getPlacePhotoMediaUrl("AWn5...", 200);
    expect(url).toContain("places%2FAWn5...");
    expect(url).toContain("maxWidthPx=200");
    expect(url).toContain("key=secret");
  });

  it("does not double-prefix places/", () => {
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = "k";
    const url = getPlacePhotoMediaUrl("places/foo/bar");
    expect(url).toContain(encodeURIComponent("places/foo/bar"));
  });
});

describe("isLegacyLocationDescriptionPath", () => {
  it("is true when the decoded path looks like a comma-separated description", () => {
    expect(isLegacyLocationDescriptionPath("Seattle, WA, USA")).toBe(true);
  });

  it("is false for a typical Google place resource id segment", () => {
    expect(isLegacyLocationDescriptionPath("ChIJ_e2e_test")).toBe(false);
  });
});

describe("location description URL helpers (autocomplete text, no Details API)", () => {
  it("encodeLocationDescriptionForPath round-trips with decodePlaceIdFromPath", () => {
    const desc = "Seattle, WA, USA";
    const enc = encodeLocationDescriptionForPath(desc);
    expect(decodePlaceIdFromPath(enc)).toBe(desc);
  });

  it("matchTokensFromLocationDescription splits comma-separated text", () => {
    expect(matchTokensFromLocationDescription("Seattle, WA, USA")).toEqual([
      "Seattle",
      "WA",
      "USA",
    ]);
  });

  it("googleMapsSearchUrlForLocation builds a search link", () => {
    expect(googleMapsSearchUrlForLocation("Boston, MA")).toBe(
      "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Boston, MA"),
    );
    expect(googleMapsSearchUrlForLocation("   ")).toBe("");
  });
});

describe("getPlacesApiKey", () => {
  const savedKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

  afterEach(() => {
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = savedKey;
  });

  it("reads NEXT_PUBLIC_GOOGLE_PLACES_API_KEY", () => {
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = "abc";
    expect(getPlacesApiKey()).toBe("abc");
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = "";
    expect(getPlacesApiKey()).toBe("");
  });
});

describe("buildMatchTokensFromPlace extra branches", () => {
  it("includes neighborhood and first formattedAddress segment", () => {
    const tokens = buildMatchTokensFromPlace("First Street, City, USA", [
      { longText: "Hood", shortText: "H", types: ["neighborhood"] },
    ]);
    expect(tokens).toContain("Hood");
    expect(tokens).toContain("First Street");
  });

  it("does not double-push shortText when it equals longText", () => {
    const tokens = buildMatchTokensFromPlace("Addr", [
      { longText: "Brooklyn", shortText: "Brooklyn", types: ["neighborhood"] },
    ]);
    expect(tokens.filter((t) => t === "Brooklyn")).toHaveLength(1);
  });

  it("handles undefined addressComponents by falling back to formattedAddress segment", () => {
    const tokens = buildMatchTokensFromPlace("Portland, OR, USA", undefined);
    expect(tokens).toContain("Portland");
    expect(tokens).not.toContain("OR");
  });
});

describe("matchTokensFromLocationDescription edge cases", () => {
  it("returns empty array for empty string", () => {
    expect(matchTokensFromLocationDescription("")).toEqual([]);
  });

  it("returns empty array for whitespace-only string", () => {
    expect(matchTokensFromLocationDescription("   ")).toEqual([]);
  });

  it("returns empty array when only token is too short", () => {
    expect(matchTokensFromLocationDescription("x")).toEqual([]);
  });

  it("falls back to the whole description when no commas and length >= 2", () => {
    expect(matchTokensFromLocationDescription("ab")).toEqual(["ab"]);
    expect(matchTokensFromLocationDescription("Boston")).toEqual(["Boston"]);
    expect(matchTokensFromLocationDescription("a,b")).toEqual(["a,b"]);
  });

  it("deduplicates case-insensitively", () => {
    expect(matchTokensFromLocationDescription("Seattle, seattle, SEATTLE")).toEqual(["Seattle"]);
  });
});

describe("searchPlacesByText – mapSearchPlace fallbacks", () => {
  const originalKey2 = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  const originalFetch2 = global.fetch;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = "test-key";
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = originalKey2;
    global.fetch = originalFetch2;
  });

  it("falls back to 'Unknown place' when displayName is missing", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        places: [{ id: "ChIJ_noname", formattedAddress: "123 St" }],
      }),
    });

    const out = await searchPlacesByText("test");
    expect(out[0].displayName).toBe("Unknown place");
    expect(out[0].firstPhotoName).toBeNull();
  });
});
