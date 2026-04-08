package com.interntoolsfyi.offer.dto;

import com.interntoolsfyi.offer.model.PostStatus;
import com.interntoolsfyi.offer.model.PostType;
import com.interntoolsfyi.offer.model.PostVisibility;
import java.time.Instant;
import java.util.List;

public record PostDetailResponse(
    Long id,
    PostType type,
    String title,
    String body,
    PostVisibility visibility,
    PostStatus status,
    String authorUsername,
    String offerSnapshots,
    List<Long> sourceOfferIds,
    Instant publishedAt,
    Instant createdAt,
    Instant updatedAt,
    boolean bookmarked) {}
