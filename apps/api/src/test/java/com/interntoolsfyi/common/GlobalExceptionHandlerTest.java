package com.interntoolsfyi.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

class GlobalExceptionHandlerTest {
  private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

  @Test
  @DisplayName("returns conflict for username/email uniqueness errors")
  void returnsConflictForUniquenessErrors() {
    ResponseEntity<Map<String, String>> response =
        handler.handleIllegalArgument(new IllegalArgumentException("Username already taken"));

    assertThat(response.getStatusCode().value()).isEqualTo(409);
    assertThat(response.getBody()).containsEntry("message", "Username already taken");
  }

  @Test
  @DisplayName("returns unprocessable entity for incorrect current password")
  void returnsUnprocessableEntityForIncorrectPassword() {
    ResponseEntity<Map<String, String>> response =
        handler.handleIllegalArgument(new IllegalArgumentException("Current password is incorrect"));

    assertThat(response.getStatusCode().value()).isEqualTo(422);
  }

  @Test
  @DisplayName("returns unauthorized for invalid credentials")
  void returnsUnauthorizedForInvalidCredentials() {
    ResponseEntity<Map<String, String>> response =
        handler.handleIllegalArgument(new IllegalArgumentException("Invalid username or password"));

    assertThat(response.getStatusCode().value()).isEqualTo(401);
  }

  @Test
  @DisplayName("returns bad request for generic illegal arguments")
  void returnsBadRequestForGenericErrors() {
    ResponseEntity<Map<String, String>> response =
        handler.handleIllegalArgument(new IllegalArgumentException("Unexpected bad request"));

    assertThat(response.getStatusCode().value()).isEqualTo(400);
    assertThat(response.getBody()).containsEntry("message", "Unexpected bad request");
  }

  @Test
  @DisplayName("returns bad request fallback message for null exception message")
  void returnsBadRequestForNullMessage() {
    ResponseEntity<Map<String, String>> response =
        handler.handleIllegalArgument(new IllegalArgumentException((String) null));

    assertThat(response.getStatusCode().value()).isEqualTo(400);
    assertThat(response.getBody()).containsEntry("message", "Bad request");
  }
}
