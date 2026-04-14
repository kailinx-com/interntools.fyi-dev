package com.interntoolsfyi.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.interntoolsfyi.user.dto.FollowSummary;
import com.interntoolsfyi.user.dto.OwnProfileResponse;
import com.interntoolsfyi.user.dto.PublicUserResponse;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.model.UserFollow;
import com.interntoolsfyi.user.repository.UserFollowRepository;
import com.interntoolsfyi.user.repository.UserRepository;
import java.util.List;
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
class UserProfileServiceTest {

  @Mock private UserRepository userRepository;
  @Mock private UserFollowRepository userFollowRepository;
  @InjectMocks private UserProfileService userProfileService;

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
  @DisplayName("getOwnProfile()")
  class GetOwnProfile {

    @Test
    @DisplayName("returns OwnProfileResponse with email and role")
    void returnsFullProfile() {
      User alice = makeUser("alice", 1L);
      when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));
      when(userFollowRepository.countFollowers(alice)).thenReturn(3L);
      when(userFollowRepository.countFollowing(alice)).thenReturn(5L);

      OwnProfileResponse resp = userProfileService.getOwnProfile("alice");

      assertThat(resp.username()).isEqualTo("alice");
      assertThat(resp.email()).isEqualTo("alice@example.com");
      assertThat(resp.role()).isEqualTo(Role.STUDENT);
      assertThat(resp.followerCount()).isEqualTo(3L);
      assertThat(resp.followingCount()).isEqualTo(5L);
    }

    @Test
    @DisplayName("throws 404 for unknown username")
    void throwsNotFound() {
      when(userRepository.findByUsername("nobody")).thenReturn(Optional.empty());

      assertThatThrownBy(() -> userProfileService.getOwnProfile("nobody"))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }
  }

  @Nested
  @DisplayName("getPublicProfile()")
  class GetPublicProfile {

    @Test
    @DisplayName("hides email; returns username and name fields")
    void hidesEmail() {
      User alice = makeUser("alice", 1L);
      when(userRepository.findById(1L)).thenReturn(Optional.of(alice));
      when(userFollowRepository.countFollowers(alice)).thenReturn(0L);
      when(userFollowRepository.countFollowing(alice)).thenReturn(0L);

      PublicUserResponse resp = userProfileService.getPublicProfile(1L, null);

      assertThat(resp.username()).isEqualTo("alice");
      assertThat(resp.firstName()).isEqualTo("First");
      assertThat(resp.lastName()).isEqualTo("Last");
      assertThat(resp.followedByViewer()).isFalse();
    }

    @Test
    @DisplayName("sets followedByViewer=true when viewer follows subject")
    void setsIsFollowedByViewerTrue() {
      User alice = makeUser("alice", 1L);
      User bob = makeUser("bob", 2L);
      Authentication auth = auth("bob");
      when(userRepository.findById(1L)).thenReturn(Optional.of(alice));
      when(userFollowRepository.countFollowers(alice)).thenReturn(1L);
      when(userFollowRepository.countFollowing(alice)).thenReturn(0L);
      when(userRepository.findByUsername("bob")).thenReturn(Optional.of(bob));
      when(userFollowRepository.existsByFollowerAndFollowing(bob, alice)).thenReturn(true);

      PublicUserResponse resp = userProfileService.getPublicProfile(1L, auth);

      assertThat(resp.followedByViewer()).isTrue();
    }

    @Test
    @DisplayName("sets followedByViewer=false for anonymous viewer")
    void falseForAnonymousViewer() {
      User alice = makeUser("alice", 1L);
      when(userRepository.findById(1L)).thenReturn(Optional.of(alice));
      when(userFollowRepository.countFollowers(alice)).thenReturn(0L);
      when(userFollowRepository.countFollowing(alice)).thenReturn(0L);

      PublicUserResponse resp = userProfileService.getPublicProfile(1L, null);

      assertThat(resp.followedByViewer()).isFalse();
    }

    @Test
    @DisplayName("throws 404 for unknown profile ID")
    void throwsNotFound() {
      when(userRepository.findById(999L)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> userProfileService.getPublicProfile(999L, null))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }
  }

  @Nested
  @DisplayName("getFollowers() and getFollowing()")
  class FollowLists {

    @Test
    @DisplayName("getFollowers returns FollowSummary list of followers")
    void getFollowersReturnsFollowers() {
      User alice = makeUser("alice", 1L);
      User bob = makeUser("bob", 2L);
      UserFollow follow = new UserFollow(bob, alice);
      when(userRepository.findById(1L)).thenReturn(Optional.of(alice));
      when(userFollowRepository.findByFollowingOrderByCreatedAtDesc(alice))
          .thenReturn(List.of(follow));

      List<FollowSummary> result = userProfileService.getFollowers(1L);

      assertThat(result).hasSize(1);
      assertThat(result.get(0).username()).isEqualTo("bob");
    }

    @Test
    @DisplayName("getFollowing returns FollowSummary list of who user follows")
    void getFollowingReturnsFollowing() {
      User alice = makeUser("alice", 1L);
      User bob = makeUser("bob", 2L);
      UserFollow follow = new UserFollow(alice, bob);
      when(userRepository.findById(1L)).thenReturn(Optional.of(alice));
      when(userFollowRepository.findByFollowerOrderByCreatedAtDesc(alice))
          .thenReturn(List.of(follow));

      List<FollowSummary> result = userProfileService.getFollowing(1L);

      assertThat(result).hasSize(1);
      assertThat(result.get(0).username()).isEqualTo("bob");
    }
  }
}
