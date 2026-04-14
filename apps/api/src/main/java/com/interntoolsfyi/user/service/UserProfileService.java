package com.interntoolsfyi.user.service;

import com.interntoolsfyi.user.dto.FollowSummary;
import com.interntoolsfyi.user.dto.OwnProfileResponse;
import com.interntoolsfyi.user.dto.PublicUserResponse;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserFollowRepository;
import com.interntoolsfyi.user.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserProfileService {

  private final UserRepository userRepository;
  private final UserFollowRepository userFollowRepository;

  public UserProfileService(
      UserRepository userRepository, UserFollowRepository userFollowRepository) {
    this.userRepository = userRepository;
    this.userFollowRepository = userFollowRepository;
  }

  @Transactional(readOnly = true)
  public OwnProfileResponse getOwnProfile(String username) {
    User user =
        userRepository
            .findByUsername(username)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    long followerCount = userFollowRepository.countFollowers(user);
    long followingCount = userFollowRepository.countFollowing(user);
    return new OwnProfileResponse(
        user.getId(),
        user.getUsername(),
        user.getEmail(),
        user.getRole(),
        user.getFirstName(),
        user.getLastName(),
        user.getCreatedAt(),
        followerCount,
        followingCount);
  }

  @Transactional(readOnly = true)
  public PublicUserResponse getPublicProfile(Long profileId, Authentication auth) {
    User subject =
        userRepository
            .findById(profileId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    return buildPublicUserResponse(subject, auth);
  }

  @Transactional(readOnly = true)
  public PublicUserResponse getPublicProfileByUsername(String username, Authentication auth) {
    User subject =
        userRepository
            .findByUsername(username)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    return buildPublicUserResponse(subject, auth);
  }

  private PublicUserResponse buildPublicUserResponse(User subject, Authentication auth) {
    long followerCount = userFollowRepository.countFollowers(subject);
    long followingCount = userFollowRepository.countFollowing(subject);
    boolean isFollowedByViewer = false;
    if (auth != null && auth.isAuthenticated()) {
      isFollowedByViewer =
          userRepository
              .findByUsername(auth.getName())
              .map(viewer -> userFollowRepository.existsByFollowerAndFollowing(viewer, subject))
              .orElse(false);
    }
    return new PublicUserResponse(
        subject.getId(),
        subject.getUsername(),
        subject.getFirstName(),
        subject.getLastName(),
        subject.getCreatedAt(),
        followerCount,
        followingCount,
        isFollowedByViewer);
  }

  @Transactional(readOnly = true)
  public List<FollowSummary> getFollowers(Long profileId) {
    User subject =
        userRepository
            .findById(profileId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    return userFollowRepository.findByFollowingOrderByCreatedAtDesc(subject).stream()
        .map(uf -> toFollowSummary(uf.getFollower()))
        .toList();
  }

  @Transactional(readOnly = true)
  public List<FollowSummary> getFollowing(Long profileId) {
    User subject =
        userRepository
            .findById(profileId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    return userFollowRepository.findByFollowerOrderByCreatedAtDesc(subject).stream()
        .map(uf -> toFollowSummary(uf.getFollowing()))
        .toList();
  }

  private FollowSummary toFollowSummary(User user) {
    return new FollowSummary(
        user.getId(), user.getUsername(), user.getFirstName(), user.getLastName());
  }
}
