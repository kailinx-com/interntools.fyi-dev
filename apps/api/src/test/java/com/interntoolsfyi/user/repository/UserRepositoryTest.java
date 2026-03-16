package com.interntoolsfyi.user.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class UserRepositoryTest {

  @Autowired private UserRepository userRepository;

  @Test
  @DisplayName("save persists the user, assigns an id, and stores all mapped fields")
  void savePersistsTheUserAssignsAnIdAndStoresAllMappedFields() {
    User saved = userRepository.saveAndFlush(createUser("alice", "alice@example.com"));

    assertThat(saved.getId()).isNotNull();
    assertThat(saved.getCreatedAt()).isNotNull();
    assertThat(saved.getUsername()).isEqualTo("alice");
    assertThat(saved.getEmail()).isEqualTo("alice@example.com");
    assertThat(saved.getPasswordHash()).isEqualTo("hashed-password");
    assertThat(saved.getRole()).isEqualTo(Role.STUDENT);
    assertThat(saved.getFirstName()).isEqualTo("Test");
    assertThat(saved.getLastName()).isEqualTo("User");
  }

  @Nested
  @DisplayName("finder queries")
  class FinderQueryTests {

    @Test
    @DisplayName("findByUsername returns the matching user")
    void findByUsernameReturnsTheMatchingUser() {
      userRepository.saveAndFlush(createUser("student1", "student1@example.com"));

      assertThat(userRepository.findByUsername("student1"))
          .get()
          .extracting(User::getEmail, User::getRole)
          .containsExactly("student1@example.com", Role.STUDENT);
    }

    @Test
    @DisplayName("findByEmail returns the matching user")
    void findByEmailReturnsTheMatchingUser() {
      userRepository.saveAndFlush(createUser("student2", "student2@example.com"));

      assertThat(userRepository.findByEmail("student2@example.com"))
          .get()
          .extracting(User::getUsername, User::getFirstName, User::getLastName)
          .containsExactly("student2", "Test", "User");
    }

    @Test
    @DisplayName("findByUsernameOrEmail matches when the username matches")
    void findByUsernameOrEmailMatchesWhenTheUsernameMatches() {
      userRepository.saveAndFlush(createUser("student3", "student3@example.com"));

      assertThat(userRepository.findByUsernameOrEmail("student3", "missing@example.com"))
          .get()
          .extracting(User::getUsername)
          .isEqualTo("student3");
    }

    @Test
    @DisplayName("findByUsernameOrEmail matches when the email matches")
    void findByUsernameOrEmailMatchesWhenTheEmailMatches() {
      userRepository.saveAndFlush(createUser("student4", "student4@example.com"));

      assertThat(userRepository.findByUsernameOrEmail("missing-user", "student4@example.com"))
          .get()
          .extracting(User::getEmail)
          .isEqualTo("student4@example.com");
    }

    @Test
    @DisplayName("finder queries return empty when no user matches")
    void finderQueriesReturnEmptyWhenNoUserMatches() {
      assertThat(userRepository.findByUsername("missing")).isEmpty();
      assertThat(userRepository.findByEmail("missing@example.com")).isEmpty();
      assertThat(userRepository.findByUsernameOrEmail("missing", "missing@example.com")).isEmpty();
    }
  }

  @Nested
  @DisplayName("exists queries")
  class ExistsQueryTests {

    @Test
    @DisplayName("existsByUsername and existsByEmail reflect repository contents")
    void existsByUsernameAndExistsByEmailReflectRepositoryContents() {
      userRepository.saveAndFlush(createUser("student5", "student5@example.com"));

      assertThat(userRepository.existsByUsername("student5")).isTrue();
      assertThat(userRepository.existsByEmail("student5@example.com")).isTrue();
      assertThat(userRepository.existsByUsername("missing")).isFalse();
      assertThat(userRepository.existsByEmail("missing@example.com")).isFalse();
    }
  }

  @Nested
  @DisplayName("database constraints")
  class DatabaseConstraintTests {

    @Test
    @DisplayName("saving two users with the same username violates the unique username constraint")
    void savingTwoUsersWithTheSameUsernameViolatesTheUniqueUsernameConstraint() {
      userRepository.saveAndFlush(createUser("duplicate-user", "first@example.com"));

      assertThatThrownBy(
              () ->
                  userRepository.saveAndFlush(createUser("duplicate-user", "second@example.com")))
          .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("saving two users with the same email violates the unique email constraint")
    void savingTwoUsersWithTheSameEmailViolatesTheUniqueEmailConstraint() {
      userRepository.saveAndFlush(createUser("first-user", "duplicate@example.com"));

      assertThatThrownBy(
              () ->
                  userRepository.saveAndFlush(createUser("second-user", "duplicate@example.com")))
          .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("username is required")
    void usernameIsRequired() {
      assertRequiredColumnViolation(createUser(null, "null-username@example.com"));
    }

    @Test
    @DisplayName("email is required")
    void emailIsRequired() {
      assertRequiredColumnViolation(createUser("null-email", null));
    }

    @Test
    @DisplayName("password hash is required")
    void passwordHashIsRequired() {
      assertRequiredColumnViolation(
          createUser("null-password", "null-password@example.com", null, Role.STUDENT, "Test", "User"));
    }

    @Test
    @DisplayName("role is required")
    void roleIsRequired() {
      assertRequiredColumnViolation(
          createUser("null-role", "null-role@example.com", "hashed-password", null, "Test", "User"));
    }

    @Test
    @DisplayName("first name is required")
    void firstNameIsRequired() {
      assertRequiredColumnViolation(
          createUser("null-first-name", "null-first@example.com", "hashed-password", Role.STUDENT, null, "User"));
    }

    @Test
    @DisplayName("last name is required")
    void lastNameIsRequired() {
      assertRequiredColumnViolation(
          createUser("null-last-name", "null-last@example.com", "hashed-password", Role.STUDENT, "Test", null));
    }
  }

  private void assertRequiredColumnViolation(User invalidUser) {
    assertThatThrownBy(() -> userRepository.saveAndFlush(invalidUser))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  private static User createUser(String username, String email) {
    return createUser(username, email, "hashed-password", Role.STUDENT, "Test", "User");
  }

  private static User createUser(
      String username,
      String email,
      String passwordHash,
      Role role,
      String firstName,
      String lastName) {
    return new User(username, email, passwordHash, role, firstName, lastName);
  }
}
