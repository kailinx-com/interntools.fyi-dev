package com.interntoolsfyi.paycheck.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SavePlanRequest(
    @NotBlank(message = "name is required")
        @Size(max = 100, message = "name must be 100 characters or fewer")
        String name,
    @NotNull(message = "config is required") @Valid PaycheckConfigDto config,
    @NotNull(message = "plannerData is required") @Valid PlannerDataDto plannerData) {}
