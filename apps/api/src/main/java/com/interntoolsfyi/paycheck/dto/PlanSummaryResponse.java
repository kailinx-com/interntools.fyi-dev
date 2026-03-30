package com.interntoolsfyi.paycheck.dto;

import java.time.Instant;

public record PlanSummaryResponse(Long id, String name, Instant createdAt, Instant updatedAt) {}
