package com.interntoolsfyi.offer.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.interntoolsfyi.offer.dto.PostDetailResponse;
import com.interntoolsfyi.offer.dto.PostRequest;
import com.interntoolsfyi.offer.dto.PostSummaryResponse;
import com.interntoolsfyi.offer.model.Post;
import com.interntoolsfyi.offer.model.PostStatus;
import com.interntoolsfyi.offer.model.PostType;
import com.interntoolsfyi.offer.model.PostVisibility;
import com.interntoolsfyi.offer.repository.PostRepository;
import com.interntoolsfyi.offer.repository.SavedPostRepository;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class PostServiceTest {

  @Mock private PostRepository postRepository;
  @Mock private SavedPostRepository savedPostRepository;
  @Mock private UserRepository userRepository;

  @InjectMocks private PostService postService;

  @Nested
  @DisplayName("listPublishedPosts")
  class ListPublishedPostsTests {

    @Test
    @DisplayName("returns a page of published post summaries without requiring authentication")
    void returnsAPageOfPublishedPostSummariesWithoutRequiringAuthentication() {
      User author = createUser("author", 1L);
      Post post =
          createPost(
              author, 10L, "Great offer", PostType.acceptance, PostStatus.published,
              PostVisibility.public_post);
      Pageable pageable = PageRequest.of(0, 20);
      Page<Post> page = new PageImpl<>(List.of(post), pageable, 1);

      when(postRepository.findByStatusOrderByPublishedAtDesc(PostStatus.published, pageable))
          .thenReturn(page);

      Page<PostSummaryResponse> result = postService.listPublishedPosts(null, pageable);

      assertThat(result.getContent()).hasSize(1);
      assertThat(result.getContent().get(0).id()).isEqualTo(10L);
      assertThat(result.getContent().get(0).title()).isEqualTo("Great offer");
      assertThat(result.getContent().get(0).status()).isEqualTo(PostStatus.published);
      assertThat(result.getContent().get(0).authorUsername()).isEqualTo("author");
    }

    @Test
    @DisplayName("returns an empty page when no published posts exist")
    void returnsAnEmptyPageWhenNoPublishedPostsExist() {
      Pageable pageable = PageRequest.of(0, 20);
      Page<Post> emptyPage = new PageImpl<>(List.of(), pageable, 0);

      when(postRepository.findByStatusOrderByPublishedAtDesc(PostStatus.published, pageable))
          .thenReturn(emptyPage);

      assertThat(postService.listPublishedPosts(null, pageable).getContent()).isEmpty();
    }

    @Test
    @DisplayName("treats bookmark as false when principal is missing from user repository")
    void bookmarkFalseWhenPrincipalMissingFromRepository() {
      User author = createUser("author", 1L);
      Authentication auth = authenticatedUser("ghost");
      Post post =
          createPost(
              author, 11L, "X", PostType.acceptance, PostStatus.published,
              PostVisibility.public_post);
      Pageable pageable = PageRequest.of(0, 20);
      Page<Post> page = new PageImpl<>(List.of(post), pageable, 1);

      when(postRepository.findByStatusOrderByPublishedAtDesc(PostStatus.published, pageable))
          .thenReturn(page);
      when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

      Page<PostSummaryResponse> result = postService.listPublishedPosts(auth, pageable);

      assertThat(result.getContent().get(0).bookmarked()).isFalse();
    }

    @Test
    @DisplayName("marks post as not bookmarked when user exists but has not saved the post")
    void marksPostAsNotBookmarkedWhenUserExistsWithoutSavedPost() {
      User author = createUser("author", 1L);
      User viewer = createUser("viewer", 2L);
      Authentication auth = authenticatedUser(viewer.getUsername());
      Post post =
          createPost(
              author, 12L, "Not saved", PostType.acceptance, PostStatus.published,
              PostVisibility.public_post);
      Pageable pageable = PageRequest.of(0, 20);
      Page<Post> page = new PageImpl<>(List.of(post), pageable, 1);

      when(postRepository.findByStatusOrderByPublishedAtDesc(PostStatus.published, pageable))
          .thenReturn(page);
      when(userRepository.findByUsername(viewer.getUsername())).thenReturn(Optional.of(viewer));
      when(savedPostRepository.existsByPostAndUser(post, viewer)).thenReturn(false);

      Page<PostSummaryResponse> result = postService.listPublishedPosts(auth, pageable);

      assertThat(result.getContent().get(0).bookmarked()).isFalse();
    }

    @Test
    @DisplayName("marks post as bookmarked for authenticated user with saved post")
    void marksPostAsBookmarkedForAuthenticatedUser() {
      User author = createUser("author", 1L);
      User viewer = createUser("viewer", 2L);
      Authentication auth = authenticatedUser(viewer.getUsername());
      Post post =
          createPost(
              author, 11L, "Bookmarked", PostType.acceptance, PostStatus.published,
              PostVisibility.public_post);
      Pageable pageable = PageRequest.of(0, 20);
      Page<Post> page = new PageImpl<>(List.of(post), pageable, 1);

      when(postRepository.findByStatusOrderByPublishedAtDesc(PostStatus.published, pageable))
          .thenReturn(page);
      when(userRepository.findByUsername(viewer.getUsername())).thenReturn(Optional.of(viewer));
      when(savedPostRepository.existsByPostAndUser(post, viewer)).thenReturn(true);

      Page<PostSummaryResponse> result = postService.listPublishedPosts(auth, pageable);

      assertThat(result.getContent()).hasSize(1);
      assertThat(result.getContent().get(0).bookmarked()).isTrue();
    }
  }

  @Nested
  @DisplayName("listMyPosts")
  class ListMyPostsTests {

    @Test
    @DisplayName("returns empty list when the user has no posts")
    void returnsEmptyWhenUserHasNoPosts() {
      User user = createUser("author", 1L);
      Authentication auth = authenticatedUser(user.getUsername());
      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(postRepository.findByAuthorOrderByCreatedAtDesc(user)).thenReturn(List.of());

      assertThat(postService.listMyPosts(auth)).isEmpty();
    }

    @Test
    @DisplayName("returns all statuses of posts belonging to the authenticated user")
    void returnsAllStatusesOfPostsBelongingToTheAuthenticatedUser() {
      User user = createUser("author", 1L);
      Authentication auth = authenticatedUser(user.getUsername());
      Post published =
          createPost(
              user, 1L, "Published", PostType.acceptance, PostStatus.published,
              PostVisibility.public_post);
      Post draft =
          createPost(
              user, 2L, "Draft", PostType.comparison, PostStatus.draft, PostVisibility.private_post);

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(postRepository.findByAuthorOrderByCreatedAtDesc(user))
          .thenReturn(List.of(published, draft));

      List<PostSummaryResponse> result = postService.listMyPosts(auth);

      assertThat(result).hasSize(2);
      assertThat(result.get(0).title()).isEqualTo("Published");
      assertThat(result.get(1).title()).isEqualTo("Draft");
    }

    @Test
    @DisplayName("returns unauthorized when no authentication is provided")
    void returnsUnauthorizedWhenNoAuthenticationIsProvided() {
      assertThatThrownBy(() -> postService.listMyPosts(null))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    @DisplayName("returns unauthorized when authenticated principal is missing from repository")
    void returnsUnauthorizedWhenAuthenticatedPrincipalIsMissingFromRepository() {
      Authentication auth = authenticatedUser("ghost-user");
      when(userRepository.findByUsername("ghost-user")).thenReturn(Optional.empty());

      assertThatThrownBy(() -> postService.listMyPosts(auth))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }
  }

  @Nested
  @DisplayName("getPost")
  class GetPostTests {

    @Test
    @DisplayName("returns detail for a public published post when authentication is not authenticated")
    void returnsDetailWhenAuthenticationNotAuthenticated() {
      User author = createUser("author", 1L);
      Post post =
          createPost(
              author, 10L, "Public post", PostType.acceptance, PostStatus.published,
              PostVisibility.public_post);
      Authentication auth = org.mockito.Mockito.mock(Authentication.class);
      when(auth.isAuthenticated()).thenReturn(false);

      when(postRepository.findById(10L)).thenReturn(Optional.of(post));

      PostDetailResponse response = postService.getPost(auth, 10L);

      assertThat(response.bookmarked()).isFalse();
    }

    @Test
    @DisplayName("returns detail for a public published post when principal is missing from user repository")
    void returnsDetailWhenAuthenticatedButUserRecordMissing() {
      User author = createUser("author", 1L);
      Post post =
          createPost(
              author, 10L, "Public post", PostType.acceptance, PostStatus.published,
              PostVisibility.public_post);
      Authentication auth = authenticatedUser("ghost");

      when(postRepository.findById(10L)).thenReturn(Optional.of(post));
      when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

      PostDetailResponse response = postService.getPost(auth, 10L);

      assertThat(response.bookmarked()).isFalse();
    }

    @Test
    @DisplayName("marks bookmarked when viewer has saved the public published post")
    void marksBookmarkedOnPublicPostForViewer() {
      User author = createUser("author", 1L);
      User viewer = createUser("viewer", 2L);
      Authentication auth = authenticatedUser(viewer.getUsername());
      Post post =
          createPost(
              author, 15L, "Bookmarked detail", PostType.acceptance, PostStatus.published,
              PostVisibility.public_post);

      when(postRepository.findById(15L)).thenReturn(Optional.of(post));
      when(userRepository.findByUsername(viewer.getUsername())).thenReturn(Optional.of(viewer));
      when(savedPostRepository.existsByPostAndUser(post, viewer)).thenReturn(true);

      PostDetailResponse response = postService.getPost(auth, 15L);

      assertThat(response.bookmarked()).isTrue();
    }

    @Test
    @DisplayName("returns detail for a public published post without authentication")
    void returnsDetailForAPublicPublishedPostWithoutAuthentication() {
      User author = createUser("author", 1L);
      Post post =
          createPost(
              author, 10L, "Public post", PostType.acceptance, PostStatus.published,
              PostVisibility.public_post);

      when(postRepository.findById(10L)).thenReturn(Optional.of(post));

      PostDetailResponse response = postService.getPost(null, 10L);

      assertThat(response.id()).isEqualTo(10L);
      assertThat(response.title()).isEqualTo("Public post");
      assertThat(response.authorUsername()).isEqualTo("author");
    }

    @Test
    @DisplayName("returns detail for a non-public post when requested by the author")
    void returnsDetailForANonPublicPostWhenRequestedByTheAuthor() {
      User author = createUser("author", 1L);
      Authentication auth = authenticatedUser(author.getUsername());
      Post post =
          createPost(
              author, 20L, "Private post", PostType.comparison, PostStatus.draft,
              PostVisibility.private_post);

      when(postRepository.findById(20L)).thenReturn(Optional.of(post));
      when(userRepository.findByUsername(author.getUsername())).thenReturn(Optional.of(author));
      when(savedPostRepository.existsByPostAndUser(any(Post.class), eq(author))).thenReturn(false);

      PostDetailResponse response = postService.getPost(auth, 20L);

      assertThat(response.id()).isEqualTo(20L);
      assertThat(response.title()).isEqualTo("Private post");
    }

    @Test
    @DisplayName("returns detail for a private published post when requested by the author")
    void returnsDetailForPrivatePublishedPostWhenAuthor() {
      User author = createUser("author", 1L);
      Authentication auth = authenticatedUser(author.getUsername());
      Post post =
          createPost(
              author, 21L, "Private published", PostType.acceptance, PostStatus.published,
              PostVisibility.private_post);
      post.setPublishedAt(Instant.parse("2026-02-01T00:00:00Z"));

      when(postRepository.findById(21L)).thenReturn(Optional.of(post));
      when(userRepository.findByUsername(author.getUsername())).thenReturn(Optional.of(author));
      when(savedPostRepository.existsByPostAndUser(any(Post.class), eq(author))).thenReturn(false);

      PostDetailResponse response = postService.getPost(auth, 21L);

      assertThat(response.id()).isEqualTo(21L);
      assertThat(response.status()).isEqualTo(PostStatus.published);
    }

    @Test
    @DisplayName("returns not found for a private published post when requested by a non-author")
    void returnsNotFoundForPrivatePublishedPostWhenNotAuthor() {
      User author = createUser("author", 1L);
      User other = createUser("other", 2L);
      Authentication auth = authenticatedUser(other.getUsername());
      Post post =
          createPost(
              author, 31L, "Private published", PostType.acceptance, PostStatus.published,
              PostVisibility.private_post);
      post.setPublishedAt(Instant.parse("2026-02-01T00:00:00Z"));

      when(postRepository.findById(31L)).thenReturn(Optional.of(post));
      when(userRepository.findByUsername(other.getUsername())).thenReturn(Optional.of(other));

      assertThatThrownBy(() -> postService.getPost(auth, 31L))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    @DisplayName("returns not found for a non-public post when requested by a non-author")
    void returnsNotFoundForANonPublicPostWhenRequestedByANonAuthor() {
      User author = createUser("author", 1L);
      User other = createUser("other", 2L);
      Authentication auth = authenticatedUser(other.getUsername());
      Post post =
          createPost(
              author, 30L, "Private post", PostType.acceptance, PostStatus.draft,
              PostVisibility.private_post);

      when(postRepository.findById(30L)).thenReturn(Optional.of(post));
      when(userRepository.findByUsername(other.getUsername())).thenReturn(Optional.of(other));

      assertThatThrownBy(() -> postService.getPost(auth, 30L))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    @DisplayName("returns detail when the author views their own public draft post")
    void authorCanViewOwnPublicDraftPost() {
      User author = createUser("author", 1L);
      Authentication auth = authenticatedUser(author.getUsername());
      Post post =
          createPost(
              author, 41L, "Public draft", PostType.acceptance, PostStatus.draft,
              PostVisibility.public_post);

      when(postRepository.findById(41L)).thenReturn(Optional.of(post));
      when(userRepository.findByUsername(author.getUsername())).thenReturn(Optional.of(author));
      when(savedPostRepository.existsByPostAndUser(any(Post.class), eq(author))).thenReturn(false);

      PostDetailResponse response = postService.getPost(auth, 41L);

      assertThat(response.id()).isEqualTo(41L);
      assertThat(response.status()).isEqualTo(PostStatus.draft);
    }

    @Test
    @DisplayName("returns not found for a public post that is not published")
    void returnsNotFoundForAPublicPostThatIsNotPublished() {
      User author = createUser("author", 1L);
      User other = createUser("other", 2L);
      Authentication auth = authenticatedUser(other.getUsername());
      Post post =
          createPost(
              author, 40L, "Draft public post", PostType.acceptance, PostStatus.draft,
              PostVisibility.public_post);

      when(postRepository.findById(40L)).thenReturn(Optional.of(post));
      when(userRepository.findByUsername(other.getUsername())).thenReturn(Optional.of(other));

      assertThatThrownBy(() -> postService.getPost(auth, 40L))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    @DisplayName("returns not found when the post does not exist")
    void returnsNotFoundWhenThePostDoesNotExist() {
      when(postRepository.findById(404L)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> postService.getPost(null, 404L))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> {
                assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                assertThat(ex.getReason()).isEqualTo("Post not found");
              });
    }
  }

  @Nested
  @DisplayName("createPost")
  class CreatePostTests {

    @Test
    @DisplayName("sets publishedAt when creating a published post for the first time")
    void setsPublishedAtWhenCreatingAPublishedPostForTheFirstTime() {
      User user = createUser("author", 1L);
      Authentication auth = authenticatedUser(user.getUsername());
      PostRequest request =
          new PostRequest(
              PostType.acceptance,
              "Accepted offer",
              "Body",
              PostVisibility.public_post,
              PostStatus.published,
              null,
              null);

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(savedPostRepository.existsByPostAndUser(any(Post.class), eq(user))).thenReturn(false);
      when(postRepository.save(any(Post.class)))
          .thenAnswer(
              inv -> {
                Post saved = inv.getArgument(0);
                ReflectionTestUtils.setField(saved, "id", 1L);
                ReflectionTestUtils.setField(saved, "createdAt", Instant.now());
                return saved;
              });

      PostDetailResponse response = postService.createPost(auth, request);

      assertThat(response.status()).isEqualTo(PostStatus.published);
      assertThat(response.publishedAt()).isNotNull();
    }

    @Test
    @DisplayName("does not set publishedAt when creating a draft post")
    void doesNotSetPublishedAtWhenCreatingADraftPost() {
      User user = createUser("author", 1L);
      Authentication auth = authenticatedUser(user.getUsername());
      PostRequest request =
          new PostRequest(
              PostType.comparison,
              "Draft post",
              null,
              PostVisibility.private_post,
              PostStatus.draft,
              null,
              null);

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(savedPostRepository.existsByPostAndUser(any(Post.class), eq(user))).thenReturn(false);
      when(postRepository.save(any(Post.class)))
          .thenAnswer(
              inv -> {
                Post saved = inv.getArgument(0);
                ReflectionTestUtils.setField(saved, "id", 2L);
                ReflectionTestUtils.setField(saved, "createdAt", Instant.now());
                return saved;
              });

      PostDetailResponse response = postService.createPost(auth, request);

      assertThat(response.status()).isEqualTo(PostStatus.draft);
      assertThat(response.publishedAt()).isNull();
    }

    @Test
    @DisplayName("defaults visibility to public_post when not specified in the request")
    void defaultsVisibilityToPublicPostWhenNotSpecifiedInTheRequest() {
      User user = createUser("author", 1L);
      Authentication auth = authenticatedUser(user.getUsername());
      PostRequest request =
          new PostRequest(PostType.acceptance, "Title", null, null, PostStatus.draft, null, null);

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(savedPostRepository.existsByPostAndUser(any(Post.class), eq(user))).thenReturn(false);
      when(postRepository.save(any(Post.class)))
          .thenAnswer(
              inv -> {
                Post saved = inv.getArgument(0);
                ReflectionTestUtils.setField(saved, "id", 3L);
                ReflectionTestUtils.setField(saved, "createdAt", Instant.now());
                return saved;
              });

      PostDetailResponse response = postService.createPost(auth, request);

      assertThat(response.visibility()).isEqualTo(PostVisibility.public_post);
    }

    @Test
    @DisplayName("returns unauthorized when authentication exists but user record is missing")
    void returnsUnauthorizedWhenAuthExistsButUserRecordIsMissing() {
      Authentication auth = authenticatedUser("missing-user");
      PostRequest request =
          new PostRequest(PostType.acceptance, "Title", null, null, PostStatus.draft, null, null);
      when(userRepository.findByUsername("missing-user")).thenReturn(Optional.empty());

      assertThatThrownBy(() -> postService.createPost(auth, request))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    @DisplayName("returns unauthorized when authentication is present but not authenticated")
    void returnsUnauthorizedWhenAuthenticationNotAuthenticated() {
      Authentication auth = org.mockito.Mockito.mock(Authentication.class);
      when(auth.isAuthenticated()).thenReturn(false);
      PostRequest request =
          new PostRequest(PostType.acceptance, "Title", null, null, PostStatus.draft, null, null);

      assertThatThrownBy(() -> postService.createPost(auth, request))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }
  }

  @Nested
  @DisplayName("updatePost")
  class UpdatePostTests {

    @Test
    @DisplayName("sets publishedAt on first publish when updating to published status")
    void setsPublishedAtOnFirstPublishWhenUpdatingToPublishedStatus() {
      User author = createUser("author", 1L);
      Authentication auth = authenticatedUser(author.getUsername());
      Post post =
          createPost(
              author, 5L, "Draft", PostType.acceptance, PostStatus.draft,
              PostVisibility.public_post);
      PostRequest request =
          new PostRequest(
              PostType.acceptance,
              "Now published",
              "Body",
              PostVisibility.public_post,
              PostStatus.published,
              null,
              null);

      when(userRepository.findByUsername(author.getUsername())).thenReturn(Optional.of(author));
      when(savedPostRepository.existsByPostAndUser(any(Post.class), eq(author))).thenReturn(false);
      when(postRepository.findByIdAndAuthor(5L, author)).thenReturn(Optional.of(post));
      when(postRepository.save(any(Post.class))).thenAnswer(inv -> inv.getArgument(0));

      PostDetailResponse response = postService.updatePost(auth, 5L, request);

      assertThat(response.publishedAt()).isNotNull();
      assertThat(response.status()).isEqualTo(PostStatus.published);
    }

    @Test
    @DisplayName("does not set publishedAt when updating a published post back to draft")
    void doesNotTouchPublishedAtWhenUnpublishingToDraft() {
      User author = createUser("author", 1L);
      Authentication auth = authenticatedUser(author.getUsername());
      Instant originalPublishedAt = Instant.parse("2026-02-01T12:00:00Z");
      Post post =
          createPost(
              author, 5L, "Was live", PostType.acceptance, PostStatus.published,
              PostVisibility.public_post);
      post.setPublishedAt(originalPublishedAt);
      PostRequest request =
          new PostRequest(
              PostType.acceptance,
              "Back to draft",
              "Body",
              PostVisibility.private_post,
              PostStatus.draft,
              null,
              null);

      when(userRepository.findByUsername(author.getUsername())).thenReturn(Optional.of(author));
      when(savedPostRepository.existsByPostAndUser(any(Post.class), eq(author))).thenReturn(false);
      when(postRepository.findByIdAndAuthor(5L, author)).thenReturn(Optional.of(post));
      when(postRepository.save(any(Post.class))).thenAnswer(inv -> inv.getArgument(0));

      PostDetailResponse response = postService.updatePost(auth, 5L, request);

      assertThat(response.status()).isEqualTo(PostStatus.draft);
      assertThat(response.publishedAt()).isEqualTo(originalPublishedAt);
    }

    @Test
    @DisplayName("does not overwrite publishedAt when it is already set")
    void doesNotOverwritePublishedAtWhenItIsAlreadySet() {
      User author = createUser("author", 1L);
      Authentication auth = authenticatedUser(author.getUsername());
      Instant originalPublishedAt = Instant.parse("2026-01-01T00:00:00Z");
      Post post =
          createPost(
              author, 5L, "Published", PostType.acceptance, PostStatus.published,
              PostVisibility.public_post);
      post.setPublishedAt(originalPublishedAt);
      PostRequest request =
          new PostRequest(
              PostType.acceptance,
              "Still published",
              "Updated body",
              PostVisibility.public_post,
              PostStatus.published,
              null,
              null);

      when(userRepository.findByUsername(author.getUsername())).thenReturn(Optional.of(author));
      when(savedPostRepository.existsByPostAndUser(any(Post.class), eq(author))).thenReturn(false);
      when(postRepository.findByIdAndAuthor(5L, author)).thenReturn(Optional.of(post));
      when(postRepository.save(any(Post.class))).thenAnswer(inv -> inv.getArgument(0));

      PostDetailResponse response = postService.updatePost(auth, 5L, request);

      assertThat(response.publishedAt()).isEqualTo(originalPublishedAt);
    }

    @Test
    @DisplayName("returns not found when updating a post not authored by the current user")
    void returnsNotFoundWhenUpdatingAPostNotAuthoredByTheCurrentUser() {
      User user = createUser("other", 2L);
      Authentication auth = authenticatedUser(user.getUsername());
      PostRequest request =
          new PostRequest(PostType.acceptance, "Title", null, null, PostStatus.published, null, null);

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(postRepository.findByIdAndAuthor(99L, user)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> postService.updatePost(auth, 99L, request))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }
  }

  @Nested
  @DisplayName("deletePost")
  class DeletePostTests {

    @Test
    @DisplayName("sets post status to hidden instead of hard deleting")
    void setsPostStatusToHiddenInsteadOfHardDeleting() {
      User author = createUser("author", 1L);
      Authentication auth = authenticatedUser(author.getUsername());
      Post post =
          createPost(
              author, 8L, "To hide", PostType.acceptance, PostStatus.published,
              PostVisibility.public_post);

      when(userRepository.findByUsername(author.getUsername())).thenReturn(Optional.of(author));
      when(postRepository.findByIdAndAuthor(8L, author)).thenReturn(Optional.of(post));
      when(postRepository.save(any(Post.class))).thenAnswer(inv -> inv.getArgument(0));

      postService.deletePost(auth, 8L);

      assertThat(post.getStatus()).isEqualTo(PostStatus.hidden);
      verify(postRepository).save(post);
    }

    @Test
    @DisplayName("returns not found when deleting a post not authored by the current user")
    void returnsNotFoundWhenDeletingAPostNotAuthoredByTheCurrentUser() {
      User user = createUser("other", 2L);
      Authentication auth = authenticatedUser(user.getUsername());

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(postRepository.findByIdAndAuthor(404L, user)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> postService.deletePost(auth, 404L))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }
  }


  private static Authentication authenticatedUser(String username) {
    Authentication auth = org.mockito.Mockito.mock(Authentication.class);
    when(auth.isAuthenticated()).thenReturn(true);
    when(auth.getName()).thenReturn(username);
    return auth;
  }

  private static User createUser(String username, Long id) {
    User user =
        new User(username, username + "@example.com", "hashed", Role.STUDENT, "Test", "User");
    ReflectionTestUtils.setField(user, "id", id);
    return user;
  }

  private static Post createPost(
      User author,
      Long id,
      String title,
      PostType type,
      PostStatus status,
      PostVisibility visibility) {
    Post post = new Post();
    post.setAuthor(author);
    post.setTitle(title);
    post.setType(type);
    post.setStatus(status);
    post.setVisibility(visibility);
    ReflectionTestUtils.setField(post, "id", id);
    ReflectionTestUtils.setField(post, "createdAt", Instant.parse("2026-01-01T00:00:00Z"));
    return post;
  }
}
