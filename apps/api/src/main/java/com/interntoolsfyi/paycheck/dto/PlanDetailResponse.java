package com.interntoolsfyi.paycheck.dto;

import java.time.Instant;

public record PlanDetailResponse(
    Long id,
    String name,
    Instant createdAt,
    Instant updatedAt,
    PaycheckConfigDto config,
    PlannerDataDto plannerData) {}
