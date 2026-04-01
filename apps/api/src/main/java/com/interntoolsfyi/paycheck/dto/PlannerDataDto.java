package com.interntoolsfyi.paycheck.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record PlannerDataDto(
    @NotNull(message = "expenses is required") List<@Valid PlannerExpenseDto> expenses) {}
