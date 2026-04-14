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
    String officeLocation,
    PostVisibility visibility,
    PostStatus status,
    String authorUsername,
    Long comparisonId,
    List<OfferResponse> offers,
    Instant publishedAt,
    Instant createdAt,
    Instant updatedAt,
    boolean bookmarked) {}
