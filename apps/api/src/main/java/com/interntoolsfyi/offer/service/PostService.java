package com.interntoolsfyi.offer.service;

import com.interntoolsfyi.offer.dto.PostDetailResponse;
import com.interntoolsfyi.offer.dto.PostRequest;
import com.interntoolsfyi.offer.dto.PostSummaryResponse;
import com.interntoolsfyi.offer.model.Post;
import com.interntoolsfyi.offer.model.PostStatus;
import com.interntoolsfyi.offer.model.PostVisibility;
import com.interntoolsfyi.offer.repository.PostRepository;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PostService {

  private final PostRepository postRepository;
  private final UserRepository userRepository;

  public PostService(PostRepository postRepository, UserRepository userRepository) {
    this.postRepository = postRepository;
    this.userRepository = userRepository;
  }

  @Transactional(readOnly = true)
  public Page<PostSummaryResponse> listPublishedPosts(Pageable pageable) {
    return postRepository
        .findByStatusOrderByPublishedAtDesc(PostStatus.published, pageable)
        .map(this::toSummary);
  }

  @Transactional(readOnly = true)
  public List<PostSummaryResponse> listMyPosts(Authentication auth) {
    User user = requireUser(auth);
    return postRepository.findByAuthorOrderByCreatedAtDesc(user).stream()
        .map(this::toSummary)
        .toList();
  }

  @Transactional(readOnly = true)
  public PostDetailResponse getPost(Authentication auth, Long id) {
    Post post =
        postRepository
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));

    if (post.getVisibility() != PostVisibility.public_post
        || post.getStatus() != PostStatus.published) {
      User user = requireUser(auth);
      if (!post.getAuthor().getId().equals(user.getId())) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found");
      }
    }

    return toDetail(post);
  }

  @Transactional
  public PostDetailResponse createPost(Authentication auth, PostRequest request) {
    User user = requireUser(auth);
    Post post = new Post();
    post.setAuthor(user);
    applyRequest(post, request);
    if (post.getStatus() == PostStatus.published && post.getPublishedAt() == null) {
      post.setPublishedAt(Instant.now());
    }
    return toDetail(postRepository.save(post));
  }

  @Transactional
  public PostDetailResponse updatePost(Authentication auth, Long id, PostRequest request) {
    User user = requireUser(auth);
    Post post = requireAuthor(id, user);
    applyRequest(post, request);
    if (post.getStatus() == PostStatus.published && post.getPublishedAt() == null) {
      post.setPublishedAt(Instant.now());
    }
    return toDetail(postRepository.save(post));
  }

  @Transactional
  public void deletePost(Authentication auth, Long id) {
    User user = requireUser(auth);
    Post post = requireAuthor(id, user);
    post.setStatus(PostStatus.hidden);
    postRepository.save(post);
  }

  private void applyRequest(Post post, PostRequest req) {
    post.setType(req.type());
    post.setTitle(req.title());
    post.setBody(req.body());
    post.setVisibility(req.visibility() != null ? req.visibility() : PostVisibility.public_post);
    post.setStatus(req.status());
    post.setOfferSnapshots(req.offerSnapshots());
    post.setSourceOfferIds(req.sourceOfferIds());
  }

  private Post requireAuthor(Long id, User user) {
    return postRepository
        .findByIdAndAuthor(id, user)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
  }

  private User requireUser(Authentication auth) {
    if (auth == null || !auth.isAuthenticated()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }
    return userRepository
        .findByUsername(auth.getName())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
  }

  private PostSummaryResponse toSummary(Post p) {
    return new PostSummaryResponse(
        p.getId(),
        p.getType(),
        p.getTitle(),
        p.getVisibility(),
        p.getStatus(),
        p.getAuthor().getUsername(),
        p.getPublishedAt(),
        p.getCreatedAt());
  }

  private PostDetailResponse toDetail(Post p) {
    return new PostDetailResponse(
        p.getId(),
        p.getType(),
        p.getTitle(),
        p.getBody(),
        p.getVisibility(),
        p.getStatus(),
        p.getAuthor().getUsername(),
        p.getOfferSnapshots(),
        p.getSourceOfferIds(),
        p.getPublishedAt(),
        p.getCreatedAt(),
        p.getUpdatedAt());
  }
}
