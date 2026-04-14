import {
  fetchPublicProfile,
  fetchPublicProfileByUsername,
  fetchOwnProfile,
  fetchUserPosts,
  fetchFollowers,
  fetchFollowing,
  followUser,
  unfollowUser,
} from "./api";

const mockApiRequest = jest.fn();

jest.mock("@/lib/auth/http", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

describe("profile/api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiRequest.mockResolvedValue({});
  });

  describe("fetchPublicProfile", () => {
    it("calls GET /users/{id} without token when omitted", async () => {
      await fetchPublicProfile(42);
      expect(mockApiRequest).toHaveBeenCalledWith("/users/42", {
        token: undefined,
      });
    });

    it("passes token when provided", async () => {
      await fetchPublicProfile(42, "tok-abc");
      expect(mockApiRequest).toHaveBeenCalledWith("/users/42", {
        token: "tok-abc",
      });
    });

    it("returns the resolved profile", async () => {
      const profile = { id: 42, username: "bob", followedByViewer: false };
      mockApiRequest.mockResolvedValue(profile);
      const result = await fetchPublicProfile(42);
      expect(result).toBe(profile);
    });
  });

  describe("fetchPublicProfileByUsername", () => {
    it("calls GET /users/by-username/{username} without token by default", async () => {
      await fetchPublicProfileByUsername("alice");
      expect(mockApiRequest).toHaveBeenCalledWith("/users/by-username/alice", {
        token: undefined,
      });
    });

    it("passes token when provided", async () => {
      await fetchPublicProfileByUsername("alice", "tok-abc");
      expect(mockApiRequest).toHaveBeenCalledWith("/users/by-username/alice", {
        token: "tok-abc",
      });
    });
  });

  describe("fetchOwnProfile", () => {
    it("calls /users/me/profile with token", async () => {
      await fetchOwnProfile("tok-abc");
      expect(mockApiRequest).toHaveBeenCalledWith("/users/me/profile", {
        token: "tok-abc",
      });
    });
  });

  describe("fetchUserPosts", () => {
    it("calls /users/{id}/posts with token", async () => {
      mockApiRequest.mockResolvedValue([]);
      await fetchUserPosts(42, "tok-abc");
      expect(mockApiRequest).toHaveBeenCalledWith("/users/42/posts", {
        token: "tok-abc",
      });
    });

    it("passes undefined token when omitted", async () => {
      mockApiRequest.mockResolvedValue([]);
      await fetchUserPosts(42);
      expect(mockApiRequest).toHaveBeenCalledWith("/users/42/posts", {
        token: undefined,
      });
    });
  });

  describe("fetchFollowers", () => {
    it("calls /users/{id}/followers with no auth options", async () => {
      mockApiRequest.mockResolvedValue([]);
      await fetchFollowers(42);
      expect(mockApiRequest).toHaveBeenCalledWith("/users/42/followers");
    });
  });

  describe("fetchFollowing", () => {
    it("calls /users/{id}/following with no auth options", async () => {
      mockApiRequest.mockResolvedValue([]);
      await fetchFollowing(42);
      expect(mockApiRequest).toHaveBeenCalledWith("/users/42/following");
    });
  });

  describe("followUser", () => {
    it("POSTs to /users/{id}/follow with token", async () => {
      mockApiRequest.mockResolvedValue(undefined);
      await followUser("tok-abc", 42);
      expect(mockApiRequest).toHaveBeenCalledWith("/users/42/follow", {
        method: "POST",
        token: "tok-abc",
      });
    });
  });

  describe("unfollowUser", () => {
    it("DELETEs /users/{id}/follow with token", async () => {
      mockApiRequest.mockResolvedValue(undefined);
      await unfollowUser("tok-abc", 42);
      expect(mockApiRequest).toHaveBeenCalledWith("/users/42/follow", {
        method: "DELETE",
        token: "tok-abc",
      });
    });
  });
});
