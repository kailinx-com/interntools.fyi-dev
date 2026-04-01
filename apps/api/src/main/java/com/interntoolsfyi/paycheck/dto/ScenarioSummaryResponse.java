package com.interntoolsfyi.paycheck.dto;

import java.time.Instant;

public record ScenarioSummaryResponse(Long id, String name, Instant createdAt) {}
