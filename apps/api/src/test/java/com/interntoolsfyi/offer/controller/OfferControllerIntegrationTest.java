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
import com.interntoolsfyi.offer.model.CompensationType;
import com.interntoolsfyi.offer.model.EmploymentType;
import com.interntoolsfyi.offer.model.Offer;
import com.interntoolsfyi.offer.repository.ComparisonRepository;
import com.interntoolsfyi.offer.repository.CommentRepository;
import com.interntoolsfyi.offer.repository.CommunityPreferenceVoteRepository;
import com.interntoolsfyi.offer.repository.OfferRepository;
import com.interntoolsfyi.offer.repository.PostRepository;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.time.Instant;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@ActiveProfiles("test")
class OfferControllerIntegrationTest {

  @Autowired private UserRepository userRepository;
  @Autowired private OfferRepository offerRepository;
  @Autowired private ComparisonRepository comparisonRepository;
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
  @DisplayName("POST /offers")
  class CreateOfferTests {

    @Test
    @DisplayName("creates an offer for the authenticated user and returns the created payload")
    void createsAnOfferForTheAuthenticatedUserAndReturnsTheCreatedPayload() throws Exception {
      User user = createUser("offer-creator");

      mockMvc
          .perform(
              post("/offers")
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(user))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(validOfferJson("Google", "SWE Intern")))
          .andExpect(status().isCreated())
          .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
          .andExpect(jsonPath("$.id").isNumber())
          .andExpect(jsonPath("$.company").value("Google"))
          .andExpect(jsonPath("$.title").value("SWE Intern"))
          .andExpect(jsonPath("$.employmentType").value("internship"))
          .andExpect(jsonPath("$.compensationType").value("hourly"))
          .andExpect(jsonPath("$.payAmount").value(45.0))
          .andExpect(jsonPath("$.createdAt").isString());

      assertThat(offerRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("returns bad request when company is missing from the request body")
    void returnsBadRequestWhenCompanyIsMissing() throws Exception {
      User user = createUser("offer-validator");

      mockMvc
          .perform(
              post("/offers")
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(user))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("""
                      { "title": "SWE Intern" }
                      """))
          .andExpect(status().isBadRequest());

      assertThat(offerRepository.count()).isZero();
    }

    @Test
    @DisplayName("creates an offer with only company provided")
    void createsOfferWithOnlyCompany() throws Exception {
      User user = createUser("offer-min");

      mockMvc
          .perform(
              post("/offers")
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(user))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("""
                      { "company": "Google" }
                      """))
          .andExpect(status().isCreated())
          .andExpect(jsonPath("$.company").value("Google"));

