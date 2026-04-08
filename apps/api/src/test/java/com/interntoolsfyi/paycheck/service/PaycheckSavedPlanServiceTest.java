package com.interntoolsfyi.paycheck.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interntoolsfyi.paycheck.dto.PaycheckConfigDto;
import com.interntoolsfyi.paycheck.dto.PlanDetailResponse;
import com.interntoolsfyi.paycheck.dto.PlanSummaryResponse;
import com.interntoolsfyi.paycheck.dto.PlannerDataDto;
import com.interntoolsfyi.paycheck.dto.PlannerExpenseDto;
import com.interntoolsfyi.paycheck.dto.SavePlanRequest;
import com.interntoolsfyi.paycheck.model.PaycheckSavedPlan;
import com.interntoolsfyi.paycheck.model.State;
import com.interntoolsfyi.paycheck.repository.PaycheckSavedPlanRepository;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class PaycheckSavedPlanServiceTest {

  @Mock private PaycheckSavedPlanRepository paycheckSavedPlanRepository;
  @Mock private UserRepository userRepository;

  private PaycheckSavedPlanService paycheckSavedPlanService;

  @BeforeEach
  void setUp() {
    paycheckSavedPlanService =
        new PaycheckSavedPlanService(paycheckSavedPlanRepository, userRepository);
  }

  @Nested
  @DisplayName("createPlan")
  class CreatePlanTests {

    @Test
    @DisplayName("returns 500 when JSON serialization fails on config")
    void returnsServerErrorWhenSerializationFailsOnConfig() throws Exception {
      User user = createUser("ser-fail");
      Authentication authentication = authenticatedUser(user.getUsername());
      SavePlanRequest request = createRequest("x");

      ObjectMapper badMapper = org.mockito.Mockito.mock(ObjectMapper.class);
      when(badMapper.writeValueAsString(org.mockito.ArgumentMatchers.any()))
          .thenThrow(new JsonProcessingException("fail") {});

      ReflectionTestUtils.setField(paycheckSavedPlanService, "objectMapper", badMapper);

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));

      assertThatThrownBy(() -> paycheckSavedPlanService.createPlan(authentication, request))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> {
                assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
                assertThat(ex.getReason()).contains("Unable to serialize config");
              });
    }

    @Test
    @DisplayName("returns 500 when JSON serialization fails on planner data")
    void returnsServerErrorWhenSerializationFailsOnPlannerData() throws Exception {
      User user = createUser("ser-fail-planner");
      Authentication authentication = authenticatedUser(user.getUsername());
      SavePlanRequest request = createRequest("y");

      ObjectMapper badMapper = org.mockito.Mockito.mock(ObjectMapper.class);
      when(badMapper.writeValueAsString(org.mockito.ArgumentMatchers.any()))
          .thenReturn("{}")
          .thenThrow(new JsonProcessingException("fail") {});

      ReflectionTestUtils.setField(paycheckSavedPlanService, "objectMapper", badMapper);

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));

      assertThatThrownBy(() -> paycheckSavedPlanService.createPlan(authentication, request))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> {
                assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
                assertThat(ex.getReason()).contains("Unable to serialize plannerData");
              });
    }

    @Test
    @DisplayName("persists serialized config and planner data and returns the created detail response")
    void persistsSerializedConfigAndPlannerDataAndReturnsTheCreatedDetailResponse() {
      User user = createUser("planner");
      Authentication authentication = authenticatedUser(user.getUsername());
      SavePlanRequest request = createRequest("  Summer budget  ");
      Instant createdAt = Instant.parse("2026-03-29T10:15:30Z");

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(paycheckSavedPlanRepository.save(any(PaycheckSavedPlan.class)))
          .thenAnswer(
              invocation -> {
                PaycheckSavedPlan saved = invocation.getArgument(0);
                ReflectionTestUtils.setField(saved, "id", 11L);
                ReflectionTestUtils.setField(saved, "createdAt", createdAt);
                ReflectionTestUtils.setField(saved, "updatedAt", createdAt);
                return saved;
              });

      PlanDetailResponse response = paycheckSavedPlanService.createPlan(authentication, request);

      ArgumentCaptor<PaycheckSavedPlan> savedCaptor =
          ArgumentCaptor.forClass(PaycheckSavedPlan.class);
      verify(paycheckSavedPlanRepository).save(savedCaptor.capture());
      PaycheckSavedPlan savedPlan = savedCaptor.getValue();

      assertThat(savedPlan.getName()).isEqualTo("Summer budget");
      assertThat(savedPlan.getUser()).isSameAs(user);
      assertThat(savedPlan.getConfigJson()).contains("\"state\":\"CA\"");
      assertThat(savedPlan.getPlannerDataJson()).contains("\"Rent\"");

      assertThat(response.id()).isEqualTo(11L);
      assertThat(response.name()).isEqualTo("Summer budget");
      assertThat(response.createdAt()).isEqualTo(createdAt);
      assertThat(response.updatedAt()).isEqualTo(createdAt);
      assertThat(response.config()).usingRecursiveComparison().isEqualTo(request.config());
      assertThat(response.plannerData()).usingRecursiveComparison().isEqualTo(request.plannerData());
    }

    @Test
    @DisplayName("normalizes null expense list in planner data")
    void normalizesNullExpenseListInPlannerData() {
      User user = createUser("null-expenses");
      Authentication authentication = authenticatedUser(user.getUsername());
      SavePlanRequest request =
          new SavePlanRequest("plan", createConfig(), new PlannerDataDto(null));

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(paycheckSavedPlanRepository.save(any(PaycheckSavedPlan.class)))
          .thenAnswer(
              invocation -> {
                PaycheckSavedPlan saved = invocation.getArgument(0);
                ReflectionTestUtils.setField(saved, "id", 77L);
                ReflectionTestUtils.setField(saved, "createdAt", Instant.parse("2026-03-29T10:15:30Z"));
                ReflectionTestUtils.setField(saved, "updatedAt", Instant.parse("2026-03-29T10:15:30Z"));
                return saved;
              });

      PlanDetailResponse response = paycheckSavedPlanService.createPlan(authentication, request);

      assertThat(response.plannerData().expenses()).isEmpty();
    }

    @Test
    @DisplayName("returns bad request when the trimmed name is empty")
    void returnsBadRequestWhenTheTrimmedNameIsEmpty() {
      User user = createUser("blank");
      Authentication authentication = authenticatedUser(user.getUsername());

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));

      assertThatThrownBy(
              () ->
                  paycheckSavedPlanService.createPlan(
                      authentication, new SavePlanRequest("   ", createConfig(), createPlannerData())))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              exception -> {
                assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                assertThat(exception.getReason()).isEqualTo("name is required");
              });

      verify(paycheckSavedPlanRepository, never()).save(any(PaycheckSavedPlan.class));
    }
  }

  @Nested
  @DisplayName("getAllPlans")
  class GetAllPlansTests {

    @Test
    @DisplayName("returns plan summaries in repository order for the current user")
    void returnsPlanSummariesInRepositoryOrderForTheCurrentUser() {
      User user = createUser("summary-user");
      Authentication authentication = authenticatedUser(user.getUsername());
      PaycheckSavedPlan newest =
          createSavedPlan(user, 4L, "Newest", Instant.parse("2026-04-01T00:00:00Z"));
      PaycheckSavedPlan older =
          createSavedPlan(user, 3L, "Older", Instant.parse("2026-03-01T00:00:00Z"));

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(paycheckSavedPlanRepository.findByUserOrderByUpdatedAtDesc(user))
          .thenReturn(List.of(newest, older));

      List<PlanSummaryResponse> response = paycheckSavedPlanService.getAllPlans(authentication);

      assertThat(response)
          .extracting(PlanSummaryResponse::id, PlanSummaryResponse::name)
          .containsExactly(
              org.assertj.core.groups.Tuple.tuple(4L, "Newest"),
              org.assertj.core.groups.Tuple.tuple(3L, "Older"));
    }
  }

  @Nested
  @DisplayName("updatePlan")
  class UpdatePlanTests {

    @Test
    @DisplayName("returns 404 when the plan id is not found for the current user")
    void returnsNotFoundWhenPlanDoesNotExist() {
      User user = createUser("no-plan");
      Authentication authentication = authenticatedUser(user.getUsername());
      SavePlanRequest request = createRequest("does not matter");

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(paycheckSavedPlanRepository.findByIdAndUser(404L, user)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> paycheckSavedPlanService.updatePlan(authentication, 404L, request))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> {
                assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                assertThat(ex.getReason()).contains("Saved plan not found with id: 404");
              });
      verify(paycheckSavedPlanRepository, never()).save(any(PaycheckSavedPlan.class));
    }

    @Test
    @DisplayName("updates an owned plan and returns the updated detail response")
    void updatesAnOwnedPlanAndReturnsTheUpdatedDetailResponse() {
      User user = createUser("updater");
      Authentication authentication = authenticatedUser(user.getUsername());
      PaycheckSavedPlan existingPlan =
          createSavedPlan(user, 12L, "Original plan", Instant.parse("2026-03-29T10:15:30Z"));
      SavePlanRequest request =
          new SavePlanRequest("  Updated plan  ", createUpdatedConfig(), createUpdatedPlannerData());
      Instant updatedAt = Instant.parse("2026-03-29T12:45:00Z");

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(paycheckSavedPlanRepository.findByIdAndUser(12L, user)).thenReturn(Optional.of(existingPlan));
      when(paycheckSavedPlanRepository.save(existingPlan))
          .thenAnswer(
              invocation -> {
                PaycheckSavedPlan saved = invocation.getArgument(0);
                ReflectionTestUtils.setField(saved, "updatedAt", updatedAt);
                return saved;
              });

      PlanDetailResponse response = paycheckSavedPlanService.updatePlan(authentication, 12L, request);

      assertThat(existingPlan.getName()).isEqualTo("Updated plan");
      assertThat(existingPlan.getConfigJson()).contains("\"state\":\"TX\"");
      assertThat(existingPlan.getPlannerDataJson()).contains("\"Utilities\"");
      assertThat(response.id()).isEqualTo(12L);
      assertThat(response.name()).isEqualTo("Updated plan");
      assertThat(response.updatedAt()).isEqualTo(updatedAt);
    }
  }

  @Nested
  @DisplayName("getPlan")
  class GetPlanTests {

    @Test
    @DisplayName("returns 500 when config JSON is empty")
    void returnsServerErrorWhenConfigJsonIsEmptyString() {
      User user = createUser("empty-config");
      Authentication authentication = authenticatedUser(user.getUsername());
      PaycheckSavedPlan plan = createSavedPlan(user, 97L, "Empty config", Instant.parse("2026-03-29T11:30:00Z"));
      plan.setConfigJson("");

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(paycheckSavedPlanRepository.findByIdAndUser(97L, user)).thenReturn(Optional.of(plan));

      assertThatThrownBy(() -> paycheckSavedPlanService.getPlan(authentication, 97L))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR));
    }

    @Test
    @DisplayName("returns 500 when stored plannerData JSON is invalid")
    void returnsServerErrorWhenPlannerDataJsonIsInvalid() {
      User user = createUser("bad-planner-json");
      Authentication authentication = authenticatedUser(user.getUsername());
      PaycheckSavedPlan plan = createSavedPlan(user, 98L, "Broken planner", Instant.parse("2026-03-29T11:30:00Z"));
      plan.setPlannerDataJson("not-valid-json{{{");

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(paycheckSavedPlanRepository.findByIdAndUser(98L, user)).thenReturn(Optional.of(plan));

      assertThatThrownBy(() -> paycheckSavedPlanService.getPlan(authentication, 98L))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              exception -> {
                assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
                assertThat(exception.getReason()).contains("Unable to read plannerData");
              });
    }

    @Test
    @DisplayName("returns 500 when stored config JSON is invalid")
    void returnsServerErrorWhenConfigJsonIsInvalid() {
      User user = createUser("bad-json");
      Authentication authentication = authenticatedUser(user.getUsername());
      PaycheckSavedPlan plan = new PaycheckSavedPlan();
      plan.setName("Broken");
      plan.setUser(user);
      plan.setConfigJson("not-json-at-all{{{");
      plan.setPlannerDataJson("{\"expenses\":[]}");
      ReflectionTestUtils.setField(plan, "id", 99L);
      ReflectionTestUtils.setField(plan, "createdAt", Instant.parse("2026-03-29T11:30:00Z"));
      ReflectionTestUtils.setField(plan, "updatedAt", Instant.parse("2026-03-29T11:30:00Z"));

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(paycheckSavedPlanRepository.findByIdAndUser(99L, user)).thenReturn(Optional.of(plan));

      assertThatThrownBy(() -> paycheckSavedPlanService.getPlan(authentication, 99L))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              exception -> {
                assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
                assertThat(exception.getReason()).contains("Unable to read config");
              });
    }

    @Test
    @DisplayName("returns the detail response for a plan owned by the current user")
    void returnsTheDetailResponseForAPlanOwnedByTheCurrentUser() {
      User user = createUser("owner");
      Authentication authentication = authenticatedUser(user.getUsername());
      PaycheckSavedPlan plan =
          createSavedPlan(user, 25L, "Owned plan", Instant.parse("2026-03-29T11:30:00Z"));

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(paycheckSavedPlanRepository.findByIdAndUser(25L, user)).thenReturn(Optional.of(plan));

      PlanDetailResponse response = paycheckSavedPlanService.getPlan(authentication, 25L);

      assertThat(response.id()).isEqualTo(25L);
      assertThat(response.name()).isEqualTo("Owned plan");
      assertThat(response.config().state()).isEqualTo(State.CA);
      assertThat(response.plannerData().expenses()).hasSize(1);
    }
  }

  @Nested
  @DisplayName("deletePlan")
  class DeletePlanTests {

    @Test
    @DisplayName("deletes a plan owned by the current user")
    void deletesAPlanOwnedByTheCurrentUser() {
      User user = createUser("owner");
      Authentication authentication = authenticatedUser(user.getUsername());
      PaycheckSavedPlan plan =
          createSavedPlan(user, 66L, "Delete me", Instant.parse("2026-03-15T08:00:00Z"));

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(paycheckSavedPlanRepository.findByIdAndUser(66L, user)).thenReturn(Optional.of(plan));

      paycheckSavedPlanService.deletePlan(authentication, 66L);

      verify(paycheckSavedPlanRepository).delete(plan);
    }
  }

  @Nested
  @DisplayName("requireCurrentUser")
  class RequireCurrentUserTests {

    @Test
    @DisplayName("getAllPlans throws when authentication is null")
    void getAllPlansUnauthorizedWhenNull() {
      assertThatThrownBy(() -> paycheckSavedPlanService.getAllPlans(null))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    @DisplayName("deletePlan throws when authentication is not authenticated")
    void deletePlanUnauthorizedWhenNotAuthenticated() {
      Authentication authentication = org.mockito.Mockito.mock(Authentication.class);
      when(authentication.isAuthenticated()).thenReturn(false);

      assertThatThrownBy(() -> paycheckSavedPlanService.deletePlan(authentication, 1L))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    @DisplayName("createPlan throws when authenticated user is not in the database")
    void createPlanWhenUserMissingFromDatabase() {
      Authentication authentication = authenticatedUser("ghost");
      when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

      assertThatThrownBy(
              () ->
                  paycheckSavedPlanService.createPlan(
                      authentication, new SavePlanRequest("n", createConfig(), createPlannerData())))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getReason()).isEqualTo("Authenticated user not found"));
    }
  }

  private static Authentication authenticatedUser(String username) {
    Authentication authentication = org.mockito.Mockito.mock(Authentication.class);
    when(authentication.isAuthenticated()).thenReturn(true);
    when(authentication.getName()).thenReturn(username);
    return authentication;
  }

  private static SavePlanRequest createRequest(String name) {
    return new SavePlanRequest(name, createConfig(), createPlannerData());
  }

  private static PaycheckConfigDto createConfig() {
    return new PaycheckConfigDto(
        LocalDate.of(2026, 6, 1),
        LocalDate.of(2026, 8, 21),
        State.CA,
        32.5f,
        8,
        5,
        125.0f,
        "nonresident",
        "F1",
        2024,
        "student-exempt");
  }

  private static PlannerDataDto createPlannerData() {
    return new PlannerDataDto(
        List.of(
            new PlannerExpenseDto(
                "rent", "Rent", 1500.0, Map.of("2026-07", 1600.0, "2026-08", 1700.0))));
  }

  private static PaycheckConfigDto createUpdatedConfig() {
    return new PaycheckConfigDto(
        LocalDate.of(2026, 5, 12),
        LocalDate.of(2026, 9, 5),
        State.TX,
        40.0f,
        8,
        5,
        200.0f,
        "resident",
        "Other",
        2020,
        "withheld");
  }

  private static PlannerDataDto createUpdatedPlannerData() {
    return new PlannerDataDto(
        List.of(
            new PlannerExpenseDto(
                "utilities", "Utilities", 180.0, Map.of("2026-08", 210.0))));
  }

  private static User createUser(String username) {
    return new User(
        username,
        username + "@example.com",
        "hashed-password",
        Role.STUDENT,
        "Test",
        "User");
  }

  private static PaycheckSavedPlan createSavedPlan(
      User user, Long id, String name, Instant timestamp) {
    PaycheckSavedPlan plan = new PaycheckSavedPlan();
    plan.setName(name);
    plan.setUser(user);
    plan.setConfigJson(
        """
        {"startDate":"2026-06-01","endDate":"2026-08-21","state":"CA","hourlyRate":32.5,"workHoursPerDay":8,"workDaysPerWeek":5,"stipendPerWeek":125.0,"residency":"nonresident","visaType":"F1","arrivalYear":2024,"ficaMode":"student-exempt"}
        """);
    plan.setPlannerDataJson(
        """
        {"expenses":[{"id":"rent","name":"Rent","defaultAmount":1500.0,"overrides":{"2026-07":1600.0}}]}
        """);
    ReflectionTestUtils.setField(plan, "id", id);
    ReflectionTestUtils.setField(plan, "createdAt", timestamp);
    ReflectionTestUtils.setField(plan, "updatedAt", timestamp);
    return plan;
  }
}
