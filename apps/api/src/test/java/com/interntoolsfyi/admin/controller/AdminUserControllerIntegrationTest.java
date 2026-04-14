package com.interntoolsfyi.admin.controller;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@ActiveProfiles("test")
class AdminUserControllerIntegrationTest {

  @Autowired private UserRepository userRepository;
  @Autowired private WebApplicationContext webApplicationContext;
  @Autowired private JdbcTemplate jdbcTemplate;

  private MockMvc mockMvc;

  @BeforeEach
  void setUp() {
    jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE");
    userRepository.deleteAllInBatch();
    jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE");
    mockMvc =
        MockMvcBuilders.webAppContextSetup(webApplicationContext).apply(springSecurity()).build();
  }

  @Test
  @DisplayName("GET /admin/users is forbidden for STUDENT token")
  void listForbiddenForStudent() throws Exception {
    register("stu", "stu@example.com", "password123");
    String token = loginToken("stu", "password123");

    mockMvc
        .perform(get("/admin/users").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isForbidden());
  }

  @Test
  @DisplayName("GET /admin/users returns users for ADMIN token")
  void listOkForAdmin() throws Exception {
    register("adminu", "admin@example.com", "password123");
    promoteToAdmin("adminu");
    String token = loginToken("adminu", "password123");

    mockMvc
        .perform(get("/admin/users").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").isArray())
        .andExpect(jsonPath("$.size").value(10))
        .andExpect(jsonPath("$.content[0].username").value("adminu"))
        .andExpect(jsonPath("$.content[0].role").value(Role.ADMIN.name()));
  }

  @Test
  @DisplayName("GET /admin/users filters by search across email")
  void listFiltersBySearch() throws Exception {
    register("alpha", "alpha@example.com", "password123");
    register("beta", "beta@example.com", "password123");
    promoteToAdmin("alpha");
    String token = loginToken("alpha", "password123");

    mockMvc
        .perform(
            get("/admin/users")
                .param("search", "beta@exam")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalElements").value(1))
        .andExpect(jsonPath("$.content[0].username").value("beta"));
  }

  @Test
  @DisplayName("GET /admin/users paginates 10 per page")
  void listPaginatesTenPerPage() throws Exception {
    for (int i = 0; i < 12; i++) {
      register("user" + i, "user" + i + "@example.com", "password123");
    }
    promoteToAdmin("user0");
    String token = loginToken("user0", "password123");

    mockMvc
        .perform(
            get("/admin/users")
                .param("page", "0")
                .param("size", "10")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content.length()").value(10))
        .andExpect(jsonPath("$.totalElements").value(12))
        .andExpect(jsonPath("$.totalPages").value(2));

    mockMvc
        .perform(
            get("/admin/users")
                .param("page", "1")
                .param("size", "10")
                .param("sort", "username,asc")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content.length()").value(2));
  }

  @Test
  @DisplayName("PATCH /admin/users/{id} forbids demoting the last admin")
  void cannotDemoteLastAdmin() throws Exception {
    register("solo", "solo@example.com", "password123");
    promoteToAdmin("solo");
    User solo = userRepository.findByUsername("solo").orElseThrow();
    String token = loginToken("solo", "password123");

    mockMvc
        .perform(
            patch("/admin/users/" + solo.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"STUDENT\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("Cannot remove the last admin"));
  }

  @Test
  @DisplayName("PATCH /admin/users/{id} allows demoting one admin when another admin exists")
  void canDemoteWhenTwoAdmins() throws Exception {
    register("admin1", "a1@example.com", "password123");
    register("admin2", "a2@example.com", "password123");
    promoteToAdmin("admin1");
    promoteToAdmin("admin2");
    User u1 = userRepository.findByUsername("admin1").orElseThrow();
    String token = loginToken("admin2", "password123");

    mockMvc
        .perform(
            patch("/admin/users/" + u1.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"STUDENT\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.role").value(Role.STUDENT.name()));

    assertThatRole("admin1", Role.STUDENT);
    assertThatRole("admin2", Role.ADMIN);
  }

  private void assertThatRole(String username, Role role) {
    org.assertj.core.api.Assertions.assertThat(
            userRepository.findByUsername(username).orElseThrow().getRole())
        .isEqualTo(role);
  }

  private void promoteToAdmin(String username) {
    User u = userRepository.findByUsername(username).orElseThrow();
    u.setRole(Role.ADMIN);
    userRepository.save(u);
  }

  private void register(String username, String email, String password) throws Exception {
    mockMvc
        .perform(
            post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "username": "%s",
                      "email": "%s",
                      "password": "%s",
                      "role": "STUDENT",
                      "firstName": "T",
                      "lastName": "U"
                    }
                    """
                        .formatted(username, email, password)))
        .andExpect(status().isCreated());
  }

  private String loginToken(String username, String password) throws Exception {
    MvcResult result =
        mockMvc
            .perform(
                post("/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {"identifier":"%s","password":"%s"}
                        """
                            .formatted(username, password)))
            .andExpect(status().isOk())
            .andReturn();
    return extractToken(result.getResponse().getContentAsString());
  }

  private static String extractToken(String responseBody) {
    Matcher matcher = Pattern.compile("\"token\"\\s*:\\s*\"([^\"]+)\"").matcher(responseBody);
    if (!matcher.find()) {
      throw new AssertionError("Expected token in response: " + responseBody);
    }
    return matcher.group(1);
  }
}
