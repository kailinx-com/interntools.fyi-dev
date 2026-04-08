package com.interntoolsfyi.offer.controller;

import com.interntoolsfyi.offer.dto.PostDetailResponse;
import com.interntoolsfyi.offer.dto.PostRequest;
import com.interntoolsfyi.offer.dto.PostSummaryResponse;
import com.interntoolsfyi.offer.service.PostService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/posts")
public class PostController {

  private final PostService postService;

  public PostController(PostService postService) {
    this.postService = postService;
  }

  @GetMapping
  public Page<PostSummaryResponse> listPosts(
      Authentication auth,
      @PageableDefault(size = 20) Pageable pageable) {
    return postService.listPublishedPosts(auth, pageable);
  }

  @GetMapping("/me")
  public List<PostSummaryResponse> listMyPosts(Authentication auth) {
    return postService.listMyPosts(auth);
  }

  @GetMapping("/{id}")
  public PostDetailResponse getPost(Authentication auth, @PathVariable Long id) {
    return postService.getPost(auth, id);
  }

  @PostMapping(consumes = "application/json")
  @ResponseStatus(HttpStatus.CREATED)
  public PostDetailResponse createPost(
      Authentication auth, @Valid @RequestBody PostRequest request) {
    return postService.createPost(auth, request);
  }

  @PatchMapping(value = "/{id}", consumes = "application/json")
  public PostDetailResponse updatePost(
      Authentication auth, @PathVariable Long id, @Valid @RequestBody PostRequest request) {
    return postService.updatePost(auth, id, request);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deletePost(Authentication auth, @PathVariable Long id) {
    postService.deletePost(auth, id);
  }
}
