package com.interntoolsfyi.offer.controller;

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
import com.interntoolsfyi.offer.model.Comparison;
import com.interntoolsfyi.offer.repository.CommentRepository;
import com.interntoolsfyi.offer.repository.ComparisonRepository;
import com.interntoolsfyi.offer.repository.CommunityPreferenceVoteRepository;
import com.interntoolsfyi.offer.repository.OfferRepository;
import com.interntoolsfyi.offer.repository.PostRepository;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.time.Instant;
import java.util.List;
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
class ComparisonControllerIntegrationTest {

  @Autowired private UserRepository userRepository;
  @Autowired private ComparisonRepository comparisonRepository;
  @Autowired private OfferRepository offerRepository;
  @Autowired private PostRepository postRepository;
  @Autowired private CommentRepository commentRepository;
  @Autowired private CommunityPreferenceVoteRepository voteRepository;
  @Autowired private JwtService jwtService;
  @Autowired private WebApplicationContext webApplicationContext;
  @Autowired private JdbcTemplate jdbcTemplate;

  private MockMvc mockMvc;

  @BeforeEach
  void setUp() {
    jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE");
    voteRepository.deleteAllInBatch();
    commentRepository.deleteAllInBatch();
    postRepository.deleteAllInBatch();
    offerRepository.deleteAllInBatch();
    comparisonRepository.deleteAllInBatch();
    userRepository.deleteAllInBatch();
    jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE");
    mockMvc =
        MockMvcBuilders.webAppContextSetup(webApplicationContext).apply(springSecurity()).build();
  }

  @Nested
  @DisplayName("POST /comparisons")
  class CreateComparisonTests {

    @Test
    @DisplayName("creates a comparison for the authenticated user and returns the created payload")
    void createsAComparisonForTheAuthenticatedUserAndReturnsTheCreatedPayload() throws Exception {
      User user = createUser("comp-creator");

      mockMvc
          .perform(
              post("/comparisons")
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(user))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(validComparisonJson("My Comparison", "[1, 2]")))
          .andExpect(status().isCreated())
          .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
          .andExpect(jsonPath("$.id").isNumber())
          .andExpect(jsonPath("$.name").value("My Comparison"))
          .andExpect(jsonPath("$.includedOfferIds").isArray())
          .andExpect(jsonPath("$.createdAt").isString());

