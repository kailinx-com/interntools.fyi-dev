package com.interntoolsfyi.auth.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.interntoolsfyi.auth.dto.AuthResponse;
import com.interntoolsfyi.auth.dto.UpdateProfileRequest;
import com.interntoolsfyi.auth.service.AuthService;
import com.interntoolsfyi.user.model.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

/**
 * Direct unit tests for {@link MeController} (avoids standalone {@link org.springframework.test.web.servlet.MockMvc}
 * argument resolution ordering issues with {@link Authentication}).
 */
@ExtendWith(MockitoExtension.class)
class MeControllerTest {

  @Mock private AuthService authService;

  private MeController controller;

  @BeforeEach
  void setUp() {
    controller = new MeController(authService);
  }

  @Test
  @DisplayName("GET /me returns 401 when not authenticated")
  void getMeUnauthorizedWhenNotAuthenticated() {
    Authentication authentication = mock(Authentication.class);
    when(authentication.isAuthenticated()).thenReturn(false);

    ResponseEntity<AuthResponse> response = controller.me(authentication);
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    verify(authService, never()).getCurrentUser(any());
  }

  @Test
  @DisplayName("GET /me returns 401 when authentication is null")
  void getMeUnauthorizedWhenAuthenticationIsNull() {
    ResponseEntity<AuthResponse> response = controller.me(null);
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    verify(authService, never()).getCurrentUser(any());
  }

  @Test
  @DisplayName("GET /me returns user when authenticated")
  void getMeReturnsUserWhenAuthenticated() {
    Authentication authentication = mock(Authentication.class);
    when(authentication.isAuthenticated()).thenReturn(true);
    when(authentication.getName()).thenReturn("alice");
    when(authService.getCurrentUser("alice"))
        .thenReturn(new AuthResponse(1L, "alice", "a@example.com", Role.STUDENT));

    ResponseEntity<AuthResponse> response = controller.me(authentication);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().username()).isEqualTo("alice");
    assertThat(response.getBody().email()).isEqualTo("a@example.com");
  }

  @Test
  @DisplayName("PATCH /me returns 401 when not authenticated")
  void patchMeUnauthorizedWhenNotAuthenticated() {
    Authentication authentication = mock(Authentication.class);
    when(authentication.isAuthenticated()).thenReturn(false);

    ResponseEntity<AuthResponse> response =
        controller.updateProfile(
            authentication, new UpdateProfileRequest(null, "e@example.com", "current", null));
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    verify(authService, never()).updateProfile(any(), any());
  }

  @Test
  @DisplayName("PATCH /me returns 401 when authentication is null")
  void patchMeUnauthorizedWhenAuthenticationIsNull() {
    ResponseEntity<AuthResponse> response =
        controller.updateProfile(null, new UpdateProfileRequest(null, null, null, null));
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    verify(authService, never()).updateProfile(any(), any());
  }

  @Test
  @DisplayName("PATCH /me updates profile when authenticated")
  void patchMeUpdatesWhenAuthenticated() {
    Authentication authentication = mock(Authentication.class);
    when(authentication.isAuthenticated()).thenReturn(true);
    when(authentication.getName()).thenReturn("alice");
    UpdateProfileRequest body = new UpdateProfileRequest(null, "new@example.com", "current", null);
    when(authService.updateProfile("alice", body))
        .thenReturn(new AuthResponse(1L, "alice", "new@example.com", Role.STUDENT));

    ResponseEntity<AuthResponse> response = controller.updateProfile(authentication, body);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().email()).isEqualTo("new@example.com");
  }
}
