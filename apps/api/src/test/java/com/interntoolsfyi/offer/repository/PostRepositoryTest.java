package com.interntoolsfyi.offer.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.interntoolsfyi.offer.model.Post;
import com.interntoolsfyi.offer.model.PostStatus;
import com.interntoolsfyi.offer.model.PostType;
import com.interntoolsfyi.offer.model.PostVisibility;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class PostRepositoryTest {
  @Autowired private PostRepository postRepository;
  @Autowired private UserRepository userRepository;

  @Test
  @DisplayName("findByStatusOrderByPublishedAtDesc returns published posts ordered by publishedAt")
  void findByStatusReturnsPublishedOrdered() {
    User author = userRepository.saveAndFlush(createUser("author4", "author4@example.com"));
    Post older = postRepository.saveAndFlush(createPost(author, "Older", PostStatus.published, Instant.parse("2026-01-01T00:00:00Z")));
    Post newer = postRepository.saveAndFlush(createPost(author, "Newer", PostStatus.published, Instant.parse("2026-02-01T00:00:00Z")));
    postRepository.saveAndFlush(createPost(author, "Draft", PostStatus.draft, null));

    List<Post> result =
        postRepository
            .findByStatusOrderByPublishedAtDesc(PostStatus.published, PageRequest.of(0, 10))
            .getContent();

    assertThat(result).extracting(Post::getId).containsExactly(newer.getId(), older.getId());
  }

  private static User createUser(String username, String email) {
    return new User(username, email, "hashed-password", Role.STUDENT, "Test", "User");
  }

  private static Post createPost(User author, String title, PostStatus status, Instant publishedAt) {
    Post post = new Post();
    post.setAuthor(author);
    post.setType(PostType.acceptance);
    post.setTitle(title);
    post.setVisibility(PostVisibility.public_post);
    post.setStatus(status);
    post.setPublishedAt(publishedAt);
    return post;
  }
}
