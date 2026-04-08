package com.interntoolsfyi.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.interntoolsfyi.auth.dto.AuthResponse;
import com.interntoolsfyi.auth.dto.LoginRequest;
import com.interntoolsfyi.auth.dto.LoginResponse;
import com.interntoolsfyi.auth.dto.RegisterRequest;
import com.interntoolsfyi.auth.dto.UpdateProfileRequest;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
  @Mock private UserRepository userRepository;
  @Mock private PasswordEncoder passwordEncoder;
  @Mock private JwtService jwtService;
  @InjectMocks private AuthService authService;

  @Nested
  @DisplayName("register")
  class RegisterTests {
    @Test
    @DisplayName("registers a user and returns auth response")
    void registersUserAndReturnsAuthResponse() {
      RegisterRequest request =
          new RegisterRequest(
              "new-user",
              "new-user@example.com",
              "password123",
              Role.STUDENT,
              "New",
              "User");
      User saved = new User("new-user", "new-user@example.com", "hashed", Role.STUDENT, "New", "User");

      when(userRepository.existsByUsername("new-user")).thenReturn(false);
      when(userRepository.existsByEmail("new-user@example.com")).thenReturn(false);
      when(passwordEncoder.encode("password123")).thenReturn("hashed");
      when(userRepository.save(any(User.class))).thenReturn(saved);

      AuthResponse response = authService.register(request);

      assertThat(response.username()).isEqualTo("new-user");
      assertThat(response.email()).isEqualTo("new-user@example.com");
      assertThat(response.role()).isEqualTo(Role.STUDENT);
    }

    @Test
    @DisplayName("rejects registration when username is taken")
    void rejectsWhenUsernameTaken() {
      RegisterRequest request =
          new RegisterRequest(
              "taken", "new@example.com", "pw", Role.STUDENT, "A", "B");
      when(userRepository.existsByUsername("taken")).thenReturn(true);

      assertThatThrownBy(() -> authService.register(request))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Username already taken");
    }

    @Test
    @DisplayName("rejects registration when email is taken")
    void rejectsWhenEmailTaken() {
      RegisterRequest request =
          new RegisterRequest(
              "u", "taken@example.com", "pw", Role.STUDENT, "A", "B");
      when(userRepository.existsByUsername("u")).thenReturn(false);
      when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);

      assertThatThrownBy(() -> authService.register(request))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Email already taken");
    }
  }

  @Nested
  @DisplayName("login")
  class LoginTests {
    @Test
    @DisplayName("returns token and user when credentials are valid")
    void returnsTokenAndUserWhenCredentialsAreValid() {
      User user = createUser("student", "student@example.com", "hashed");
      when(userRepository.findByUsernameOrEmail("student", "student")).thenReturn(Optional.of(user));
      when(passwordEncoder.matches("password123", "hashed")).thenReturn(true);
      when(jwtService.generateToken("student", user.getId(), Role.STUDENT.name())).thenReturn("jwt-token");

      LoginResponse response = authService.login(new LoginRequest("student", "password123"));

      assertThat(response.token()).isEqualTo("jwt-token");
      assertThat(response.user().username()).isEqualTo("student");
    }

    @Test
    @DisplayName("resolves login by email identifier")
    void resolvesLoginByEmailIdentifier() {
      User user = createUser("student", "student@example.com", "hashed");
      when(userRepository.findByUsernameOrEmail("student@example.com", "student@example.com"))
          .thenReturn(Optional.of(user));
      when(passwordEncoder.matches("pw", "hashed")).thenReturn(true);
      when(jwtService.generateToken("student", user.getId(), Role.STUDENT.name())).thenReturn("jwt-token");

      LoginResponse response = authService.login(new LoginRequest("student@example.com", "pw"));

      assertThat(response.user().email()).isEqualTo("student@example.com");
    }

    @Test
    @DisplayName("rejects login when user is not found")
    void rejectsLoginWhenUserNotFound() {
      when(userRepository.findByUsernameOrEmail("nope", "nope")).thenReturn(Optional.empty());

      assertThatThrownBy(() -> authService.login(new LoginRequest("nope", "password123")))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Invalid username or password");
    }

    @Test
    @DisplayName("rejects login when password does not match")
    void rejectsLoginWhenPasswordWrong() {
      User user = createUser("student", "student@example.com", "hashed");
      when(userRepository.findByUsernameOrEmail("student", "student")).thenReturn(Optional.of(user));
      when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

      assertThatThrownBy(() -> authService.login(new LoginRequest("student", "wrong")))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Invalid username or password");
    }
  }

  @Nested
  @DisplayName("getCurrentUser")
  class GetCurrentUserTests {
    @Test
    @DisplayName("returns auth response when user exists")
    void returnsWhenFound() {
      User user = createUser("bob", "bob@example.com", "h");
      when(userRepository.findByUsername("bob")).thenReturn(Optional.of(user));

      AuthResponse response = authService.getCurrentUser("bob");

      assertThat(response.username()).isEqualTo("bob");
      assertThat(response.email()).isEqualTo("bob@example.com");
    }

    @Test
    @DisplayName("throws when user is missing")
    void throwsWhenMissing() {
      when(userRepository.findByUsername("missing")).thenReturn(Optional.empty());

      assertThatThrownBy(() -> authService.getCurrentUser("missing"))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("User not found");
    }
  }

  @Nested
  @DisplayName("updateProfile")
  class UpdateProfileTests {
    @Test
    @DisplayName("throws when the current username is not found")
    void throwsWhenCurrentUserNotFound() {
      when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

      assertThatThrownBy(
              () ->
                  authService.updateProfile(
                      "ghost", new UpdateProfileRequest("alice", "alice@example.com", null, null)))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("User not found");
    }

    @Test
    @DisplayName("updates username, email, and password when current password matches")
    void updatesUsernameEmailAndPassword() {
      User user = createUser("alice", "alice@example.com", "old-hash");
      when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
      when(passwordEncoder.matches("current-pass", "old-hash")).thenReturn(true);
      when(userRepository.existsByUsername("alice2")).thenReturn(false);
      when(userRepository.existsByEmail("alice2@example.com")).thenReturn(false);
      when(passwordEncoder.encode("new-pass")).thenReturn("new-hash");
      when(userRepository.save(user)).thenReturn(user);

      AuthResponse response =
          authService.updateProfile(
              "alice",
              new UpdateProfileRequest("alice2", "alice2@example.com", "current-pass", "new-pass"));

      assertThat(response.username()).isEqualTo("alice2");
      assertThat(response.email()).isEqualTo("alice2@example.com");
      assertThat(user.getPasswordHash()).isEqualTo("new-hash");
    }

    @Test
    @DisplayName("rejects password change when current password is omitted")
    void rejectsPasswordChangeWhenCurrentPasswordOmitted() {
      User user = createUser("alice", "alice@example.com", "old-hash");
      when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));

      assertThatThrownBy(
              () ->
                  authService.updateProfile(
                      "alice",
                      new UpdateProfileRequest("alice", "alice@example.com", null, "new-pass")))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Current password is incorrect");
    }

    @Test
    @DisplayName("rejects updates when current password is incorrect")
    void rejectsUpdateWhenCurrentPasswordIncorrect() {
      User user = createUser("alice", "alice@example.com", "old-hash");
      when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
      when(passwordEncoder.matches("wrong", "old-hash")).thenReturn(false);

      assertThatThrownBy(
              () ->
                  authService.updateProfile(
                      "alice",
                      new UpdateProfileRequest("alice2", "alice2@example.com", "wrong", "new-pass")))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Current password is incorrect");
    }

    @Test
    @DisplayName("rejects username changes when the new username is taken")
    void rejectsUsernameChangeWhenTaken() {
      User user = createUser("alice", "alice@example.com", "old-hash");
      when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
      when(passwordEncoder.matches("current-pass", "old-hash")).thenReturn(true);
      when(userRepository.existsByUsername("taken")).thenReturn(true);

      assertThatThrownBy(
              () ->
                  authService.updateProfile(
                      "alice",
                      new UpdateProfileRequest("taken", "alice@example.com", "current-pass", null)))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Username already taken");
    }

    @Test
    @DisplayName("ignores blank new password when deciding whether to change password")
    void ignoresBlankNewPassword() {
      User user = createUser("alice", "alice@example.com", "old-hash");
      when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
      when(userRepository.save(user)).thenReturn(user);

      AuthResponse response =
          authService.updateProfile(
              "alice", new UpdateProfileRequest("alice", "alice@example.com", null, "   "));

      assertThat(user.getPasswordHash()).isEqualTo("old-hash");
      assertThat(response.username()).isEqualTo("alice");
    }

    @Test
    @DisplayName("ignores blank username in request when deciding whether to change username")
    void ignoresBlankUsernameInRequest() {
      User user = createUser("alice", "alice@example.com", "old-hash");
      when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
      when(userRepository.save(user)).thenReturn(user);

      AuthResponse response =
          authService.updateProfile(
              "alice", new UpdateProfileRequest("   ", "alice@example.com", null, null));

      assertThat(response.username()).isEqualTo("alice");
      verify(userRepository, never()).existsByUsername(any());
    }

    @Test
    @DisplayName("ignores empty string username in request when deciding whether to change username")
    void ignoresEmptyStringUsernameInRequest() {
      User user = createUser("alice", "alice@example.com", "old-hash");
      when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
      when(userRepository.save(user)).thenReturn(user);

      AuthResponse response =
          authService.updateProfile(
              "alice", new UpdateProfileRequest("", "alice@example.com", null, null));

      assertThat(response.username()).isEqualTo("alice");
      verify(userRepository, never()).existsByUsername(any());
    }

    @Test
    @DisplayName("ignores blank email in request when deciding whether to change email")
    void ignoresBlankEmailInRequest() {
      User user = createUser("alice", "alice@example.com", "old-hash");
      when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
      when(userRepository.save(user)).thenReturn(user);

      AuthResponse response =
          authService.updateProfile("alice", new UpdateProfileRequest("alice", "   ", null, null));

      assertThat(response.email()).isEqualTo("alice@example.com");
      verify(userRepository, never()).existsByEmail(any());
    }

    @Test
    @DisplayName("allows no-op updates without requiring current password")
    void allowsNoOpWithoutCurrentPassword() {
      User user = createUser("alice", "alice@example.com", "old-hash");
      when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
      when(userRepository.save(user)).thenReturn(user);

      AuthResponse response =
          authService.updateProfile("alice", new UpdateProfileRequest("alice", "alice@example.com", null, null));

      assertThat(response.username()).isEqualTo("alice");
      verify(userRepository).save(user);
    }

    @Test
    @DisplayName("allows no-op when username field is omitted in request")
    void allowsNoOpWhenUsernameOmitted() {
      User user = createUser("alice", "alice@example.com", "old-hash");
      when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
      when(userRepository.save(user)).thenReturn(user);

      AuthResponse response =
          authService.updateProfile("alice", new UpdateProfileRequest(null, "alice@example.com", null, null));

      assertThat(response.username()).isEqualTo("alice");
      assertThat(response.email()).isEqualTo("alice@example.com");
      verify(userRepository).save(user);
    }

    @Test
    @DisplayName("allows no-op when email field is omitted in request")
    void allowsNoOpWhenEmailOmitted() {
      User user = createUser("alice", "alice@example.com", "old-hash");
      when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
      when(userRepository.save(user)).thenReturn(user);

      AuthResponse response =
          authService.updateProfile("alice", new UpdateProfileRequest("alice", null, null, null));

      assertThat(response.email()).isEqualTo("alice@example.com");
      verify(userRepository).save(user);
    }

    @Test
    @DisplayName("updates email only when current password is provided")
    void updatesEmailOnlyWithCurrentPassword() {
      User user = createUser("alice", "alice@example.com", "old-hash");
      when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
      when(passwordEncoder.matches("current-pass", "old-hash")).thenReturn(true);
      when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
      when(userRepository.save(user)).thenReturn(user);

      AuthResponse response =
          authService.updateProfile(
              "alice",
              new UpdateProfileRequest("alice", "new@example.com", "current-pass", null));

      assertThat(response.email()).isEqualTo("new@example.com");
    }

    @Test
    @DisplayName("updates username and email together when current password matches")
    void updatesUsernameAndEmailTogether() {
      User user = createUser("alice", "alice@example.com", "old-hash");
      when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
      when(passwordEncoder.matches("current-pass", "old-hash")).thenReturn(true);
      when(userRepository.existsByUsername("newname")).thenReturn(false);
      when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
      when(userRepository.save(user)).thenReturn(user);

      AuthResponse response =
          authService.updateProfile(
              "alice",
              new UpdateProfileRequest("newname", "new@example.com", "current-pass", null));

      assertThat(response.username()).isEqualTo("newname");
      assertThat(response.email()).isEqualTo("new@example.com");
    }

    @Test
    @DisplayName("updates password only when current password is provided")
    void updatesPasswordOnlyWithCurrentPassword() {
      User user = createUser("alice", "alice@example.com", "old-hash");
      when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
      when(passwordEncoder.matches("current-pass", "old-hash")).thenReturn(true);
      when(passwordEncoder.encode("new-pass")).thenReturn("new-hash");
      when(userRepository.save(user)).thenReturn(user);

      AuthResponse response =
          authService.updateProfile(
              "alice",
              new UpdateProfileRequest("alice", "alice@example.com", "current-pass", "new-pass"));

      assertThat(user.getPasswordHash()).isEqualTo("new-hash");
      assertThat(response.username()).isEqualTo("alice");
    }

    @Test
    @DisplayName("rejects email changes when the new email is taken")
    void rejectsEmailChangeWhenTaken() {
      User user = createUser("alice", "alice@example.com", "old-hash");
      when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
      when(passwordEncoder.matches("current-pass", "old-hash")).thenReturn(true);
      when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);

      assertThatThrownBy(
              () ->
                  authService.updateProfile(
                      "alice",
                      new UpdateProfileRequest(
                          "alice", "taken@example.com", "current-pass", null)))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Email already taken");
    }
  }

  @Nested
  @DisplayName("toAuthResponse")
  class ToAuthResponseTests {
    @Test
    @DisplayName("maps user fields to the response record")
    void mapsUserFields() {
      User user = createUser("u", "u@example.com", "h");
      AuthResponse response = authService.toAuthResponse(user);
      assertThat(response.username()).isEqualTo("u");
      assertThat(response.email()).isEqualTo("u@example.com");
      assertThat(response.role()).isEqualTo(Role.STUDENT);
    }
  }

  private static User createUser(String username, String email, String passwordHash) {
    return new User(username, email, passwordHash, Role.STUDENT, "Test", "User");
  }
}
