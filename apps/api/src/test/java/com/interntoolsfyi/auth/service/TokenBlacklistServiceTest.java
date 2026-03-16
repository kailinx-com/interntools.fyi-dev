package com.interntoolsfyi.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class TokenBlacklistServiceTest {

  private static final String TOKEN_A = "token-a";
  private static final String TOKEN_B = "token-b";

  private final TokenBlacklistService tokenBlacklistService = new TokenBlacklistService();

  @Nested
  @DisplayName("revoke")
  class RevokeTests {

    @Test
    @DisplayName("marks a token as revoked")
    void marksATokenAsRevoked() {
      tokenBlacklistService.revoke(TOKEN_A);

      assertThat(tokenBlacklistService.isRevoked(TOKEN_A)).isTrue();
    }

    @Test
    @DisplayName("revoking the same token more than once keeps it revoked")
    void revokingTheSameTokenMoreThanOnceKeepsItRevoked() {
      tokenBlacklistService.revoke(TOKEN_A);
      tokenBlacklistService.revoke(TOKEN_A);

      assertThat(tokenBlacklistService.isRevoked(TOKEN_A)).isTrue();
    }

    @Test
    @DisplayName("revoking one token does not revoke a different token")
    void revokingOneTokenDoesNotRevokeADifferentToken() {
      tokenBlacklistService.revoke(TOKEN_A);

      assertThat(tokenBlacklistService.isRevoked(TOKEN_A)).isTrue();
      assertThat(tokenBlacklistService.isRevoked(TOKEN_B)).isFalse();
    }

    @Test
    @DisplayName("rejects null tokens")
    void rejectsNullTokens() {
      assertThatThrownBy(() -> tokenBlacklistService.revoke(null))
          .isInstanceOf(NullPointerException.class);
    }
  }

  @Nested
  @DisplayName("isRevoked")
  class IsRevokedTests {

    @Test
    @DisplayName("returns false for a token that has never been revoked")
    void returnsFalseForATokenThatHasNeverBeenRevoked() {
      assertThat(tokenBlacklistService.isRevoked(TOKEN_A)).isFalse();
    }

    @Test
    @DisplayName("rejects null tokens")
    void rejectsNullTokens() {
      assertThatThrownBy(() -> tokenBlacklistService.isRevoked(null))
          .isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("returns true only for tokens revoked in the same service instance")
    void returnsTrueOnlyForTokensRevokedInTheSameServiceInstance() {
      tokenBlacklistService.revoke(TOKEN_A);
      TokenBlacklistService anotherService = new TokenBlacklistService();

      assertThat(tokenBlacklistService.isRevoked(TOKEN_A)).isTrue();
      assertThat(anotherService.isRevoked(TOKEN_A)).isFalse();
    }
  }
}
