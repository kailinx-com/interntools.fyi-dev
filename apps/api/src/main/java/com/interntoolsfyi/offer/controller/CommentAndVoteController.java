package com.interntoolsfyi.offer.controller;

import com.interntoolsfyi.offer.dto.CommentRequest;
import com.interntoolsfyi.offer.dto.CommentResponse;
import com.interntoolsfyi.offer.dto.VoteRequest;
import com.interntoolsfyi.offer.dto.VoteTallyResponse;
import com.interntoolsfyi.offer.service.CommentAndVoteService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
public class CommentAndVoteController {

  private final CommentAndVoteService commentAndVoteService;

  public CommentAndVoteController(CommentAndVoteService commentAndVoteService) {
    this.commentAndVoteService = commentAndVoteService;
  }

  @GetMapping("/posts/{postId}/comments")
  public List<CommentResponse> listComments(@PathVariable Long postId) {
    return commentAndVoteService.listComments(postId);
  }

  @PostMapping(value = "/posts/{postId}/comments", consumes = "application/json")
  @ResponseStatus(HttpStatus.CREATED)
  public CommentResponse createComment(
      Authentication auth,
      @PathVariable Long postId,
      @Valid @RequestBody CommentRequest request) {
    return commentAndVoteService.createComment(auth, postId, request);
  }

  @PatchMapping(value = "/comments/{id}", consumes = "application/json")
  public CommentResponse updateComment(
      Authentication auth,
      @PathVariable Long id,
      @Valid @RequestBody CommentRequest request) {
    return commentAndVoteService.updateComment(auth, id, request);
  }

  @DeleteMapping("/comments/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteComment(Authentication auth, @PathVariable Long id) {
    commentAndVoteService.deleteComment(auth, id);
  }

  @GetMapping("/posts/{postId}/votes")
  public VoteTallyResponse getVoteTally(@PathVariable Long postId) {
    return commentAndVoteService.getVoteTally(postId);
  }

  @PutMapping(value = "/posts/{postId}/vote", consumes = "application/json")
  public VoteTallyResponse upsertVote(
      Authentication auth,
      @PathVariable Long postId,
      @RequestBody VoteRequest request) {
    return commentAndVoteService.upsertVote(auth, postId, request);
  }

  @DeleteMapping("/posts/{postId}/vote")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteVote(Authentication auth, @PathVariable Long postId) {
    commentAndVoteService.deleteVote(auth, postId);
  }
}
