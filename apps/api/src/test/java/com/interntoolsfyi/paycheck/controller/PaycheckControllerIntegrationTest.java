package com.interntoolsfyi.paycheck.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.interntoolsfyi.auth.service.JwtService;
import com.interntoolsfyi.paycheck.model.PaycheckConfig;
import com.interntoolsfyi.paycheck.model.PaycheckSavedPlan;
import com.interntoolsfyi.paycheck.model.State;
import com.interntoolsfyi.paycheck.repository.PaycheckConfigRepository;
import com.interntoolsfyi.paycheck.repository.PaycheckSavedPlanRepository;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.time.Instant;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@ActiveProfiles("test")
class PaycheckControllerIntegrationTest {

  @Autowired private UserRepository userRepository;
  @Autowired private PaycheckConfigRepository paycheckConfigRepository;
  @Autowired private PaycheckSavedPlanRepository paycheckSavedPlanRepository;
  @Autowired private JwtService jwtService;
  @Autowired private WebApplicationContext webApplicationContext;
  @Autowired private JdbcTemplate jdbcTemplate;

  private MockMvc mockMvc;

  @BeforeEach
  void setUp() {
    jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE");
    paycheckSavedPlanRepository.deleteAllInBatch();
    paycheckConfigRepository.deleteAllInBatch();
    userRepository.deleteAllInBatch();
    jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE");
    mockMvc =
        MockMvcBuilders.webAppContextSetup(webApplicationContext).apply(springSecurity()).build();
  }

  @Nested
  @DisplayName("POST /paycheck/scenarios")
  class CreateScenarioTests {

    @Test
    @DisplayName("creates a scenario for the authenticated user and returns the detail payload")
    void createsAScenarioForTheAuthenticatedUserAndReturnsTheDetailPayload() throws Exception {
      User user = createUser("creator");

      mockMvc
          .perform(
              post("/paycheck/scenarios")
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(user))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(validScenarioRequestJson("  Summer internship  ")))
          .andExpect(status().isCreated())
          .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
          .andExpect(jsonPath("$.id").isNumber())
          .andExpect(jsonPath("$.name").value("Summer internship"))
          .andExpect(jsonPath("$.createdAt").isString())
          .andExpect(jsonPath("$.config.startDate").value("2026-06-01"))
          .andExpect(jsonPath("$.config.endDate").value("2026-08-21"))
          .andExpect(jsonPath("$.config.state").value(State.CA.name()))
          .andExpect(jsonPath("$.config.hourlyRate").value(32.5))
          .andExpect(jsonPath("$.config.workHoursPerDay").value(8))
          .andExpect(jsonPath("$.config.workDaysPerWeek").value(5))
          .andExpect(jsonPath("$.config.stipendPerWeek").value(125.0))
          .andExpect(jsonPath("$.config.residency").value("nonresident"))
          .andExpect(jsonPath("$.config.visaType").value("F1"))
          .andExpect(jsonPath("$.config.arrivalYear").value(2024))
          .andExpect(jsonPath("$.config.ficaMode").value("student-exempt"));

      assertThat(paycheckConfigRepository.count()).isEqualTo(1);
      PaycheckConfig saved = paycheckConfigRepository.findAll().getFirst();
      assertThat(saved.getName()).isEqualTo("Summer internship");
      assertThat(saved.getCreatedAt()).isNotNull();
      assertThat(paycheckConfigRepository.findByUserOrderByCreatedAtDesc(user)).hasSize(1);
    }

    @Test
    @DisplayName("returns bad request when the request body is missing required nested config data")
    void returnsBadRequestWhenTheRequestBodyIsMissingRequiredNestedConfigData() throws Exception {
      User user = createUser("missing-config");

      mockMvc
          .perform(
              post("/paycheck/scenarios")
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(user))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(
                      """
                      {
                        "name": "Incomplete scenario",
                        "config": {
                          "startDate": "2026-06-01",
                          "endDate": "2026-08-21",
                          "state": "CA",
                          "workHoursPerDay": 8,
                          "workDaysPerWeek": 5,
                          "residency": "nonresident",
                          "arrivalYear": 2024,
                          "ficaMode": "student-exempt"
                        }
                      }
                      """))
          .andExpect(status().isBadRequest());

