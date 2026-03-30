package com.interntoolsfyi.paycheck.dto;

import com.interntoolsfyi.paycheck.model.State;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record PaycheckConfigDto(
    @NotNull(message = "startDate is required") LocalDate startDate,
    @NotNull(message = "endDate is required") LocalDate endDate,
    @NotNull(message = "state is required") State state,
    @NotNull(message = "hourlyRate is required") Float hourlyRate,
    @NotNull(message = "workHoursPerDay is required") Integer workHoursPerDay,
    @NotNull(message = "workDaysPerWeek is required") Integer workDaysPerWeek,
    Float stipendPerWeek,
    @NotBlank(message = "residency is required") String residency,
    String visaType,
    @NotNull(message = "arrivalYear is required") Integer arrivalYear,
    @NotBlank(message = "ficaMode is required") String ficaMode) {}
