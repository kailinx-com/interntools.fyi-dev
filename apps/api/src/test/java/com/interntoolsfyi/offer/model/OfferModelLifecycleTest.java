package com.interntoolsfyi.offer.model;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThat;

import com.interntoolsfyi.offer.repository.CommentRepository;
import com.interntoolsfyi.offer.repository.CommunityPreferenceVoteRepository;
import com.interntoolsfyi.offer.repository.PostRepository;
import com.interntoolsfyi.offer.repository.SavedPostRepository;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class OfferModelLifecycleTest {
  @Autowired private UserRepository userRepository;
  @Autowired private PostRepository postRepository;
  @Autowired private CommentRepository commentRepository;
  @Autowired private CommunityPreferenceVoteRepository voteRepository;
  @Autowired private SavedPostRepository savedPostRepository;

  @Test
  @DisplayName("post sets createdAt on persist and updatedAt on update")
  void postLifecycleHooksSetTimestamps() {
    User author = userRepository.saveAndFlush(createUser("author-lifecycle", "author-lifecycle@test.dev"));
    Post post = new Post();
    post.setAuthor(author);
    post.setType(PostType.acceptance);
    post.setTitle("Initial");
    post.setVisibility(PostVisibility.public_post);
    post.setStatus(PostStatus.draft);

    Post saved = postRepository.saveAndFlush(post);
    assertThat(saved.getCreatedAt()).isNotNull();
    assertThat(saved.getUpdatedAt()).isNull();

    saved.setTitle("Updated title");
    Post updated = postRepository.saveAndFlush(saved);
    assertThat(updated.getUpdatedAt()).isNotNull();
  }

  @Test
  @DisplayName("comment, vote, and saved post set createdAt on persist")
  void relatedModelsSetCreatedAtOnPersist() {
    User author = userRepository.saveAndFlush(createUser("author2-lifecycle", "author2-lifecycle@test.dev"));
    User viewer = userRepository.saveAndFlush(createUser("viewer-lifecycle", "viewer-lifecycle@test.dev"));

    Post post = new Post();
    post.setAuthor(author);
    post.setType(PostType.comparison);
    post.setTitle("Comparison");
    post.setVisibility(PostVisibility.public_post);
    post.setStatus(PostStatus.published);
    post.setPublishedAt(Instant.now());
    post = postRepository.saveAndFlush(post);

    Comment comment = new Comment();
    comment.setPost(post);
    comment.setUser(viewer);
    comment.setBody("Nice post");
    comment = commentRepository.saveAndFlush(comment);
    assertThat(comment.getCreatedAt()).isNotNull();

    CommunityPreferenceVote vote = new CommunityPreferenceVote();
    vote.setPost(post);
    vote.setUser(viewer);
    vote.setSelectedOfferIndex(0);
    vote = voteRepository.saveAndFlush(vote);
    assertThat(vote.getCreatedAt()).isNotNull();

    SavedPost savedPost = new SavedPost();
    savedPost.setPost(post);
    savedPost.setUser(viewer);
    savedPost = savedPostRepository.saveAndFlush(savedPost);
    assertThat(savedPost.getCreatedAt()).isNotNull();
  }

  @Test
  @DisplayName("enforces required field constraints for comment body")
  void commentBodyIsRequired() {
    User author = userRepository.saveAndFlush(createUser("author3-lifecycle", "author3-lifecycle@test.dev"));
    Post post = new Post();
    post.setAuthor(author);
    post.setType(PostType.acceptance);
    post.setTitle("Constraint post");
    post.setVisibility(PostVisibility.public_post);
    post.setStatus(PostStatus.published);
    post.setPublishedAt(Instant.now());
    post = postRepository.saveAndFlush(post);

    Comment invalid = new Comment();
    invalid.setPost(post);
    invalid.setUser(author);
    invalid.setBody(null);

    assertThatThrownBy(() -> commentRepository.saveAndFlush(invalid))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  private static User createUser(String username, String email) {
    return new User(username, email, "hashed-password", Role.STUDENT, "Test", "User");
  }
}
