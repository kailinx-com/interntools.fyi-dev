package com.interntoolsfyi.offer.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.interntoolsfyi.auth.service.JwtService;
import com.interntoolsfyi.offer.model.Comparison;
import com.interntoolsfyi.offer.model.CompensationType;
import com.interntoolsfyi.offer.model.EmploymentType;
import com.interntoolsfyi.offer.model.Offer;
import com.interntoolsfyi.offer.model.Post;
import com.interntoolsfyi.offer.model.PostIncludedOffer;
import com.interntoolsfyi.offer.model.PostStatus;
import com.interntoolsfyi.offer.model.PostType;
import com.interntoolsfyi.offer.model.PostVisibility;
import com.interntoolsfyi.offer.repository.CommentRepository;
import com.interntoolsfyi.offer.repository.ComparisonRepository;
import com.interntoolsfyi.offer.repository.CommunityPreferenceVoteRepository;
import com.interntoolsfyi.offer.repository.OfferRepository;
import com.interntoolsfyi.offer.repository.PostRepository;
import com.interntoolsfyi.offer.testsupport.PostFixtures;
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
class PostControllerIntegrationTest {

  @Autowired private UserRepository userRepository;
  @Autowired private PostRepository postRepository;
  @Autowired private OfferRepository offerRepository;
  @Autowired private ComparisonRepository comparisonRepository;
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
  @DisplayName("GET /posts")
  class ListPostsTests {

