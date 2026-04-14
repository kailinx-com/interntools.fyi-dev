package com.interntoolsfyi.user.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.model.UserFollow;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class UserFollowRepositoryTest {

  @Autowired private UserFollowRepository userFollowRepository;
  @Autowired private UserRepository userRepository;

  private User createUser(String username, String email) {
    return userRepository.saveAndFlush(
        new User(username, email, "hash", Role.STUDENT, "First", "Last"));
  }

  @Test
  @DisplayName("existsByFollowerAndFollowing returns true after save")
  void existsAfterSave() {
    User alice = createUser("alice", "alice@example.com");
    User bob = createUser("bob", "bob@example.com");

    userFollowRepository.saveAndFlush(new UserFollow(alice, bob));

    assertThat(userFollowRepository.existsByFollowerAndFollowing(alice, bob)).isTrue();
    assertThat(userFollowRepository.existsByFollowerAndFollowing(bob, alice)).isFalse();
  }

  @Test
  @DisplayName("countFollowers and countFollowing return correct values")
  void countFollowersAndFollowing() {
    User alice = createUser("alice2", "alice2@example.com");
    User bob = createUser("bob2", "bob2@example.com");
    User carol = createUser("carol2", "carol2@example.com");

    userFollowRepository.saveAndFlush(new UserFollow(alice, bob));
    userFollowRepository.saveAndFlush(new UserFollow(carol, bob));
    userFollowRepository.saveAndFlush(new UserFollow(alice, carol));

    assertThat(userFollowRepository.countFollowers(bob)).isEqualTo(2);
    assertThat(userFollowRepository.countFollowing(alice)).isEqualTo(2);
    assertThat(userFollowRepository.countFollowers(alice)).isEqualTo(0);
  }

  @Test
  @DisplayName("deleteByFollowerAndFollowing removes the follow record")
  void deleteByFollowerAndFollowing() {
    User alice = createUser("alice3", "alice3@example.com");
    User bob = createUser("bob3", "bob3@example.com");
    userFollowRepository.saveAndFlush(new UserFollow(alice, bob));

    userFollowRepository.deleteByFollowerAndFollowing(alice, bob);
    userFollowRepository.flush();

    assertThat(userFollowRepository.existsByFollowerAndFollowing(alice, bob)).isFalse();
  }

  @Test
  @DisplayName("findByFollowerOrderByCreatedAtDesc returns follows by follower")
  void findByFollower() {
    User alice = createUser("alice4", "alice4@example.com");
    User bob = createUser("bob4", "bob4@example.com");
    User carol = createUser("carol4", "carol4@example.com");
    userFollowRepository.saveAndFlush(new UserFollow(alice, bob));
    userFollowRepository.saveAndFlush(new UserFollow(alice, carol));

    var list = userFollowRepository.findByFollowerOrderByCreatedAtDesc(alice);
    assertThat(list).hasSize(2);
    assertThat(list).allMatch(uf -> uf.getFollower().getId().equals(alice.getId()));
  }

  @Test
  @DisplayName("findByFollowingOrderByCreatedAtDesc returns followers of a user")
  void findByFollowing() {
    User alice = createUser("alice5", "alice5@example.com");
    User bob = createUser("bob5", "bob5@example.com");
    User carol = createUser("carol5", "carol5@example.com");
    userFollowRepository.saveAndFlush(new UserFollow(bob, alice));
    userFollowRepository.saveAndFlush(new UserFollow(carol, alice));

    var list = userFollowRepository.findByFollowingOrderByCreatedAtDesc(alice);
    assertThat(list).hasSize(2);
    assertThat(list).allMatch(uf -> uf.getFollowing().getId().equals(alice.getId()));
  }

  @Test
  @DisplayName("duplicate follow for same pair violates unique constraint")
  void duplicateFollowViolatesUnique() {
    User alice = createUser("alice6", "alice6@example.com");
    User bob = createUser("bob6", "bob6@example.com");
    userFollowRepository.saveAndFlush(new UserFollow(alice, bob));

    assertThatThrownBy(() -> userFollowRepository.saveAndFlush(new UserFollow(alice, bob)))
        .isInstanceOf(DataIntegrityViolationException.class);
  }
}
