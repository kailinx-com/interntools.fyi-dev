package com.interntoolsfyi.paycheck.service;

import com.interntoolsfyi.paycheck.dto.PaycheckConfigDto;
import com.interntoolsfyi.paycheck.dto.SaveScenarioRequest;
import com.interntoolsfyi.paycheck.dto.ScenarioDetailResponse;
import com.interntoolsfyi.paycheck.dto.ScenarioSummaryResponse;
import com.interntoolsfyi.paycheck.model.PaycheckConfig;
import com.interntoolsfyi.paycheck.repository.PaycheckConfigRepository;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.util.List;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Legacy calculator-scenario service kept for backward-compatible endpoints. */
@Service
public class PaycheckScenarioService {

  private final PaycheckConfigRepository paycheckConfigRepo;
  private final UserRepository userRepository;

  /**
   * Constructor for PaycheckScenarioService.
   *
   * @param paycheckConfigRepo The repository for paycheck configurations.
   * @param userRepository The repository for users.
   */
  public PaycheckScenarioService(
      PaycheckConfigRepository paycheckConfigRepo, UserRepository userRepository) {
    this.paycheckConfigRepo = paycheckConfigRepo;
    this.userRepository = userRepository;
  }

  /**
   * Get all legacy calculator scenarios for the current user.
   *
   * @param authentication The authentication object.
   * @return A list of legacy scenario summaries.
   */
  @Transactional(readOnly = true)
  public List<ScenarioSummaryResponse> getAllScenarios(Authentication authentication) {
    User currentUser = requireCurrentUser(authentication);
    return paycheckConfigRepo.findByUserOrderByCreatedAtDesc(currentUser).stream()
        .map(this::toSummaryResponse)
        .toList();
  }

  /**
   * Create a legacy calculator scenario.
   *
   * @param authentication The authentication object.
   * @param request The request object.
   * @return The created legacy scenario detail response.
   */
  @Transactional
  public ScenarioDetailResponse createScenario(
      Authentication authentication, SaveScenarioRequest request) {
    User currentUser = requireCurrentUser(authentication);

    String scenarioName = requireName(request.name());

    PaycheckConfig scenarioToSave = toEntity(request.config(), scenarioName, currentUser);
    PaycheckConfig saved = paycheckConfigRepo.save(scenarioToSave);
    return toDetailResponse(saved);
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

  /**
   * Convert a PaycheckConfigDto to a PaycheckConfig entity.
   *
   * @param config The PaycheckConfigDto object.
   * @param scenarioName The name of the legacy scenario.
   * @param user The user object.
   * @return The PaycheckConfig entity.
   */
  private PaycheckConfig toEntity(PaycheckConfigDto config, String scenarioName, User user) {
    PaycheckConfig entity = new PaycheckConfig();
    entity.setName(scenarioName);
    entity.setUser(user);
    entity.setStartDate(config.startDate());
    entity.setEndDate(config.endDate());
    entity.setState(config.state());
    entity.setHourlyRate(config.hourlyRate());
    entity.setWorkHoursPerDay(config.workHoursPerDay());
    entity.setWorkDaysPerWeek(config.workDaysPerWeek());
    entity.setStipendPerWeek(config.stipendPerWeek());
    entity.setResidency(config.residency());
    entity.setVisaType(config.visaType());
    entity.setArrivalYear(config.arrivalYear());
    entity.setFicaMode(config.ficaMode());
    return entity;
  }

  /**
   * Convert a PaycheckConfig entity to a ScenarioSummaryResponse object.
   *
   * @param entity The PaycheckConfig entity.
   * @return The ScenarioSummaryResponse object.
   */
  private ScenarioSummaryResponse toSummaryResponse(PaycheckConfig entity) {
    return new ScenarioSummaryResponse(entity.getId(), entity.getName(), entity.getCreatedAt());
  }

  /**
   * Convert a PaycheckConfig entity to a ScenarioDetailResponse object.
   *
   * @param entity The PaycheckConfig entity.
   * @return The ScenarioDetailResponse object.
   */
  private ScenarioDetailResponse toDetailResponse(PaycheckConfig entity) {
    return new ScenarioDetailResponse(
        entity.getId(), entity.getName(), entity.getCreatedAt(), toConfigDto(entity));
  }

  /**
   * Convert a PaycheckConfig entity to a PaycheckConfigDto object.
   *
   * @param entity The PaycheckConfig entity.
   * @return The PaycheckConfigDto object.
   */
  private PaycheckConfigDto toConfigDto(PaycheckConfig entity) {
    return new PaycheckConfigDto(
        entity.getStartDate(),
        entity.getEndDate(),
        entity.getState(),
        entity.getHourlyRate(),
        entity.getWorkHoursPerDay(),
        entity.getWorkDaysPerWeek(),
        entity.getStipendPerWeek(),
        entity.getResidency(),
        entity.getVisaType(),
        entity.getArrivalYear(),
        entity.getFicaMode());
  }

  /**
   * Get a legacy calculator scenario by id.
   *
   * @param authentication The authentication object.
   * @param id The id of the legacy scenario.
   * @return The legacy scenario detail response.
   */
  @Transactional(readOnly = true)
  public ScenarioDetailResponse getScenario(Authentication authentication, Long id) {
    User currentUser = requireCurrentUser(authentication);

    PaycheckConfig scenarioToGet =
        paycheckConfigRepo
            .findByIdAndUser(id, currentUser)
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Scenario not found with id: " + id));

    return toDetailResponse(scenarioToGet);
  }

  /**
   * Delete a legacy calculator scenario by id.
   *
   * @param authentication The authentication object.
   * @param id The id of the legacy scenario.
   */
  @Transactional
  public void deleteScenario(Authentication authentication, Long id) {
    User currentUser = requireCurrentUser(authentication);

    PaycheckConfig scenarioToDelete =
        paycheckConfigRepo
            .findByIdAndUser(id, currentUser)
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Scenario not found with id: " + id));

    paycheckConfigRepo.delete(scenarioToDelete);
  }
}
