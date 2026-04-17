package com.interntoolsfyi.user.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.interntoolsfyi.auth.service.JwtService;
import com.interntoolsfyi.offer.repository.OfferRepository;
import com.interntoolsfyi.offer.repository.PostRepository;
import com.interntoolsfyi.offer.repository.SavedPostRepository;
import com.interntoolsfyi.offer.testsupport.PostFixtures;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.model.UserFollow;
import com.interntoolsfyi.user.repository.UserFollowRepository;
import com.interntoolsfyi.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@ActiveProfiles("test")
class UserProfileControllerIntegrationTest {

  @Autowired private UserRepository userRepository;
  @Autowired private UserFollowRepository userFollowRepository;
  @Autowired private PostRepository postRepository;
  @Autowired private OfferRepository offerRepository;
  @Autowired private SavedPostRepository savedPostRepository;
  @Autowired private JwtService jwtService;
  @Autowired private WebApplicationContext webApplicationContext;
  @Autowired private JdbcTemplate jdbcTemplate;

  private MockMvc mockMvc;

  @BeforeEach
  void setUp() {
    jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE");
    userFollowRepository.deleteAllInBatch();
    savedPostRepository.deleteAllInBatch();
    postRepository.deleteAllInBatch();
    offerRepository.deleteAllInBatch();
    userRepository.deleteAllInBatch();
    jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE");
    mockMvc =
        MockMvcBuilders.webAppContextSetup(webApplicationContext).apply(springSecurity()).build();
  }

