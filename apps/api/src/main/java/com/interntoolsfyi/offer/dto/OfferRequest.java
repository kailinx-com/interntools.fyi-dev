package com.interntoolsfyi.offer.dto;

import com.interntoolsfyi.offer.model.CompensationType;
import com.interntoolsfyi.offer.model.EmploymentType;
import jakarta.validation.constraints.NotBlank;

public record OfferRequest(
    @NotBlank(message = "company is required") String company,
    String title,
    EmploymentType employmentType,
    CompensationType compensationType,
    Float payAmount,
    Integer hoursPerWeek,
    Float signOnBonus,
    Float relocationAmount,
    String equityNotes,
    String officeLocation,
    Integer daysInOffice,
    String notes,
    Boolean favorite) {}
