package com.interntoolsfyi.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.interntoolsfyi.auth.dto.AuthResponse;
import com.interntoolsfyi.auth.dto.LoginRequest;
import com.interntoolsfyi.auth.dto.LoginResponse;
import com.interntoolsfyi.auth.dto.RegisterRequest;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.lang.reflect.Field;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

  private static final String DEFAULT_USERNAME = "alice";
  private static final String DEFAULT_EMAIL = "alice@example.com";
  private static final String DEFAULT_PASSWORD = "password123";
  private static final String DEFAULT_HASH = "hashed-password";
  private static final String DEFAULT_TOKEN = "jwt-token";
  private static final String DEFAULT_FIRST_NAME = "Alice";
  private static final String DEFAULT_LAST_NAME = "Nguyen";
  private static final Role DEFAULT_ROLE = Role.STUDENT;

  @Mock private UserRepository userRepository;

  @Mock private PasswordEncoder passwordEncoder;

  @Mock private JwtService jwtService;

  @InjectMocks private AuthService authService;

  private RegisterRequest createRegisterRequest() {
    return new RegisterRequest(
        DEFAULT_USERNAME,
        DEFAULT_EMAIL,
        DEFAULT_PASSWORD,
        DEFAULT_ROLE,
        DEFAULT_FIRST_NAME,
        DEFAULT_LAST_NAME);
  }

  private User createUser(Long id, String username, String email, String passwordHash, Role role) {
    User user =
        new User(username, email, passwordHash, role, DEFAULT_FIRST_NAME, DEFAULT_LAST_NAME);
    setUserId(user, id);
    return user;
  }

  private void setUserId(User user, Long id) {
    try {
      Field field = User.class.getDeclaredField("id");
      field.setAccessible(true);
      field.set(user, id);
    } catch (ReflectiveOperationException e) {
      throw new AssertionError(e);
    }
  }

  @Nested
  @DisplayName("Constructor")
  class ConstructorTests {

    @Test
    @DisplayName("creates a service instance when dependencies are provided")
    void createsAServiceInstanceWhenDependenciesAreProvided() {
      AuthService service = new AuthService(userRepository, passwordEncoder, jwtService);

      assertThat(service).isNotNull();
    }
  }

  @Nested
  @DisplayName("register")
  class RegisterTests {

    @Test
    @DisplayName(
        "registers a new user, hashes the password, saves the user, and returns an auth response")
    void registersANewUserHashesThePasswordSavesTheUserAndReturnsAnAuthResponse() {
      RegisterRequest request = createRegisterRequest();
      ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);

      when(userRepository.existsByUsername(request.username())).thenReturn(false);
      when(userRepository.existsByEmail(request.email())).thenReturn(false);
      when(passwordEncoder.encode(request.password())).thenReturn(DEFAULT_HASH);
      when(userRepository.save(any(User.class)))
          .thenAnswer(
              invocation -> {
                User user = invocation.getArgument(0);
                setUserId(user, 101L);
                return user;
              });

      AuthResponse response = authService.register(request);

      verify(userRepository).existsByUsername(request.username());
      verify(userRepository).existsByEmail(request.email());
      verify(passwordEncoder).encode(request.password());
      verify(userRepository).save(userCaptor.capture());

      User savedUser = userCaptor.getValue();
      assertThat(savedUser.getId()).isEqualTo(101L);
      assertThat(savedUser.getUsername()).isEqualTo(request.username());
      assertThat(savedUser.getEmail()).isEqualTo(request.email());
      assertThat(savedUser.getPasswordHash()).isEqualTo(DEFAULT_HASH);
      assertThat(savedUser.getRole()).isEqualTo(request.role());
      assertThat(savedUser.getFirstName()).isEqualTo(request.firstName());
      assertThat(savedUser.getLastName()).isEqualTo(request.lastName());

      assertThat(response.id()).isEqualTo(101L);
      assertThat(response.username()).isEqualTo(request.username());
      assertThat(response.email()).isEqualTo(request.email());
      assertThat(response.role()).isEqualTo(request.role());
    }

    @Test
    @DisplayName("rejects registration when the username already exists")
    void rejectsRegistrationWhenTheUsernameAlreadyExists() {
      RegisterRequest request = createRegisterRequest();
      when(userRepository.existsByUsername(request.username())).thenReturn(true);

      assertThatThrownBy(() -> authService.register(request))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Username already taken");

      verify(userRepository).existsByUsername(request.username());
      verify(userRepository, never()).existsByEmail(any());
      verifyNoInteractions(passwordEncoder, jwtService);
      verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("rejects registration when the email already exists")
    void rejectsRegistrationWhenTheEmailAlreadyExists() {
      RegisterRequest request = createRegisterRequest();
      when(userRepository.existsByUsername(request.username())).thenReturn(false);
      when(userRepository.existsByEmail(request.email())).thenReturn(true);

      assertThatThrownBy(() -> authService.register(request))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Email already taken");

      verify(userRepository).existsByUsername(request.username());
      verify(userRepository).existsByEmail(request.email());
      verifyNoInteractions(passwordEncoder, jwtService);
      verify(userRepository, never()).save(any(User.class));
    }
  }

  @Nested
  @DisplayName("login")
  class LoginTests {

    @Test
    @DisplayName("logs in a valid user and returns a token with the mapped auth response")
    void logsInAValidUserAndReturnsATokenWithTheMappedAuthResponse() {
      LoginRequest request = new LoginRequest(DEFAULT_USERNAME, DEFAULT_PASSWORD);
      User user = createUser(7L, DEFAULT_USERNAME, DEFAULT_EMAIL, DEFAULT_HASH, DEFAULT_ROLE);

      when(userRepository.findByUsernameOrEmail(request.identifier(), request.identifier()))
          .thenReturn(Optional.of(user));
      when(passwordEncoder.matches(request.password(), user.getPasswordHash())).thenReturn(true);
      when(jwtService.generateToken(user.getUsername(), user.getId(), user.getRole().name()))
          .thenReturn(DEFAULT_TOKEN);

      LoginResponse response = authService.login(request);

      verify(userRepository).findByUsernameOrEmail(request.identifier(), request.identifier());
      verify(passwordEncoder).matches(request.password(), user.getPasswordHash());
      verify(jwtService).generateToken(user.getUsername(), user.getId(), user.getRole().name());

      assertThat(response.token()).isEqualTo(DEFAULT_TOKEN);
      assertThat(response.user().id()).isEqualTo(user.getId());
      assertThat(response.user().username()).isEqualTo(user.getUsername());
      assertThat(response.user().email()).isEqualTo(user.getEmail());
      assertThat(response.user().role()).isEqualTo(user.getRole());
    }

    @Test
    @DisplayName("uses the same identifier for username and email lookup")
    void usesTheSameIdentifierForUsernameAndEmailLookup() {
      LoginRequest request = new LoginRequest(DEFAULT_EMAIL, DEFAULT_PASSWORD);
      User user = createUser(8L, DEFAULT_USERNAME, DEFAULT_EMAIL, DEFAULT_HASH, DEFAULT_ROLE);

      when(userRepository.findByUsernameOrEmail(request.identifier(), request.identifier()))
          .thenReturn(Optional.of(user));
      when(passwordEncoder.matches(request.password(), user.getPasswordHash())).thenReturn(true);
      when(jwtService.generateToken(user.getUsername(), user.getId(), user.getRole().name()))
          .thenReturn(DEFAULT_TOKEN);

      LoginResponse response = authService.login(request);

      verify(userRepository).findByUsernameOrEmail(DEFAULT_EMAIL, DEFAULT_EMAIL);
      assertThat(response.token()).isEqualTo(DEFAULT_TOKEN);
    }

    @Test
    @DisplayName("rejects login when the user does not exist")
    void rejectsLoginWhenTheUserDoesNotExist() {
      LoginRequest request = new LoginRequest(DEFAULT_USERNAME, DEFAULT_PASSWORD);

      when(userRepository.findByUsernameOrEmail(request.identifier(), request.identifier()))
          .thenReturn(Optional.empty());

      assertThatThrownBy(() -> authService.login(request))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Invalid username or password");

      verify(userRepository).findByUsernameOrEmail(request.identifier(), request.identifier());
      verifyNoInteractions(passwordEncoder, jwtService);
    }

    @Test
    @DisplayName("rejects login when the password does not match")
    void rejectsLoginWhenThePasswordDoesNotMatch() {
      LoginRequest request = new LoginRequest(DEFAULT_USERNAME, DEFAULT_PASSWORD);
      User user = createUser(9L, DEFAULT_USERNAME, DEFAULT_EMAIL, DEFAULT_HASH, DEFAULT_ROLE);

      when(userRepository.findByUsernameOrEmail(request.identifier(), request.identifier()))
          .thenReturn(Optional.of(user));
      when(passwordEncoder.matches(request.password(), user.getPasswordHash())).thenReturn(false);

      assertThatThrownBy(() -> authService.login(request))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Invalid username or password");

      verify(userRepository).findByUsernameOrEmail(request.identifier(), request.identifier());
      verify(passwordEncoder).matches(request.password(), user.getPasswordHash());
      verifyNoInteractions(jwtService);
    }
  }

  @Nested
  @DisplayName("getCurrentUser")
  class GetCurrentUserTests {

    @Test
    @DisplayName("returns the current user when the username exists")
    void returnsTheCurrentUserWhenTheUsernameExists() {
      User user = createUser(11L, DEFAULT_USERNAME, DEFAULT_EMAIL, DEFAULT_HASH, Role.ADMIN);
      when(userRepository.findByUsername(DEFAULT_USERNAME)).thenReturn(Optional.of(user));

      AuthResponse response = authService.getCurrentUser(DEFAULT_USERNAME);

      verify(userRepository).findByUsername(DEFAULT_USERNAME);
      assertThat(response.id()).isEqualTo(user.getId());
      assertThat(response.username()).isEqualTo(user.getUsername());
      assertThat(response.email()).isEqualTo(user.getEmail());
      assertThat(response.role()).isEqualTo(user.getRole());
    }

    @Test
    @DisplayName("rejects current-user lookup when the username does not exist")
    void rejectsCurrentUserLookupWhenTheUsernameDoesNotExist() {
      when(userRepository.findByUsername(DEFAULT_USERNAME)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> authService.getCurrentUser(DEFAULT_USERNAME))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("User not found");

      verify(userRepository).findByUsername(DEFAULT_USERNAME);
      verifyNoInteractions(passwordEncoder, jwtService);
    }
  }

  @Nested
  @DisplayName("toAuthResponse")
  class ToAuthResponseTests {

    @Test
    @DisplayName("maps the user id, username, email, and role into an auth response")
    void mapsTheUserIdUsernameEmailAndRoleIntoAnAuthResponse() {
      User user = createUser(15L, "robin", "robin@example.com", DEFAULT_HASH, Role.ADMIN);

      AuthResponse response = authService.toAuthResponse(user);

      assertThat(response.id()).isEqualTo(15L);
      assertThat(response.username()).isEqualTo("robin");
      assertThat(response.email()).isEqualTo("robin@example.com");
      assertThat(response.role()).isEqualTo(Role.ADMIN);
    }

    @Test
    @DisplayName("preserves null id values when mapping an unsaved user")
    void preservesNullIdValuesWhenMappingAnUnsavedUser() {
      User user =
          new User(
              DEFAULT_USERNAME,
              DEFAULT_EMAIL,
              DEFAULT_HASH,
              DEFAULT_ROLE,
              DEFAULT_FIRST_NAME,
              DEFAULT_LAST_NAME);

      AuthResponse response = authService.toAuthResponse(user);

      assertThat(response.id()).isNull();
      assertThat(response.username()).isEqualTo(DEFAULT_USERNAME);
      assertThat(response.email()).isEqualTo(DEFAULT_EMAIL);
      assertThat(response.role()).isEqualTo(DEFAULT_ROLE);
    }
  }
}
