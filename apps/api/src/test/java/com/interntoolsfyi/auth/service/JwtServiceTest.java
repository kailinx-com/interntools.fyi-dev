package com.interntoolsfyi.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertThrows;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.WeakKeyException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import javax.crypto.SecretKey;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

  private static final String TEST_SECRET = "0123456789abcdef0123456789abcdef";
  private static final String OTHER_SECRET = "fedcba9876543210fedcba9876543210";
  private static final long EXPIRATION_MS = 3_600_000L;
  private static final long EXPIRATION_TOLERANCE_MS = 2_000L;

  private static final String DEFAULT_USERNAME = "alice@example.com";
  private static final Long DEFAULT_USER_ID = 42L;
  private static final String DEFAULT_ROLE = "STUDENT";

  private final JwtService jwtService = new JwtService(TEST_SECRET, EXPIRATION_MS);

  private String createValidToken() {
    return jwtService.generateToken(DEFAULT_USERNAME, DEFAULT_USER_ID, DEFAULT_ROLE);
  }

  private String createExpiredToken() {
    return new JwtService(TEST_SECRET, -1L)
        .generateToken(DEFAULT_USERNAME, DEFAULT_USER_ID, DEFAULT_ROLE);
  }

  private Long roundTripUserId(Long userId) {
    return jwtService.getUserIdFromToken(
        jwtService.generateToken(DEFAULT_USERNAME, userId, DEFAULT_ROLE));
  }

  private String roundTripUsername(String username) {
    return jwtService.getUsernameFromToken(
        jwtService.generateToken(username, DEFAULT_USER_ID, DEFAULT_ROLE));
  }

  private String roundTripRole(String role) {
    return jwtService.getRoleFromToken(
        jwtService.generateToken(DEFAULT_USERNAME, DEFAULT_USER_ID, role));
  }

  private String payloadJson(String token) {
    String encodedPayload = token.split("\\.")[1];
    return new String(Base64.getUrlDecoder().decode(encodedPayload), StandardCharsets.UTF_8);
  }

  private String tamperToken(String token) {
    String[] parts = token.split("\\.");
    char[] signature = parts[2].toCharArray();
    int indexToReplace = signature.length / 2;
    signature[indexToReplace] = signature[indexToReplace] == 'a' ? 'b' : 'a';
    parts[2] = new String(signature);
    return String.join(".", parts);
  }

  private Claims parseClaims(String token, String secret) {
    return Jwts.parser()
        .verifyWith(signingKey(secret))
        .build()
        .parseSignedClaims(token)
        .getPayload();
  }

  private SecretKey signingKey(String secret) {
    return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
  }

  private void assertInvalidTokenThrows(ThrowingCall call) {
    assertThatThrownBy(call::run)
        .isInstanceOfAny(JwtException.class, IllegalArgumentException.class);
  }

  @FunctionalInterface
  private interface ThrowingCall {
    void run();
  }

  @Nested
  @DisplayName("Constructor and configuration")
  class ConstructorAndConfigurationTests {

    @Test
    @DisplayName("accepts a valid secret and expiration")
    void acceptsValidSecretAndExpiration() {
      JwtService configuredService = new JwtService(TEST_SECRET, EXPIRATION_MS);

      String token =
          configuredService.generateToken(DEFAULT_USERNAME, DEFAULT_USER_ID, DEFAULT_ROLE);

      assertThat(token).isNotBlank();
      assertThat(configuredService.validateToken(token)).isTrue();
    }

    @Test
    @DisplayName("rejects secrets shorter than the HS256 minimum")
    void rejectsShortSecret() {
      assertThrows(WeakKeyException.class, () -> new JwtService("short-secret", EXPIRATION_MS));
    }

    @Test
    @DisplayName("negative expiration creates an already expired token")
    void negativeExpirationCreatesAnExpiredToken() {
      JwtService expiredJwtService = new JwtService(TEST_SECRET, -1L);

      String token =
          expiredJwtService.generateToken(DEFAULT_USERNAME, DEFAULT_USER_ID, DEFAULT_ROLE);

      assertThat(token).isNotBlank();
      assertThat(expiredJwtService.validateToken(token)).isFalse();
    }
  }

  @Nested
  @DisplayName("generateToken")
  class GenerateTokenTests {

    @Test
    @DisplayName("returns a signed JWT with three sections")
    void returnsASignedJwtWithThreeSections() {
      String token = createValidToken();

      assertThat(token).isNotBlank();
      assertThat(token.split("\\.")).hasSize(3);
      assertThat(jwtService.validateToken(token)).isTrue();
    }

    @Test
    @DisplayName("round-trips the core claims for a typical user")
    void roundTripsTheCoreClaimsForATypicalUser() {
      String token = createValidToken();

      assertThat(jwtService.getUsernameFromToken(token)).isEqualTo(DEFAULT_USERNAME);
      assertThat(jwtService.getUserIdFromToken(token)).isEqualTo(DEFAULT_USER_ID);
      assertThat(jwtService.getRoleFromToken(token)).isEqualTo(DEFAULT_ROLE);
    }

    @Test
    @DisplayName("preserves edge userId values")
    void preservesEdgeUserIdValues() {
      assertThat(roundTripUserId(0L)).isZero();
      assertThat(roundTripUserId(-1L)).isEqualTo(-1L);
      assertThat(roundTripUserId(Long.MAX_VALUE)).isEqualTo(Long.MAX_VALUE);
    }

    @Test
    @DisplayName("preserves long and special usernames, and documents empty-subject behavior")
    void preservesLongAndSpecialUsernamesAndDocumentsEmptySubjectBehavior() {
      assertThat(roundTripUsername("")).isNull();
      assertThat(roundTripUsername("a".repeat(256))).hasSize(256);
      assertThat(roundTripUsername("name with spaces")).isEqualTo("name with spaces");
      assertThat(roundTripUsername("elise+intern@example.com"))
          .isEqualTo("elise+intern@example.com");
      assertThat(roundTripUsername("测试-user@example.com")).isEqualTo("测试-user@example.com");
    }

    @Test
    @DisplayName("preserves empty and special-character roles")
    void preservesEmptyAndSpecialCharacterRoles() {
      assertThat(roundTripRole("")).isEmpty();
      assertThat(roundTripRole("SUPER ADMIN")).isEqualTo("SUPER ADMIN");
      assertThat(roundTripRole("ROLE_STUDENT-2026")).isEqualTo("ROLE_STUDENT-2026");
      assertThat(roundTripRole("reviewer/read-only")).isEqualTo("reviewer/read-only");
    }

    @Test
    @DisplayName("documents the current null-input behavior")
    void documentsTheCurrentNullInputBehavior() {
      String token = jwtService.generateToken(null, null, null);

      assertThat(token).isNotBlank();
      assertThat(jwtService.validateToken(token)).isTrue();
      assertThat(jwtService.getUsernameFromToken(token)).isNull();
      assertThat(jwtService.getUserIdFromToken(token)).isNull();
      assertThat(jwtService.getRoleFromToken(token)).isNull();
    }

    @Test
    @DisplayName("includes standard and custom claims in the payload")
    void includesStandardAndCustomClaimsInThePayload() {
      String token = createValidToken();
      String payloadJson = payloadJson(token);

      assertThat(payloadJson).contains("\"sub\":\"" + DEFAULT_USERNAME + "\"");
      assertThat(payloadJson).contains("\"userId\":" + DEFAULT_USER_ID);
      assertThat(payloadJson).contains("\"role\":\"" + DEFAULT_ROLE + "\"");
      assertThat(payloadJson).contains("\"iat\":");
      assertThat(payloadJson).contains("\"exp\":");
    }
  }

  @Nested
  @DisplayName("validateToken")
  class ValidateTokenTests {

    @Test
    @DisplayName("returns true for a valid token")
    void returnsTrueForAValidToken() {
      assertThat(jwtService.validateToken(createValidToken())).isTrue();
    }

    @Test
    @DisplayName("returns false for malformed, blank, and null tokens")
    void returnsFalseForMalformedBlankAndNullTokens() {
      assertThat(jwtService.validateToken("not-a-jwt")).isFalse();
      assertThat(jwtService.validateToken("")).isFalse();
      assertThat(jwtService.validateToken("   ")).isFalse();
      assertThat(jwtService.validateToken("header.payload")).isFalse();
      assertThat(jwtService.validateToken(null)).isFalse();
    }

    @Test
    @DisplayName("returns false for a tampered token")
    void returnsFalseForATamperedToken() {
      String tamperedToken = tamperToken(createValidToken());

      assertThat(jwtService.validateToken(tamperedToken)).isFalse();
    }

    @Test
    @DisplayName("returns false for an expired token")
    void returnsFalseForAnExpiredToken() {
      assertThat(jwtService.validateToken(createExpiredToken())).isFalse();
    }

    @Test
    @DisplayName("returns false for a token signed with a different secret")
    void returnsFalseForATokenSignedWithADifferentSecret() {
      JwtService otherJwtService = new JwtService(OTHER_SECRET, EXPIRATION_MS);
      String token = otherJwtService.generateToken(DEFAULT_USERNAME, DEFAULT_USER_ID, DEFAULT_ROLE);

      assertThat(jwtService.validateToken(token)).isFalse();
    }
  }

  @Nested
  @DisplayName("claim getters")
  class ClaimGetterTests {

    @Test
    @DisplayName("getUsernameFromToken returns the subject")
    void getUsernameFromTokenReturnsTheSubject() {
      assertThat(jwtService.getUsernameFromToken(createValidToken())).isEqualTo(DEFAULT_USERNAME);
    }

    @Test
    @DisplayName("getUserIdFromToken returns the custom claim")
    void getUserIdFromTokenReturnsTheCustomClaim() {
      assertThat(jwtService.getUserIdFromToken(createValidToken())).isEqualTo(DEFAULT_USER_ID);
    }

    @Test
    @DisplayName("getRoleFromToken returns the custom claim")
    void getRoleFromTokenReturnsTheCustomClaim() {
      assertThat(jwtService.getRoleFromToken(createValidToken())).isEqualTo(DEFAULT_ROLE);
    }

    @Test
    @DisplayName("getter methods throw for malformed tokens")
    void getterMethodsThrowForMalformedTokens() {
      assertInvalidTokenThrows(() -> jwtService.getUsernameFromToken("not-a-jwt"));
      assertInvalidTokenThrows(() -> jwtService.getUserIdFromToken("not-a-jwt"));
      assertInvalidTokenThrows(() -> jwtService.getRoleFromToken("not-a-jwt"));
    }

    @Test
    @DisplayName("getter methods throw for null tokens")
    void getterMethodsThrowForNullTokens() {
      assertInvalidTokenThrows(() -> jwtService.getUsernameFromToken(null));
      assertInvalidTokenThrows(() -> jwtService.getUserIdFromToken(null));
      assertInvalidTokenThrows(() -> jwtService.getRoleFromToken(null));
    }

    @Test
    @DisplayName("getter methods throw for tampered tokens")
    void getterMethodsThrowForTamperedTokens() {
      String tamperedToken = tamperToken(createValidToken());

      assertInvalidTokenThrows(() -> jwtService.getUsernameFromToken(tamperedToken));
      assertInvalidTokenThrows(() -> jwtService.getUserIdFromToken(tamperedToken));
      assertInvalidTokenThrows(() -> jwtService.getRoleFromToken(tamperedToken));
    }

    @Test
    @DisplayName("getter methods throw for expired tokens")
    void getterMethodsThrowForExpiredTokens() {
      String expiredToken = createExpiredToken();

      assertInvalidTokenThrows(() -> jwtService.getUsernameFromToken(expiredToken));
      assertInvalidTokenThrows(() -> jwtService.getUserIdFromToken(expiredToken));
      assertInvalidTokenThrows(() -> jwtService.getRoleFromToken(expiredToken));
    }

    @Test
    @DisplayName("missing userId claim returns null")
    void missingUserIdClaimReturnsNull() {
      String token =
          Jwts.builder()
              .subject(DEFAULT_USERNAME)
              .claim("role", DEFAULT_ROLE)
              .signWith(signingKey(TEST_SECRET))
              .compact();

      assertThat(jwtService.getUserIdFromToken(token)).isNull();
    }

    @Test
    @DisplayName("missing role claim returns null")
    void missingRoleClaimReturnsNull() {
      String token =
          Jwts.builder()
              .subject(DEFAULT_USERNAME)
              .claim("userId", DEFAULT_USER_ID)
              .signWith(signingKey(TEST_SECRET))
              .compact();

      assertThat(jwtService.getRoleFromToken(token)).isNull();
    }

    @Test
    @DisplayName("wrong userId claim type throws an exception")
    void wrongUserIdClaimTypeThrowsAnException() {
      String token =
          Jwts.builder()
              .subject(DEFAULT_USERNAME)
              .claim("userId", "forty-two")
              .claim("role", DEFAULT_ROLE)
              .signWith(signingKey(TEST_SECRET))
              .compact();

      assertThatThrownBy(() -> jwtService.getUserIdFromToken(token))
          .isInstanceOfAny(JwtException.class, IllegalArgumentException.class);
    }
  }

  @Nested
  @DisplayName("cross-instance consistency")
  class CrossInstanceConsistencyTests {

    @Test
    @DisplayName("different instances with the same config accept each other's tokens")
    void differentInstancesWithTheSameConfigAcceptEachOthersTokens() {
      JwtService first = new JwtService(TEST_SECRET, EXPIRATION_MS);
      JwtService second = new JwtService(TEST_SECRET, EXPIRATION_MS);

      String token = first.generateToken(DEFAULT_USERNAME, DEFAULT_USER_ID, DEFAULT_ROLE);

      assertThat(second.validateToken(token)).isTrue();
      assertThat(second.getUsernameFromToken(token)).isEqualTo(DEFAULT_USERNAME);
      assertThat(second.getUserIdFromToken(token)).isEqualTo(DEFAULT_USER_ID);
      assertThat(second.getRoleFromToken(token)).isEqualTo(DEFAULT_ROLE);
    }

    @Test
    @DisplayName("generated expiration matches the configured duration")
    void generatedExpirationMatchesTheConfiguredDuration() {
      long beforeGeneration = System.currentTimeMillis();

      String token = createValidToken();
      Claims claims = parseClaims(token, TEST_SECRET);
      long afterGeneration = System.currentTimeMillis();

      assertThat(claims.getIssuedAt()).isNotNull();
      assertThat(claims.getExpiration()).isNotNull();
      assertThat(claims.getIssuedAt().getTime())
          .isBetween(beforeGeneration - 1_000L, afterGeneration);
      assertThat(claims.getExpiration().getTime() - claims.getIssuedAt().getTime())
          .isBetween(
              EXPIRATION_MS - EXPIRATION_TOLERANCE_MS, EXPIRATION_MS + EXPIRATION_TOLERANCE_MS);
    }
  }
}
