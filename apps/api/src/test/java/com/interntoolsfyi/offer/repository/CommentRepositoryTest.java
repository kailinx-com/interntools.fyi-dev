package com.interntoolsfyi.offer.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.interntoolsfyi.offer.model.Comment;
import com.interntoolsfyi.offer.model.Post;
import com.interntoolsfyi.offer.model.PostStatus;
import com.interntoolsfyi.offer.model.PostType;
import com.interntoolsfyi.offer.model.PostVisibility;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class CommentRepositoryTest {
  @Autowired private CommentRepository commentRepository;
  @Autowired private PostRepository postRepository;
  @Autowired private UserRepository userRepository;

  @Test
  @DisplayName("findByPostAndDeletedFalseOrderByCreatedAtAsc excludes deleted comments")
  void findByPostExcludesDeletedComments() {
    User author = userRepository.saveAndFlush(createUser("author", "author@example.com"));
    User commenter = userRepository.saveAndFlush(createUser("commenter", "commenter@example.com"));
    Post post = postRepository.saveAndFlush(createPublishedPost(author, "Post"));

    Comment visible = createComment(post, commenter, "visible");
    visible.setDeleted(false);
    commentRepository.saveAndFlush(visible);

    Comment deleted = createComment(post, commenter, "deleted");
    deleted.setDeleted(true);
    commentRepository.saveAndFlush(deleted);

    assertThat(commentRepository.findByPostAndDeletedFalseOrderByCreatedAtAsc(post))
        .extracting(Comment::getBody)
        .containsExactly("visible");
  }

  @Test
  @DisplayName("findByIdAndUser only returns comments owned by that user")
  void findByIdAndUserReturnsOnlyOwnedComment() {
    User author = userRepository.saveAndFlush(createUser("author2", "author2@example.com"));
    User user = userRepository.saveAndFlush(createUser("owner", "owner@example.com"));
    User other = userRepository.saveAndFlush(createUser("other", "other@example.com"));
    Post post = postRepository.saveAndFlush(createPublishedPost(author, "Post2"));

    Comment comment = commentRepository.saveAndFlush(createComment(post, user, "mine"));

    assertThat(commentRepository.findByIdAndUser(comment.getId(), user)).isPresent();
    assertThat(commentRepository.findByIdAndUser(comment.getId(), other)).isEmpty();
  }

  private static User createUser(String username, String email) {
    return new User(username, email, "hashed-password", Role.STUDENT, "Test", "User");
  }

  private static Post createPublishedPost(User author, String title) {
    Post post = new Post();
    post.setAuthor(author);
    post.setType(PostType.acceptance);
    post.setTitle(title);
    post.setVisibility(PostVisibility.public_post);
    post.setStatus(PostStatus.published);
    post.setPublishedAt(Instant.now());
    return post;
  }

  private static Comment createComment(Post post, User user, String body) {
    Comment comment = new Comment();
    comment.setPost(post);
    comment.setUser(user);
    comment.setBody(body);
    return comment;
  }
}