      assertThat(offerRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("returns unauthorized when no authentication is provided")
    void returnsUnauthorizedWhenNoAuthenticationIsProvided() throws Exception {
      mockMvc
          .perform(
              post("/offers")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(validOfferJson("Google", "SWE Intern")))
          .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("returns unauthorized when the bearer token is malformed")
    void returnsUnauthorizedWhenTheBearerTokenIsMalformed() throws Exception {
      mockMvc
          .perform(
              post("/offers")
                  .header(HttpHeaders.AUTHORIZATION, "Bearer not-a-jwt")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(validOfferJson("Google", "SWE Intern")))
          .andExpect(status().isUnauthorized());
    }
  }

  @Nested
  @DisplayName("GET /offers")
  class ListOffersTests {

    @Test
    @DisplayName("returns only the authenticated users offers ordered by updatedAt descending")
    void returnsOnlyTheAuthenticatedUsersOffersOrderedByUpdatedAtDescending() throws Exception {
      User owner = createUser("offer-list-owner");
      User other = createUser("offer-list-other");

      createOffer(owner, "Google", Instant.parse("2026-04-01T00:00:00Z"));
      createOffer(owner, "Meta", Instant.parse("2026-03-01T00:00:00Z"));
      createOffer(other, "Apple", Instant.parse("2026-05-01T00:00:00Z"));

      mockMvc
          .perform(get("/offers").header(HttpHeaders.AUTHORIZATION, authHeaderFor(owner)))
          .andExpect(status().isOk())
          .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
          .andExpect(jsonPath("$.length()").value(2))
          .andExpect(jsonPath("$[0].company").value("Google"))
          .andExpect(jsonPath("$[1].company").value("Meta"));
    }

    @Test
    @DisplayName("returns an empty list when the authenticated user has no offers")
    void returnsAnEmptyListWhenTheAuthenticatedUserHasNoOffers() throws Exception {
      User user = createUser("offer-empty");

      mockMvc
          .perform(get("/offers").header(HttpHeaders.AUTHORIZATION, authHeaderFor(user)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("returns unauthorized when no authentication is provided")
    void returnsUnauthorizedWhenNoAuthenticationIsProvided() throws Exception {
      mockMvc.perform(get("/offers")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("returns unauthorized when the token is valid but the user no longer exists")
    void returnsUnauthorizedWhenTheTokenIsValidButTheUserNoLongerExists() throws Exception {
      User user = createUser("offer-deleted-user");
      String authHeader = authHeaderFor(user);
      jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE");
      userRepository.deleteAllInBatch();
      jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE");

      mockMvc
          .perform(get("/offers").header(HttpHeaders.AUTHORIZATION, authHeader))
          .andExpect(status().isUnauthorized());
    }
  }

  @Nested
  @DisplayName("GET /offers/{id}")
  class GetOfferTests {

    @Test
    @DisplayName("returns the owned offer detail for the authenticated user")
    void returnsTheOwnedOfferDetailForTheAuthenticatedUser() throws Exception {
      User owner = createUser("offer-getter");
      Offer offer = createOffer(owner, "Stripe", Instant.parse("2026-03-01T00:00:00Z"));

      mockMvc
          .perform(
              get("/offers/{id}", offer.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(owner)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.id").value(offer.getId()))
          .andExpect(jsonPath("$.company").value("Stripe"));
    }

    @Test
    @DisplayName("returns not found when the offer belongs to another user")
    void returnsNotFoundWhenTheOfferBelongsToAnotherUser() throws Exception {
      User owner = createUser("offer-owner");
      User other = createUser("offer-other");
      Offer offer = createOffer(owner, "Stripe", Instant.parse("2026-03-01T00:00:00Z"));

      mockMvc
          .perform(
              get("/offers/{id}", offer.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(other)))
          .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("returns unauthorized when no authentication is provided")
    void returnsUnauthorizedWhenNoAuthenticationIsProvided() throws Exception {
      User owner = createUser("offer-auth-owner");
      Offer offer = createOffer(owner, "Stripe", Instant.parse("2026-03-01T00:00:00Z"));

      mockMvc.perform(get("/offers/{id}", offer.getId())).andExpect(status().isUnauthorized());
    }
  }

  @Nested
  @DisplayName("PATCH /offers/{id}")
  class UpdateOfferTests {

    @Test
    @DisplayName("updates an owned offer and returns the updated payload")
    void updatesAnOwnedOfferAndReturnsTheUpdatedPayload() throws Exception {
      User owner = createUser("offer-updater");
      Offer offer = createOffer(owner, "Google", Instant.parse("2026-03-01T00:00:00Z"));

      mockMvc
          .perform(
              patch("/offers/{id}", offer.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(owner))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(validOfferJson("Meta", "Software Engineer")))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.company").value("Meta"))
          .andExpect(jsonPath("$.title").value("Software Engineer"));

      Offer updated = offerRepository.findById(offer.getId()).orElseThrow();
      assertThat(updated.getCompany()).isEqualTo("Meta");
    }

    @Test
    @DisplayName("returns not found when updating an offer owned by another user")
    void returnsNotFoundWhenUpdatingAnOfferOwnedByAnotherUser() throws Exception {
      User owner = createUser("offer-update-owner");
      User other = createUser("offer-update-other");
      Offer offer = createOffer(owner, "Google", Instant.parse("2026-03-01T00:00:00Z"));

      mockMvc
          .perform(
              patch("/offers/{id}", offer.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(other))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(validOfferJson("Hacked", "Title")))
          .andExpect(status().isNotFound());

      assertThat(offerRepository.findById(offer.getId()).orElseThrow().getCompany())
          .isEqualTo("Google");
    }

    @Test
    @DisplayName("returns unauthorized when no authentication is provided")
    void returnsUnauthorizedWhenNoAuthenticationIsProvided() throws Exception {
      User owner = createUser("offer-patch-auth-owner");
      Offer offer = createOffer(owner, "Google", Instant.parse("2026-03-01T00:00:00Z"));

      mockMvc
          .perform(
              patch("/offers/{id}", offer.getId())
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(validOfferJson("Meta", "Title")))
          .andExpect(status().isUnauthorized());
    }
  }

  @Nested
  @DisplayName("DELETE /offers/{id}")
  class DeleteOfferTests {

    @Test
    @DisplayName("deletes an owned offer and returns no content")
    void deletesAnOwnedOfferAndReturnsNoContent() throws Exception {
      User owner = createUser("offer-deleter");
      Offer offer = createOffer(owner, "Airbnb", Instant.parse("2026-03-01T00:00:00Z"));

      mockMvc
          .perform(
              delete("/offers/{id}", offer.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(owner)))
          .andExpect(status().isNoContent());

      assertThat(offerRepository.findById(offer.getId())).isEmpty();
    }

    @Test
    @DisplayName("returns not found when deleting an offer owned by another user")
    void returnsNotFoundWhenDeletingAnOfferOwnedByAnotherUser() throws Exception {
      User owner = createUser("offer-delete-owner");
      User other = createUser("offer-delete-other");
      Offer offer = createOffer(owner, "Airbnb", Instant.parse("2026-03-01T00:00:00Z"));

      mockMvc
          .perform(
              delete("/offers/{id}", offer.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(other)))
          .andExpect(status().isNotFound());

      assertThat(offerRepository.findById(offer.getId())).isPresent();
    }

    @Test
    @DisplayName("returns unauthorized when no authentication is provided")
    void returnsUnauthorizedWhenNoAuthenticationIsProvided() throws Exception {
      User owner = createUser("offer-delete-auth-owner");
      Offer offer = createOffer(owner, "Airbnb", Instant.parse("2026-03-01T00:00:00Z"));

      mockMvc
          .perform(delete("/offers/{id}", offer.getId()))
          .andExpect(status().isUnauthorized());

      assertThat(offerRepository.findById(offer.getId())).isPresent();
    }
  }


  private User createUser(String username) {
    return userRepository.saveAndFlush(
        new User(
            username, username + "@example.com", "hashed-password", Role.STUDENT, "Test", "User"));
  }

  private Offer createOffer(User user, String company, Instant updatedAt) {
    Offer offer = new Offer();
    offer.setUser(user);
    offer.setCompany(company);
    offer.setTitle("SWE Intern");
    offer.setEmploymentType(EmploymentType.internship);
    offer.setCompensationType(CompensationType.hourly);
    offer.setPayAmount(45.0f);
    offer.setUpdatedAt(updatedAt);
    return offerRepository.saveAndFlush(offer);
  }

  private String authHeaderFor(User user) {
    String token =
        jwtService.generateToken(user.getUsername(), user.getId(), user.getRole().name());
    return "Bearer " + token;
  }

  private String validOfferJson(String company, String title) {
    return """
        {
          "company": "%s",
          "title": "%s",
          "employmentType": "internship",
          "compensationType": "hourly",
          "payAmount": 45.0,
          "hoursPerWeek": 40,
          "officeLocation": "Mountain View, CA",
          "daysInOffice": 5,
          "notes": "Great team",
          "favorite": false
        }
        """
        .formatted(company, title);
  }
}