      assertThat(comparisonRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("accepts a comparison with a blank name")
    void acceptsComparisonWithBlankName() throws Exception {
      User user = createUser("comp-blank-name");

      mockMvc
          .perform(
              post("/comparisons")
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(user))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(validComparisonJson("   ", "[1, 2]")))
          .andExpect(status().isCreated());

      assertThat(comparisonRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("accepts a comparison with fewer than 2 offer IDs")
    void acceptsComparisonWithFewerThan2OfferIds() throws Exception {
      User user = createUser("comp-too-few");

      mockMvc
          .perform(
              post("/comparisons")
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(user))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(validComparisonJson("Single offer", "[1]")))
          .andExpect(status().isCreated());

      assertThat(comparisonRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("accepts a comparison with more than 4 offer IDs")
    void acceptsComparisonWithMoreThan4OfferIds() throws Exception {
      User user = createUser("comp-too-many");

      mockMvc
          .perform(
              post("/comparisons")
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(user))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(validComparisonJson("Many offers", "[1, 2, 3, 4, 5]")))
          .andExpect(status().isCreated());

      assertThat(comparisonRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("returns unauthorized when no authentication is provided")
    void returnsUnauthorizedWhenNoAuthenticationIsProvided() throws Exception {
      mockMvc
          .perform(
              post("/comparisons")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(validComparisonJson("Unauthorized", "[1, 2]")))
          .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("returns unauthorized when the bearer token is malformed")
    void returnsUnauthorizedWhenTheBearerTokenIsMalformed() throws Exception {
      mockMvc
          .perform(
              post("/comparisons")
                  .header(HttpHeaders.AUTHORIZATION, "Bearer not-a-jwt")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(validComparisonJson("Bad token", "[1, 2]")))
          .andExpect(status().isUnauthorized());
    }
  }

  @Nested
  @DisplayName("GET /comparisons")
  class ListComparisonsTests {

    @Test
    @DisplayName("returns only the authenticated users comparisons ordered by createdAt descending")
    void returnsOnlyTheAuthenticatedUsersComparisonsOrderedByCreatedAtDescending() throws Exception {
      User owner = createUser("comp-list-owner");
      User other = createUser("comp-list-other");

      createComparison(owner, "Older", Instant.parse("2026-03-01T00:00:00Z"));
      createComparison(owner, "Newer", Instant.parse("2026-04-01T00:00:00Z"));
      createComparison(other, "Other users comparison", Instant.parse("2026-05-01T00:00:00Z"));

      mockMvc
          .perform(get("/comparisons").header(HttpHeaders.AUTHORIZATION, authHeaderFor(owner)))
          .andExpect(status().isOk())
          .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
          .andExpect(jsonPath("$.length()").value(2))
          .andExpect(jsonPath("$[0].name").value("Newer"))
          .andExpect(jsonPath("$[1].name").value("Older"));
    }

    @Test
    @DisplayName("returns unauthorized when no authentication is provided")
    void returnsUnauthorizedWhenNoAuthenticationIsProvided() throws Exception {
      mockMvc.perform(get("/comparisons")).andExpect(status().isUnauthorized());
    }
  }

  @Nested
  @DisplayName("GET /comparisons/{id}")
  class GetComparisonTests {

    @Test
    @DisplayName("returns the owned comparison detail for the authenticated user")
    void returnsTheOwnedComparisonDetailForTheAuthenticatedUser() throws Exception {
      User owner = createUser("comp-getter");
      Comparison comparison =
          createComparison(owner, "Detailed", Instant.parse("2026-03-01T00:00:00Z"));

      mockMvc
          .perform(
              get("/comparisons/{id}", comparison.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(owner)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.id").value(comparison.getId()))
          .andExpect(jsonPath("$.name").value("Detailed"));
    }

    @Test
    @DisplayName("returns not found when the comparison belongs to another user")
    void returnsNotFoundWhenTheComparisonBelongsToAnotherUser() throws Exception {
      User owner = createUser("comp-get-owner");
      User other = createUser("comp-get-other");
      Comparison comparison =
          createComparison(owner, "Private", Instant.parse("2026-03-01T00:00:00Z"));

      mockMvc
          .perform(
              get("/comparisons/{id}", comparison.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(other)))
          .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("returns unauthorized when no authentication is provided")
    void returnsUnauthorizedWhenNoAuthenticationIsProvided() throws Exception {
      User owner = createUser("comp-get-auth-owner");
      Comparison comparison =
          createComparison(owner, "Private", Instant.parse("2026-03-01T00:00:00Z"));

      mockMvc
          .perform(get("/comparisons/{id}", comparison.getId()))
          .andExpect(status().isUnauthorized());
    }
  }

  @Nested
  @DisplayName("PATCH /comparisons/{id}")
  class UpdateComparisonTests {

    @Test
    @DisplayName("updates an owned comparison and returns the updated payload")
    void updatesAnOwnedComparisonAndReturnsTheUpdatedPayload() throws Exception {
      User owner = createUser("comp-updater");
      Comparison comparison =
          createComparison(owner, "Old Name", Instant.parse("2026-03-01T00:00:00Z"));

      mockMvc
          .perform(
              patch("/comparisons/{id}", comparison.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(owner))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(validComparisonJson("New Name", "[1, 2, 3]")))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.name").value("New Name"));

      assertThat(comparisonRepository.findById(comparison.getId()).orElseThrow().getName())
          .isEqualTo("New Name");
    }

    @Test
    @DisplayName("returns not found when updating a comparison owned by another user")
    void returnsNotFoundWhenUpdatingAComparisonOwnedByAnotherUser() throws Exception {
      User owner = createUser("comp-update-owner");
      User other = createUser("comp-update-other");
      Comparison comparison =
          createComparison(owner, "Protected", Instant.parse("2026-03-01T00:00:00Z"));

      mockMvc
          .perform(
              patch("/comparisons/{id}", comparison.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(other))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(validComparisonJson("Hacked", "[1, 2]")))
          .andExpect(status().isNotFound());

      assertThat(comparisonRepository.findById(comparison.getId()).orElseThrow().getName())
          .isEqualTo("Protected");
    }
  }

  @Nested
  @DisplayName("DELETE /comparisons/{id}")
  class DeleteComparisonTests {

    @Test
    @DisplayName("deletes an owned comparison and returns no content")
    void deletesAnOwnedComparisonAndReturnsNoContent() throws Exception {
      User owner = createUser("comp-deleter");
      Comparison comparison =
          createComparison(owner, "Delete me", Instant.parse("2026-03-01T00:00:00Z"));

      mockMvc
          .perform(
              delete("/comparisons/{id}", comparison.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(owner)))
          .andExpect(status().isNoContent());

      assertThat(comparisonRepository.findById(comparison.getId())).isEmpty();
    }

    @Test
    @DisplayName("returns not found when deleting a comparison owned by another user")
    void returnsNotFoundWhenDeletingAComparisonOwnedByAnotherUser() throws Exception {
      User owner = createUser("comp-delete-owner");
      User other = createUser("comp-delete-other");
      Comparison comparison =
          createComparison(owner, "Protected", Instant.parse("2026-03-01T00:00:00Z"));

      mockMvc
          .perform(
              delete("/comparisons/{id}", comparison.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(other)))
          .andExpect(status().isNotFound());

      assertThat(comparisonRepository.findById(comparison.getId())).isPresent();
    }

    @Test
    @DisplayName("returns unauthorized when no authentication is provided")
    void returnsUnauthorizedWhenNoAuthenticationIsProvided() throws Exception {
      User owner = createUser("comp-delete-auth-owner");
      Comparison comparison =
          createComparison(owner, "Protected", Instant.parse("2026-03-01T00:00:00Z"));

      mockMvc
          .perform(delete("/comparisons/{id}", comparison.getId()))
          .andExpect(status().isUnauthorized());

      assertThat(comparisonRepository.findById(comparison.getId())).isPresent();
    }
  }


  private User createUser(String username) {
    return userRepository.saveAndFlush(
        new User(
            username, username + "@example.com", "hashed-password", Role.STUDENT, "Test", "User"));
  }

  private Comparison createComparison(User user, String name, Instant createdAt) {
    Comparison comparison = new Comparison();
    comparison.setUser(user);
    comparison.setName(name);
    comparison.setIncludedOfferIds(List.of(1L, 2L));
    ReflectionTestUtils.setField(comparison, "createdAt", createdAt);
    return comparisonRepository.saveAndFlush(comparison);
  }

  private String authHeaderFor(User user) {
    String token =
        jwtService.generateToken(user.getUsername(), user.getId(), user.getRole().name());
    return "Bearer " + token;
  }

  private String validComparisonJson(String name, String offerIds) {
    return """
        {
          "name": "%s",
          "includedOfferIds": %s,
          "description": "Test description"
        }
        """
        .formatted(name, offerIds);
  }
}
