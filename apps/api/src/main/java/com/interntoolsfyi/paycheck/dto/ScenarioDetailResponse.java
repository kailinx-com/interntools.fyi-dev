package com.interntoolsfyi.paycheck.dto;

import java.time.Instant;

public record ScenarioDetailResponse(
    Long id, String name, Instant createdAt, PaycheckConfigDto config) {}
