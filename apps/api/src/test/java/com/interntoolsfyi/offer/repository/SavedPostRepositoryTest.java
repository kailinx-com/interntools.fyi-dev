package com.interntoolsfyi.offer.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.interntoolsfyi.offer.model.Post;
import com.interntoolsfyi.offer.model.SavedPost;
import com.interntoolsfyi.offer.testsupport.PostFixtures;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class SavedPostRepositoryTest {
  @Autowired private SavedPostRepository savedPostRepository;
  @Autowired private PostRepository postRepository;
  @Autowired private OfferRepository offerRepository;
  @Autowired private UserRepository userRepository;

  @Test
  @DisplayName("existsByPostAndUser and findByPostAndUser work for saved bookmark")
  void existsAndFindWork() {
    User author = userRepository.saveAndFlush(createUser("author", "author@example.com"));
    User viewer = userRepository.saveAndFlush(createUser("viewer", "viewer@example.com"));
    Post post = PostFixtures.savePublishedPost(author, "Saved post", offerRepository, postRepository);
    SavedPost saved = new SavedPost();
    saved.setPost(post);
    saved.setUser(viewer);
    savedPostRepository.saveAndFlush(saved);

    assertThat(savedPostRepository.existsByPostAndUser(post, viewer)).isTrue();
    assertThat(savedPostRepository.findByPostAndUser(post, viewer)).isPresent();
    assertThat(savedPostRepository.findByUserOrderByCreatedAtDesc(viewer)).hasSize(1);
  }

  @Test
  @DisplayName("duplicate bookmark for same post and user violates unique constraint")
  void duplicateBookmarkViolatesUniqueConstraint() {
    User author = userRepository.saveAndFlush(createUser("author2", "author2@example.com"));
    User viewer = userRepository.saveAndFlush(createUser("viewer2", "viewer2@example.com"));
    Post post = PostFixtures.savePublishedPost(author, "Saved post two", offerRepository, postRepository);

    SavedPost first = new SavedPost();
    first.setPost(post);
    first.setUser(viewer);
    savedPostRepository.saveAndFlush(first);

    SavedPost duplicate = new SavedPost();
    duplicate.setPost(post);
    duplicate.setUser(viewer);

    assertThatThrownBy(() -> savedPostRepository.saveAndFlush(duplicate))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  private static User createUser(String username, String email) {
    return new User(username, email, "hashed-password", Role.STUDENT, "Test", "User");
  }

}
