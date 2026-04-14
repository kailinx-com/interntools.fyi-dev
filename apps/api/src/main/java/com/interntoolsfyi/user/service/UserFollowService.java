package com.interntoolsfyi.user.service;

import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.model.UserFollow;
import com.interntoolsfyi.user.repository.UserFollowRepository;
import com.interntoolsfyi.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserFollowService {

  private final UserRepository userRepository;
  private final UserFollowRepository userFollowRepository;

  public UserFollowService(
      UserRepository userRepository, UserFollowRepository userFollowRepository) {
    this.userRepository = userRepository;
    this.userFollowRepository = userFollowRepository;
  }

  @Transactional
  public void follow(Authentication auth, Long targetUserId) {
    User follower = requireUser(auth);
    User target =
        userRepository
            .findById(targetUserId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    if (follower.getId().equals(targetUserId)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot follow yourself");
    }
    if (!userFollowRepository.existsByFollowerAndFollowing(follower, target)) {
      userFollowRepository.save(new UserFollow(follower, target));
    }
  }

  @Transactional
  public void unfollow(Authentication auth, Long targetUserId) {
    User follower = requireUser(auth);
    User target =
        userRepository
            .findById(targetUserId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    userFollowRepository.deleteByFollowerAndFollowing(follower, target);
  }

  private User requireUser(Authentication auth) {
    if (auth == null || !auth.isAuthenticated()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }
    return userRepository
        .findByUsername(auth.getName())
        .orElseThrow(
            () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
  }
}
