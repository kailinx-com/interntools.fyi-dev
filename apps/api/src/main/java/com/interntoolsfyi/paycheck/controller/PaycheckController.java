package com.interntoolsfyi.paycheck.controller;

import com.interntoolsfyi.paycheck.dto.*;
import com.interntoolsfyi.paycheck.service.PaycheckPlannerService;
import com.interntoolsfyi.paycheck.service.PaycheckSavedPlanService;
import com.interntoolsfyi.paycheck.service.PaycheckScenarioService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/paycheck")
public class PaycheckController {

  private final PaycheckScenarioService paycheckScenarioService;
  private final ObjectProvider<PaycheckPlannerService> paycheckPlannerService;
  private final PaycheckSavedPlanService paycheckSavedPlanService;

  public PaycheckController(
      PaycheckScenarioService paycheckScenarioService,
      ObjectProvider<PaycheckPlannerService> paycheckPlannerService,
      PaycheckSavedPlanService paycheckSavedPlanService) {
    this.paycheckScenarioService = paycheckScenarioService;
    this.paycheckPlannerService = paycheckPlannerService;
    this.paycheckSavedPlanService = paycheckSavedPlanService;
  }

  @GetMapping("/scenarios")
  public List<ScenarioSummaryResponse> getAllScenarios(Authentication authentication) {
    return paycheckScenarioService.getAllScenarios(authentication);
  }

  @PostMapping(value = "/scenarios", consumes = "application/json")
  @ResponseStatus(HttpStatus.CREATED)
  public ScenarioDetailResponse postScenario(
      Authentication authentication, @Valid @RequestBody SaveScenarioRequest request) {
    return paycheckScenarioService.createScenario(authentication, request);
  }

  @GetMapping(value = "/scenarios/{id}", produces = "application/json")
  public ScenarioDetailResponse getScenario(Authentication authentication, @PathVariable Long id) {
    return paycheckScenarioService.getScenario(authentication, id);
  }

  @DeleteMapping("/scenarios/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteScenario(Authentication authentication, @PathVariable Long id) {
    paycheckScenarioService.deleteScenario(authentication, id);
  }

  @PostMapping(value = "/planner")
  public PlannerDetailResponse postPlanner(
      Authentication authentication, @Valid @RequestBody SavePlannerRequest request) {
    return paycheckPlannerService.getObject().createPlanner(authentication, request);
  }

  @GetMapping(value = "/planner")
  public List<PlannerSummaryResponse> getAllPlanners(Authentication authentication) {
    return paycheckPlannerService.getObject().getAllPlanners(authentication);
  }

  @GetMapping(value = "/planner/{id}", produces = "application/json")
  public PlannerDetailResponse getPlanner(Authentication authentication, @PathVariable String id) {
    return paycheckPlannerService.getObject().getPlanner(authentication, id);
  }

  @DeleteMapping(value = "/planner/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deletePlanner(Authentication authentication, @PathVariable String id) {
    paycheckPlannerService.getObject().deletePlanner(authentication, id);
  }

  @GetMapping("/plans")
  public List<PlanSummaryResponse> getAllPlans(Authentication authentication) {
    return paycheckSavedPlanService.getAllPlans(authentication);
  }

  @PostMapping(value = "/plans", consumes = "application/json")
  @ResponseStatus(HttpStatus.CREATED)
  public PlanDetailResponse postPlan(
      Authentication authentication, @Valid @RequestBody SavePlanRequest request) {
    return paycheckSavedPlanService.createPlan(authentication, request);
  }

  @PatchMapping(value = "/plans/{id}", consumes = "application/json", produces = "application/json")
  public PlanDetailResponse patchPlan(
      Authentication authentication, @PathVariable Long id, @Valid @RequestBody SavePlanRequest request) {
    return paycheckSavedPlanService.updatePlan(authentication, id, request);
  }

  @GetMapping(value = "/plans/{id}", produces = "application/json")
  public PlanDetailResponse getPlan(Authentication authentication, @PathVariable Long id) {
    return paycheckSavedPlanService.getPlan(authentication, id);
  }

  @DeleteMapping("/plans/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deletePlan(Authentication authentication, @PathVariable Long id) {
    paycheckSavedPlanService.deletePlan(authentication, id);
  }
}
