package com.interntoolsfyi.offer.controller;

import com.interntoolsfyi.offer.dto.PostSummaryResponse;
import com.interntoolsfyi.offer.service.BookmarkService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
public class BookmarkController {

  private final BookmarkService bookmarkService;

  public BookmarkController(BookmarkService bookmarkService) {
    this.bookmarkService = bookmarkService;
  }

  @PostMapping("/posts/{postId}/bookmark")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void bookmark(Authentication auth, @PathVariable Long postId) {
    bookmarkService.bookmark(auth, postId);
  }

  @DeleteMapping("/posts/{postId}/bookmark")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void unbookmark(Authentication auth, @PathVariable Long postId) {
    bookmarkService.unbookmark(auth, postId);
  }

  @GetMapping("/posts/bookmarks")
  public List<PostSummaryResponse> listBookmarks(Authentication auth) {
    return bookmarkService.listBookmarks(auth);
  }
}
