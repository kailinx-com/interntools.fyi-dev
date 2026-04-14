package com.interntoolsfyi.auth.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import com.interntoolsfyi.auth.service.JwtService;
import com.interntoolsfyi.auth.service.TokenBlacklistService;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import java.util.Optional;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class JwtAuthFilterTest {

  @Mock private JwtService jwtService;
  @Mock private TokenBlacklistService tokenBlacklistService;
  @Mock private UserRepository userRepository;
  @Mock private HttpServletRequest request;
  @Mock private HttpServletResponse response;
  @Mock private FilterChain filterChain;

  @InjectMocks private JwtAuthFilter filter;

  @BeforeEach
  void clearContext() {
    SecurityContextHolder.clearContext();
  }

  @AfterEach
  void clearContextAfter() {
    SecurityContextHolder.clearContext();
  }

  @Nested
  @DisplayName("no Authorization header")
  class NoAuthHeader {

    @Test
    @DisplayName("passes request through without setting authentication")
    void passesThroughWithoutAuthentication() throws Exception {
      when(request.getHeader("Authorization")).thenReturn(null);

      filter.doFilter(request, response, filterChain);

      verify(filterChain).doFilter(request, response);
      assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }
  }

  @Nested
  @DisplayName("non-Bearer Authorization header")
  class NonBearerHeader {

    @Test
    @DisplayName("passes request through without setting authentication")
    void passesThroughWithoutAuthentication() throws Exception {
      when(request.getHeader("Authorization")).thenReturn("Basic dXNlcjpwYXNz");

      filter.doFilter(request, response, filterChain);

      verify(filterChain).doFilter(request, response);
      assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }
  }

  @Nested
  @DisplayName("invalid token")
  class InvalidToken {

    @Test
    @DisplayName("passes request through without setting authentication")
    void passesThroughWithoutAuthentication() throws Exception {
      when(request.getHeader("Authorization")).thenReturn("Bearer bad.token.here");
      when(jwtService.validateToken("bad.token.here")).thenReturn(false);

      filter.doFilter(request, response, filterChain);

      verify(filterChain).doFilter(request, response);
      assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }
  }

  @Nested
  @DisplayName("revoked token")
  class RevokedToken {

    @Test
    @DisplayName("passes request through without setting authentication")
    void passesThroughWithoutAuthentication() throws Exception {
      when(request.getHeader("Authorization")).thenReturn("Bearer revoked.token");
      when(jwtService.validateToken("revoked.token")).thenReturn(true);
      when(tokenBlacklistService.isRevoked("revoked.token")).thenReturn(true);

      filter.doFilter(request, response, filterChain);

      verify(filterChain).doFilter(request, response);
      assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }
  }

  @Nested
  @DisplayName("valid token")
  class ValidToken {

    @Test
    @DisplayName("sets authentication from userId claim and current DB username")
    void setsAuthenticationFromUserIdAndDbUser() throws Exception {
      when(request.getHeader("Authorization")).thenReturn("Bearer valid.token");
      when(jwtService.validateToken("valid.token")).thenReturn(true);
      when(tokenBlacklistService.isRevoked("valid.token")).thenReturn(false);
      when(jwtService.getUserIdFromToken("valid.token")).thenReturn(1L);
      User alice =
          new User("alice", "a@example.com", "hash", Role.STUDENT, "A", "L");
      when(userRepository.findById(1L)).thenReturn(Optional.of(alice));

      filter.doFilter(request, response, filterChain);

      verify(filterChain).doFilter(request, response);
      verify(userRepository, never()).findByUsername(any());
      var auth = SecurityContextHolder.getContext().getAuthentication();
      assertThat(auth).isNotNull();
      assertThat(auth.getPrincipal()).isEqualTo("alice");
      assertThat(auth.getAuthorities()).extracting(Object::toString).containsExactly("STUDENT");
    }

    @Test
    @DisplayName("principal is current DB username when JWT subject is stale after rename")
    void principalMatchesDbUsernameWhenSubjectDiffersFromToken() throws Exception {
      when(request.getHeader("Authorization")).thenReturn("Bearer valid.token");
      when(jwtService.validateToken("valid.token")).thenReturn(true);
      when(tokenBlacklistService.isRevoked("valid.token")).thenReturn(false);
      when(jwtService.getUserIdFromToken("valid.token")).thenReturn(42L);
      User renamed =
          new User("alice2", "a@example.com", "hash", Role.STUDENT, "A", "L");
      when(userRepository.findById(42L)).thenReturn(Optional.of(renamed));

      filter.doFilter(request, response, filterChain);

      verify(userRepository, never()).findByUsername(any());
      var auth = SecurityContextHolder.getContext().getAuthentication();
      assertThat(auth).isNotNull();
      assertThat(auth.getPrincipal()).isEqualTo("alice2");
    }

    @Test
    @DisplayName("falls back to findByUsername when userId claim is absent")
    void fallsBackToUsernameWhenUserIdNull() throws Exception {
      when(request.getHeader("Authorization")).thenReturn("Bearer valid.token");
      when(jwtService.validateToken("valid.token")).thenReturn(true);
      when(tokenBlacklistService.isRevoked("valid.token")).thenReturn(false);
      when(jwtService.getUserIdFromToken("valid.token")).thenReturn(null);
      when(jwtService.getUsernameFromToken("valid.token")).thenReturn("alice");
      User alice =
          new User("alice", "a@example.com", "hash", Role.STUDENT, "A", "L");
      when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));

      filter.doFilter(request, response, filterChain);

      verify(userRepository, never()).findById(any());
      var auth = SecurityContextHolder.getContext().getAuthentication();
      assertThat(auth).isNotNull();
      assertThat(auth.getPrincipal()).isEqualTo("alice");
    }

    @Test
    @DisplayName("passes through without authentication when user no longer exists")
    void passesThroughWhenUserMissing() throws Exception {
      when(request.getHeader("Authorization")).thenReturn("Bearer valid.token");
      when(jwtService.validateToken("valid.token")).thenReturn(true);
      when(tokenBlacklistService.isRevoked("valid.token")).thenReturn(false);
      when(jwtService.getUserIdFromToken("valid.token")).thenReturn(99L);
      when(userRepository.findById(99L)).thenReturn(Optional.empty());
      when(jwtService.getUsernameFromToken("valid.token")).thenReturn("ghost");
      when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

      filter.doFilter(request, response, filterChain);

      verify(filterChain).doFilter(request, response);
      assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }
  }
}
