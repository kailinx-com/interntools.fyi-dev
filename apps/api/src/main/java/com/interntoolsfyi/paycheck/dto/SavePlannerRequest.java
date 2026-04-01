package com.interntoolsfyi.paycheck.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;

public record SavePlannerRequest(
    @NotBlank(message = "name is required")
        @Size(max = 100, message = "name must be 100 characters or fewer")
        String name,
    @JsonAlias("planner") Map<String, Object> data) {}
