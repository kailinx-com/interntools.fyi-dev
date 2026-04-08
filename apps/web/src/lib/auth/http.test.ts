import { apiRequest } from "./http";

const originalFetch = global.fetch;

describe("apiRequest", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("sends JSON body and authorization header when token is provided", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({ id: 1 }),
    });

    await expect(apiRequest("/path", { method: "POST", body: { a: 1 }, token: "t" })).resolves.toEqual({ id: 1 });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/path"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer t",
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("throws backend message for JSON errors", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      headers: { get: () => "application/json" },
      json: async () => ({ message: "Unauthorized" }),
    });

    await expect(apiRequest("/path")).rejects.toThrow("Unauthorized");
  });

  it("throws default message for non-json errors", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      headers: { get: () => "text/plain" },
    });

    await expect(apiRequest("/path")).rejects.toThrow("Something went wrong");
  });
});
