"use client";

import { apiRequest } from "@/lib/auth/http";
import type { PostSummary } from "@/lib/offers/api";

export type PublicUserProfile = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  followerCount: number;
  followingCount: number;
  followedByViewer: boolean;
};

export type OwnUserProfile = {
  id: number;
  username: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  followerCount: number;
  followingCount: number;
};

export type FollowSummary = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
};

export async function fetchPublicProfile(
  profileId: number,
  token?: string,
): Promise<PublicUserProfile> {
  return apiRequest<PublicUserProfile>(`/users/${profileId}`, { token });
}

export async function fetchPublicProfileByUsername(
  username: string,
  token?: string,
): Promise<PublicUserProfile> {
  return apiRequest<PublicUserProfile>(`/users/by-username/${username}`, { token });
}

export async function fetchOwnProfile(token: string): Promise<OwnUserProfile> {
  return apiRequest<OwnUserProfile>("/users/me/profile", { token });
}

export async function fetchUserPosts(
  profileId: number,
  token?: string,
): Promise<PostSummary[]> {
  return apiRequest<PostSummary[]>(`/users/${profileId}/posts`, { token });
}

export async function fetchFollowers(profileId: number): Promise<FollowSummary[]> {
  return apiRequest<FollowSummary[]>(`/users/${profileId}/followers`);
}

export async function fetchFollowing(profileId: number): Promise<FollowSummary[]> {
  return apiRequest<FollowSummary[]>(`/users/${profileId}/following`);
}

export async function followUser(token: string, profileId: number): Promise<void> {
  await apiRequest<void>(`/users/${profileId}/follow`, { method: "POST", token });
}

export async function unfollowUser(token: string, profileId: number): Promise<void> {
  await apiRequest<void>(`/users/${profileId}/follow`, { method: "DELETE", token });
}
