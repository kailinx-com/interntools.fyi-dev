describe("auth config", () => {
  it("exports API base url from environment", () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:8080";
    jest.isolateModules(() => {
      const config = require("./config") as { API_BASE_URL: string };
      expect(config.API_BASE_URL).toBe("http://localhost:8080");
    });
  });

  it("throws when API base url is missing", () => {
    const original = process.env.NEXT_PUBLIC_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;

    expect(() => {
      jest.isolateModules(() => {
        require("./config");
      });
    }).toThrow("NEXT_PUBLIC_API_BASE_URL is not defined");

    process.env.NEXT_PUBLIC_API_BASE_URL = original;
  });
});
