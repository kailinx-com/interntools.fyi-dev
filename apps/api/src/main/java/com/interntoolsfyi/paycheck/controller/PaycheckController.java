package com.interntoolsfyi.paycheck.controller;

import com.interntoolsfyi.paycheck.dto.*;
import com.interntoolsfyi.paycheck.service.PaycheckPlannerService;
import com.interntoolsfyi.paycheck.service.PaycheckSavedPlanService;
import com.interntoolsfyi.paycheck.service.PaycheckScenarioService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/** PaycheckController used as the controller layer. */
@RestController
@RequestMapping("/paycheck")
public class PaycheckController {

  private final PaycheckScenarioService paycheckScenarioService;
  private final PaycheckPlannerService paycheckPlannerService;
  private final PaycheckSavedPlanService paycheckSavedPlanService;

  public PaycheckController(
      PaycheckScenarioService paycheckScenarioService,
      PaycheckPlannerService paycheckPlannerService,
      PaycheckSavedPlanService paycheckSavedPlanService) {
    this.paycheckScenarioService = paycheckScenarioService;
    this.paycheckPlannerService = paycheckPlannerService;
    this.paycheckSavedPlanService = paycheckSavedPlanService;
  }

  /**
   * Get all legacy calculator scenarios for the current user.
   *
   * @param authentication The authentication object.
   * @return A list of legacy scenario summaries.
   */
  @GetMapping("/scenarios")
  public List<ScenarioSummaryResponse> getAllScenarios(Authentication authentication) {
    return paycheckScenarioService.getAllScenarios(authentication);
  }

  /**
   * Create a legacy calculator scenario.
   *
   * @param authentication The authentication object.
   * @param request The request object.
   * @return The created legacy scenario detail response.
   */
  @PostMapping(value = "/scenarios", consumes = "application/json")
  @ResponseStatus(HttpStatus.CREATED)
  public ScenarioDetailResponse postScenario(
      Authentication authentication, @Valid @RequestBody SaveScenarioRequest request) {
    return paycheckScenarioService.createScenario(authentication, request);
  }

  /**
   * Get a legacy calculator scenario by id.
   *
   * @param authentication The authentication object.
   * @param id The id of the legacy scenario.
   * @return The legacy scenario detail response.
   */
  @GetMapping(value = "/scenarios/{id}", produces = "application/json")
  public ScenarioDetailResponse getScenario(Authentication authentication, @PathVariable Long id) {
    return paycheckScenarioService.getScenario(authentication, id);
  }

  /**
   * Delete a legacy calculator scenario by id.
   *
   * @param authentication The authentication object.
   * @param id The id of the legacy scenario.
   */
  @DeleteMapping("/scenarios/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteScenario(Authentication authentication, @PathVariable Long id) {
    paycheckScenarioService.deleteScenario(authentication, id);
  }

  /** Create a legacy planner document. */
  @PostMapping(value = "/planner")
  public PlannerDetailResponse postPlanner(
      Authentication authentication, @Valid @RequestBody SavePlannerRequest request) {
    return paycheckPlannerService.createPlanner(authentication, request);
  }

  /** Get all legacy planner documents for the current user. */
  @GetMapping(value = "/planner")
  public List<PlannerSummaryResponse> getAllPlanners(Authentication authentication) {
    return paycheckPlannerService.getAllPlanners(authentication);
  }

  /** Get a legacy planner document by id. */
  @GetMapping(value = "/planner/{id}", produces = "application/json")
  public PlannerDetailResponse getPlanner(Authentication authentication, @PathVariable String id) {
    return paycheckPlannerService.getPlanner(authentication, id);
  }

  /** Delete a legacy planner document by id. */
  @DeleteMapping(value = "/planner/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deletePlanner(Authentication authentication, @PathVariable String id) {
    paycheckPlannerService.deletePlanner(authentication, id);
  }

  /** Get all unified saved plans for the current user. */
  @GetMapping("/plans")
  public List<PlanSummaryResponse> getAllPlans(Authentication authentication) {
    return paycheckSavedPlanService.getAllPlans(authentication);
  }

  /** Create a unified saved paycheck plan. */
  @PostMapping(value = "/plans", consumes = "application/json")
  @ResponseStatus(HttpStatus.CREATED)
  public PlanDetailResponse postPlan(
      Authentication authentication, @Valid @RequestBody SavePlanRequest request) {
    return paycheckSavedPlanService.createPlan(authentication, request);
  }

  /** Update a unified saved paycheck plan by id. */
  @PatchMapping(value = "/plans/{id}", consumes = "application/json", produces = "application/json")
  public PlanDetailResponse patchPlan(
      Authentication authentication, @PathVariable Long id, @Valid @RequestBody SavePlanRequest request) {
    return paycheckSavedPlanService.updatePlan(authentication, id, request);
  }

  /** Get a unified saved paycheck plan by id. */
  @GetMapping(value = "/plans/{id}", produces = "application/json")
  public PlanDetailResponse getPlan(Authentication authentication, @PathVariable Long id) {
    return paycheckSavedPlanService.getPlan(authentication, id);
  }

  /** Delete a unified saved paycheck plan by id. */
  @DeleteMapping("/plans/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deletePlan(Authentication authentication, @PathVariable Long id) {
    paycheckSavedPlanService.deletePlan(authentication, id);
  }
}
