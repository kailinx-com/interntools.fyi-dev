package com.interntoolsfyi.offer.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.interntoolsfyi.offer.dto.CommentRequest;
import com.interntoolsfyi.offer.dto.CommentResponse;
import com.interntoolsfyi.offer.dto.VoteRequest;
import com.interntoolsfyi.offer.dto.VoteTallyResponse;
import com.interntoolsfyi.offer.model.Comment;
import com.interntoolsfyi.offer.model.CommunityPreferenceVote;
import com.interntoolsfyi.offer.model.Post;
import com.interntoolsfyi.offer.model.PostStatus;
import com.interntoolsfyi.offer.model.PostType;
import com.interntoolsfyi.offer.model.PostVisibility;
import com.interntoolsfyi.offer.repository.CommentRepository;
import com.interntoolsfyi.offer.repository.CommunityPreferenceVoteRepository;
import com.interntoolsfyi.offer.repository.PostRepository;
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
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class CommentAndVoteServiceTest {

  @Mock private PostRepository postRepository;
  @Mock private CommentRepository commentRepository;
  @Mock private CommunityPreferenceVoteRepository voteRepository;
  @Mock private UserRepository userRepository;

  @InjectMocks private CommentAndVoteService commentAndVoteService;

  @Nested
  @DisplayName("listComments")
  class ListCommentsTests {

    @Test
    @DisplayName("returns empty list when the post has no comments")
    void returnsEmptyWhenPostHasNoComments() {
      User author = createUser("poster", 1L);
      Post post = createPublishedPost(author, 10L);

      when(postRepository.findById(10L)).thenReturn(Optional.of(post));
      when(commentRepository.findByPostAndDeletedFalseOrderByCreatedAtAsc(post)).thenReturn(List.of());

      assertThat(commentAndVoteService.listComments(10L)).isEmpty();
    }

    @Test
    @DisplayName("returns non-deleted comments in creation order for a published post")
    void returnsNonDeletedCommentsInCreationOrderForAPublishedPost() {
      User author = createUser("poster", 1L);
      Post post = createPublishedPost(author, 10L);
      User commenter = createUser("commenter", 2L);
      Comment c1 = createComment(post, commenter, 1L, "First comment");
      Comment c2 = createComment(post, commenter, 2L, "Second comment");

      when(postRepository.findById(10L)).thenReturn(Optional.of(post));
      when(commentRepository.findByPostAndDeletedFalseOrderByCreatedAtAsc(post))
          .thenReturn(List.of(c1, c2));

      List<CommentResponse> result = commentAndVoteService.listComments(10L);

      assertThat(result).hasSize(2);
      assertThat(result.get(0).body()).isEqualTo("First comment");
      assertThat(result.get(0).authorUsername()).isEqualTo("commenter");
      assertThat(result.get(0).postId()).isEqualTo(10L);
      assertThat(result.get(1).body()).isEqualTo("Second comment");
    }

    @Test
    @DisplayName("returns unauthorized when deleting a comment without authentication")
    void returnsUnauthorizedWhenDeletingCommentWithoutAuth() {
      assertThatThrownBy(() -> commentAndVoteService.deleteComment(null, 5L))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    @DisplayName("returns not found when listing comments on a non-published post")
    void returnsNotFoundWhenListingCommentsOnANonPublishedPost() {
      User author = createUser("poster", 1L);
      Post draft = createPost(author, 20L, PostStatus.draft);

      when(postRepository.findById(20L)).thenReturn(Optional.of(draft));

      assertThatThrownBy(() -> commentAndVoteService.listComments(20L))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    @DisplayName("returns not found when the post does not exist")
    void returnsNotFoundWhenThePostDoesNotExist() {
      when(postRepository.findById(404L)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> commentAndVoteService.listComments(404L))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }
  }

  @Nested
  @DisplayName("createComment")
  class CreateCommentTests {

    @Test
    @DisplayName("saves the comment and returns the response with all fields populated")
    void savesTheCommentAndReturnsTheResponseWithAllFieldsPopulated() {
      User author = createUser("poster", 1L);
      Post post = createPublishedPost(author, 10L);
      User commenter = createUser("commenter", 2L);
      Authentication auth = authenticatedUser(commenter.getUsername());
      CommentRequest request = new CommentRequest("Great post!", null);
      Instant createdAt = Instant.parse("2026-04-01T12:00:00Z");

      when(userRepository.findByUsername(commenter.getUsername())).thenReturn(Optional.of(commenter));
      when(postRepository.findById(10L)).thenReturn(Optional.of(post));
      when(commentRepository.save(any(Comment.class)))
          .thenAnswer(
              inv -> {
                Comment saved = inv.getArgument(0);
                ReflectionTestUtils.setField(saved, "id", 5L);
                ReflectionTestUtils.setField(saved, "createdAt", createdAt);
                return saved;
              });

      CommentResponse response = commentAndVoteService.createComment(auth, 10L, request);

      ArgumentCaptor<Comment> captor = ArgumentCaptor.forClass(Comment.class);
      verify(commentRepository).save(captor.capture());
      Comment saved = captor.getValue();

      assertThat(saved.getPost()).isSameAs(post);
      assertThat(saved.getUser()).isSameAs(commenter);
      assertThat(saved.getBody()).isEqualTo("Great post!");

      assertThat(response.id()).isEqualTo(5L);
      assertThat(response.body()).isEqualTo("Great post!");
      assertThat(response.authorUsername()).isEqualTo("commenter");
      assertThat(response.postId()).isEqualTo(10L);
      assertThat(response.createdAt()).isEqualTo(createdAt);
    }

    @Test
    @DisplayName("returns not found when commenting on a non-published post")
    void returnsNotFoundWhenCommentingOnANonPublishedPost() {
      User author = createUser("poster", 1L);
      Post draft = createPost(author, 20L, PostStatus.draft);
      User commenter = createUser("commenter", 2L);
      Authentication auth = authenticatedUser(commenter.getUsername());

      when(userRepository.findByUsername(commenter.getUsername())).thenReturn(Optional.of(commenter));
      when(postRepository.findById(20L)).thenReturn(Optional.of(draft));

      assertThatThrownBy(
              () -> commentAndVoteService.createComment(auth, 20L, new CommentRequest("Hello", null)))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    @DisplayName("returns unauthorized when no authentication is provided")
    void returnsUnauthorizedWhenNoAuthenticationIsProvided() {
      assertThatThrownBy(
              () -> commentAndVoteService.createComment(null, 10L, new CommentRequest("Hello", null)))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    @DisplayName("returns unauthorized when authentication is present but not authenticated")
    void returnsUnauthorizedWhenAuthenticationNotAuthenticated() {
      Authentication auth = org.mockito.Mockito.mock(Authentication.class);
      when(auth.isAuthenticated()).thenReturn(false);

      assertThatThrownBy(
              () -> commentAndVoteService.createComment(auth, 10L, new CommentRequest("Hello", null)))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    @DisplayName("returns not found when parent comment id does not exist")
    void returnsNotFoundWhenParentCommentMissing() {
      User author = createUser("poster", 1L);
      Post post = createPublishedPost(author, 10L);
      User commenter = createUser("commenter", 2L);
      Authentication auth = authenticatedUser(commenter.getUsername());

      when(userRepository.findByUsername(commenter.getUsername())).thenReturn(Optional.of(commenter));
      when(postRepository.findById(10L)).thenReturn(Optional.of(post));
      when(commentRepository.findById(99L)).thenReturn(Optional.empty());

      assertThatThrownBy(
              () ->
                  commentAndVoteService.createComment(
                      auth, 10L, new CommentRequest("Reply", 99L)))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> {
                assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                assertThat(ex.getReason()).isEqualTo("Parent comment not found");
              });
    }

    @Test
    @DisplayName("links a reply comment to its parent when parentId is provided")
    void linksReplyToParentWhenParentIdProvided() {
      User author = createUser("poster", 1L);
      Post post = createPublishedPost(author, 10L);
      User commenter = createUser("commenter", 2L);
      Authentication auth = authenticatedUser(commenter.getUsername());
      Comment parent = createComment(post, commenter, 3L, "Parent body");

      when(userRepository.findByUsername(commenter.getUsername())).thenReturn(Optional.of(commenter));
      when(postRepository.findById(10L)).thenReturn(Optional.of(post));
      when(commentRepository.findById(3L)).thenReturn(Optional.of(parent));
      when(commentRepository.save(any(Comment.class)))
          .thenAnswer(
              inv -> {
                Comment saved = inv.getArgument(0);
                ReflectionTestUtils.setField(saved, "id", 7L);
                ReflectionTestUtils.setField(saved, "createdAt", Instant.parse("2026-04-02T00:00:00Z"));
                return saved;
              });

      CommentResponse response =
          commentAndVoteService.createComment(auth, 10L, new CommentRequest("Reply text", 3L));

      ArgumentCaptor<Comment> captor = ArgumentCaptor.forClass(Comment.class);
      verify(commentRepository).save(captor.capture());
      assertThat(captor.getValue().getParent()).isSameAs(parent);
      assertThat(response.parentId()).isEqualTo(3L);
    }
  }

  @Nested
  @DisplayName("updateComment")
  class UpdateCommentTests {

    @Test
    @DisplayName("returns unauthorized when updating a comment without authentication")
    void returnsUnauthorizedWhenUpdatingCommentWithoutAuth() {
      assertThatThrownBy(
              () -> commentAndVoteService.updateComment(null, 5L, new CommentRequest("X", null)))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    @DisplayName("updates the body and sets editedAt on a comment owned by the current user")
    void updatesTheBodyAndSetsEditedAtOnACommentOwnedByTheCurrentUser() {
      User user = createUser("commenter", 1L);
      Authentication auth = authenticatedUser(user.getUsername());
      User poster = createUser("poster", 2L);
      Post post = createPublishedPost(poster, 10L);
      Comment comment = createComment(post, user, 5L, "Original body");
      CommentRequest request = new CommentRequest("Updated body", null);

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(commentRepository.findByIdAndUser(5L, user)).thenReturn(Optional.of(comment));
      when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> inv.getArgument(0));

      CommentResponse response = commentAndVoteService.updateComment(auth, 5L, request);

      assertThat(response.body()).isEqualTo("Updated body");
      assertThat(comment.getEditedAt()).isNotNull();
    }

    @Test
    @DisplayName("returns not found when updating a comment owned by another user")
    void returnsNotFoundWhenUpdatingACommentOwnedByAnotherUser() {
      User user = createUser("other", 2L);
      Authentication auth = authenticatedUser(user.getUsername());

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(commentRepository.findByIdAndUser(99L, user)).thenReturn(Optional.empty());

      assertThatThrownBy(
              () -> commentAndVoteService.updateComment(auth, 99L, new CommentRequest("X", null)))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> {
                assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                assertThat(ex.getReason()).isEqualTo("Comment not found");
              });
    }
  }

  @Nested
  @DisplayName("deleteComment")
  class DeleteCommentTests {

    @Test
    @DisplayName("soft deletes a comment by setting the deleted flag to true")
    void softDeletesACommentBySettingTheDeletedFlagToTrue() {
      User user = createUser("commenter", 1L);
      Authentication auth = authenticatedUser(user.getUsername());
      User poster = createUser("poster", 2L);
      Post post = createPublishedPost(poster, 10L);
      Comment comment = createComment(post, user, 5L, "Some comment");

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(commentRepository.findByIdAndUser(5L, user)).thenReturn(Optional.of(comment));
      when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> inv.getArgument(0));

      commentAndVoteService.deleteComment(auth, 5L);

      assertThat(comment.getDeleted()).isTrue();
      verify(commentRepository).save(comment);
    }

    @Test
    @DisplayName("returns not found when deleting a comment owned by another user")
    void returnsNotFoundWhenDeletingACommentOwnedByAnotherUser() {
      User user = createUser("other", 2L);
      Authentication auth = authenticatedUser(user.getUsername());

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(commentRepository.findByIdAndUser(404L, user)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> commentAndVoteService.deleteComment(auth, 404L))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }
  }

  @Nested
  @DisplayName("getVoteTally")
  class GetVoteTallyTests {

    @Test
    @DisplayName("returns tally grouped by snapshotId when votes reference snapshot IDs")
    void returnsTallyGroupedBySnapshotIdWhenVotesReferenceSnapshotIds() {
      User poster = createUser("poster", 1L);
      Post post = createPublishedPost(poster, 10L);
      CommunityPreferenceVote v1 = createVoteBySnapshotId(post, createUser("u1", 2L), "snap-a");
      CommunityPreferenceVote v2 = createVoteBySnapshotId(post, createUser("u2", 3L), "snap-a");
      CommunityPreferenceVote v3 = createVoteBySnapshotId(post, createUser("u3", 4L), "snap-b");

      when(postRepository.findById(10L)).thenReturn(Optional.of(post));
      when(voteRepository.findByPost(post)).thenReturn(List.of(v1, v2, v3));

      VoteTallyResponse tally = commentAndVoteService.getVoteTally(10L);

      assertThat(tally.postId()).isEqualTo(10L);
      assertThat(tally.totalVotes()).isEqualTo(3L);
      assertThat(tally.tally()).containsEntry("snap-a", 2L);
      assertThat(tally.tally()).containsEntry("snap-b", 1L);
    }

    @Test
    @DisplayName("groups votes with null snapshot id and null index under key 'null'")
    void groupsVotesWithNullSnapshotAndIndex() {
      User poster = createUser("poster", 1L);
      Post post = createPublishedPost(poster, 10L);
      CommunityPreferenceVote v = new CommunityPreferenceVote();
      v.setPost(post);
      v.setUser(createUser("u", 2L));
      v.setSelectedOfferSnapshotId(null);
      v.setSelectedOfferIndex(null);

      when(postRepository.findById(10L)).thenReturn(Optional.of(post));
      when(voteRepository.findByPost(post)).thenReturn(List.of(v));

      VoteTallyResponse tally = commentAndVoteService.getVoteTally(10L);

      assertThat(tally.tally()).containsEntry("null", 1L);
    }

    @Test
    @DisplayName("returns tally grouped by index string when votes reference array indices")
    void returnsTallyGroupedByIndexStringWhenVotesReferenceArrayIndices() {
      User poster = createUser("poster", 1L);
      Post post = createPublishedPost(poster, 10L);
      CommunityPreferenceVote v1 = createVoteByIndex(post, createUser("u1", 2L), 0);
      CommunityPreferenceVote v2 = createVoteByIndex(post, createUser("u2", 3L), 0);
      CommunityPreferenceVote v3 = createVoteByIndex(post, createUser("u3", 4L), 1);

      when(postRepository.findById(10L)).thenReturn(Optional.of(post));
      when(voteRepository.findByPost(post)).thenReturn(List.of(v1, v2, v3));

      VoteTallyResponse tally = commentAndVoteService.getVoteTally(10L);

      assertThat(tally.totalVotes()).isEqualTo(3L);
      assertThat(tally.tally()).containsEntry("0", 2L);
      assertThat(tally.tally()).containsEntry("1", 1L);
    }

    @Test
    @DisplayName("returns not found when getting votes for a non-published post")
    void returnsNotFoundWhenGettingVotesForANonPublishedPost() {
      User poster = createUser("poster", 1L);
      Post draft = createPost(poster, 20L, PostStatus.draft);

      when(postRepository.findById(20L)).thenReturn(Optional.of(draft));

      assertThatThrownBy(() -> commentAndVoteService.getVoteTally(20L))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    @DisplayName("returns zero total votes when no one has voted")
    void returnsZeroTotalVotesWhenNoOneHasVoted() {
      User poster = createUser("poster", 1L);
      Post post = createPublishedPost(poster, 10L);

      when(postRepository.findById(10L)).thenReturn(Optional.of(post));
      when(voteRepository.findByPost(post)).thenReturn(List.of());

      VoteTallyResponse tally = commentAndVoteService.getVoteTally(10L);

      assertThat(tally.totalVotes()).isEqualTo(0L);
      assertThat(tally.tally()).isEmpty();
    }
  }

  @Nested
  @DisplayName("upsertVote")
  class UpsertVoteTests {

    @Test
    @DisplayName("creates a vote using only selectedOfferIndex when snapshot id is null")
    void createsVoteUsingIndexOnly() {
      User poster = createUser("poster", 1L);
      Post post = createPublishedPost(poster, 10L);
      User voter = createUser("voter", 2L);
      Authentication auth = authenticatedUser(voter.getUsername());
      VoteRequest request = new VoteRequest(null, 2);

      when(userRepository.findByUsername(voter.getUsername())).thenReturn(Optional.of(voter));
      when(postRepository.findById(10L)).thenReturn(Optional.of(post));
      when(voteRepository.findByPostAndUser(post, voter)).thenReturn(Optional.empty());
      when(voteRepository.save(any(CommunityPreferenceVote.class)))
          .thenAnswer(inv -> inv.getArgument(0));
      when(voteRepository.findByPost(post)).thenReturn(List.of());

      commentAndVoteService.upsertVote(auth, 10L, request);

      ArgumentCaptor<CommunityPreferenceVote> captor =
          ArgumentCaptor.forClass(CommunityPreferenceVote.class);
      verify(voteRepository).save(captor.capture());
      assertThat(captor.getValue().getSelectedOfferIndex()).isEqualTo(2);
      assertThat(captor.getValue().getSelectedOfferSnapshotId()).isNull();
    }

    @Test
    @DisplayName("creates a new vote when no previous vote exists for the user")
    void createsANewVoteWhenNoPreviousVoteExistsForTheUser() {
      User poster = createUser("poster", 1L);
      Post post = createPublishedPost(poster, 10L);
      User voter = createUser("voter", 2L);
      Authentication auth = authenticatedUser(voter.getUsername());
      VoteRequest request = new VoteRequest("snap-a", null);

      when(userRepository.findByUsername(voter.getUsername())).thenReturn(Optional.of(voter));
      when(postRepository.findById(10L)).thenReturn(Optional.of(post));
      when(voteRepository.findByPostAndUser(post, voter)).thenReturn(Optional.empty());
      when(voteRepository.save(any(CommunityPreferenceVote.class)))
          .thenAnswer(inv -> inv.getArgument(0));
      when(voteRepository.findByPost(post)).thenReturn(List.of());

      commentAndVoteService.upsertVote(auth, 10L, request);

      ArgumentCaptor<CommunityPreferenceVote> captor =
          ArgumentCaptor.forClass(CommunityPreferenceVote.class);
      verify(voteRepository).save(captor.capture());
      CommunityPreferenceVote saved = captor.getValue();

      assertThat(saved.getPost()).isSameAs(post);
      assertThat(saved.getUser()).isSameAs(voter);
      assertThat(saved.getSelectedOfferSnapshotId()).isEqualTo("snap-a");
      assertThat(saved.getSelectedOfferIndex()).isNull();
    }

    @Test
    @DisplayName("updates an existing vote when the user has already voted")
    void updatesAnExistingVoteWhenTheUserHasAlreadyVoted() {
      User poster = createUser("poster", 1L);
      Post post = createPublishedPost(poster, 10L);
      User voter = createUser("voter", 2L);
      Authentication auth = authenticatedUser(voter.getUsername());
      CommunityPreferenceVote existingVote = createVoteBySnapshotId(post, voter, "snap-a");
      VoteRequest request = new VoteRequest("snap-b", null);

      when(userRepository.findByUsername(voter.getUsername())).thenReturn(Optional.of(voter));
      when(postRepository.findById(10L)).thenReturn(Optional.of(post));
      when(voteRepository.findByPostAndUser(post, voter)).thenReturn(Optional.of(existingVote));
      when(voteRepository.save(any(CommunityPreferenceVote.class)))
          .thenAnswer(inv -> inv.getArgument(0));
      when(voteRepository.findByPost(post)).thenReturn(List.of(existingVote));

      commentAndVoteService.upsertVote(auth, 10L, request);

      assertThat(existingVote.getSelectedOfferSnapshotId()).isEqualTo("snap-b");
    }

    @Test
    @DisplayName("returns bad request when neither snapshotId nor index is provided")
    void returnsBadRequestWhenNeitherSnapshotIdNorIndexIsProvided() {
      User poster = createUser("poster", 1L);
      Post post = createPublishedPost(poster, 10L);
      User voter = createUser("voter", 2L);
      Authentication auth = authenticatedUser(voter.getUsername());
      VoteRequest request = new VoteRequest(null, null);

      when(userRepository.findByUsername(voter.getUsername())).thenReturn(Optional.of(voter));
      when(postRepository.findById(10L)).thenReturn(Optional.of(post));

      assertThatThrownBy(() -> commentAndVoteService.upsertVote(auth, 10L, request))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    @DisplayName("returns unauthorized when no authentication is provided")
    void returnsUnauthorizedWhenNoAuthenticationIsProvided() {
      assertThatThrownBy(
              () ->
                  commentAndVoteService.upsertVote(
                      null, 10L, new VoteRequest("snap-a", null)))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }
  }

  @Nested
  @DisplayName("deleteVote")
  class DeleteVoteTests {

    @Test
    @DisplayName("removes the vote when one exists for the user and post")
    void removesTheVoteWhenOneExistsForTheUserAndPost() {
      User poster = createUser("poster", 1L);
      Post post = createPublishedPost(poster, 10L);
      User voter = createUser("voter", 2L);
      Authentication auth = authenticatedUser(voter.getUsername());
      CommunityPreferenceVote vote = createVoteBySnapshotId(post, voter, "snap-a");

      when(userRepository.findByUsername(voter.getUsername())).thenReturn(Optional.of(voter));
      when(postRepository.findById(10L)).thenReturn(Optional.of(post));
      when(voteRepository.findByPostAndUser(post, voter)).thenReturn(Optional.of(vote));

      commentAndVoteService.deleteVote(auth, 10L);

      verify(voteRepository).delete(vote);
    }

    @Test
    @DisplayName("is a no-op when the user has not voted on the post")
    void isANoOpWhenTheUserHasNotVotedOnThePost() {
      User poster = createUser("poster", 1L);
      Post post = createPublishedPost(poster, 10L);
      User voter = createUser("voter", 2L);
      Authentication auth = authenticatedUser(voter.getUsername());

      when(userRepository.findByUsername(voter.getUsername())).thenReturn(Optional.of(voter));
      when(postRepository.findById(10L)).thenReturn(Optional.of(post));
      when(voteRepository.findByPostAndUser(post, voter)).thenReturn(Optional.empty());

      commentAndVoteService.deleteVote(auth, 10L);

      verify(voteRepository, never()).delete(any(CommunityPreferenceVote.class));
    }

    @Test
    @DisplayName("returns not found when deleting a vote on a non-published post")
    void returnsNotFoundWhenDeletingAVoteOnANonPublishedPost() {
      User poster = createUser("poster", 1L);
      Post draft = createPost(poster, 20L, PostStatus.draft);
      User voter = createUser("voter", 2L);
      Authentication auth = authenticatedUser(voter.getUsername());

      when(userRepository.findByUsername(voter.getUsername())).thenReturn(Optional.of(voter));
      when(postRepository.findById(20L)).thenReturn(Optional.of(draft));

      assertThatThrownBy(() -> commentAndVoteService.deleteVote(auth, 20L))
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

  private static Post createPublishedPost(User author, Long id) {
    return createPost(author, id, PostStatus.published);
  }

  private static Post createPost(User author, Long id, PostStatus status) {
    Post post = new Post();
    post.setAuthor(author);
    post.setTitle("Test post");
    post.setType(PostType.acceptance);
    post.setStatus(status);
    post.setVisibility(PostVisibility.public_post);
    ReflectionTestUtils.setField(post, "id", id);
    ReflectionTestUtils.setField(post, "createdAt", Instant.parse("2026-01-01T00:00:00Z"));
    return post;
  }

  private static Comment createComment(Post post, User user, Long id, String body) {
    Comment comment = new Comment();
    comment.setPost(post);
    comment.setUser(user);
    comment.setBody(body);
    comment.setDeleted(false);
    ReflectionTestUtils.setField(comment, "id", id);
    ReflectionTestUtils.setField(comment, "createdAt", Instant.parse("2026-01-01T00:00:00Z"));
    return comment;
  }

  private static CommunityPreferenceVote createVoteBySnapshotId(
      Post post, User user, String snapshotId) {
    CommunityPreferenceVote vote = new CommunityPreferenceVote();
    vote.setPost(post);
    vote.setUser(user);
    vote.setSelectedOfferSnapshotId(snapshotId);
    return vote;
  }

  private static CommunityPreferenceVote createVoteByIndex(Post post, User user, Integer index) {
    CommunityPreferenceVote vote = new CommunityPreferenceVote();
    vote.setPost(post);
    vote.setUser(user);
    vote.setSelectedOfferIndex(index);
    return vote;
  }
}
