package com.interntoolsfyi.user.controller;

import com.interntoolsfyi.offer.dto.PostSummaryResponse;
import com.interntoolsfyi.offer.service.PostService;
import com.interntoolsfyi.user.dto.FollowSummary;
import com.interntoolsfyi.user.dto.OwnProfileResponse;
import com.interntoolsfyi.user.dto.PublicUserResponse;
import com.interntoolsfyi.user.service.UserFollowService;
import com.interntoolsfyi.user.service.UserProfileService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserProfileController {

  private final UserProfileService userProfileService;
  private final UserFollowService userFollowService;
  private final PostService postService;

  public UserProfileController(
      UserProfileService userProfileService,
      UserFollowService userFollowService,
      PostService postService) {
    this.userProfileService = userProfileService;
    this.userFollowService = userFollowService;
    this.postService = postService;
  }

  @GetMapping("/me/profile")
  public ResponseEntity<OwnProfileResponse> getOwnProfile(Authentication auth) {
    if (auth == null || !auth.isAuthenticated()) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    return ResponseEntity.ok(userProfileService.getOwnProfile(auth.getName()));
  }

  @GetMapping("/by-username/{username}")
  public PublicUserResponse getPublicProfileByUsername(
      @PathVariable String username, Authentication auth) {
    return userProfileService.getPublicProfileByUsername(username, auth);
  }

  @GetMapping("/{profileId}")
  public PublicUserResponse getPublicProfile(
      @PathVariable Long profileId, Authentication auth) {
    return userProfileService.getPublicProfile(profileId, auth);
  }

  @GetMapping("/{profileId}/posts")
  public List<PostSummaryResponse> getPostsByUser(
      @PathVariable Long profileId, Authentication auth) {
    return postService.listPublishedPostsByUser(profileId, auth);
  }

  @GetMapping("/{profileId}/followers")
  public List<FollowSummary> getFollowers(@PathVariable Long profileId) {
    return userProfileService.getFollowers(profileId);
  }

  @GetMapping("/{profileId}/following")
  public List<FollowSummary> getFollowing(@PathVariable Long profileId) {
    return userProfileService.getFollowing(profileId);
  }

  @PostMapping("/{profileId}/follow")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void follow(@PathVariable Long profileId, Authentication auth) {
    userFollowService.follow(auth, profileId);
  }

  @DeleteMapping("/{profileId}/follow")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void unfollow(@PathVariable Long profileId, Authentication auth) {
    userFollowService.unfollow(auth, profileId);
  }
}
