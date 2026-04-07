package com.interntoolsfyi.offer.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.interntoolsfyi.offer.dto.ComparisonRequest;
import com.interntoolsfyi.offer.dto.ComparisonResponse;
import com.interntoolsfyi.offer.model.Comparison;
import com.interntoolsfyi.offer.repository.ComparisonRepository;
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
class ComparisonServiceTest {

  @Mock private ComparisonRepository comparisonRepository;
  @Mock private UserRepository userRepository;

  @InjectMocks private ComparisonService comparisonService;

  @Nested
  @DisplayName("authentication")
  class AuthenticationTests {

    @Test
    @DisplayName("returns unauthorized when no authentication is provided")
    void returnsUnauthorizedWhenNoAuthenticationIsProvided() {
      assertThatThrownBy(() -> comparisonService.listComparisons(null))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> {
                assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
                assertThat(ex.getReason()).isEqualTo("Authentication required");
              });
    }

    @Test
    @DisplayName("returns unauthorized when the authentication is not authenticated")
    void returnsUnauthorizedWhenTheAuthenticationIsNotAuthenticated() {
      assertThatThrownBy(() -> comparisonService.listComparisons(unauthenticatedUser()))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    @DisplayName("returns unauthorized when the authenticated principal no longer exists")
    void returnsUnauthorizedWhenTheAuthenticatedPrincipalNoLongerExists() {
      Authentication auth = authenticatedUser("missing");
      when(userRepository.findByUsername("missing")).thenReturn(Optional.empty());

      assertThatThrownBy(() -> comparisonService.listComparisons(auth))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> {
                assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
                assertThat(ex.getReason()).isEqualTo("User not found");
              });
    }
  }

  @Nested
  @DisplayName("listComparisons")
  class ListComparisonsTests {

    @Test
    @DisplayName("returns the authenticated users comparisons ordered by createdAt descending")
    void returnsTheAuthenticatedUsersComparisonsOrderedByCreatedAtDescending() {
      User user = createUser("viewer");
      Authentication auth = authenticatedUser(user.getUsername());
      Comparison newer = createComparison(user, 2L, "Newest", Instant.parse("2026-04-01T00:00:00Z"));
      Comparison older = createComparison(user, 1L, "Oldest", Instant.parse("2026-03-01T00:00:00Z"));

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(comparisonRepository.findByUserOrderByCreatedAtDesc(user))
          .thenReturn(List.of(newer, older));

      List<ComparisonResponse> result = comparisonService.listComparisons(auth);

      assertThat(result).hasSize(2);
      assertThat(result.get(0).id()).isEqualTo(2L);
      assertThat(result.get(0).name()).isEqualTo("Newest");
      assertThat(result.get(1).id()).isEqualTo(1L);
    }

    @Test
    @DisplayName("returns an empty list when the user has no comparisons")
    void returnsAnEmptyListWhenTheUserHasNoComparisons() {
      User user = createUser("empty");
      Authentication auth = authenticatedUser(user.getUsername());

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(comparisonRepository.findByUserOrderByCreatedAtDesc(user)).thenReturn(List.of());

      assertThat(comparisonService.listComparisons(auth)).isEmpty();
    }
  }

  @Nested
  @DisplayName("createComparison")
  class CreateComparisonTests {

    @Test
    @DisplayName("persists all mapped fields and returns the created response")
    void persistsAllMappedFieldsAndReturnsTheCreatedResponse() {
      User user = createUser("creator");
      Authentication auth = authenticatedUser(user.getUsername());
      ComparisonRequest request =
          new ComparisonRequest("My Comparison", List.of(1L, 2L), "Google vs Meta", null);
      Instant createdAt = Instant.parse("2026-03-01T00:00:00Z");

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(comparisonRepository.save(any(Comparison.class)))
          .thenAnswer(
              invocation -> {
                Comparison saved = invocation.getArgument(0);
                ReflectionTestUtils.setField(saved, "id", 10L);
                ReflectionTestUtils.setField(saved, "createdAt", createdAt);
                return saved;
              });

      ComparisonResponse response = comparisonService.createComparison(auth, request);

      ArgumentCaptor<Comparison> captor = ArgumentCaptor.forClass(Comparison.class);
      verify(comparisonRepository).save(captor.capture());
      Comparison saved = captor.getValue();

      assertThat(saved.getUser()).isSameAs(user);
      assertThat(saved.getName()).isEqualTo("My Comparison");
      assertThat(saved.getIncludedOfferIds()).containsExactly(1L, 2L);
      assertThat(saved.getDescription()).isEqualTo("Google vs Meta");
      assertThat(saved.getUpdatedAt()).isNotNull();

      assertThat(response.id()).isEqualTo(10L);
      assertThat(response.name()).isEqualTo("My Comparison");
      assertThat(response.includedOfferIds()).containsExactly(1L, 2L);
      assertThat(response.createdAt()).isEqualTo(createdAt);
    }
  }

  @Nested
  @DisplayName("getComparison")
  class GetComparisonTests {

    @Test
    @DisplayName("returns the response for a comparison owned by the current user")
    void returnsTheResponseForAComparisonOwnedByTheCurrentUser() {
      User user = createUser("owner");
      Authentication auth = authenticatedUser(user.getUsername());
      Comparison comparison =
          createComparison(user, 5L, "My Comp", Instant.parse("2026-03-01T00:00:00Z"));

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(comparisonRepository.findByIdAndUser(5L, user)).thenReturn(Optional.of(comparison));

      ComparisonResponse response = comparisonService.getComparison(auth, 5L);

      assertThat(response.id()).isEqualTo(5L);
      assertThat(response.name()).isEqualTo("My Comp");
    }

    @Test
    @DisplayName("returns not found when the comparison belongs to another user")
    void returnsNotFoundWhenTheComparisonBelongsToAnotherUser() {
      User user = createUser("other");
      Authentication auth = authenticatedUser(user.getUsername());

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(comparisonRepository.findByIdAndUser(99L, user)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> comparisonService.getComparison(auth, 99L))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> {
                assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                assertThat(ex.getReason()).isEqualTo("Comparison not found");
              });
    }
  }

  @Nested
  @DisplayName("updateComparison")
  class UpdateComparisonTests {

    @Test
    @DisplayName("applies all request fields and returns the updated response")
    void appliesAllRequestFieldsAndReturnsTheUpdatedResponse() {
      User user = createUser("updater");
      Authentication auth = authenticatedUser(user.getUsername());
      Comparison comparison =
          createComparison(user, 7L, "Old Name", Instant.parse("2026-03-01T00:00:00Z"));
      ComparisonRequest request =
          new ComparisonRequest("New Name", List.of(1L, 2L, 3L), "Updated desc", null);

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(comparisonRepository.findByIdAndUser(7L, user)).thenReturn(Optional.of(comparison));
      when(comparisonRepository.save(any(Comparison.class)))
          .thenAnswer(inv -> inv.getArgument(0));

      ComparisonResponse response = comparisonService.updateComparison(auth, 7L, request);

      assertThat(response.name()).isEqualTo("New Name");
      assertThat(response.includedOfferIds()).containsExactly(1L, 2L, 3L);
      assertThat(response.description()).isEqualTo("Updated desc");
    }

    @Test
    @DisplayName("returns not found when updating a comparison owned by another user")
    void returnsNotFoundWhenUpdatingAComparisonOwnedByAnotherUser() {
      User user = createUser("other");
      Authentication auth = authenticatedUser(user.getUsername());

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(comparisonRepository.findByIdAndUser(999L, user)).thenReturn(Optional.empty());

      assertThatThrownBy(
              () ->
                  comparisonService.updateComparison(
                      auth, 999L, new ComparisonRequest("X", List.of(1L, 2L), null, null)))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));

      verify(comparisonRepository, never()).save(any());
    }
  }

  @Nested
  @DisplayName("deleteComparison")
  class DeleteComparisonTests {

    @Test
    @DisplayName("deletes a comparison owned by the current user")
    void deletesAComparisonOwnedByTheCurrentUser() {
      User user = createUser("owner");
      Authentication auth = authenticatedUser(user.getUsername());
      Comparison comparison =
          createComparison(user, 3L, "To Delete", Instant.parse("2026-03-01T00:00:00Z"));

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(comparisonRepository.findByIdAndUser(3L, user)).thenReturn(Optional.of(comparison));

      comparisonService.deleteComparison(auth, 3L);

      verify(comparisonRepository).delete(comparison);
    }

    @Test
    @DisplayName("returns not found when deleting a comparison owned by another user")
    void returnsNotFoundWhenDeletingAComparisonOwnedByAnotherUser() {
      User user = createUser("other");
      Authentication auth = authenticatedUser(user.getUsername());

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(comparisonRepository.findByIdAndUser(404L, user)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> comparisonService.deleteComparison(auth, 404L))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));

      verify(comparisonRepository, never()).delete(any());
    }
  }


  private static Authentication authenticatedUser(String username) {
    Authentication auth = org.mockito.Mockito.mock(Authentication.class);
    when(auth.isAuthenticated()).thenReturn(true);
    when(auth.getName()).thenReturn(username);
    return auth;
  }

  private static Authentication unauthenticatedUser() {
    Authentication auth = org.mockito.Mockito.mock(Authentication.class);
    when(auth.isAuthenticated()).thenReturn(false);
    return auth;
  }

  private static User createUser(String username) {
    return new User(username, username + "@example.com", "hashed", Role.STUDENT, "Test", "User");
  }

  private static Comparison createComparison(User user, Long id, String name, Instant createdAt) {
    Comparison comparison = new Comparison();
    comparison.setUser(user);
    comparison.setName(name);
    comparison.setIncludedOfferIds(List.of(1L, 2L));
    ReflectionTestUtils.setField(comparison, "id", id);
    ReflectionTestUtils.setField(comparison, "createdAt", createdAt);
    return comparison;
  }
}