      assertThat(paycheckConfigRepository.count()).isZero();
    }

    @Test
    @DisplayName("returns bad request when the scenario name is blank")
    void returnsBadRequestWhenTheScenarioNameIsBlank() throws Exception {
      User user = createUser("blank-name");

      mockMvc
          .perform(
              post("/paycheck/scenarios")
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(user))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(validScenarioRequestJson("   ")))
          .andExpect(status().isBadRequest());

      assertThat(paycheckConfigRepository.count()).isZero();
    }

    @Test
    @DisplayName("returns bad request when the state enum value is invalid")
    void returnsBadRequestWhenTheStateEnumValueIsInvalid() throws Exception {
      User user = createUser("invalid-state");

      mockMvc
          .perform(
              post("/paycheck/scenarios")
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(user))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(validScenarioRequestJson("State test").replace("\"CA\"", "\"ZZ\"")))
          .andExpect(status().isBadRequest());

      assertThat(paycheckConfigRepository.count()).isZero();
    }

    @Test
    @DisplayName("returns unauthorized when no authentication is provided")
    void returnsUnauthorizedWhenNoAuthenticationIsProvided() throws Exception {
      mockMvc
          .perform(
              post("/paycheck/scenarios")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(validScenarioRequestJson("Unauthorized")))
          .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("returns unauthorized when the bearer token is malformed")
    void returnsUnauthorizedWhenTheBearerTokenIsMalformed() throws Exception {
      mockMvc
          .perform(
              post("/paycheck/scenarios")
                  .header(HttpHeaders.AUTHORIZATION, "Bearer not-a-jwt")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(validScenarioRequestJson("Bad token")))
          .andExpect(status().isUnauthorized());
    }
  }

  @Nested
  @DisplayName("GET /paycheck/scenarios")
  class GetAllScenariosTests {

    @Test
    @DisplayName("returns only the authenticated users scenarios in descending created time order")
    void returnsOnlyTheAuthenticatedUsersScenariosInDescendingCreatedTimeOrder() throws Exception {
      User currentUser = createUser("viewer");
      User otherUser = createUser("other-viewer");

      createScenario(
          currentUser, "Older current-user scenario", Instant.parse("2026-03-01T00:00:00Z"));
      createScenario(
          currentUser, "Newest current-user scenario", Instant.parse("2026-04-01T00:00:00Z"));
      createScenario(otherUser, "Other users scenario", Instant.parse("2026-05-01T00:00:00Z"));

      mockMvc
          .perform(get("/paycheck/scenarios").header(HttpHeaders.AUTHORIZATION, authHeaderFor(currentUser)))
          .andExpect(status().isOk())
          .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
          .andExpect(jsonPath("$.length()").value(2))
          .andExpect(jsonPath("$[0].name").value("Newest current-user scenario"))
          .andExpect(jsonPath("$[1].name").value("Older current-user scenario"));
    }

    @Test
    @DisplayName("returns unauthorized when no authentication is provided")
    void returnsUnauthorizedWhenNoAuthenticationIsProvided() throws Exception {
      mockMvc.perform(get("/paycheck/scenarios")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("returns unauthorized when the token is valid but the user no longer exists")
    void returnsUnauthorizedWhenTheTokenIsValidButTheUserNoLongerExists() throws Exception {
      User user = createUser("deleted-user");
      String authHeader = authHeaderFor(user);
      jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE");
      userRepository.deleteAllInBatch();
      jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE");

      mockMvc
          .perform(get("/paycheck/scenarios").header(HttpHeaders.AUTHORIZATION, authHeader))
          .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("returns unauthorized when the bearer token is malformed")
    void returnsUnauthorizedWhenTheBearerTokenIsMalformed() throws Exception {
      mockMvc
          .perform(
              get("/paycheck/scenarios")
                  .header(HttpHeaders.AUTHORIZATION, "Bearer not-a-jwt"))
          .andExpect(status().isUnauthorized());
    }
  }

  @Nested
  @DisplayName("GET /paycheck/scenarios/{id}")
  class GetScenarioTests {

    @Test
    @DisplayName("returns the owned scenario detail for the authenticated user")
    void returnsTheOwnedScenarioDetailForTheAuthenticatedUser() throws Exception {
      User owner = createUser("detail-owner");
      PaycheckConfig scenario =
          createScenario(owner, "Detailed scenario", Instant.parse("2026-03-29T12:00:00Z"));

      mockMvc
          .perform(
              get("/paycheck/scenarios/{id}", scenario.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(owner)))
          .andExpect(status().isOk())
          .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
          .andExpect(jsonPath("$.id").value(scenario.getId()))
          .andExpect(jsonPath("$.name").value("Detailed scenario"))
          .andExpect(jsonPath("$.config.state").value(State.CA.name()))
          .andExpect(jsonPath("$.config.hourlyRate").value(32.5))
          .andExpect(jsonPath("$.config.ficaMode").value("student-exempt"));
    }

    @Test
    @DisplayName("returns not found when the scenario belongs to another user")
    void returnsNotFoundWhenTheScenarioBelongsToAnotherUser() throws Exception {
      User owner = createUser("owner");
      User differentUser = createUser("different-user");
      PaycheckConfig scenario =
          createScenario(owner, "Private scenario", Instant.parse("2026-03-29T13:00:00Z"));

      mockMvc
          .perform(
              get("/paycheck/scenarios/{id}", scenario.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(differentUser)))
          .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("returns unauthorized when no authentication is provided")
    void returnsUnauthorizedWhenNoAuthenticationIsProvided() throws Exception {
      User owner = createUser("owner");
      PaycheckConfig scenario =
          createScenario(owner, "Private scenario", Instant.parse("2026-03-29T13:00:00Z"));

      mockMvc.perform(get("/paycheck/scenarios/{id}", scenario.getId())).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("returns unauthorized when the bearer token is malformed")
    void returnsUnauthorizedWhenTheBearerTokenIsMalformed() throws Exception {
      User owner = createUser("owner");
      PaycheckConfig scenario =
          createScenario(owner, "Private scenario", Instant.parse("2026-03-29T13:00:00Z"));

      mockMvc
          .perform(
              get("/paycheck/scenarios/{id}", scenario.getId())
                  .header(HttpHeaders.AUTHORIZATION, "Bearer not-a-jwt"))
          .andExpect(status().isUnauthorized());
    }
  }

  @Nested
  @DisplayName("DELETE /paycheck/scenarios/{id}")
  class DeleteScenarioTests {

    @Test
    @DisplayName("deletes an owned scenario and returns no content")
    void deletesAnOwnedScenarioAndReturnsNoContent() throws Exception {
      User owner = createUser("delete-owner");
      PaycheckConfig scenario =
          createScenario(owner, "Delete me", Instant.parse("2026-03-10T00:00:00Z"));

      mockMvc
          .perform(
              delete("/paycheck/scenarios/{id}", scenario.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(owner)))
          .andExpect(status().isNoContent());

      assertThat(paycheckConfigRepository.findById(scenario.getId())).isEmpty();
    }

    @Test
    @DisplayName("returns not found when deleting a scenario owned by another user")
    void returnsNotFoundWhenDeletingAScenarioOwnedByAnotherUser() throws Exception {
      User owner = createUser("owner");
      User differentUser = createUser("different-user");
      PaycheckConfig scenario =
          createScenario(owner, "Protected delete", Instant.parse("2026-03-11T00:00:00Z"));

      mockMvc
          .perform(
              delete("/paycheck/scenarios/{id}", scenario.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(differentUser)))
          .andExpect(status().isNotFound());

      assertThat(paycheckConfigRepository.findById(scenario.getId())).isPresent();
    }

    @Test
    @DisplayName("returns unauthorized when no authentication is provided")
    void returnsUnauthorizedWhenNoAuthenticationIsProvided() throws Exception {
      User owner = createUser("owner");
      PaycheckConfig scenario =
          createScenario(owner, "Protected delete", Instant.parse("2026-03-11T00:00:00Z"));

      mockMvc
          .perform(delete("/paycheck/scenarios/{id}", scenario.getId()))
          .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("returns unauthorized when the bearer token is malformed")
    void returnsUnauthorizedWhenTheBearerTokenIsMalformed() throws Exception {
      User owner = createUser("owner");
      PaycheckConfig scenario =
          createScenario(owner, "Protected delete", Instant.parse("2026-03-11T00:00:00Z"));

      mockMvc
          .perform(
              delete("/paycheck/scenarios/{id}", scenario.getId())
                  .header(HttpHeaders.AUTHORIZATION, "Bearer not-a-jwt"))
          .andExpect(status().isUnauthorized());
    }
  }

  @Nested
  @DisplayName("POST /paycheck/plans")
  class CreatePlanTests {

    @Test
    @DisplayName("creates a unified saved plan for the authenticated user")
    void createsAUnifiedSavedPlanForTheAuthenticatedUser() throws Exception {
      User user = createUser("plan-creator");

      mockMvc
          .perform(
              post("/paycheck/plans")
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(user))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(validPlanRequestJson("  Summer budget  ")))
          .andExpect(status().isCreated())
          .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
          .andExpect(jsonPath("$.id").isNumber())
          .andExpect(jsonPath("$.name").value("Summer budget"))
          .andExpect(jsonPath("$.createdAt").isString())
          .andExpect(jsonPath("$.updatedAt").isString())
          .andExpect(jsonPath("$.config.state").value(State.CA.name()))
          .andExpect(jsonPath("$.plannerData.expenses[0].name").value("Rent"))
          .andExpect(jsonPath("$.plannerData.expenses[0].overrides['2026-07']").value(1600.0));

      assertThat(paycheckSavedPlanRepository.count()).isEqualTo(1);
      PaycheckSavedPlan savedPlan = paycheckSavedPlanRepository.findAll().getFirst();
      assertThat(savedPlan.getName()).isEqualTo("Summer budget");
      assertThat(savedPlan.getCreatedAt()).isNotNull();
      assertThat(savedPlan.getUpdatedAt()).isNotNull();
    }

    @Test
    @DisplayName("returns bad request when planner data is missing")
    void returnsBadRequestWhenPlannerDataIsMissing() throws Exception {
      User user = createUser("plan-missing-data");

      mockMvc
          .perform(
              post("/paycheck/plans")
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(user))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(
                      """
                      {
                        "name": "Incomplete plan",
                        "config": {
                          "startDate": "2026-06-01",
                          "endDate": "2026-08-21",
                          "state": "CA",
                          "hourlyRate": 32.5,
                          "workHoursPerDay": 8,
                          "workDaysPerWeek": 5,
                          "stipendPerWeek": 125.0,
                          "residency": "nonresident",
                          "visaType": "F1",
                          "arrivalYear": 2024,
                          "ficaMode": "student-exempt"
                        }
                      }
                      """))
          .andExpect(status().isBadRequest());

      assertThat(paycheckSavedPlanRepository.count()).isZero();
    }
  }

  @Nested
  @DisplayName("GET /paycheck/plans")
  class GetAllPlansTests {

    @Test
    @DisplayName("returns only the authenticated users saved plans ordered by updated time")
    void returnsOnlyTheAuthenticatedUsersSavedPlansOrderedByUpdatedTime() throws Exception {
      User currentUser = createUser("plan-viewer");
      User otherUser = createUser("other-plan-viewer");

      createSavedPlan(
          currentUser, "Older current-user plan", Instant.parse("2026-03-01T00:00:00Z"));
      createSavedPlan(
          currentUser, "Newest current-user plan", Instant.parse("2026-04-01T00:00:00Z"));
      createSavedPlan(otherUser, "Other users plan", Instant.parse("2026-05-01T00:00:00Z"));

      mockMvc
          .perform(get("/paycheck/plans").header(HttpHeaders.AUTHORIZATION, authHeaderFor(currentUser)))
          .andExpect(status().isOk())
          .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
          .andExpect(jsonPath("$.length()").value(2))
          .andExpect(jsonPath("$[0].name").value("Newest current-user plan"))
          .andExpect(jsonPath("$[1].name").value("Older current-user plan"));
    }
  }

  @Nested
  @DisplayName("GET /paycheck/plans/{id}")
  class GetPlanTests {

    @Test
    @DisplayName("returns the owned saved plan detail for the authenticated user")
    void returnsTheOwnedSavedPlanDetailForTheAuthenticatedUser() throws Exception {
      User owner = createUser("plan-detail-owner");
      PaycheckSavedPlan plan =
          createSavedPlan(owner, "Detailed plan", Instant.parse("2026-03-29T12:00:00Z"));

      mockMvc
          .perform(
              get("/paycheck/plans/{id}", plan.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(owner)))
          .andExpect(status().isOk())
          .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
          .andExpect(jsonPath("$.id").value(plan.getId()))
          .andExpect(jsonPath("$.name").value("Detailed plan"))
          .andExpect(jsonPath("$.config.hourlyRate").value(32.5))
          .andExpect(jsonPath("$.plannerData.expenses[0].name").value("Rent"));
    }

    @Test
    @DisplayName("returns not found when the saved plan belongs to another user")
    void returnsNotFoundWhenTheSavedPlanBelongsToAnotherUser() throws Exception {
      User owner = createUser("plan-owner");
      User differentUser = createUser("plan-different-user");
      PaycheckSavedPlan plan =
          createSavedPlan(owner, "Private plan", Instant.parse("2026-03-29T13:00:00Z"));

      mockMvc
          .perform(
              get("/paycheck/plans/{id}", plan.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(differentUser)))
          .andExpect(status().isNotFound());
    }
  }

  @Nested
  @DisplayName("PATCH /paycheck/plans/{id}")
  class UpdatePlanTests {

    @Test
    @DisplayName("updates an owned saved plan and returns the updated detail payload")
    void updatesAnOwnedSavedPlanAndReturnsTheUpdatedDetailPayload() throws Exception {
      User owner = createUser("plan-updater");
      PaycheckSavedPlan plan =
          createSavedPlan(owner, "Starter plan", Instant.parse("2026-03-29T12:00:00Z"));

      mockMvc
          .perform(
              patch("/paycheck/plans/{id}", plan.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(owner))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(validUpdatedPlanRequestJson("  Updated plan  ")))
          .andExpect(status().isOk())
          .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
          .andExpect(jsonPath("$.id").value(plan.getId()))
          .andExpect(jsonPath("$.name").value("Updated plan"))
          .andExpect(jsonPath("$.config.state").value(State.TX.name()))
          .andExpect(jsonPath("$.plannerData.expenses[0].name").value("Utilities"))
          .andExpect(jsonPath("$.plannerData.expenses[0].overrides['2026-08']").value(210.0));

      PaycheckSavedPlan updated = paycheckSavedPlanRepository.findById(plan.getId()).orElseThrow();
      assertThat(updated.getName()).isEqualTo("Updated plan");
      assertThat(updated.getConfigJson()).contains("\"state\":\"TX\"");
      assertThat(updated.getPlannerDataJson()).contains("\"Utilities\"");
    }
  }

  @Nested
  @DisplayName("DELETE /paycheck/plans/{id}")
  class DeletePlanTests {

    @Test
    @DisplayName("deletes an owned saved plan and returns no content")
    void deletesAnOwnedSavedPlanAndReturnsNoContent() throws Exception {
      User owner = createUser("plan-delete-owner");
      PaycheckSavedPlan plan =
          createSavedPlan(owner, "Delete plan", Instant.parse("2026-03-10T00:00:00Z"));

      mockMvc
          .perform(
              delete("/paycheck/plans/{id}", plan.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(owner)))
          .andExpect(status().isNoContent());

      assertThat(paycheckSavedPlanRepository.findById(plan.getId())).isEmpty();
    }

    @Test
    @DisplayName("returns not found when deleting a saved plan owned by another user")
    void returnsNotFoundWhenDeletingASavedPlanOwnedByAnotherUser() throws Exception {
      User owner = createUser("plan-owner");
      User differentUser = createUser("plan-different-user");
      PaycheckSavedPlan plan =
          createSavedPlan(owner, "Protected plan", Instant.parse("2026-03-11T00:00:00Z"));

      mockMvc
          .perform(
              delete("/paycheck/plans/{id}", plan.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(differentUser)))
          .andExpect(status().isNotFound());

      assertThat(paycheckSavedPlanRepository.findById(plan.getId())).isPresent();
    }
  }

  private User createUser(String username) {
    return userRepository.saveAndFlush(
        new User(
            username,
            username + "@example.com",
            "hashed-password",
            Role.STUDENT,
            "Test",
            "User"));
  }

  private PaycheckConfig createScenario(User user, String name, Instant createdAt) {
    PaycheckConfig scenario = new PaycheckConfig();
    scenario.setName(name);
    scenario.setUser(user);
    scenario.setStartDate(LocalDate.of(2026, 6, 1));
    scenario.setEndDate(LocalDate.of(2026, 8, 21));
    scenario.setState(State.CA);
    scenario.setHourlyRate(32.5f);
    scenario.setWorkHoursPerDay(8);
    scenario.setWorkDaysPerWeek(5);
    scenario.setStipendPerWeek(125.0f);
    scenario.setResidency("nonresident");
    scenario.setVisaType("F1");
    scenario.setArrivalYear(2024);
    scenario.setFicaMode("student-exempt");
    ReflectionTestUtils.setField(scenario, "createdAt", createdAt);
    return paycheckConfigRepository.saveAndFlush(scenario);
  }

  private String authHeaderFor(User user) {
    String token = jwtService.generateToken(user.getUsername(), user.getId(), user.getRole().name());
    return "Bearer " + token;
  }

  private PaycheckSavedPlan createSavedPlan(User user, String name, Instant updatedAt) {
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
    ReflectionTestUtils.setField(plan, "createdAt", updatedAt);
    ReflectionTestUtils.setField(plan, "updatedAt", updatedAt);
    return paycheckSavedPlanRepository.saveAndFlush(plan);
  }

  private String validScenarioRequestJson(String name) {
    return """
        {
          "name": "%s",
          "config": {
            "startDate": "2026-06-01",
            "endDate": "2026-08-21",
            "state": "CA",
            "hourlyRate": 32.5,
            "workHoursPerDay": 8,
            "workDaysPerWeek": 5,
            "stipendPerWeek": 125.0,
            "residency": "nonresident",
            "visaType": "F1",
            "arrivalYear": 2024,
            "ficaMode": "student-exempt"
          }
        }
        """
        .formatted(name);
  }

  private String validPlanRequestJson(String name) {
    return """
        {
          "name": "%s",
          "config": {
            "startDate": "2026-06-01",
            "endDate": "2026-08-21",
            "state": "CA",
            "hourlyRate": 32.5,
            "workHoursPerDay": 8,
            "workDaysPerWeek": 5,
            "stipendPerWeek": 125.0,
            "residency": "nonresident",
            "visaType": "F1",
            "arrivalYear": 2024,
            "ficaMode": "student-exempt"
          },
          "plannerData": {
            "expenses": [
              {
                "id": "rent",
                "name": "Rent",
                "defaultAmount": 1500.0,
                "overrides": {
                  "2026-07": 1600.0
                }
              }
            ]
          }
        }
        """
        .formatted(name);
  }

  private String validUpdatedPlanRequestJson(String name) {
    return """
        {
          "name": "%s",
          "config": {
            "startDate": "2026-05-12",
            "endDate": "2026-09-05",
            "state": "TX",
            "hourlyRate": 40.0,
            "workHoursPerDay": 8,
            "workDaysPerWeek": 5,
            "stipendPerWeek": 200.0,
            "residency": "resident",
            "visaType": "Other",
            "arrivalYear": 2020,
            "ficaMode": "withheld"
          },
          "plannerData": {
            "expenses": [
              {
                "id": "utilities",
                "name": "Utilities",
                "defaultAmount": 180.0,
                "overrides": {
                  "2026-08": 210.0
                }
              }
            ]
          }
        }
        """
        .formatted(name);
  }
}
