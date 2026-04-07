package com.interntoolsfyi.offer.dto;

import com.interntoolsfyi.offer.model.CompensationType;
import com.interntoolsfyi.offer.model.EmploymentType;
import java.time.Instant;

public record OfferResponse(
    Long id,
    String company,
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
    Boolean favorite,
    Instant createdAt,
    Instant updatedAt) {}
