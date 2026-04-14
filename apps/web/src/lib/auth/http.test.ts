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
      status: 200,
      headers: { get: () => "application/json" },
      text: async () => JSON.stringify({ id: 1 }),
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
      status: 401,
      headers: { get: () => "application/json" },
      text: async () => JSON.stringify({ message: "Unauthorized" }),
    });

    await expect(apiRequest("/path")).rejects.toThrow("Unauthorized");
  });

  it("throws default message for non-json errors", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      headers: { get: () => "text/plain" },
      text: async () => "",
    });

    await expect(apiRequest("/path")).rejects.toThrow("Something went wrong");
  });

  it("resolves undefined for 204 No Content without parsing JSON", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 204,
      headers: { get: () => "application/json" },
      text: async () => "",
    });

    await expect(apiRequest("/posts/1", { method: "DELETE", token: "t" })).resolves.toBeUndefined();
  });
});
