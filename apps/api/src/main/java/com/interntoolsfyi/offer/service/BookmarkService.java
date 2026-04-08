package com.interntoolsfyi.offer.service;

import com.interntoolsfyi.offer.dto.PostSummaryResponse;
import com.interntoolsfyi.offer.model.Post;
import com.interntoolsfyi.offer.model.PostStatus;
import com.interntoolsfyi.offer.model.SavedPost;
import com.interntoolsfyi.offer.repository.PostRepository;
import com.interntoolsfyi.offer.repository.SavedPostRepository;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BookmarkService {

  private final PostRepository postRepository;
  private final SavedPostRepository savedPostRepository;
  private final UserRepository userRepository;

  public BookmarkService(
      PostRepository postRepository,
      SavedPostRepository savedPostRepository,
      UserRepository userRepository) {
    this.postRepository = postRepository;
    this.savedPostRepository = savedPostRepository;
    this.userRepository = userRepository;
  }

  @Transactional
  public void bookmark(Authentication auth, Long postId) {
    User user = requireUser(auth);
    Post post = requirePublishedPost(postId);
    if (!savedPostRepository.existsByPostAndUser(post, user)) {
      SavedPost sp = new SavedPost();
      sp.setPost(post);
      sp.setUser(user);
      savedPostRepository.save(sp);
    }
  }

  @Transactional
  public void unbookmark(Authentication auth, Long postId) {
    User user = requireUser(auth);
    Post post = requirePublishedPost(postId);
    savedPostRepository.findByPostAndUser(post, user)
        .ifPresent(savedPostRepository::delete);
  }

  @Transactional(readOnly = true)
  public boolean isBookmarked(Authentication auth, Long postId) {
    if (auth == null || !auth.isAuthenticated()) return false;
    User user = userRepository.findByUsername(auth.getName()).orElse(null);
    if (user == null) return false;
    Post post = postRepository.findById(postId).orElse(null);
    if (post == null) return false;
    return savedPostRepository.existsByPostAndUser(post, user);
  }

  @Transactional(readOnly = true)
  public List<PostSummaryResponse> listBookmarks(Authentication auth) {
    User user = requireUser(auth);
    return savedPostRepository.findByUserOrderByCreatedAtDesc(user).stream()
        .map(sp -> toSummary(sp.getPost()))
        .toList();
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
        p.getCreatedAt(),
        true); // always bookmarked in this context
  }

  private Post requirePublishedPost(Long postId) {
    Post post = postRepository.findById(postId)
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
    return userRepository.findByUsername(auth.getName())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
  }
}
