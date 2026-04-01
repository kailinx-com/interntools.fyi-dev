package com.interntoolsfyi.paycheck.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Map;

public record PlannerExpenseDto(
    @NotBlank(message = "expense id is required") String id,
    @NotBlank(message = "expense name is required") String name,
    @NotNull(message = "defaultAmount is required") Double defaultAmount,
    @NotNull(message = "overrides is required") Map<String, Double> overrides) {}
