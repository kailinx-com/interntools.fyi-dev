package com.interntoolsfyi.offer.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.interntoolsfyi.auth.service.JwtService;
import com.interntoolsfyi.offer.model.Comment;
import com.interntoolsfyi.offer.model.CommunityPreferenceVote;
import com.interntoolsfyi.offer.model.Post;
import com.interntoolsfyi.offer.model.PostStatus;
import com.interntoolsfyi.offer.model.PostType;
import com.interntoolsfyi.offer.model.PostVisibility;
import com.interntoolsfyi.offer.repository.CommentRepository;
import com.interntoolsfyi.offer.repository.ComparisonRepository;
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
class CommentAndVoteControllerIntegrationTest {

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
    voteRepository.deleteAll();
    commentRepository.deleteAll();
    postRepository.deleteAll();
    offerRepository.deleteAll();
    comparisonRepository.deleteAll();
    userRepository.deleteAll();
    jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE");
    mockMvc =
        MockMvcBuilders.webAppContextSetup(webApplicationContext).apply(springSecurity()).build();
  }

  @Nested
  @DisplayName("GET /posts/{postId}/comments")
  class ListCommentsTests {

    @Test
    @DisplayName("returns non-deleted comments for a published post without authentication")
    void returnsNonDeletedCommentsForAPublishedPostWithoutAuthentication() throws Exception {
      User author = createUser("comment-feed-author");
      Post post = createPublishedPost(author, "Feed post");
      User commenter = createUser("commenter-feed");
      createComment(post, commenter, "First comment");
      createComment(post, commenter, "Second comment");

      mockMvc
          .perform(get("/posts/{postId}/comments", post.getId()))
          .andExpect(status().isOk())
          .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
          .andExpect(jsonPath("$.length()").value(2))
          .andExpect(jsonPath("$[0].body").value("First comment"))
          .andExpect(jsonPath("$[0].authorUsername").value("commenter-feed"))
          .andExpect(jsonPath("$[0].postId").value(post.getId()))
          .andExpect(jsonPath("$[1].body").value("Second comment"));
    }

    @Test
    @DisplayName("does not include soft-deleted comments in the response")
    void doesNotIncludeSoftDeletedCommentsInTheResponse() throws Exception {
      User author = createUser("comment-deleted-author");
      Post post = createPublishedPost(author, "Post with deleted comments");
      User commenter = createUser("comment-deleter");
      createComment(post, commenter, "Visible comment");
      createDeletedComment(post, commenter, "Deleted comment");

      mockMvc
          .perform(get("/posts/{postId}/comments", post.getId()))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.length()").value(1))
          .andExpect(jsonPath("$[0].body").value("Visible comment"));
    }

    @Test
    @DisplayName("returns not found when the post is not published")
    void returnsNotFoundWhenThePostIsNotPublished() throws Exception {
      User author = createUser("comment-draft-author");
      Post draft = createPost(author, "Draft", PostStatus.draft, PostVisibility.private_post);

      mockMvc
          .perform(get("/posts/{postId}/comments", draft.getId()))
          .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("returns not found when the post does not exist")
    void returnsNotFoundWhenThePostDoesNotExist() throws Exception {
      mockMvc.perform(get("/posts/{postId}/comments", 999999L)).andExpect(status().isNotFound());
    }
  }

  @Nested
  @DisplayName("POST /posts/{postId}/comments")
  class CreateCommentTests {

    @Test
    @DisplayName("creates a comment on a published post and returns the created payload")
    void createsACommentOnAPublishedPostAndReturnsTheCreatedPayload() throws Exception {
      User author = createUser("comment-post-author");
      Post post = createPublishedPost(author, "Post to comment on");
      User commenter = createUser("commenter");

      mockMvc
          .perform(
              post("/posts/{postId}/comments", post.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(commenter))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("""
                      { "body": "Great update!" }
                      """))
          .andExpect(status().isCreated())
          .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
          .andExpect(jsonPath("$.id").isNumber())
          .andExpect(jsonPath("$.body").value("Great update!"))
          .andExpect(jsonPath("$.authorUsername").value("commenter"))
          .andExpect(jsonPath("$.postId").value(post.getId()))
          .andExpect(jsonPath("$.createdAt").isString());

      assertThat(commentRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("returns bad request when the comment body is blank")
    void returnsBadRequestWhenTheCommentBodyIsBlank() throws Exception {
      User author = createUser("comment-blank-author");
      Post post = createPublishedPost(author, "Post");
      User commenter = createUser("comment-blank-commenter");

      mockMvc
          .perform(
              post("/posts/{postId}/comments", post.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(commenter))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("""
                      { "body": "  " }
                      """))
          .andExpect(status().isBadRequest());

      assertThat(commentRepository.count()).isZero();
    }

    @Test
    @DisplayName("returns not found when commenting on a non-published post")
    void returnsNotFoundWhenCommentingOnANonPublishedPost() throws Exception {
      User author = createUser("comment-draft-post-author");
      Post draft = createPost(author, "Draft post", PostStatus.draft, PostVisibility.private_post);
      User commenter = createUser("comment-draft-commenter");

      mockMvc
          .perform(
              post("/posts/{postId}/comments", draft.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(commenter))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("""
                      { "body": "Hello" }
                      """))
          .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("returns unauthorized when no authentication is provided")
    void returnsUnauthorizedWhenNoAuthenticationIsProvided() throws Exception {
      User author = createUser("comment-unauth-author");
      Post post = createPublishedPost(author, "Post");

      mockMvc
          .perform(
              post("/posts/{postId}/comments", post.getId())
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("""
                      { "body": "Hello" }
                      """))
          .andExpect(status().isUnauthorized());
    }
  }

  @Nested
  @DisplayName("PATCH /comments/{id}")
  class UpdateCommentTests {

    @Test
    @DisplayName("updates the body of a comment owned by the current user")
    void updatesTheBodyOfACommentOwnedByTheCurrentUser() throws Exception {
      User author = createUser("comment-update-author");
      Post post = createPublishedPost(author, "Post");
      User commenter = createUser("comment-updater");
      Comment comment = createComment(post, commenter, "Original body");

      mockMvc
          .perform(
              patch("/comments/{id}", comment.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(commenter))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("""
                      { "body": "Updated body" }
                      """))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.body").value("Updated body"))
          .andExpect(jsonPath("$.editedAt").isString());

      assertThat(commentRepository.findById(comment.getId()).orElseThrow().getBody())
          .isEqualTo("Updated body");
    }

    @Test
    @DisplayName("returns not found when updating a comment owned by another user")
    void returnsNotFoundWhenUpdatingACommentOwnedByAnotherUser() throws Exception {
      User author = createUser("comment-update-owner");
      Post post = createPublishedPost(author, "Post");
      User commenter = createUser("comment-update-commenter");
      User other = createUser("comment-update-other");
      Comment comment = createComment(post, commenter, "My comment");

      mockMvc
          .perform(
              patch("/comments/{id}", comment.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(other))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("""
                      { "body": "Hijacked" }
                      """))
          .andExpect(status().isNotFound());

      assertThat(commentRepository.findById(comment.getId()).orElseThrow().getBody())
          .isEqualTo("My comment");
    }

    @Test
    @DisplayName("returns unauthorized when no authentication is provided")
    void returnsUnauthorizedWhenNoAuthenticationIsProvided() throws Exception {
      User author = createUser("comment-patch-auth-author");
      Post post = createPublishedPost(author, "Post");
      User commenter = createUser("comment-patch-auth-commenter");
      Comment comment = createComment(post, commenter, "My comment");

      mockMvc
          .perform(
              patch("/comments/{id}", comment.getId())
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("""
                      { "body": "Updated" }
                      """))
          .andExpect(status().isUnauthorized());
    }
  }

  @Nested
  @DisplayName("DELETE /comments/{id}")
  class DeleteCommentTests {

    @Test
    @DisplayName("soft deletes a comment owned by the current user and returns no content")
    void softDeletesACommentOwnedByTheCurrentUserAndReturnsNoContent() throws Exception {
      User author = createUser("comment-delete-author");
      Post post = createPublishedPost(author, "Post");
      User commenter = createUser("comment-deleter");
      Comment comment = createComment(post, commenter, "Delete me");

      mockMvc
          .perform(
              delete("/comments/{id}", comment.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(commenter)))
          .andExpect(status().isNoContent());

      Comment deleted = commentRepository.findById(comment.getId()).orElseThrow();
      assertThat(deleted.getDeleted()).isTrue();
    }

    @Test
    @DisplayName("does not remove the comment row from the database after soft delete")
    void doesNotRemoveTheCommentRowFromTheDatabaseAfterSoftDelete() throws Exception {
      User author = createUser("comment-soft-delete-author");
      Post post = createPublishedPost(author, "Post");
      User commenter = createUser("comment-soft-deleter");
      Comment comment = createComment(post, commenter, "Soft delete me");

      mockMvc
          .perform(
              delete("/comments/{id}", comment.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(commenter)))
          .andExpect(status().isNoContent());

      assertThat(commentRepository.findById(comment.getId())).isPresent();
    }

    @Test
    @DisplayName("returns not found when deleting a comment owned by another user")
    void returnsNotFoundWhenDeletingACommentOwnedByAnotherUser() throws Exception {
      User author = createUser("comment-delete-owner");
      Post post = createPublishedPost(author, "Post");
      User commenter = createUser("comment-delete-commenter");
      User other = createUser("comment-delete-other");
      Comment comment = createComment(post, commenter, "My comment");

      mockMvc
          .perform(
              delete("/comments/{id}", comment.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(other)))
          .andExpect(status().isNotFound());

      assertThat(commentRepository.findById(comment.getId()).orElseThrow().getDeleted()).isFalse();
    }
  }

  @Nested
  @DisplayName("GET /posts/{postId}/votes")
  class GetVoteTallyTests {

    @Test
    @DisplayName("returns the vote tally for a published post without authentication")
    void returnsTheVoteTallyForAPublishedPostWithoutAuthentication() throws Exception {
      User author = createUser("vote-tally-author");
      Post post = createPublishedPost(author, "Tally post");

      mockMvc
          .perform(get("/posts/{postId}/votes", post.getId()))
          .andExpect(status().isOk())
          .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
          .andExpect(jsonPath("$.postId").value(post.getId()))
          .andExpect(jsonPath("$.totalVotes").value(0))
          .andExpect(jsonPath("$.tally").isMap());
    }

    @Test
    @DisplayName("returns the correct tally after votes have been cast")
    void returnsTheCorrectTallyAfterVotesHaveBeenCast() throws Exception {
      User author = createUser("vote-tally-author2");
      Post post = createPublishedPost(author, "Voted post");
      User v1 = createUser("voter-tally-1");
      User v2 = createUser("voter-tally-2");
      User v3 = createUser("voter-tally-3");
      createVoteByIndex(post, v1, 0);
      createVoteByIndex(post, v2, 0);
      createVoteByIndex(post, v3, 1);

      mockMvc
          .perform(get("/posts/{postId}/votes", post.getId()))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.totalVotes").value(3))
          .andExpect(jsonPath("$.tally['0']").value(2))
          .andExpect(jsonPath("$.tally['1']").value(1));
    }

    @Test
    @DisplayName("returns not found when getting votes for a non-published post")
    void returnsNotFoundWhenGettingVotesForANonPublishedPost() throws Exception {
      User author = createUser("vote-draft-author");
      Post draft = createPost(author, "Draft", PostStatus.draft, PostVisibility.private_post);

      mockMvc
          .perform(get("/posts/{postId}/votes", draft.getId()))
          .andExpect(status().isNotFound());
    }
  }

  @Nested
  @DisplayName("PUT /posts/{postId}/vote")
  class UpsertVoteTests {

    @Test
    @DisplayName("creates a vote by index and returns the updated tally")
    void createsAVoteByIndexAndReturnsTheUpdatedTally() throws Exception {
      User author = createUser("vote-create-author");
      Post post = createPublishedPost(author, "Vote post");
      User voter = createUser("voter-create");

      mockMvc
          .perform(
              put("/posts/{postId}/vote", post.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(voter))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("""
                      { "selectedOfferIndex": 0 }
                      """))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.postId").value(post.getId()))
          .andExpect(jsonPath("$.totalVotes").value(1))
          .andExpect(jsonPath("$.tally['0']").value(1));

      assertThat(voteRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("creates a vote by snapshotId and returns the updated tally")
    void createsAVoteBySnapshotIdAndReturnsTheUpdatedTally() throws Exception {
      User author = createUser("vote-snap-author");
      Post post = createPublishedPost(author, "Snapshot vote post");
      User voter = createUser("voter-snap");

      mockMvc
          .perform(
              put("/posts/{postId}/vote", post.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(voter))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("""
                      { "selectedOfferSnapshotId": "snap-a" }
                      """))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.totalVotes").value(1))
          .andExpect(jsonPath("$.tally['snap-a']").value(1));
    }

    @Test
    @DisplayName("updates an existing vote when the user votes again")
    void updatesAnExistingVoteWhenTheUserVotesAgain() throws Exception {
      User author = createUser("vote-update-author");
      Post post = createPublishedPost(author, "Re-vote post");
      User voter = createUser("voter-update");
      createVoteByIndex(post, voter, 0);

      mockMvc
          .perform(
              put("/posts/{postId}/vote", post.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(voter))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("""
                      { "selectedOfferIndex": 1 }
                      """))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.totalVotes").value(1))
          .andExpect(jsonPath("$.tally['1']").value(1));

      assertThat(voteRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("returns bad request when neither snapshotId nor index is provided")
    void returnsBadRequestWhenNeitherSnapshotIdNorIndexIsProvided() throws Exception {
      User author = createUser("vote-bad-author");
      Post post = createPublishedPost(author, "Bad vote post");
      User voter = createUser("voter-bad");

      mockMvc
          .perform(
              put("/posts/{postId}/vote", post.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(voter))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("""
                      {}
                      """))
          .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("returns unauthorized when no authentication is provided")
    void returnsUnauthorizedWhenNoAuthenticationIsProvided() throws Exception {
      User author = createUser("vote-unauth-author");
      Post post = createPublishedPost(author, "Vote unauth post");

      mockMvc
          .perform(
              put("/posts/{postId}/vote", post.getId())
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("""
                      { "selectedOfferIndex": 0 }
                      """))
          .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("returns not found when voting on a non-published post")
    void returnsNotFoundWhenVotingOnANonPublishedPost() throws Exception {
      User author = createUser("vote-draft-post-author");
      Post draft = createPost(author, "Draft", PostStatus.draft, PostVisibility.private_post);
      User voter = createUser("voter-draft");

      mockMvc
          .perform(
              put("/posts/{postId}/vote", draft.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(voter))
                  .contentType(MediaType.APPLICATION_JSON)
                  .content("""
                      { "selectedOfferIndex": 0 }
                      """))
          .andExpect(status().isNotFound());
    }
  }

  @Nested
  @DisplayName("DELETE /posts/{postId}/vote")
  class DeleteVoteTests {

    @Test
    @DisplayName("removes an existing vote and returns no content")
    void removesAnExistingVoteAndReturnsNoContent() throws Exception {
      User author = createUser("vote-delete-author");
      Post post = createPublishedPost(author, "Delete vote post");
      User voter = createUser("voter-delete");
      createVoteByIndex(post, voter, 0);

      mockMvc
          .perform(
              delete("/posts/{postId}/vote", post.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(voter)))
          .andExpect(status().isNoContent());

      assertThat(voteRepository.count()).isZero();
    }

    @Test
    @DisplayName("is a no-op and returns no content when the user has not voted")
    void isANoOpAndReturnsNoContentWhenTheUserHasNotVoted() throws Exception {
      User author = createUser("vote-noop-author");
      Post post = createPublishedPost(author, "No vote post");
      User nonVoter = createUser("non-voter");

      mockMvc
          .perform(
              delete("/posts/{postId}/vote", post.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(nonVoter)))
          .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("returns unauthorized when no authentication is provided")
    void returnsUnauthorizedWhenNoAuthenticationIsProvided() throws Exception {
      User author = createUser("vote-del-unauth-author");
      Post post = createPublishedPost(author, "Post");

      mockMvc
          .perform(delete("/posts/{postId}/vote", post.getId()))
          .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("returns not found when deleting a vote on a non-published post")
    void returnsNotFoundWhenDeletingAVoteOnANonPublishedPost() throws Exception {
      User author = createUser("vote-del-draft-author");
      Post draft = createPost(author, "Draft", PostStatus.draft, PostVisibility.private_post);
      User voter = createUser("vote-del-draft-voter");

      mockMvc
          .perform(
              delete("/posts/{postId}/vote", draft.getId())
                  .header(HttpHeaders.AUTHORIZATION, authHeaderFor(voter)))
          .andExpect(status().isNotFound());
    }
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

  private Post createPost(User author, String title, PostStatus status, PostVisibility visibility) {
    Post post = new Post();
    post.setAuthor(author);
    post.setTitle(title);
    post.setType(PostType.acceptance);
    post.setStatus(status);
    post.setVisibility(visibility);
    return postRepository.saveAndFlush(post);
  }

  private Comment createComment(Post post, User user, String body) {
    Comment comment = new Comment();
    comment.setPost(post);
    comment.setUser(user);
    comment.setBody(body);
    comment.setDeleted(false);
    return commentRepository.saveAndFlush(comment);
  }

  private Comment createDeletedComment(Post post, User user, String body) {
    Comment comment = new Comment();
    comment.setPost(post);
    comment.setUser(user);
    comment.setBody(body);
    comment.setDeleted(true);
    return commentRepository.saveAndFlush(comment);
  }

  private CommunityPreferenceVote createVoteByIndex(Post post, User user, int index) {
    CommunityPreferenceVote vote = new CommunityPreferenceVote();
    vote.setPost(post);
    vote.setUser(user);
    vote.setSelectedOfferIndex(index);
    return voteRepository.saveAndFlush(vote);
  }

  private String authHeaderFor(User user) {
    String token =
        jwtService.generateToken(user.getUsername(), user.getId(), user.getRole().name());
    return "Bearer " + token;
  }
}
