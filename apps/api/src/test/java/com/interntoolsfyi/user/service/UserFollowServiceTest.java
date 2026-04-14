package com.interntoolsfyi.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.model.UserFollow;
import com.interntoolsfyi.user.repository.UserFollowRepository;
import com.interntoolsfyi.user.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class UserFollowServiceTest {

  @Mock private UserRepository userRepository;
  @Mock private UserFollowRepository userFollowRepository;
  @InjectMocks private UserFollowService userFollowService;

  private User makeUser(String username, long id) {
    User u = new User(username, username + "@example.com", "hash", Role.STUDENT, "First", "Last");
    ReflectionTestUtils.setField(u, "id", id);
    return u;
  }

  private Authentication auth(String username) {
    Authentication a = mock(Authentication.class);
    when(a.isAuthenticated()).thenReturn(true);
    when(a.getName()).thenReturn(username);
    return a;
  }

  @Nested
  @DisplayName("follow()")
  class Follow {

    @Test
    @DisplayName("creates UserFollow when not already following")
    void createsFollowWhenNotFollowing() {
      User alice = makeUser("alice", 1L);
      User bob = makeUser("bob", 2L);
      Authentication auth = auth("alice");
      when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));
      when(userRepository.findById(2L)).thenReturn(Optional.of(bob));
      when(userFollowRepository.existsByFollowerAndFollowing(alice, bob)).thenReturn(false);

      userFollowService.follow(auth, 2L);

      verify(userFollowRepository).save(any(UserFollow.class));
    }

    @Test
    @DisplayName("is idempotent: does not save when already following")
    void idempotentWhenAlreadyFollowing() {
      User alice = makeUser("alice", 1L);
      User bob = makeUser("bob", 2L);
      Authentication auth = auth("alice");
      when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));
      when(userRepository.findById(2L)).thenReturn(Optional.of(bob));
      when(userFollowRepository.existsByFollowerAndFollowing(alice, bob)).thenReturn(true);

      userFollowService.follow(auth, 2L);

      verify(userFollowRepository, never()).save(any());
    }

    @Test
    @DisplayName("throws 400 when trying to follow yourself")
    void throwsBadRequestOnSelfFollow() {
      User alice = makeUser("alice", 1L);
      Authentication auth = auth("alice");
      when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));
      when(userRepository.findById(1L)).thenReturn(Optional.of(alice));

      assertThatThrownBy(() -> userFollowService.follow(auth, 1L))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    @DisplayName("throws 401 when not authenticated")
    void throwsUnauthorizedWhenNotAuthenticated() {
      assertThatThrownBy(() -> userFollowService.follow(null, 2L))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    @DisplayName("throws 404 when target user does not exist")
    void throwsNotFoundForUnknownTarget() {
      User alice = makeUser("alice", 1L);
      Authentication auth = auth("alice");
      when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));
      when(userRepository.findById(999L)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> userFollowService.follow(auth, 999L))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }
  }

  @Nested
  @DisplayName("unfollow()")
  class Unfollow {

    @Test
    @DisplayName("calls deleteByFollowerAndFollowing")
    void callsDelete() {
      User alice = makeUser("alice", 1L);
      User bob = makeUser("bob", 2L);
      Authentication auth = auth("alice");
      when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));
      when(userRepository.findById(2L)).thenReturn(Optional.of(bob));

      userFollowService.unfollow(auth, 2L);

      verify(userFollowRepository).deleteByFollowerAndFollowing(alice, bob);
    }

    @Test
    @DisplayName("throws 401 when not authenticated")
    void throwsUnauthorizedWhenNotAuthenticated() {
      assertThatThrownBy(() -> userFollowService.unfollow(null, 2L))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }
  }
}
