package com.interntoolsfyi.offer.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.interntoolsfyi.offer.model.Comparison;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class ComparisonRepositoryTest {

  @Autowired private ComparisonRepository comparisonRepository;
  @Autowired private UserRepository userRepository;

  @Nested
  @DisplayName("findByUserOrderByCreatedAtDesc")
  class FindByUserOrderByCreatedAtDescTests {

    @Test
    @DisplayName("returns only the given users comparisons ordered newest createdAt first")
    void returnsOnlyGivenUsersComparisonsInDescOrder() {
      User owner = userRepository.saveAndFlush(createUser("comp-owner", "comp-owner@example.com"));
      User other = userRepository.saveAndFlush(createUser("comp-other", "comp-other@example.com"));

      Comparison older = saveComparison(owner, "Older comparison", Instant.parse("2026-01-01T00:00:00Z"));
      Comparison newer = saveComparison(owner, "Newer comparison", Instant.parse("2026-04-01T00:00:00Z"));
      saveComparison(other, "Other user comparison", Instant.parse("2026-05-01T00:00:00Z"));

      List<Comparison> result = comparisonRepository.findByUserOrderByCreatedAtDesc(owner);

      assertThat(result).extracting(Comparison::getId)
          .containsExactly(newer.getId(), older.getId());
    }

    @Test
    @DisplayName("returns empty list when user has no comparisons")
    void returnsEmptyListForUserWithNoComparisons() {
      User emptyUser = userRepository.saveAndFlush(createUser("no-comps-user", "no-comps@example.com"));

      assertThat(comparisonRepository.findByUserOrderByCreatedAtDesc(emptyUser)).isEmpty();
    }
  }

  @Nested
  @DisplayName("findByIdAndUser")
  class FindByIdAndUserTests {

    @Test
    @DisplayName("returns the comparison when it belongs to the given user")
    void returnsComparisonForOwner() {
      User owner = userRepository.saveAndFlush(createUser("comp-owner2", "comp-owner2@example.com"));
      Comparison comparison = saveComparison(owner, "My comparison", Instant.parse("2026-02-01T00:00:00Z"));

      assertThat(comparisonRepository.findByIdAndUser(comparison.getId(), owner)).isPresent();
    }

    @Test
    @DisplayName("returns empty when the comparison belongs to a different user")
    void returnsEmptyForNonOwner() {
      User owner = userRepository.saveAndFlush(createUser("comp-owner3", "comp-owner3@example.com"));
      User other = userRepository.saveAndFlush(createUser("comp-other3", "comp-other3@example.com"));
      Comparison comparison = saveComparison(owner, "Private comparison", Instant.parse("2026-02-01T00:00:00Z"));

      assertThat(comparisonRepository.findByIdAndUser(comparison.getId(), other)).isEmpty();
    }

    @Test
    @DisplayName("returns empty for a non-existent id")
    void returnsEmptyForNonExistentId() {
      User owner = userRepository.saveAndFlush(createUser("comp-owner4", "comp-owner4@example.com"));

      assertThat(comparisonRepository.findByIdAndUser(Long.MAX_VALUE, owner)).isEmpty();
    }
  }

  private Comparison saveComparison(User user, String name, Instant createdAt) {
    Comparison comparison = new Comparison();
    comparison.setUser(user);
    comparison.setName(name);
    comparison.setCreatedAt(createdAt);
    return comparisonRepository.saveAndFlush(comparison);
  }

  private static User createUser(String username, String email) {
    return new User(username, email, "hashed-password", Role.STUDENT, "Test", "User");
  }
}
