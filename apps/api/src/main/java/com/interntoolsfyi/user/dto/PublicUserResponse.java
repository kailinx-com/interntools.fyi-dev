package com.interntoolsfyi.user.dto;

import java.time.Instant;

public record PublicUserResponse(
    Long id,
    String username,
    String firstName,
    String lastName,
    Instant createdAt,
    long followerCount,
    long followingCount,
    boolean followedByViewer) {}