  @Test
  @DisplayName("GET /users/by-username/{username} returns public profile without email")
  void getPublicProfileByUsernameReturnsProfile() throws Exception {
    User alice = createUser("alice-byname", "Alice", "Smith");

    mockMvc
        .perform(get("/users/by-username/{username}", alice.getUsername()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(alice.getId()))
        .andExpect(jsonPath("$.username").value("alice-byname"))
        .andExpect(jsonPath("$.firstName").value("Alice"))
        .andExpect(jsonPath("$.lastName").value("Smith"))
        .andExpect(jsonPath("$.email").doesNotExist());
  }

  @Test
  @DisplayName("GET /users/by-username/{username} returns 404 for unknown username")
  void getPublicProfileByUsernameNotFound() throws Exception {
    mockMvc
        .perform(get("/users/by-username/{username}", "does-not-exist"))
        .andExpect(status().isNotFound());
  }

  @Test
  @DisplayName("GET /users/by-username/{username} with viewer who follows shows followedByViewer=true")
  void getPublicProfileByUsernameShowsFollowedByViewer() throws Exception {
    User alice = createUser("alice-byfv", "Alice", "Smith");
    User bob = createUser("bob-byfv", "Bob", "Jones");
    userFollowRepository.saveAndFlush(new UserFollow(bob, alice));

    mockMvc
        .perform(
            get("/users/by-username/{username}", alice.getUsername())
                .header(HttpHeaders.AUTHORIZATION, authHeaderFor(bob)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.followedByViewer").value(true));
  }

  @Test
  @DisplayName("GET /users/{id} returns public profile without email")
  void getPublicProfileAnonymous() throws Exception {
    User alice = createUser("alice-pub", "Alice", "Smith");

    mockMvc
        .perform(get("/users/{id}", alice.getId()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value("alice-pub"))
        .andExpect(jsonPath("$.firstName").value("Alice"))
        .andExpect(jsonPath("$.lastName").value("Smith"))
        .andExpect(jsonPath("$.createdAt").isString())
        .andExpect(jsonPath("$.email").doesNotExist());
  }

  @Test
  @DisplayName("GET /users/{id} returns 404 for unknown user")
  void getPublicProfileNotFound() throws Exception {
    mockMvc.perform(get("/users/{id}", 999999L)).andExpect(status().isNotFound());
  }

  @Test
  @DisplayName("GET /users/{id} with viewer who follows shows followedByViewer=true")
  void getPublicProfileShowsFollowedByViewer() throws Exception {
    User alice = createUser("alice-fv", "Alice", "Smith");
    User bob = createUser("bob-fv", "Bob", "Jones");
    userFollowRepository.saveAndFlush(new UserFollow(bob, alice));

    mockMvc
        .perform(
            get("/users/{id}", alice.getId())
                .header(HttpHeaders.AUTHORIZATION, authHeaderFor(bob)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.followedByViewer").value(true));
  }

  @Test
  @DisplayName("GET /users/{id} with non-following viewer shows followedByViewer=false")
  void getPublicProfileShowsNotFollowedByViewer() throws Exception {
    User alice = createUser("alice-nf", "Alice", "Smith");
    User bob = createUser("bob-nf", "Bob", "Jones");

    mockMvc
        .perform(
            get("/users/{id}", alice.getId())
                .header(HttpHeaders.AUTHORIZATION, authHeaderFor(bob)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.followedByViewer").value(false));
  }

  @Test
  @DisplayName("GET /users/me/profile returns own profile with email when authenticated")
  void getOwnProfileAuthenticated() throws Exception {
    User alice = createUser("alice-own", "Alice", "Smith");

    mockMvc
        .perform(
            get("/users/me/profile").header(HttpHeaders.AUTHORIZATION, authHeaderFor(alice)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value("alice-own"))
        .andExpect(jsonPath("$.email").value("alice-own@example.com"))
        .andExpect(jsonPath("$.firstName").value("Alice"))
        .andExpect(jsonPath("$.role").value("STUDENT"));
  }

  @Test
  @DisplayName("GET /users/me/profile returns 401 without auth")
  void getOwnProfileUnauthorized() throws Exception {
    mockMvc.perform(get("/users/me/profile")).andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("GET /users/{id}/posts returns only published public posts by user")
  void getPostsByUser() throws Exception {
    User alice = createUser("alice-posts", "Alice", "Smith");
    PostFixtures.savePublishedPost(alice, "Alice published", offerRepository, postRepository);
    PostFixtures.saveDraftPost(alice, "Alice draft", offerRepository, postRepository);

    mockMvc
        .perform(get("/users/{id}/posts", alice.getId()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].title").value("Alice published"));
  }

  @Test
  @DisplayName("GET /users/{id}/posts returns 404 for unknown user")
  void getPostsByUserNotFound() throws Exception {
    mockMvc.perform(get("/users/{id}/posts", 999999L)).andExpect(status().isNotFound());
  }

  @Test
  @DisplayName("GET /users/{id}/followers returns follower stubs")
  void getFollowers() throws Exception {
    User alice = createUser("alice-fl", "Alice", "Smith");
    User bob = createUser("bob-fl", "Bob", "Jones");
    userFollowRepository.saveAndFlush(new UserFollow(bob, alice));

    mockMvc
        .perform(get("/users/{id}/followers", alice.getId()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].username").value("bob-fl"));
  }

  @Test
  @DisplayName("GET /users/{id}/following returns following stubs")
  void getFollowing() throws Exception {
    User alice = createUser("alice-fw", "Alice", "Smith");
    User bob = createUser("bob-fw", "Bob", "Jones");
    userFollowRepository.saveAndFlush(new UserFollow(alice, bob));

    mockMvc
        .perform(get("/users/{id}/following", alice.getId()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].username").value("bob-fw"));
  }

  @Test
  @DisplayName("POST /users/{id}/follow creates follow relationship")
  void followUser() throws Exception {
    User alice = createUser("alice-follow", "Alice", "Smith");
    User bob = createUser("bob-follow", "Bob", "Jones");

    mockMvc
        .perform(
            post("/users/{id}/follow", alice.getId())
                .header(HttpHeaders.AUTHORIZATION, authHeaderFor(bob)))
        .andExpect(status().isNoContent());

    assertThat(userFollowRepository.existsByFollowerAndFollowing(bob, alice)).isTrue();
  }

  @Test
  @DisplayName("POST /users/{id}/follow is idempotent")
  void followUserIdempotent() throws Exception {
    User alice = createUser("alice-idem", "Alice", "Smith");
    User bob = createUser("bob-idem", "Bob", "Jones");
    userFollowRepository.saveAndFlush(new UserFollow(bob, alice));

    mockMvc
        .perform(
            post("/users/{id}/follow", alice.getId())
                .header(HttpHeaders.AUTHORIZATION, authHeaderFor(bob)))
        .andExpect(status().isNoContent());

    assertThat(userFollowRepository.countFollowers(alice)).isEqualTo(1);
  }

  @Test
  @DisplayName("POST /users/{id}/follow self returns 400")
  void followSelfReturnsBadRequest() throws Exception {
    User alice = createUser("alice-self", "Alice", "Smith");

    mockMvc
        .perform(
            post("/users/{id}/follow", alice.getId())
                .header(HttpHeaders.AUTHORIZATION, authHeaderFor(alice)))
        .andExpect(status().isBadRequest());
  }

  @Test
  @DisplayName("POST /users/{id}/follow returns 401 without auth")
  void followRequiresAuth() throws Exception {
    User alice = createUser("alice-noauth", "Alice", "Smith");
    mockMvc.perform(post("/users/{id}/follow", alice.getId())).andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("DELETE /users/{id}/follow removes follow relationship")
  void unfollowUser() throws Exception {
    User alice = createUser("alice-unfollow", "Alice", "Smith");
    User bob = createUser("bob-unfollow", "Bob", "Jones");
    userFollowRepository.saveAndFlush(new UserFollow(bob, alice));

    mockMvc
        .perform(
            delete("/users/{id}/follow", alice.getId())
                .header(HttpHeaders.AUTHORIZATION, authHeaderFor(bob)))
        .andExpect(status().isNoContent());

    assertThat(userFollowRepository.existsByFollowerAndFollowing(bob, alice)).isFalse();
  }

  @Test
  @DisplayName("DELETE /users/{id}/follow returns 401 without auth")
  void unfollowRequiresAuth() throws Exception {
    User alice = createUser("alice-unfollowauth", "Alice", "Smith");
    mockMvc
        .perform(delete("/users/{id}/follow", alice.getId()))
        .andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("PATCH /me with firstName/lastName updates profile without requiring current password")
  void patchMeUpdatesFirstLastName() throws Exception {
    User alice = createUser("alice-patch", "Alice", "Smith");
    String body = "{\"firstName\":\"Alicia\",\"lastName\":\"Smithson\"}";

    mockMvc
        .perform(
            patch("/me")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body)
                .header(HttpHeaders.AUTHORIZATION, authHeaderFor(alice)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.firstName").value("Alicia"))
        .andExpect(jsonPath("$.lastName").value("Smithson"));
  }

  private User createUser(String username, String firstName, String lastName) {
    return userRepository.saveAndFlush(
        new User(
            username,
            username + "@example.com",
            "hashed-password",
            Role.STUDENT,
            firstName,
            lastName));
  }

  private String authHeaderFor(User user) {
    String token =
        jwtService.generateToken(user.getUsername(), user.getId(), user.getRole().name());
    return "Bearer " + token;
  }
}
