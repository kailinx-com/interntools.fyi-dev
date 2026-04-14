package com.interntoolsfyi.offer.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.interntoolsfyi.auth.service.JwtService;
import com.interntoolsfyi.offer.model.Post;
import com.interntoolsfyi.offer.repository.OfferRepository;
import com.interntoolsfyi.offer.repository.PostRepository;
import com.interntoolsfyi.offer.testsupport.PostFixtures;
import com.interntoolsfyi.offer.repository.SavedPostRepository;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@ActiveProfiles("test")
class BookmarkControllerIntegrationTest {
  @Autowired private UserRepository userRepository;
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
    savedPostRepository.deleteAll();
    postRepository.deleteAll();
    offerRepository.deleteAll();
    userRepository.deleteAll();
    jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE");
    mockMvc =
        MockMvcBuilders.webAppContextSetup(webApplicationContext).apply(springSecurity()).build();
  }

  @Test
  @DisplayName("POST /posts/{postId}/bookmark creates bookmark for authenticated user")
  void bookmarkCreatesSavedPost() throws Exception {
    User author = createUser("bookmark-author");
    User viewer = createUser("bookmark-viewer");
    Post post = createPublishedPost(author, "Bookmark this");

    mockMvc
        .perform(
            post("/posts/{postId}/bookmark", post.getId())
                .header(HttpHeaders.AUTHORIZATION, authHeaderFor(viewer)))
        .andExpect(status().isNoContent());

    assertThat(savedPostRepository.findByUserOrderByCreatedAtDesc(viewer)).hasSize(1);
  }

  @Test
  @DisplayName("deleting a post removes bookmarks for that post (including author’s own bookmark)")
  void deletingPostRemovesBookmarksIncludingAuthorBookmark() throws Exception {
    User author = createUser("bookmark-author-self-delete");
    Post post = createPublishedPost(author, "My post I bookmarked");

    mockMvc
        .perform(
            post("/posts/{postId}/bookmark", post.getId())
                .header(HttpHeaders.AUTHORIZATION, authHeaderFor(author)))
        .andExpect(status().isNoContent());

    assertThat(savedPostRepository.findByUserOrderByCreatedAtDesc(author)).hasSize(1);

    mockMvc
        .perform(
            delete("/posts/{id}", post.getId())
                .header(HttpHeaders.AUTHORIZATION, authHeaderFor(author)))
        .andExpect(status().isNoContent());

    assertThat(savedPostRepository.findByUserOrderByCreatedAtDesc(author)).isEmpty();

    mockMvc
        .perform(get("/posts/bookmarks").header(HttpHeaders.AUTHORIZATION, authHeaderFor(author)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(0));
  }

  @Test
  @DisplayName("deleting a post removes bookmarks for other users who saved that post")
  void deletingPostRemovesViewerBookmarks() throws Exception {
    User author = createUser("bookmark-author-delete-viewer");
    User viewer = createUser("bookmark-viewer-deleted-post");
    Post post = createPublishedPost(author, "Post viewer bookmarked");

    mockMvc
        .perform(
            post("/posts/{postId}/bookmark", post.getId())
                .header(HttpHeaders.AUTHORIZATION, authHeaderFor(viewer)))
        .andExpect(status().isNoContent());

    assertThat(savedPostRepository.findByUserOrderByCreatedAtDesc(viewer)).hasSize(1);

    mockMvc
        .perform(
            delete("/posts/{id}", post.getId())
                .header(HttpHeaders.AUTHORIZATION, authHeaderFor(author)))
        .andExpect(status().isNoContent());

    assertThat(savedPostRepository.findByUserOrderByCreatedAtDesc(viewer)).isEmpty();

    mockMvc
        .perform(get("/posts/bookmarks").header(HttpHeaders.AUTHORIZATION, authHeaderFor(viewer)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(0));
  }

  @Test
  @DisplayName("GET /posts/bookmarks returns bookmarked post summaries")
  void listBookmarksReturnsSavedPosts() throws Exception {
    User author = createUser("bookmark-author2");
    User viewer = createUser("bookmark-viewer2");
    Post post = createPublishedPost(author, "Bookmarked post");

    mockMvc
        .perform(
            post("/posts/{postId}/bookmark", post.getId())
                .header(HttpHeaders.AUTHORIZATION, authHeaderFor(viewer)))
        .andExpect(status().isNoContent());

    mockMvc
        .perform(get("/posts/bookmarks").header(HttpHeaders.AUTHORIZATION, authHeaderFor(viewer)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].id").value(post.getId()))
        .andExpect(jsonPath("$[0].bookmarked").value(true));
  }

  @Test
  @DisplayName("DELETE /posts/{postId}/bookmark removes bookmark")
  void unbookmarkRemovesSavedPost() throws Exception {
    User author = createUser("bookmark-author3");
    User viewer = createUser("bookmark-viewer3");
    Post post = createPublishedPost(author, "Remove bookmark");

    mockMvc
        .perform(
            post("/posts/{postId}/bookmark", post.getId())
                .header(HttpHeaders.AUTHORIZATION, authHeaderFor(viewer)))
        .andExpect(status().isNoContent());

    mockMvc
        .perform(
            delete("/posts/{postId}/bookmark", post.getId())
                .header(HttpHeaders.AUTHORIZATION, authHeaderFor(viewer)))
        .andExpect(status().isNoContent());

    assertThat(savedPostRepository.findByUserOrderByCreatedAtDesc(viewer)).isEmpty();
  }

  @Test
  @DisplayName("bookmark endpoints return unauthorized without token")
  void bookmarkEndpointsRequireAuthentication() throws Exception {
    mockMvc.perform(get("/posts/bookmarks")).andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("POST /posts/{postId}/bookmark returns unauthorized without auth")
  void bookmarkRequiresAuthentication() throws Exception {
    User author = createUser("bookmark-author4");
    Post post = createPublishedPost(author, "Need auth");

    mockMvc.perform(post("/posts/{postId}/bookmark", post.getId())).andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("DELETE /posts/{postId}/bookmark returns unauthorized without auth")
  void unbookmarkRequiresAuthentication() throws Exception {
    User author = createUser("bookmark-author5");
    Post post = createPublishedPost(author, "Need auth delete");

    mockMvc.perform(delete("/posts/{postId}/bookmark", post.getId())).andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("bookmarking a draft post returns not found")
  void bookmarkDraftReturnsNotFound() throws Exception {
    User author = createUser("bookmark-author6");
    User viewer = createUser("bookmark-viewer6");
    Post draft = createDraftPost(author, "Draft post");

    mockMvc
        .perform(
            post("/posts/{postId}/bookmark", draft.getId())
                .header(HttpHeaders.AUTHORIZATION, authHeaderFor(viewer)))
        .andExpect(status().isNotFound());
  }

  @Test
  @DisplayName("unbookmark non-existing bookmark remains no-content")
  void unbookmarkMissingBookmarkIsNoOp() throws Exception {
    User author = createUser("bookmark-author7");
    User viewer = createUser("bookmark-viewer7");
    Post post = createPublishedPost(author, "No-op unbookmark");

    mockMvc
        .perform(
            delete("/posts/{postId}/bookmark", post.getId())
                .header(HttpHeaders.AUTHORIZATION, authHeaderFor(viewer)))
        .andExpect(status().isNoContent());
  }

  private User createUser(String username) {
    return userRepository.saveAndFlush(
        new User(
            username, username + "@example.com", "hashed-password", Role.STUDENT, "Test", "User"));
  }

  private Post createPublishedPost(User author, String title) {
    return PostFixtures.savePublishedPost(author, title, offerRepository, postRepository);
  }

  private Post createDraftPost(User author, String title) {
    return PostFixtures.saveDraftPost(author, title, offerRepository, postRepository);
  }

  private String authHeaderFor(User user) {
    String token = jwtService.generateToken(user.getUsername(), user.getId(), user.getRole().name());
    return "Bearer " + token;
  }
}
