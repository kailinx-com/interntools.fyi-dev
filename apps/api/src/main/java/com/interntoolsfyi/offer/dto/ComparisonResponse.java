package com.interntoolsfyi.offer.dto;

import java.time.Instant;
import java.util.List;

public record ComparisonResponse(
    Long id,
    String name,
    List<Long> includedOfferIds,
    String description,
    Boolean isPublished,
    String computedMetrics,
    Instant createdAt,
    Instant updatedAt) {}
