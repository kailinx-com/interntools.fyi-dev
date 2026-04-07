package com.interntoolsfyi.offer.dto;

import java.util.List;

public record ComparisonRequest(
    String name,
    List<Long> includedOfferIds,
    String description,
    String computedMetrics) {}
