import { fetchAdminUsers, patchUserRole } from "./api";

jest.mock("@/lib/auth/http", () => ({
  apiRequest: jest.fn(),
}));

import { apiRequest } from "@/lib/auth/http";

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe("admin api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetchAdminUsers builds query with pagination and sort", async () => {
    mockApiRequest.mockResolvedValue({ content: [], totalElements: 0 });
    await fetchAdminUsers("tok", {
      page: 1,
      size: 10,
      sortField: "email",
      sortDir: "desc",
    });
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/admin/users?page=1&size=10&sort=email%2Cdesc",
      { method: "GET", token: "tok" },
    );
  });

  it("fetchAdminUsers adds search when provided", async () => {
    mockApiRequest.mockResolvedValue({ content: [], totalElements: 0 });
    await fetchAdminUsers("tok", { search: "  beta  " });
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/admin/users?page=0&size=10&sort=username%2Casc&search=beta",
      { method: "GET", token: "tok" },
    );
  });

  it("patchUserRole sends role in body", async () => {
    mockApiRequest.mockResolvedValue({ id: 1 });
    await patchUserRole("tok", 99, "ADMIN");
    expect(mockApiRequest).toHaveBeenCalledWith("/admin/users/99", {
      method: "PATCH",
      token: "tok",
      body: { role: "ADMIN" },
    });
  });
});