    @Test
    @DisplayName("returns only published posts in a paginated response without authentication")
    void returnsOnlyPublishedPostsInAPaginatedResponseWithoutAuthentication() throws Exception {
      User author = createUser("post-feed-author");
      createPublishedPost(author, "Published post A");
      createPublishedPost(author, "Published post B");
      createPost(author, "Draft post", PostStatus.draft, PostVisibility.public_post);

      mockMvc
          .perform(get("/posts"))
          .andExpect(status().isOk())
          .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
          .andExpect(jsonPath("$.content.length()").value(2))
          .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    @DisplayName("returns an empty page when no published posts exist")
    void returnsAnEmptyPageWhenNoPublishedPostsExist() throws Exception {
      mockMvc
          .perform(get("/posts"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.content.length()").value(0))
          .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @DisplayName("respects the default page size of 20")
    void respectsTheDefaultPageSizeOf20() throws Exception {
      mockMvc
          .perform(get("/posts"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.size").value(20));
    }
  }

  @Nested
  @DisplayName("GET /posts/me")
  class ListMyPostsTests {

    @Test
    @DisplayName("returns draft and published posts for the authenticated user but not hidden")
    void returnsDraftAndPublishedPostsForTheAuthenticatedUserButNotHidden() throws Exception {
      User author = createUser("my-posts-author");
      User other = createUser("my-posts-other");

      createPublishedPost(author, "My published post");
      createPost(author, "My draft post", PostStatus.draft, PostVisibility.private_post);
      createPublishedPost(other, "Other users post");

      mockMvc
          .perform(get("/posts/me").header(HttpHeaders.AUTHORIZATION, authHeaderFor(author)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("does not list posts after the user deletes them (soft delete)")
    void doesNotListPostsAfterTheUserDeletesThem() throws Exception {
      User author = createUser("my-posts-delete");
      Post post = createPublishedPost(author, "Gone soon");

      mockMvc
          .perform(get("/posts/me").header(HttpHeaders.AUTHORIZATION, authHeaderFor(author)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.length()").value(1));

      mockMvc
          .perform(
              delete("/posts/{id}", post.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(author)))
          .andExpect(status().isNoContent());

      mockMvc
          .perform(get("/posts/me").header(HttpHeaders.AUTHORIZATION, authHeaderFor(author)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("returns unauthorized when no authentication is provided")
    void returnsUnauthorizedWhenNoAuthenticationIsProvided() throws Exception {
      mockMvc.perform(get("/posts/me")).andExpect(status().isUnauthorized());
    }
  }

  @Nested
  @DisplayName("GET /posts/{id}")
  class GetPostTests {

    @Test
    @DisplayName("returns a public published post without authentication")
    void returnsAPublicPublishedPostWithoutAuthentication() throws Exception {
      User author = createUser("post-get-author");
      Post post = createPublishedPost(author, "Public post");

      mockMvc
          .perform(get("/posts/{id}", post.getId()))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.id").value(post.getId()))
          .andExpect(jsonPath("$.title").value("Public post"))
          .andExpect(jsonPath("$.status").value("published"));
    }

    @Test
    @DisplayName("returns a non-public post when requested by its author")
    void returnsANonPublicPostWhenRequestedByItsAuthor() throws Exception {
      User author = createUser("private-post-author");
      Post post = createPost(author, "My draft", PostStatus.draft, PostVisibility.private_post);

      mockMvc
          .perform(
              get("/posts/{id}", post.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(author)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.id").value(post.getId()))
          .andExpect(jsonPath("$.status").value("draft"));
    }

    @Test
    @DisplayName("returns not found for a non-public post when requested by a non-author")
    void returnsNotFoundForANonPublicPostWhenRequestedByANonAuthor() throws Exception {
      User author = createUser("private-post-owner");
      User other = createUser("private-post-other");
      Post post = createPost(author, "My draft", PostStatus.draft, PostVisibility.private_post);

      mockMvc
          .perform(
              get("/posts/{id}", post.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(other)))
          .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("returns not found for a non-existent post")
    void returnsNotFoundForANonExistentPost() throws Exception {
      mockMvc.perform(get("/posts/{id}", 999999L)).andExpect(status().isNotFound());
    }
  }

  @Nested
  @DisplayName("POST /posts")
  class CreatePostTests {

    @Test
    @DisplayName("creates a published post and sets publishedAt for the authenticated user")
    void createsAPublishedPostAndSetsPublishedAtForTheAuthenticatedUser() throws Exception {
      User user = createUser("post-creator");

      mockMvc
          .perform(
              post("/posts")
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(user))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(publishedPostJson("Accepted at Google", "acceptance")))
          .andExpect(status().isCreated())
          .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
          .andExpect(jsonPath("$.id").isNumber())
          .andExpect(jsonPath("$.title").value("Accepted at Google"))
          .andExpect(jsonPath("$.type").value("acceptance"))
          .andExpect(jsonPath("$.status").value("published"))
          .andExpect(jsonPath("$.publishedAt").isString())
          .andExpect(jsonPath("$.authorUsername").value("post-creator"))
          .andExpect(jsonPath("$.officeLocation").value("Seattle, WA"));

      assertThat(postRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("creates a draft post without setting publishedAt")
    void createsADraftPostWithoutSettingPublishedAt() throws Exception {
      User user = createUser("post-draft-creator");

      mockMvc
          .perform(
              post("/posts")
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(user))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(draftPostJson("My draft comparison", "comparison")))
          .andExpect(status().isCreated())
          .andExpect(jsonPath("$.status").value("draft"))
          .andExpect(jsonPath("$.publishedAt").isEmpty());
    }

    @Test
    @DisplayName("returns bad request when required fields are missing")
    void returnsBadRequestWhenRequiredFieldsAreMissing() throws Exception {
      User user = createUser("post-bad-request");

      mockMvc
          .perform(
              post("/posts")
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(user))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("""
                      { "title": "Missing type and status" }
                      """))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("returns unauthorized when no authentication is provided")
    void returnsUnauthorizedWhenNoAuthenticationIsProvided() throws Exception {
      mockMvc
          .perform(
              post("/posts")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(publishedPostJson("Unauthorized post", "acceptance")))
          .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("clears officeLocation for comparison posts even when the client sends one")
    void clearsOfficeLocationForComparisonPostsEvenWhenTheClientSendsOne() throws Exception {
      User user = createUser("comparison-office-null");

      mockMvc
          .perform(
              post("/posts")
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(user))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(comparisonPublishedPostWithOfficeJson("Compared offers")))
          .andExpect(status().isCreated())
          .andExpect(jsonPath("$.type").value("comparison"))
          .andExpect(jsonPath("$.officeLocation", nullValue()));
    }
  }

  @Nested
  @DisplayName("GET /posts/related-location")
  class RelatedLocationTests {

    @Test
    @DisplayName("returns a comparison post when the search text matches a linked offer office location")
    void returnsComparisonPostWhenSearchMatchesLinkedOfferOfficeLocation() throws Exception {
      User author = createUser("related-loc-author");
      Post comparison =
          createPublishedComparisonPost(author, "Boulder comparison title", "Boulder");

      mockMvc
          .perform(get("/posts/related-location").param("text", "Boulder"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$[0].id").value(comparison.getId()))
          .andExpect(jsonPath("$[0].title").value("Boulder comparison title"));
    }

    @Test
    @DisplayName("merges and deduplicates posts when multiple tokens are provided")
    void mergesAndDedupesWhenMultipleTokensProvided() throws Exception {
      User author = createUser("multi-token-author");
      Post onlyAlpha = createPublishedComparisonPost(author, "Alpha post title", "Alphacity, TX");
      Post onlyBeta  = createPublishedComparisonPost(author, "Beta post title",  "Betaville, TX");

      mockMvc
          .perform(
              get("/posts/related-location")
                  .param("tokens", "Alphacity")
                  .param("tokens", "Betaville"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.length()").value(2));

      assertThat(onlyAlpha.getId()).isNotEqualTo(onlyBeta.getId());
    }
  }

  @Nested
  @DisplayName("POST /posts/resolve-place-links")
  class ResolvePlaceLinksTests {

    @Test
    @DisplayName("returns post id for an offer included in a published post")
    void returnsPostIdForOfferIncludedInPublishedPost() throws Exception {
      User author = createUser("resolve-offer-author");
      Post post = createPublishedPost(author, "Resolve me");
      Long offerId =
          post.getIncludedOffers().getFirst().getOffer().getId();

      mockMvc
          .perform(
              post("/posts/resolve-place-links")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(
                      """
                      { "offerIds": [%d], "comparisonIds": [] }
                      """
                          .formatted(offerId)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.postsByOfferId['%d']".formatted(offerId)).value(post.getId()));
    }

    @Test
    @DisplayName("returns post id when a published post links to the comparison")
    void returnsPostIdForPublishedPostLinkedToComparison() throws Exception {
      User author = createUser("resolve-comp-author");
      Comparison comparison = new Comparison();
      comparison.setUser(author);
      comparison.setName("Area comparison");
      comparison.setIncludedOfferIds(java.util.List.of());
      comparison.setIsPublished(true);
      comparison.setUpdatedAt(Instant.parse("2026-06-01T12:00:00Z"));
      comparison = comparisonRepository.saveAndFlush(comparison);

      Post post = new Post();
      post.setAuthor(author);
      post.setType(PostType.comparison);
      post.setTitle("From comparison entity");
      post.setVisibility(PostVisibility.public_post);
      post.setStatus(PostStatus.published);
      post.setPublishedAt(Instant.parse("2026-06-02T12:00:00Z"));
      post.setComparison(comparison);
      post = postRepository.saveAndFlush(post);

      mockMvc
          .perform(
              post("/posts/resolve-place-links")
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(
                      """
                      { "offerIds": [], "comparisonIds": [%d] }
                      """
                          .formatted(comparison.getId())))
          .andExpect(status().isOk())
          .andExpect(
              jsonPath("$.postsByComparisonId['%d']".formatted(comparison.getId()))
                  .value(post.getId()));
    }
  }

  @Nested
  @DisplayName("PATCH /posts/{id}")
  class UpdatePostTests {

    @Test
    @DisplayName("updates an authored post and returns the updated payload")
    void updatesAnAuthoredPostAndReturnsTheUpdatedPayload() throws Exception {
      User author = createUser("post-updater");
      Post post = createPost(author, "Original title", PostStatus.draft, PostVisibility.public_post);

      mockMvc
          .perform(
              patch("/posts/{id}", post.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(author))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(publishedPostJson("Updated title", "acceptance")))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.title").value("Updated title"))
          .andExpect(jsonPath("$.status").value("published"))
          .andExpect(jsonPath("$.publishedAt").isString())
          .andExpect(jsonPath("$.officeLocation").value("Seattle, WA"));
    }

    @Test
    @DisplayName("returns not found when updating a post not authored by the current user")
    void returnsNotFoundWhenUpdatingAPostNotAuthoredByTheCurrentUser() throws Exception {
      User author = createUser("post-update-owner");
      User other = createUser("post-update-other");
      Post post = createPost(author, "My post", PostStatus.published, PostVisibility.public_post);

      mockMvc
          .perform(
              patch("/posts/{id}", post.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(other))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(publishedPostJson("Hacked title", "acceptance")))
          .andExpect(status().isNotFound());

      assertThat(postRepository.findById(post.getId()).orElseThrow().getTitle())
          .isEqualTo("My post");
    }

    @Test
    @DisplayName("returns unauthorized when no authentication is provided")
    void returnsUnauthorizedWhenNoAuthenticationIsProvided() throws Exception {
      User author = createUser("post-patch-auth-owner");
      Post post = createPost(author, "My post", PostStatus.published, PostVisibility.public_post);

      mockMvc
          .perform(
              patch("/posts/{id}", post.getId())
                  .contentType(MediaType.APPLICATION_JSON)
                  .content(publishedPostJson("Hacked", "acceptance")))
          .andExpect(status().isUnauthorized());
    }
  }

  @Nested
  @DisplayName("DELETE /posts/{id}")
  class DeletePostTests {

    @Test
    @DisplayName("sets the post status to hidden and returns no content")
    void setsThePostStatusToHiddenAndReturnsNoContent() throws Exception {
      User author = createUser("post-deleter");
      Post post = createPublishedPost(author, "To hide");

      mockMvc
          .perform(
              delete("/posts/{id}", post.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(author)))
          .andExpect(status().isNoContent());

      assertThat(postRepository.findById(post.getId()).orElseThrow().getStatus())
          .isEqualTo(PostStatus.hidden);
    }

    @Test
    @DisplayName("does not remove the post from the database after deletion")
    void doesNotRemoveThePostFromTheDatabaseAfterDeletion() throws Exception {
      User author = createUser("post-soft-delete-author");
      Post post = createPublishedPost(author, "Still in DB");

      mockMvc
          .perform(
              delete("/posts/{id}", post.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(author)))
          .andExpect(status().isNoContent());

      assertThat(postRepository.findById(post.getId())).isPresent();
    }

    @Test
    @DisplayName("returns not found when deleting a post not authored by the current user")
    void returnsNotFoundWhenDeletingAPostNotAuthoredByTheCurrentUser() throws Exception {
      User author = createUser("post-delete-owner");
      User other = createUser("post-delete-other");
      Post post = createPublishedPost(author, "Protected post");

      mockMvc
          .perform(
              delete("/posts/{id}", post.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(other)))
          .andExpect(status().isNotFound());

      assertThat(postRepository.findById(post.getId()).orElseThrow().getStatus())
          .isEqualTo(PostStatus.published);
    }

    @Test
    @DisplayName("returns unauthorized when no authentication is provided")
    void returnsUnauthorizedWhenNoAuthenticationIsProvided() throws Exception {
      User author = createUser("post-delete-auth-owner");
      Post post = createPublishedPost(author, "Protected post");

      mockMvc
          .perform(delete("/posts/{id}", post.getId()))
          .andExpect(status().isUnauthorized());
    }
  }

  private User createUser(String username) {
    return userRepository.saveAndFlush(
        new User(
            username, username + "@example.com", "hashed-password", Role.STUDENT, "Test", "User"));
  }

  private Post createPublishedPost(User author, String title) {
    return PostFixtures.savePublishedPost(author, title, offerRepository, postRepository);
  }

  private Post createPost(User author, String title, PostStatus status, PostVisibility visibility) {
    return PostFixtures.savePost(author, title, status, visibility, offerRepository, postRepository);
  }

  private Post createPublishedComparisonPost(User author, String title, String offerOfficeLocation) {
    Offer offer = new Offer();
    offer.setUser(author);
    offer.setCompany("RelatedLocCo");
    offer.setTitle("Intern");
    offer.setEmploymentType(EmploymentType.internship);
    offer.setCompensationType(CompensationType.hourly);
    offer.setPayAmount(30f);
    offer.setOfficeLocation(offerOfficeLocation);
    offer = offerRepository.saveAndFlush(offer);

    Post post = new Post();
    post.setAuthor(author);
    post.setType(PostType.comparison);
    post.setTitle(title);
    post.setVisibility(PostVisibility.public_post);
    post.setStatus(PostStatus.published);
    post.setPublishedAt(Instant.parse("2026-05-01T12:00:00Z"));
    PostIncludedOffer link = new PostIncludedOffer();
    link.setPost(post);
    link.setOffer(offer);
    link.setSortOrder(0);
    post.getIncludedOffers().add(link);
    return postRepository.saveAndFlush(post);
  }

  private String authHeaderFor(User user) {
    String token =
        jwtService.generateToken(user.getUsername(), user.getId(), user.getRole().name());
    return "Bearer " + token;
  }

  private String publishedPostJson(String title, String type) {
    return """
        {
          "type": "%s",
          "title": "%s",
          "body": "I am thrilled to share this update.",
          "officeLocation": "Seattle, WA",
          "visibility": "public_post",
          "status": "published",
          "offers": [
            { "company": "Acme", "role": "Engineer", "compensationText": "$8500/mo" }
          ]
        }
        """
        .formatted(type, title);
  }

  private String draftPostJson(String title, String type) {
    return """
        {
          "type": "%s",
          "title": "%s",
          "status": "draft",
          "offers": [
            { "company": "A", "role": "R1", "compensationText": "$1/mo" },
            { "company": "B", "role": "R2", "compensationText": "$2/mo" }
          ]
        }
        """
        .formatted(type, title);
  }

  private String comparisonPublishedPostWithOfficeJson(String title) {
    return """
        {
          "type": "comparison",
          "title": "%s",
          "body": "Comparing two great teams.",
          "officeLocation": "Seattle, WA",
          "visibility": "public_post",
          "status": "published",
          "offers": [
            { "company": "A", "role": "R1", "compensationText": "$1/mo" }
          ]
        }
        """
        .formatted(title);
  }
}
