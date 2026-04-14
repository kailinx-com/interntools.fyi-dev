package com.interntoolsfyi.paycheck.controller;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.interntoolsfyi.paycheck.dto.PaycheckConfigDto;
import com.interntoolsfyi.paycheck.dto.PlanDetailResponse;
import com.interntoolsfyi.paycheck.dto.PlannerDataDto;
import com.interntoolsfyi.paycheck.dto.PlannerDetailResponse;
import com.interntoolsfyi.paycheck.dto.PlannerSummaryResponse;
import com.interntoolsfyi.paycheck.dto.PlanSummaryResponse;
import com.interntoolsfyi.paycheck.dto.SavePlannerRequest;
import com.interntoolsfyi.paycheck.dto.SavePlanRequest;
import com.interntoolsfyi.paycheck.dto.SaveScenarioRequest;
import com.interntoolsfyi.paycheck.dto.ScenarioDetailResponse;
import com.interntoolsfyi.paycheck.dto.ScenarioSummaryResponse;
import com.interntoolsfyi.paycheck.model.State;
import com.interntoolsfyi.paycheck.service.PaycheckPlannerService;
import com.interntoolsfyi.paycheck.service.PaycheckSavedPlanService;
import com.interntoolsfyi.paycheck.service.PaycheckScenarioService;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

@ExtendWith(MockitoExtension.class)
class PaycheckControllerTest {

  @Mock private PaycheckScenarioService paycheckScenarioService;
  @Mock private PaycheckPlannerService paycheckPlannerService;
  @Mock private PaycheckSavedPlanService paycheckSavedPlanService;

  @Mock private Authentication authentication;

  private PaycheckController controller;

  @BeforeEach
  void setUp() {
    controller =
        new PaycheckController(
            paycheckScenarioService, paycheckPlannerService, paycheckSavedPlanService);
  }

  @Test
  @DisplayName("delegates scenario and planner/plan endpoints to services")
  void delegatesToServices() {
    when(paycheckScenarioService.getAllScenarios(authentication))
        .thenReturn(List.<ScenarioSummaryResponse>of());
    when(paycheckPlannerService.getAllPlanners(authentication))
        .thenReturn(List.<PlannerSummaryResponse>of());
    when(paycheckSavedPlanService.getAllPlans(authentication))
        .thenReturn(List.<PlanSummaryResponse>of());

    controller.getAllScenarios(authentication);
    controller.getAllPlanners(authentication);
    controller.getAllPlans(authentication);

    verify(paycheckScenarioService).getAllScenarios(authentication);
    verify(paycheckPlannerService).getAllPlanners(authentication);
    verify(paycheckSavedPlanService).getAllPlans(authentication);

    PaycheckConfigDto config = minimalConfig();
    SaveScenarioRequest scenarioReq = new SaveScenarioRequest("scenario", config);
    when(paycheckScenarioService.createScenario(authentication, scenarioReq))
        .thenReturn(org.mockito.Mockito.mock(ScenarioDetailResponse.class));
    controller.postScenario(authentication, scenarioReq);
    verify(paycheckScenarioService).createScenario(authentication, scenarioReq);

    when(paycheckScenarioService.getScenario(authentication, 1L))
        .thenReturn(org.mockito.Mockito.mock(ScenarioDetailResponse.class));
    controller.getScenario(authentication, 1L);
    verify(paycheckScenarioService).getScenario(authentication, 1L);

    controller.deleteScenario(authentication, 1L);
    verify(paycheckScenarioService).deleteScenario(authentication, 1L);

    SavePlannerRequest plannerReq = new SavePlannerRequest("p", Map.of());
    when(paycheckPlannerService.createPlanner(authentication, plannerReq))
        .thenReturn(org.mockito.Mockito.mock(PlannerDetailResponse.class));
    controller.postPlanner(authentication, plannerReq);
    verify(paycheckPlannerService).createPlanner(authentication, plannerReq);

    when(paycheckPlannerService.getPlanner(authentication, "id"))
        .thenReturn(org.mockito.Mockito.mock(PlannerDetailResponse.class));
    controller.getPlanner(authentication, "id");
    verify(paycheckPlannerService).getPlanner(authentication, "id");

    controller.deletePlanner(authentication, "id");
    verify(paycheckPlannerService).deletePlanner(authentication, "id");

    SavePlanRequest planReq = new SavePlanRequest("plan", config, new PlannerDataDto(List.of()));
    when(paycheckSavedPlanService.createPlan(authentication, planReq))
        .thenReturn(org.mockito.Mockito.mock(PlanDetailResponse.class));
    controller.postPlan(authentication, planReq);
    verify(paycheckSavedPlanService).createPlan(authentication, planReq);

    when(paycheckSavedPlanService.updatePlan(authentication, 2L, planReq))
        .thenReturn(org.mockito.Mockito.mock(PlanDetailResponse.class));
    controller.patchPlan(authentication, 2L, planReq);
    verify(paycheckSavedPlanService).updatePlan(authentication, 2L, planReq);

    when(paycheckSavedPlanService.getPlan(authentication, 3L))
        .thenReturn(org.mockito.Mockito.mock(PlanDetailResponse.class));
    controller.getPlan(authentication, 3L);
    verify(paycheckSavedPlanService).getPlan(authentication, 3L);

    controller.deletePlan(authentication, 4L);
    verify(paycheckSavedPlanService).deletePlan(authentication, 4L);
  }

  private static PaycheckConfigDto minimalConfig() {
    return new PaycheckConfigDto(
        LocalDate.of(2026, 1, 1),
        LocalDate.of(2026, 12, 31),
        State.CA,
        50f,
        8,
        5,
        100f,
        "resident",
        "F1",
        2024,
        "student-exempt");
  }
}
