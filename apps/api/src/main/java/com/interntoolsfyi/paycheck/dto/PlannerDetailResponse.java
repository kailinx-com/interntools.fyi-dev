package com.interntoolsfyi.paycheck.dto;

import java.util.Map;

public record PlannerDetailResponse(String id, String name, Map<String, Object> data) {}
