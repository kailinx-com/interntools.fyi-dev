package com.interntoolsfyi.paycheck.service;

import com.interntoolsfyi.paycheck.dto.PlannerDetailResponse;
import com.interntoolsfyi.paycheck.dto.PlannerSummaryResponse;
import com.interntoolsfyi.paycheck.dto.SavePlannerRequest;
import com.interntoolsfyi.paycheck.model.PlannerDocument;
import com.interntoolsfyi.paycheck.repository.PlannerDocumentRepository;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Profile("!test")
public class PaycheckPlannerService {

  private final PlannerDocumentRepository plannerDocumentRepository;
  private final UserRepository userRepository;

  public PaycheckPlannerService(
      PlannerDocumentRepository plannerDocumentRepository, UserRepository userRepository) {
    this.plannerDocumentRepository = plannerDocumentRepository;
    this.userRepository = userRepository;
  }

  @Transactional
  public PlannerDetailResponse createPlanner(
      Authentication authentication, SavePlannerRequest request) {
    User currentUser = requireCurrentUser(authentication);
    String plannerName = requireName(request.name());
    Map<String, Object> plannerData = normalizeData(request.data());

    PlannerDocument plannerToSave = toEntity(plannerData, plannerName, currentUser);
    PlannerDocument saved = plannerDocumentRepository.save(plannerToSave);
    return toDetailResponse(saved);
  }

  @Transactional(readOnly = true)
  public PlannerDetailResponse getPlanner(Authentication authentication, String id) {
    User currentUser = requireCurrentUser(authentication);

    PlannerDocument plannerToGet =
        plannerDocumentRepository
            .findByIdAndUser(id, currentUser)
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Scenario not found with id: " + id));

    return toDetailResponse(plannerToGet);
  }

  private String requireName(String name) {
    String trimmedName = Objects.requireNonNullElse(name, "").trim();
    if (trimmedName.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
    }
    return trimmedName;
  }

  private Map<String, Object> normalizeData(Map<String, Object> data) {
    if (data == null) {
      return Collections.emptyMap();
    }

    Object expenses = data.get("expenses");
    if (expenses instanceof List<?> expenseList && !expenseList.isEmpty()) {
      return Map.of("expenses", List.copyOf(expenseList));
    }

    return Collections.emptyMap();
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

  private PlannerDocument toEntity(Map<String, Object> planner, String plannerName, User user) {
    PlannerDocument entity = new PlannerDocument();
    entity.setName(plannerName);
    entity.setUser(user);
    entity.setData(planner);
    return entity;
  }

  private PlannerDetailResponse toDetailResponse(PlannerDocument entity) {
    return new PlannerDetailResponse(entity.getId(), entity.getName(), entity.getData());
  }

  public List<PlannerSummaryResponse> getAllPlanners(Authentication authentication) {
    User currentUser = requireCurrentUser(authentication);
    return plannerDocumentRepository.findByUserOrderByCreatedAtDesc(currentUser).stream()
        .map(this::toSummaryResponse)
        .toList();
  }

  private PlannerSummaryResponse toSummaryResponse(PlannerDocument entity) {
    return new PlannerSummaryResponse(entity.getId(), entity.getName(), entity.getCreatedAt());
  }

  @Transactional
  public void deletePlanner(Authentication authentication, String id) {
    User currentUser = requireCurrentUser(authentication);

    PlannerDocument plannerToDelete =
        plannerDocumentRepository
            .findByIdAndUser(id, currentUser)
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Scenario not found with id: " + id));
    plannerDocumentRepository.delete(plannerToDelete);
  }
}
