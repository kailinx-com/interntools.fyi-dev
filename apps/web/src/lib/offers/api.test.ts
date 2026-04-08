import { apiRequest } from "@/lib/auth/http";
import {
  fetchOffers,
  fetchOffer,
  createOffer,
  updateOffer,
  deleteOffer,
  fetchComparisons,
  fetchComparison,
  createComparison,
  updateComparison,
  deleteComparison,
  fetchPublishedPosts,
  fetchMyPosts,
  fetchPost,
  createPost,
  updatePost,
  deletePost,
  fetchComments,
  createComment,
  updateComment,
  deleteComment,
  fetchVoteTally,
  castVote,
  deleteVote,
  bookmarkPost,
  unbookmarkPost,
  fetchBookmarkedPosts,
} from "./api";

jest.mock("@/lib/auth/http", () => ({
  apiRequest: jest.fn(),
}));

const mockedApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe("offers api client", () => {
  beforeEach(() => {
    mockedApiRequest.mockReset();
  });

  describe("fetchOffers", () => {
    it("requests user offers with token", async () => {
      const offers = [{ id: 1 }];
      mockedApiRequest.mockResolvedValue(offers);

      await expect(fetchOffers("tok")).resolves.toBe(offers);
      expect(mockedApiRequest).toHaveBeenCalledWith("/offers", { token: "tok" });
    });
  });

  describe("fetchOffer", () => {
    it("requests a single offer by id", async () => {
      const offer = { id: 5 };
      mockedApiRequest.mockResolvedValue(offer);

      await expect(fetchOffer("tok", 5)).resolves.toBe(offer);
      expect(mockedApiRequest).toHaveBeenCalledWith("/offers/5", { token: "tok" });
    });
  });

  describe("createOffer", () => {
    it("posts a new offer", async () => {
      const body = { company: "Acme", title: "SWE", employmentType: "internship" as const, compensationType: "hourly" as const, payAmount: 50, officeLocation: "NYC" };
      const created = { id: 10, ...body };
      mockedApiRequest.mockResolvedValue(created);

      await expect(createOffer("tok", body)).resolves.toBe(created);
      expect(mockedApiRequest).toHaveBeenCalledWith("/offers", { method: "POST", token: "tok", body });
    });
  });

  describe("updateOffer", () => {
    it("patches an existing offer", async () => {
      const body = { company: "Acme2", title: "SWE2", employmentType: "internship" as const, compensationType: "hourly" as const, payAmount: 60, officeLocation: "SF" };
      mockedApiRequest.mockResolvedValue({ id: 10, ...body });

      await updateOffer("tok", 10, body);
      expect(mockedApiRequest).toHaveBeenCalledWith("/offers/10", { method: "PATCH", token: "tok", body });
    });
  });

  describe("deleteOffer", () => {
    it("deletes an offer by id", async () => {
      mockedApiRequest.mockResolvedValue(undefined);

      await deleteOffer("tok", 3);
      expect(mockedApiRequest).toHaveBeenCalledWith("/offers/3", { method: "DELETE", token: "tok" });
    });

    it("propagates errors", async () => {
      mockedApiRequest.mockRejectedValue(new Error("Not found"));
      await expect(deleteOffer("tok", 999)).rejects.toThrow("Not found");
    });
  });

  describe("fetchComparisons", () => {
    it("requests user comparisons", async () => {
      const data = [{ id: 1 }];
      mockedApiRequest.mockResolvedValue(data);

      await expect(fetchComparisons("tok")).resolves.toBe(data);
      expect(mockedApiRequest).toHaveBeenCalledWith("/comparisons", { token: "tok" });
    });
  });

  describe("fetchComparison", () => {
    it("requests a single comparison", async () => {
      mockedApiRequest.mockResolvedValue({ id: 2 });

      await fetchComparison("tok", 2);
      expect(mockedApiRequest).toHaveBeenCalledWith("/comparisons/2", { token: "tok" });
    });
  });

  describe("createComparison", () => {
    it("posts a new comparison", async () => {
      const body = { name: "Test", includedOfferIds: [1, 2] };
      mockedApiRequest.mockResolvedValue({ id: 1, ...body });

      await createComparison("tok", body);
      expect(mockedApiRequest).toHaveBeenCalledWith("/comparisons", { method: "POST", token: "tok", body });
    });
  });

  describe("updateComparison", () => {
    it("patches a comparison", async () => {
      const body = { name: "Updated", includedOfferIds: [1, 3] };
      mockedApiRequest.mockResolvedValue({ id: 1, ...body });

      await updateComparison("tok", 1, body);
      expect(mockedApiRequest).toHaveBeenCalledWith("/comparisons/1", { method: "PATCH", token: "tok", body });
    });
  });

  describe("deleteComparison", () => {
    it("deletes a comparison", async () => {
      mockedApiRequest.mockResolvedValue(undefined);

      await deleteComparison("tok", 5);
      expect(mockedApiRequest).toHaveBeenCalledWith("/comparisons/5", { method: "DELETE", token: "tok" });
    });
  });

  describe("fetchPublishedPosts", () => {
    it("requests paginated public posts", async () => {
      const page = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20, last: true, first: true };
      mockedApiRequest.mockResolvedValue(page);

      await expect(fetchPublishedPosts(0, 20)).resolves.toBe(page);
      expect(mockedApiRequest).toHaveBeenCalledWith("/posts?page=0&size=20");
    });

    it("defaults to page 0, size 20", async () => {
      mockedApiRequest.mockResolvedValue({ content: [] });

      await fetchPublishedPosts();
      expect(mockedApiRequest).toHaveBeenCalledWith("/posts?page=0&size=20");
    });
  });

  describe("fetchMyPosts", () => {
    it("requests user's own posts", async () => {
      mockedApiRequest.mockResolvedValue([]);

      await fetchMyPosts("tok");
      expect(mockedApiRequest).toHaveBeenCalledWith("/posts/me", { token: "tok" });
    });
  });

  describe("fetchPost", () => {
    it("requests a single post by id", async () => {
      mockedApiRequest.mockResolvedValue({ id: 7 });

      await fetchPost(7);
      expect(mockedApiRequest).toHaveBeenCalledWith("/posts/7");
    });
  });

  describe("createPost", () => {
    it("creates a new post", async () => {
      const body = { type: "comparison" as const, title: "Test", status: "published" as const };
      mockedApiRequest.mockResolvedValue({ id: 1, ...body });

      await createPost("tok", body);
      expect(mockedApiRequest).toHaveBeenCalledWith("/posts", { method: "POST", token: "tok", body });
    });
  });

  describe("updatePost", () => {
    it("updates an existing post", async () => {
      const body = { type: "comparison" as const, title: "Updated", status: "published" as const };
      mockedApiRequest.mockResolvedValue({ id: 1, ...body });

      await updatePost("tok", 1, body);
      expect(mockedApiRequest).toHaveBeenCalledWith("/posts/1", { method: "PATCH", token: "tok", body });
    });
  });

  describe("deletePost", () => {
    it("deletes a post", async () => {
      mockedApiRequest.mockResolvedValue(undefined);

      await deletePost("tok", 4);
      expect(mockedApiRequest).toHaveBeenCalledWith("/posts/4", { method: "DELETE", token: "tok" });
    });
  });

  describe("fetchComments", () => {
    it("requests comments for a post", async () => {
      mockedApiRequest.mockResolvedValue([]);

      await fetchComments(3);
      expect(mockedApiRequest).toHaveBeenCalledWith("/posts/3/comments");
    });
  });

  describe("createComment", () => {
    it("posts a new comment", async () => {
      const body = { body: "Great post!" };
      mockedApiRequest.mockResolvedValue({ id: 1, ...body });

      await createComment("tok", 3, body);
      expect(mockedApiRequest).toHaveBeenCalledWith("/posts/3/comments", { method: "POST", token: "tok", body });
    });
  });

  describe("updateComment", () => {
    it("patches a comment", async () => {
      const body = { body: "Updated comment" };
      mockedApiRequest.mockResolvedValue({ id: 1, ...body });

      await updateComment("tok", 1, body);
      expect(mockedApiRequest).toHaveBeenCalledWith("/comments/1", { method: "PATCH", token: "tok", body });
    });
  });

  describe("deleteComment", () => {
    it("deletes a comment", async () => {
      mockedApiRequest.mockResolvedValue(undefined);

      await deleteComment("tok", 5);
      expect(mockedApiRequest).toHaveBeenCalledWith("/comments/5", { method: "DELETE", token: "tok" });
    });
  });

  describe("fetchVoteTally", () => {
    it("requests vote tally for a post", async () => {
      const tally = { postId: 2, totalVotes: 10, tally: { "0": 6, "1": 4 } };
      mockedApiRequest.mockResolvedValue(tally);

      await expect(fetchVoteTally(2)).resolves.toBe(tally);
      expect(mockedApiRequest).toHaveBeenCalledWith("/posts/2/votes");
    });
  });

  describe("castVote", () => {
    it("puts a vote for a post", async () => {
      const body = { selectedOfferIndex: 1 };
      const tally = { postId: 2, totalVotes: 11, tally: { "0": 6, "1": 5 } };
      mockedApiRequest.mockResolvedValue(tally);

      await expect(castVote("tok", 2, body)).resolves.toBe(tally);
      expect(mockedApiRequest).toHaveBeenCalledWith("/posts/2/vote", { method: "PUT", token: "tok", body });
    });
  });

  describe("deleteVote", () => {
    it("deletes a vote", async () => {
      mockedApiRequest.mockResolvedValue(undefined);

      await deleteVote("tok", 2);
      expect(mockedApiRequest).toHaveBeenCalledWith("/posts/2/vote", { method: "DELETE", token: "tok" });
    });
  });

  describe("bookmarks", () => {
    it("bookmarks a post", async () => {
      mockedApiRequest.mockResolvedValue(undefined);
      await bookmarkPost("tok", 8);
      expect(mockedApiRequest).toHaveBeenCalledWith("/posts/8/bookmark", {
        method: "POST",
        token: "tok",
      });
    });

    it("unbookmarks a post", async () => {
      mockedApiRequest.mockResolvedValue(undefined);
      await unbookmarkPost("tok", 8);
      expect(mockedApiRequest).toHaveBeenCalledWith("/posts/8/bookmark", {
        method: "DELETE",
        token: "tok",
      });
    });

    it("fetches bookmarked posts", async () => {
      mockedApiRequest.mockResolvedValue([{ id: 1 }]);
      await fetchBookmarkedPosts("tok");
      expect(mockedApiRequest).toHaveBeenCalledWith("/posts/bookmarks", {
        token: "tok",
      });
    });
  });
});
