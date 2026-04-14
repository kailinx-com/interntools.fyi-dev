package com.interntoolsfyi.offer.dto;

import java.util.Map;

public record ResolvePlaceLinksResponse(
    Map<Long, Long> postsByOfferId, Map<Long, Long> postsByComparisonId) {}
