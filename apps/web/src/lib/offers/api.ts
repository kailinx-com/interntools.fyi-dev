"use client";

import { apiRequest } from "@/lib/auth/http";

export type EmploymentType = "internship" | "coop" | "full_time";

export type CompensationType = "hourly" | "monthly";

export type PostType = "acceptance" | "comparison";

export type PostVisibility = "public_post" | "unlisted" | "private_post";

export type PostStatus = "draft" | "published" | "hidden";

export type Offer = {
  id: number;
  company: string;
  title: string;
  employmentType: EmploymentType | null;
  compensationType: CompensationType | null;
  payAmount: number | null;
  hoursPerWeek: number | null;
  signOnBonus: number | null;
  relocationAmount: number | null;
  equityNotes: string | null;
  officeLocation: string | null;
  daysInOffice: number | null;
  notes: string | null;
  favorite: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type OfferRequest = {
  company: string;
  title?: string;
  employmentType?: EmploymentType;
  compensationType?: CompensationType;
  payAmount?: number;
  hoursPerWeek?: number | null;
  signOnBonus?: number | null;
  relocationAmount?: number | null;
  equityNotes?: string | null;
  officeLocation?: string;
  daysInOffice?: number | null;
  notes?: string | null;
  favorite?: boolean | null;
};

export type Comparison = {
  id: number;
  name: string;
  includedOfferIds: number[];
  description: string | null;
  isPublished: boolean | null;
  computedMetrics: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ComparisonRequest = {
  name: string;
  includedOfferIds: number[];
  description?: string | null;
  computedMetrics?: string | null;
};

export type PostSummary = {
  id: number;
  type: PostType;
  title: string;
  officeLocation: string | null;
  visibility: PostVisibility;
  status: PostStatus;
  authorUsername: string;
  publishedAt: string | null;
  createdAt: string;
  bookmarked: boolean;
};

export type PostOfferItemRequest = {
  offerId?: number | null;
  company?: string | null;
  role?: string | null;
  compensationText?: string | null;
};

export type PostDetailResponse = {
  id: number;
  type: PostType;
  title: string;
  body: string | null;
  officeLocation: string | null;
  visibility: PostVisibility;
  status: PostStatus;
  authorUsername: string;
  comparisonId: number | null;
  offers: Offer[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  bookmarked: boolean;
};

export type PostRequest = {
  type: PostType;
  title: string;
  body?: string | null;
  officeLocation?: string | null;
  visibility?: PostVisibility;
  status: PostStatus;
  comparisonId?: number | null;
  offers?: PostOfferItemRequest[] | null;
};

export type CommentResponse = {
  id: number;
  postId: number;
  parentId: number | null;
  authorUsername: string;
  body: string;
  editedAt: string | null;
  createdAt: string;
};

export type CommentRequest = {
  body: string;
  parentId?: number;
};

export type VoteTallyResponse = {
  postId: number;
  totalVotes: number;
  tally: Record<string, number>;
};

export type VoteRequest = {
  selectedOfferSnapshotId?: string | null;
  selectedOfferIndex?: number | null;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
  first: boolean;
};

export async function fetchOffers(token: string): Promise<Offer[]> {
  return apiRequest<Offer[]>("/offers", { token });
}

export async function fetchOffer(token: string, id: number): Promise<Offer> {
  return apiRequest<Offer>(`/offers/${id}`, { token });
}

export async function createOffer(token: string, body: OfferRequest): Promise<Offer> {
  return apiRequest<Offer>("/offers", { method: "POST", token, body });
}

export async function updateOffer(token: string, id: number, body: OfferRequest): Promise<Offer> {
  return apiRequest<Offer>(`/offers/${id}`, { method: "PATCH", token, body });
}

export async function deleteOffer(token: string, id: number): Promise<void> {
  await apiRequest<void>(`/offers/${id}`, { method: "DELETE", token });
}

export async function fetchComparisons(token: string): Promise<Comparison[]> {
  return apiRequest<Comparison[]>("/comparisons", { token });
}

export async function fetchComparison(token: string, id: number): Promise<Comparison> {
  return apiRequest<Comparison>(`/comparisons/${id}`, { token });
}

export async function createComparison(token: string, body: ComparisonRequest): Promise<Comparison> {
  return apiRequest<Comparison>("/comparisons", { method: "POST", token, body });
}

export async function updateComparison(token: string, id: number, body: ComparisonRequest): Promise<Comparison> {
  return apiRequest<Comparison>(`/comparisons/${id}`, { method: "PATCH", token, body });
}

export async function deleteComparison(token: string, id: number): Promise<void> {
  await apiRequest<void>(`/comparisons/${id}`, { method: "DELETE", token });
}

export async function fetchPublishedPosts(
  page = 0,
  size = 20,
): Promise<PageResponse<PostSummary>> {
  return apiRequest<PageResponse<PostSummary>>(`/posts?page=${page}&size=${size}`);
}

export async function fetchRelatedPostsByLocation(text: string): Promise<PostSummary[]> {
  const params = new URLSearchParams({ text });
  return apiRequest<PostSummary[]>(`/posts/related-location?${params.toString()}`);
}

/** Same matching semantics as offers/comparisons “by office location”: any token can match (merged, deduped). */
export async function fetchRelatedPostsByLocationTokens(tokens: string[]): Promise<PostSummary[]> {
  const params = new URLSearchParams();
  appendTokensParam(params, tokens);
  const q = params.toString();
  if (!q) return [];
  return apiRequest<PostSummary[]>(`/posts/related-location?${q}`);
}

export type ResolvePlaceLinksResponse = {
  postsByOfferId: Record<string, number>;
  postsByComparisonId: Record<string, number>;
};

export async function resolvePlacePostLinks(body: {
  offerIds: number[];
  comparisonIds: number[];
}): Promise<ResolvePlaceLinksResponse> {
  return apiRequest<ResolvePlaceLinksResponse>("/posts/resolve-place-links", {
    method: "POST",
    body,
  });
}

function appendTokensParam(params: URLSearchParams, tokens: string[]): void {
  for (const t of tokens) {
    const s = t.trim();
    if (s.length > 0) params.append("tokens", s);
  }
}

export async function fetchOffersByOfficeLocation(tokens: string[]): Promise<Offer[]> {
  const params = new URLSearchParams();
  appendTokensParam(params, tokens);
  const q = params.toString();
  if (!q) return [];
  return apiRequest<Offer[]>(`/offers/by-office-location?${q}`);
}

export async function fetchComparisonsByOfficeLocation(tokens: string[]): Promise<Comparison[]> {
  const params = new URLSearchParams();
  appendTokensParam(params, tokens);
  const q = params.toString();
  if (!q) return [];
  return apiRequest<Comparison[]>(`/comparisons/by-office-location?${q}`);
}

export async function fetchMyPosts(token: string): Promise<PostSummary[]> {
  return apiRequest<PostSummary[]>("/posts/me", { token });
}

export async function fetchPost(id: number): Promise<PostDetailResponse> {
  return apiRequest<PostDetailResponse>(`/posts/${id}`);
}

export async function createPost(token: string, body: PostRequest): Promise<PostDetailResponse> {
  return apiRequest<PostDetailResponse>("/posts", { method: "POST", token, body });
}

export async function updatePost(token: string, id: number, body: PostRequest): Promise<PostDetailResponse> {
  return apiRequest<PostDetailResponse>(`/posts/${id}`, { method: "PATCH", token, body });
}

export async function deletePost(token: string, id: number): Promise<void> {
  await apiRequest<void>(`/posts/${id}`, { method: "DELETE", token });
}

export async function fetchComments(postId: number): Promise<CommentResponse[]> {
  return apiRequest<CommentResponse[]>(`/posts/${postId}/comments`);
}

export async function createComment(token: string, postId: number, body: CommentRequest): Promise<CommentResponse> {
  return apiRequest<CommentResponse>(`/posts/${postId}/comments`, { method: "POST", token, body });
}

export async function updateComment(token: string, commentId: number, body: CommentRequest): Promise<CommentResponse> {
  return apiRequest<CommentResponse>(`/comments/${commentId}`, { method: "PATCH", token, body });
}

export async function deleteComment(token: string, commentId: number): Promise<void> {
  await apiRequest<void>(`/comments/${commentId}`, { method: "DELETE", token });
}

export async function bookmarkPost(token: string, postId: number): Promise<void> {
  await apiRequest<void>(`/posts/${postId}/bookmark`, { method: "POST", token });
}

export async function unbookmarkPost(token: string, postId: number): Promise<void> {
  await apiRequest<void>(`/posts/${postId}/bookmark`, { method: "DELETE", token });
}

export async function fetchBookmarkedPosts(token: string): Promise<PostSummary[]> {
  return apiRequest<PostSummary[]>("/posts/bookmarks", { token });
}

export async function fetchVoteTally(postId: number): Promise<VoteTallyResponse> {
  return apiRequest<VoteTallyResponse>(`/posts/${postId}/votes`);
}

export async function castVote(token: string, postId: number, body: VoteRequest): Promise<VoteTallyResponse> {
  return apiRequest<VoteTallyResponse>(`/posts/${postId}/vote`, { method: "PUT", token, body });
}

export async function deleteVote(token: string, postId: number): Promise<void> {
  await apiRequest<void>(`/posts/${postId}/vote`, { method: "DELETE", token });
}
