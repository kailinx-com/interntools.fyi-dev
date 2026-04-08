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
import com.interntoolsfyi.offer.model.PostStatus;
import com.interntoolsfyi.offer.model.PostType;
import com.interntoolsfyi.offer.model.PostVisibility;
import com.interntoolsfyi.offer.repository.PostRepository;
import com.interntoolsfyi.offer.repository.SavedPostRepository;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.time.Instant;
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
    Post post = new Post();
    post.setAuthor(author);
    post.setTitle(title);
    post.setType(PostType.acceptance);
    post.setStatus(PostStatus.published);
    post.setVisibility(PostVisibility.public_post);
    post.setPublishedAt(Instant.now());
    return postRepository.saveAndFlush(post);
  }

  private Post createDraftPost(User author, String title) {
    Post post = new Post();
    post.setAuthor(author);
    post.setTitle(title);
    post.setType(PostType.acceptance);
    post.setStatus(PostStatus.draft);
    post.setVisibility(PostVisibility.public_post);
    return postRepository.saveAndFlush(post);
  }

  private String authHeaderFor(User user) {
    String token = jwtService.generateToken(user.getUsername(), user.getId(), user.getRole().name());
    return "Bearer " + token;
  }
}
