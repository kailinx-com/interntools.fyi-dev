package com.interntoolsfyi.offer.dto;

import java.time.Instant;

public record CommentResponse(
    Long id,
    Long postId,
    Long parentId,
    String authorUsername,
    String body,
    Instant editedAt,
    Instant createdAt) {}
