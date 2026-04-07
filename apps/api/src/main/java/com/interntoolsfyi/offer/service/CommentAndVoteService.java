package com.interntoolsfyi.offer.service;

import com.interntoolsfyi.offer.dto.CommentRequest;
import com.interntoolsfyi.offer.dto.CommentResponse;
import com.interntoolsfyi.offer.dto.VoteRequest;
import com.interntoolsfyi.offer.dto.VoteTallyResponse;
import com.interntoolsfyi.offer.model.Comment;
import com.interntoolsfyi.offer.model.CommunityPreferenceVote;
import com.interntoolsfyi.offer.model.Post;
import com.interntoolsfyi.offer.model.PostStatus;
import com.interntoolsfyi.offer.repository.CommentRepository;
import com.interntoolsfyi.offer.repository.CommunityPreferenceVoteRepository;
import com.interntoolsfyi.offer.repository.PostRepository;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CommentAndVoteService {

  private final PostRepository postRepository;
  private final CommentRepository commentRepository;
  private final CommunityPreferenceVoteRepository voteRepository;
  private final UserRepository userRepository;

  public CommentAndVoteService(
      PostRepository postRepository,
      CommentRepository commentRepository,
      CommunityPreferenceVoteRepository voteRepository,
      UserRepository userRepository) {
    this.postRepository = postRepository;
    this.commentRepository = commentRepository;
    this.voteRepository = voteRepository;
    this.userRepository = userRepository;
  }

  @Transactional(readOnly = true)
  public List<CommentResponse> listComments(Long postId) {
    Post post = requirePublishedPost(postId);
    return commentRepository.findByPostAndDeletedFalseOrderByCreatedAtAsc(post).stream()
        .map(this::toCommentResponse)
        .toList();
  }

  @Transactional
  public CommentResponse createComment(Authentication auth, Long postId, CommentRequest request) {
    User user = requireUser(auth);
    Post post = requirePublishedPost(postId);
    Comment comment = new Comment();
    comment.setPost(post);
    comment.setUser(user);
    comment.setBody(request.body());
    return toCommentResponse(commentRepository.save(comment));
  }

  @Transactional
  public CommentResponse updateComment(
      Authentication auth, Long commentId, CommentRequest request) {
    User user = requireUser(auth);
    Comment comment =
        commentRepository
            .findByIdAndUser(commentId, user)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
    comment.setBody(request.body());
    comment.setEditedAt(Instant.now());
    return toCommentResponse(commentRepository.save(comment));
  }

  @Transactional
  public void deleteComment(Authentication auth, Long commentId) {
    User user = requireUser(auth);
    Comment comment =
        commentRepository
            .findByIdAndUser(commentId, user)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
    comment.setDeleted(true);
    commentRepository.save(comment);
  }

  @Transactional(readOnly = true)
  public VoteTallyResponse getVoteTally(Long postId) {
    Post post = requirePublishedPost(postId);
    List<CommunityPreferenceVote> votes = voteRepository.findByPost(post);
    Map<String, Long> tally =
        votes.stream()
            .collect(
                Collectors.groupingBy(
                    v ->
                        v.getSelectedOfferSnapshotId() != null
                            ? v.getSelectedOfferSnapshotId()
                            : String.valueOf(v.getSelectedOfferIndex()),
                    Collectors.counting()));
    return new VoteTallyResponse(postId, votes.size(), tally);
  }

  @Transactional
  public VoteTallyResponse upsertVote(Authentication auth, Long postId, VoteRequest request) {
    User user = requireUser(auth);
    Post post = requirePublishedPost(postId);

    if (request.selectedOfferSnapshotId() == null && request.selectedOfferIndex() == null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Either selectedOfferSnapshotId or selectedOfferIndex is required");
    }

    CommunityPreferenceVote vote =
        voteRepository.findByPostAndUser(post, user).orElseGet(CommunityPreferenceVote::new);
    vote.setPost(post);
    vote.setUser(user);
    vote.setSelectedOfferSnapshotId(request.selectedOfferSnapshotId());
    vote.setSelectedOfferIndex(request.selectedOfferIndex());
    voteRepository.save(vote);
    return getVoteTally(postId);
  }

  @Transactional
  public void deleteVote(Authentication auth, Long postId) {
    User user = requireUser(auth);
    Post post = requirePublishedPost(postId);
    voteRepository.findByPostAndUser(post, user).ifPresent(voteRepository::delete);
  }

  private Post requirePublishedPost(Long postId) {
    Post post =
        postRepository
            .findById(postId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
    if (post.getStatus() != PostStatus.published) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found");
    }
    return post;
  }

  private User requireUser(Authentication auth) {
    if (auth == null || !auth.isAuthenticated()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }
    return userRepository
        .findByUsername(auth.getName())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
  }

  private CommentResponse toCommentResponse(Comment c) {
    return new CommentResponse(
        c.getId(),
        c.getPost().getId(),
        c.getUser().getUsername(),
        c.getBody(),
        c.getEditedAt(),
        c.getCreatedAt());
  }
}
