package com.interntoolsfyi.paycheck.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.interntoolsfyi.auth.service.JwtService;
import com.interntoolsfyi.paycheck.dto.PlannerDetailResponse;
import com.interntoolsfyi.paycheck.dto.PlannerSummaryResponse;
import com.interntoolsfyi.paycheck.service.PaycheckPlannerService;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@ActiveProfiles("test")
class PaycheckPlannerEndpointsIntegrationTest {

  @Autowired private PaycheckPlannerService paycheckPlannerService;

  @Autowired private UserRepository userRepository;
  @Autowired private JwtService jwtService;
  @Autowired private WebApplicationContext webApplicationContext;
  @Autowired private JdbcTemplate jdbcTemplate;

  private MockMvc mockMvc;

  @BeforeEach
  void setUp() {
    reset(paycheckPlannerService);
    jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE");
    userRepository.deleteAllInBatch();
    jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE");
    mockMvc =
        MockMvcBuilders.webAppContextSetup(webApplicationContext).apply(springSecurity()).build();
  }

  @Test
  @DisplayName("GET /paycheck/planner returns summaries from service")
  void getAllPlannersReturnsSummaries() throws Exception {
    User user = createUser("planner-list");
    when(paycheckPlannerService.getAllPlanners(any()))
        .thenReturn(
            List.of(
                new PlannerSummaryResponse("p-1", "First", Instant.parse("2026-04-01T12:00:00Z"))));

    mockMvc
        .perform(get("/paycheck/planner").header(HttpHeaders.AUTHORIZATION, authHeaderFor(user)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value("p-1"))
        .andExpect(jsonPath("$[0].name").value("First"));
  }

  @Test
  @DisplayName("POST /paycheck/planner creates via service and returns 200 JSON body")
  void postPlannerDelegatesToService() throws Exception {
    User user = createUser("planner-create");
    when(paycheckPlannerService.createPlanner(any(), any()))
        .thenReturn(new PlannerDetailResponse("new-id", "Named", Map.of("expenses", List.of())));

    mockMvc
        .perform(
            post("/paycheck/planner")
                .header(HttpHeaders.AUTHORIZATION, authHeaderFor(user))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "name": "Named",
                      "data": { "expenses": [ { "name": "Rent" } ] }
                    }
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("new-id"))
        .andExpect(jsonPath("$.name").value("Named"));

    verify(paycheckPlannerService).createPlanner(any(), any());
  }

  @Test
  @DisplayName("GET /paycheck/planner/{id} returns detail from service")
  void getPlannerByIdReturnsDetail() throws Exception {
    User user = createUser("planner-get");
    when(paycheckPlannerService.getPlanner(any(), eq("abc")))
        .thenReturn(new PlannerDetailResponse("abc", "Doc", Map.of("k", "v")));

    mockMvc
        .perform(
            get("/paycheck/planner/{id}", "abc")
                .header(HttpHeaders.AUTHORIZATION, authHeaderFor(user)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("abc"))
        .andExpect(jsonPath("$.name").value("Doc"));
  }

  @Test
  @DisplayName("DELETE /paycheck/planner/{id} returns 204")
  void deletePlannerReturns204() throws Exception {
    User user = createUser("planner-del");

    mockMvc
        .perform(
            delete("/paycheck/planner/{id}", "to-delete")
                .header(HttpHeaders.AUTHORIZATION, authHeaderFor(user)))
        .andExpect(status().isNoContent());

    verify(paycheckPlannerService).deletePlanner(any(), eq("to-delete"));
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

  private String authHeaderFor(User user) {
    String token = jwtService.generateToken(user.getUsername(), user.getId(), user.getRole().name());
    return "Bearer " + token;
  }
}
