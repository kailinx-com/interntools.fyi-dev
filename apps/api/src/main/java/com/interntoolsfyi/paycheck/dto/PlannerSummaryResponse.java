package com.interntoolsfyi.paycheck.dto;

import java.time.Instant;

public record PlannerSummaryResponse(String id, String name, Instant createdAt) {}
