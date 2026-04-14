package com.interntoolsfyi.offer.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.interntoolsfyi.offer.dto.PostSummaryResponse;
import com.interntoolsfyi.offer.model.Post;
import com.interntoolsfyi.offer.model.PostStatus;
import com.interntoolsfyi.offer.model.PostType;
import com.interntoolsfyi.offer.model.PostVisibility;
import com.interntoolsfyi.offer.model.SavedPost;
import com.interntoolsfyi.offer.repository.PostRepository;
import com.interntoolsfyi.offer.repository.SavedPostRepository;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
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
class BookmarkServiceTest {
  @Mock private PostRepository postRepository;
  @Mock private SavedPostRepository savedPostRepository;
  @Mock private UserRepository userRepository;

  @InjectMocks private BookmarkService bookmarkService;

  @Test
  @DisplayName("unbookmark returns unauthorized when authentication is null")
  void unbookmarkUnauthorizedWhenNull() {
    assertThatThrownBy(() -> bookmarkService.unbookmark(null, 10L))
        .isInstanceOfSatisfying(
            ResponseStatusException.class,
            ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
  }

  @Test
  @DisplayName("bookmark returns unauthorized when authentication is null")
  void bookmarkUnauthorizedWhenNull() {
    assertThatThrownBy(() -> bookmarkService.bookmark(null, 10L))
        .isInstanceOfSatisfying(
            ResponseStatusException.class,
            ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
  }

  @Test
  @DisplayName("bookmark creates saved-post for authenticated user")
  void bookmarkCreatesSavedPostForAuthenticatedUser() {
    User user = createUser("alice", 1L);
    Post post = createPublishedPost(user, 10L);
    Authentication auth = auth("alice");
    when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
    when(postRepository.findById(10L)).thenReturn(Optional.of(post));
    when(savedPostRepository.existsByPostAndUser(post, user)).thenReturn(false);

    bookmarkService.bookmark(auth, 10L);

    verify(savedPostRepository).save(any(SavedPost.class));
  }

  @Test
  @DisplayName("bookmark is idempotent when already bookmarked")
  void bookmarkIsIdempotentWhenAlreadyBookmarked() {
    User user = createUser("alice", 1L);
    Post post = createPublishedPost(user, 10L);
    Authentication auth = auth("alice");
    when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
    when(postRepository.findById(10L)).thenReturn(Optional.of(post));
    when(savedPostRepository.existsByPostAndUser(post, user)).thenReturn(true);

    bookmarkService.bookmark(auth, 10L);

    verify(savedPostRepository, never()).save(any(SavedPost.class));
  }

  @Test
  @DisplayName("unbookmark deletes existing saved-post")
  void unbookmarkDeletesExistingSavedPost() {
    User user = createUser("alice", 1L);
    Post post = createPublishedPost(user, 10L);
    SavedPost saved = new SavedPost();
    Authentication auth = auth("alice");
    when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
    when(postRepository.findById(10L)).thenReturn(Optional.of(post));
    when(savedPostRepository.findByPostAndUser(post, user)).thenReturn(Optional.of(saved));

    bookmarkService.unbookmark(auth, 10L);

    verify(savedPostRepository).delete(saved);
  }

  @Test
  @DisplayName("listBookmarks returns empty list when user has no bookmarks")
  void listBookmarksReturnsEmptyWhenNone() {
    User current = createUser("alice", 1L);
    Authentication auth = auth("alice");
    when(userRepository.findByUsername("alice")).thenReturn(Optional.of(current));
    when(savedPostRepository.findByUserOrderByCreatedAtDesc(current)).thenReturn(List.of());

    assertThat(bookmarkService.listBookmarks(auth)).isEmpty();
  }

  @Test
  @DisplayName("listBookmarks omits rows when the post is no longer published (e.g. soft-deleted)")
  void listBookmarksOmitsNonPublishedPosts() {
    User author = createUser("author", 2L);
    User current = createUser("alice", 1L);
    Post hiddenPost = createPublishedPost(author, 10L);
    hiddenPost.setStatus(PostStatus.hidden);
    SavedPost saved = new SavedPost();
    saved.setPost(hiddenPost);
    saved.setUser(current);
    Authentication auth = auth("alice");
    when(userRepository.findByUsername("alice")).thenReturn(Optional.of(current));
    when(savedPostRepository.findByUserOrderByCreatedAtDesc(current)).thenReturn(List.of(saved));

    assertThat(bookmarkService.listBookmarks(auth)).isEmpty();
  }

  @Test
  @DisplayName("listBookmarks returns bookmarked summaries")
  void listBookmarksReturnsBookmarkedSummaries() {
    User author = createUser("author", 2L);
    User current = createUser("alice", 1L);
    Post post = createPublishedPost(author, 10L);
    SavedPost saved = new SavedPost();
    saved.setPost(post);
    saved.setUser(current);
    Authentication auth = auth("alice");
    when(userRepository.findByUsername("alice")).thenReturn(Optional.of(current));
    when(savedPostRepository.findByUserOrderByCreatedAtDesc(current)).thenReturn(List.of(saved));

    List<PostSummaryResponse> result = bookmarkService.listBookmarks(auth);

    assertThat(result).hasSize(1);
    assertThat(result.get(0).bookmarked()).isTrue();
    assertThat(result.get(0).id()).isEqualTo(10L);
  }

  @Test
  @DisplayName("returns unauthorized when auth is missing")
  void returnsUnauthorizedWhenAuthMissing() {
    assertThatThrownBy(() -> bookmarkService.listBookmarks(null))
        .isInstanceOfSatisfying(
            ResponseStatusException.class,
            ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
  }

  @Test
  @DisplayName("bookmark returns unauthorized when user record is missing")
  void bookmarkUnauthorizedWhenUserMissing() {
    Authentication auth = auth("ghost");
    when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

    assertThatThrownBy(() -> bookmarkService.bookmark(auth, 10L))
        .isInstanceOfSatisfying(
            ResponseStatusException.class,
            ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
  }

  @Test
  @DisplayName("unbookmark returns unauthorized when user record is missing")
  void unbookmarkUnauthorizedWhenUserMissing() {
    Authentication auth = auth("ghost");
    when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

    assertThatThrownBy(() -> bookmarkService.unbookmark(auth, 10L))
        .isInstanceOfSatisfying(
            ResponseStatusException.class,
            ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
  }

  @Test
  @DisplayName("returns false for isBookmarked when auth is missing")
  void isBookmarkedReturnsFalseWithoutAuth() {
    assertThat(bookmarkService.isBookmarked(null, 10L)).isFalse();
  }

  @Test
  @DisplayName("returns false for isBookmarked when auth is present but not authenticated")
  void isBookmarkedReturnsFalseWhenNotAuthenticated() {
    Authentication auth = org.mockito.Mockito.mock(Authentication.class);
    when(auth.isAuthenticated()).thenReturn(false);
    assertThat(bookmarkService.isBookmarked(auth, 10L)).isFalse();
  }

  @Test
  @DisplayName("returns false for isBookmarked when user does not exist")
  void isBookmarkedReturnsFalseWhenUserMissing() {
    Authentication auth = auth("ghost");
    when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

    assertThat(bookmarkService.isBookmarked(auth, 10L)).isFalse();
  }

  @Test
  @DisplayName("returns false for isBookmarked when post does not exist")
  void isBookmarkedReturnsFalseWhenPostMissing() {
    User user = createUser("alice", 1L);
    Authentication auth = auth("alice");
    when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
    when(postRepository.findById(404L)).thenReturn(Optional.empty());

    assertThat(bookmarkService.isBookmarked(auth, 404L)).isFalse();
  }

  @Test
  @DisplayName("returns true for isBookmarked when saved post exists")
  void isBookmarkedReturnsTrueWhenSavedPostExists() {
    User user = createUser("alice", 1L);
    Post post = createPublishedPost(user, 10L);
    Authentication auth = auth("alice");
    when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
    when(postRepository.findById(10L)).thenReturn(Optional.of(post));
    when(savedPostRepository.existsByPostAndUser(post, user)).thenReturn(true);

    assertThat(bookmarkService.isBookmarked(auth, 10L)).isTrue();
  }

  @Test
  @DisplayName("bookmark returns unauthorized when authentication is present but not authenticated")
  void bookmarkReturnsUnauthorizedWhenAuthenticationNotAuthenticated() {
    Authentication auth = org.mockito.Mockito.mock(Authentication.class);
    when(auth.isAuthenticated()).thenReturn(false);

    assertThatThrownBy(() -> bookmarkService.bookmark(auth, 10L))
        .isInstanceOfSatisfying(
            ResponseStatusException.class,
            ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
  }

  @Test
  @DisplayName("bookmark returns not found when post id does not exist")
  void bookmarkReturnsNotFoundWhenPostMissing() {
    User user = createUser("alice", 1L);
    Authentication auth = auth("alice");
    when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
    when(postRepository.findById(404L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> bookmarkService.bookmark(auth, 404L))
        .isInstanceOfSatisfying(
            ResponseStatusException.class,
            ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
  }

  @Test
  @DisplayName("bookmark returns not found when post is unpublished")
  void bookmarkReturnsNotFoundWhenPostUnpublished() {
    User user = createUser("alice", 1L);
    Post draft = createDraftPost(user, 11L);
    Authentication auth = auth("alice");
    when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
    when(postRepository.findById(11L)).thenReturn(Optional.of(draft));

    assertThatThrownBy(() -> bookmarkService.bookmark(auth, 11L))
        .isInstanceOfSatisfying(
            ResponseStatusException.class,
            ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
  }

  private static Authentication auth(String username) {
    Authentication auth = org.mockito.Mockito.mock(Authentication.class);
    when(auth.isAuthenticated()).thenReturn(true);
    when(auth.getName()).thenReturn(username);
    return auth;
  }

  private static User createUser(String username, Long id) {
    User user = new User(username, username + "@example.com", "hashed", Role.STUDENT, "Test", "User");
    ReflectionTestUtils.setField(user, "id", id);
    return user;
  }

  private static Post createPublishedPost(User author, Long id) {
    Post post = new Post();
    post.setAuthor(author);
    post.setType(PostType.acceptance);
    post.setTitle("Post " + id);
    post.setVisibility(PostVisibility.public_post);
    post.setStatus(PostStatus.published);
    ReflectionTestUtils.setField(post, "id", id);
    return post;
  }

  private static Post createDraftPost(User author, Long id) {
    Post post = new Post();
    post.setAuthor(author);
    post.setType(PostType.acceptance);
    post.setTitle("Draft " + id);
    post.setVisibility(PostVisibility.public_post);
    post.setStatus(PostStatus.draft);
    ReflectionTestUtils.setField(post, "id", id);
    return post;
  }
}
