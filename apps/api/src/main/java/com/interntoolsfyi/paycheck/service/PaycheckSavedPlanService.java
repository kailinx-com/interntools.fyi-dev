package com.interntoolsfyi.paycheck.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.interntoolsfyi.paycheck.dto.PlanDetailResponse;
import com.interntoolsfyi.paycheck.dto.PlanSummaryResponse;
import com.interntoolsfyi.paycheck.dto.PaycheckConfigDto;
import com.interntoolsfyi.paycheck.dto.PlannerDataDto;
import com.interntoolsfyi.paycheck.dto.SavePlanRequest;
import com.interntoolsfyi.paycheck.model.PaycheckSavedPlan;
import com.interntoolsfyi.paycheck.repository.PaycheckSavedPlanRepository;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.util.List;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Service for unified saved paycheck plans. */
@Service
public class PaycheckSavedPlanService {

  private final PaycheckSavedPlanRepository paycheckSavedPlanRepository;
  private final UserRepository userRepository;
  private final ObjectMapper objectMapper =
      new ObjectMapper()
          .registerModule(new JavaTimeModule())
          .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

  public PaycheckSavedPlanService(
      PaycheckSavedPlanRepository paycheckSavedPlanRepository, UserRepository userRepository) {
    this.paycheckSavedPlanRepository = paycheckSavedPlanRepository;
    this.userRepository = userRepository;
  }

  @Transactional
  public PlanDetailResponse createPlan(Authentication authentication, SavePlanRequest request) {
    User currentUser = requireCurrentUser(authentication);
    PaycheckSavedPlan plan = buildPlan(new PaycheckSavedPlan(), currentUser, request);

    PaycheckSavedPlan saved = paycheckSavedPlanRepository.save(plan);
    return toDetailResponse(saved);
  }

  @Transactional
  public PlanDetailResponse updatePlan(
      Authentication authentication, Long id, SavePlanRequest request) {
    User currentUser = requireCurrentUser(authentication);
    PaycheckSavedPlan existingPlan =
        paycheckSavedPlanRepository
            .findByIdAndUser(id, currentUser)
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Saved plan not found with id: " + id));

    PaycheckSavedPlan updatedPlan = buildPlan(existingPlan, currentUser, request);
    PaycheckSavedPlan saved = paycheckSavedPlanRepository.save(updatedPlan);
    return toDetailResponse(saved);
  }

  @Transactional(readOnly = true)
  public List<PlanSummaryResponse> getAllPlans(Authentication authentication) {
    User currentUser = requireCurrentUser(authentication);
    return paycheckSavedPlanRepository.findByUserOrderByUpdatedAtDesc(currentUser).stream()
        .map(this::toSummaryResponse)
        .toList();
  }

  @Transactional(readOnly = true)
  public PlanDetailResponse getPlan(Authentication authentication, Long id) {
    User currentUser = requireCurrentUser(authentication);
    PaycheckSavedPlan plan =
        paycheckSavedPlanRepository
            .findByIdAndUser(id, currentUser)
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Saved plan not found with id: " + id));
    return toDetailResponse(plan);
  }

  @Transactional
  public void deletePlan(Authentication authentication, Long id) {
    User currentUser = requireCurrentUser(authentication);
    PaycheckSavedPlan plan =
        paycheckSavedPlanRepository
            .findByIdAndUser(id, currentUser)
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Saved plan not found with id: " + id));
    paycheckSavedPlanRepository.delete(plan);
  }

  private PlannerDataDto normalizePlannerData(PlannerDataDto plannerData) {
    return new PlannerDataDto(List.copyOf(Objects.requireNonNullElse(plannerData.expenses(), List.of())));
  }

  private PaycheckSavedPlan buildPlan(
      PaycheckSavedPlan plan, User currentUser, SavePlanRequest request) {
    String planName = requireName(request.name());
    plan.setName(planName);
    plan.setUser(currentUser);
    plan.setConfigJson(writeJson(request.config(), "config"));
    plan.setPlannerDataJson(writeJson(normalizePlannerData(request.plannerData()), "plannerData"));
    return plan;
  }

  private String requireName(String name) {
    String trimmedName = Objects.requireNonNullElse(name, "").trim();
    if (trimmedName.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
    }
    return trimmedName;
  }

  private User requireCurrentUser(Authentication authentication) {
    if (authentication == null || !authentication.isAuthenticated()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }

    String username = authentication.getName();
    return userRepository
        .findByUsername(username)
        .orElseThrow(
            () ->
                new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
  }

  private PlanSummaryResponse toSummaryResponse(PaycheckSavedPlan entity) {
    return new PlanSummaryResponse(
        entity.getId(), entity.getName(), entity.getCreatedAt(), entity.getUpdatedAt());
  }

  private PlanDetailResponse toDetailResponse(PaycheckSavedPlan entity) {
    return new PlanDetailResponse(
        entity.getId(),
        entity.getName(),
        entity.getCreatedAt(),
        entity.getUpdatedAt(),
        readJson(entity.getConfigJson(), PaycheckConfigDto.class, "config"),
        readJson(entity.getPlannerDataJson(), PlannerDataDto.class, "plannerData"));
  }

  private String writeJson(Object value, String fieldName) {
    try {
      return objectMapper.writeValueAsString(value);
    } catch (JsonProcessingException exception) {
      throw new ResponseStatusException(
          HttpStatus.INTERNAL_SERVER_ERROR, "Unable to serialize " + fieldName, exception);
    }
  }

  private <T> T readJson(String json, Class<T> type, String fieldName) {
    try {
      return objectMapper.readValue(json, type);
    } catch (JsonProcessingException exception) {
      throw new ResponseStatusException(
          HttpStatus.INTERNAL_SERVER_ERROR, "Unable to read " + fieldName, exception);
    }
  }
}
