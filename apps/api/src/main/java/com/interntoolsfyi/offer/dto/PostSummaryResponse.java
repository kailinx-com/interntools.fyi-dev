package com.interntoolsfyi.offer.dto;

import com.interntoolsfyi.offer.model.PostStatus;
import com.interntoolsfyi.offer.model.PostType;
import com.interntoolsfyi.offer.model.PostVisibility;
import java.time.Instant;

public record PostSummaryResponse(
    Long id,
    PostType type,
    String title,
    String officeLocation,
    PostVisibility visibility,
    PostStatus status,
    String authorUsername,
    Instant publishedAt,
    Instant createdAt,
    boolean bookmarked) {}
