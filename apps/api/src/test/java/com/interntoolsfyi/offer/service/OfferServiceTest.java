package com.interntoolsfyi.offer.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.interntoolsfyi.offer.dto.OfferRequest;
import com.interntoolsfyi.offer.dto.OfferResponse;
import com.interntoolsfyi.offer.model.CompensationType;
import com.interntoolsfyi.offer.model.EmploymentType;
import com.interntoolsfyi.offer.model.Offer;
import com.interntoolsfyi.offer.repository.OfferRepository;
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
class OfferServiceTest {

  @Mock private OfferRepository offerRepository;
  @Mock private UserRepository userRepository;

  @InjectMocks private OfferService offerService;

  @Nested
  @DisplayName("authentication")
  class AuthenticationTests {

    @Test
    @DisplayName("returns unauthorized when no authentication is provided")
    void returnsUnauthorizedWhenNoAuthenticationIsProvided() {
      assertThatThrownBy(() -> offerService.listOffers(null))
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
      assertThatThrownBy(() -> offerService.listOffers(unauthenticatedUser()))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> {
                assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
                assertThat(ex.getReason()).isEqualTo("Authentication required");
              });
    }

    @Test
    @DisplayName("returns unauthorized when the authenticated principal no longer exists")
    void returnsUnauthorizedWhenTheAuthenticatedPrincipalNoLongerExists() {
      Authentication auth = authenticatedUser("missing");
      when(userRepository.findByUsername("missing")).thenReturn(Optional.empty());

      assertThatThrownBy(() -> offerService.listOffers(auth))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> {
                assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
                assertThat(ex.getReason()).isEqualTo("User not found");
              });
    }
  }

  @Nested
  @DisplayName("listOffers")
  class ListOffersTests {

    @Test
    @DisplayName("returns the authenticated users offers ordered by updatedAt descending")
    void returnsTheAuthenticatedUsersOffersOrderedByUpdatedAtDescending() {
      User user = createUser("viewer");
      Authentication auth = authenticatedUser(user.getUsername());
      Offer newer = createOffer(user, 2L, "Meta", Instant.parse("2026-04-01T00:00:00Z"));
      Offer older = createOffer(user, 1L, "Google", Instant.parse("2026-03-01T00:00:00Z"));

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(offerRepository.findByUserOrderByUpdatedAtDesc(user)).thenReturn(List.of(newer, older));

      List<OfferResponse> result = offerService.listOffers(auth);

      assertThat(result).hasSize(2);
      assertThat(result.get(0).id()).isEqualTo(2L);
      assertThat(result.get(0).company()).isEqualTo("Meta");
      assertThat(result.get(1).id()).isEqualTo(1L);
      assertThat(result.get(1).company()).isEqualTo("Google");
    }

    @Test
    @DisplayName("returns an empty list when the user has no offers")
    void returnsAnEmptyListWhenTheUserHasNoOffers() {
      User user = createUser("empty");
      Authentication auth = authenticatedUser(user.getUsername());

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(offerRepository.findByUserOrderByUpdatedAtDesc(user)).thenReturn(List.of());

      assertThat(offerService.listOffers(auth)).isEmpty();
    }
  }

  @Nested
  @DisplayName("createOffer")
  class CreateOfferTests {

    @Test
    @DisplayName("persists all mapped fields and returns the created response")
    void persistsAllMappedFieldsAndReturnsTheCreatedResponse() {
      User user = createUser("creator");
      Authentication auth = authenticatedUser(user.getUsername());
      OfferRequest request = validRequest("Google", "SWE Intern");
      Instant createdAt = Instant.parse("2026-03-01T00:00:00Z");

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(offerRepository.save(any(Offer.class)))
          .thenAnswer(
              invocation -> {
                Offer saved = invocation.getArgument(0);
                ReflectionTestUtils.setField(saved, "id", 10L);
                ReflectionTestUtils.setField(saved, "createdAt", createdAt);
                return saved;
              });

      OfferResponse response = offerService.createOffer(auth, request);

      ArgumentCaptor<Offer> captor = ArgumentCaptor.forClass(Offer.class);
      verify(offerRepository).save(captor.capture());
      Offer saved = captor.getValue();

      assertThat(saved.getUser()).isSameAs(user);
      assertThat(saved.getCompany()).isEqualTo("Google");
      assertThat(saved.getTitle()).isEqualTo("SWE Intern");
      assertThat(saved.getEmploymentType()).isEqualTo(EmploymentType.internship);
      assertThat(saved.getCompensationType()).isEqualTo(CompensationType.hourly);
      assertThat(saved.getPayAmount()).isEqualTo(45.0f);
      assertThat(saved.getHoursPerWeek()).isEqualTo(40);
      assertThat(saved.getOfficeLocation()).isEqualTo("Mountain View, CA");
      assertThat(saved.getDaysInOffice()).isEqualTo(5);
      assertThat(saved.getNotes()).isEqualTo("Great team");
      assertThat(saved.getFavorite()).isFalse();
      assertThat(saved.getUpdatedAt()).isNotNull();

      assertThat(response.id()).isEqualTo(10L);
      assertThat(response.company()).isEqualTo("Google");
      assertThat(response.title()).isEqualTo("SWE Intern");
      assertThat(response.createdAt()).isEqualTo(createdAt);
    }
  }

  @Nested
  @DisplayName("getOffer")
  class GetOfferTests {

    @Test
    @DisplayName("returns the response for an offer owned by the current user")
    void returnsTheResponseForAnOfferOwnedByTheCurrentUser() {
      User user = createUser("owner");
      Authentication auth = authenticatedUser(user.getUsername());
      Offer offer = createOffer(user, 5L, "Google", Instant.parse("2026-03-01T00:00:00Z"));

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(offerRepository.findByIdAndUser(5L, user)).thenReturn(Optional.of(offer));

      OfferResponse response = offerService.getOffer(auth, 5L);

      assertThat(response.id()).isEqualTo(5L);
      assertThat(response.company()).isEqualTo("Google");
    }

    @Test
    @DisplayName("returns not found when the offer belongs to another user")
    void returnsNotFoundWhenTheOfferBelongsToAnotherUser() {
      User user = createUser("requester");
      Authentication auth = authenticatedUser(user.getUsername());

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(offerRepository.findByIdAndUser(99L, user)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> offerService.getOffer(auth, 99L))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> {
                assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                assertThat(ex.getReason()).isEqualTo("Offer not found");
              });
    }
  }

  @Nested
  @DisplayName("updateOffer")
  class UpdateOfferTests {

    @Test
    @DisplayName("applies all request fields and returns the updated response")
    void appliesAllRequestFieldsAndReturnsTheUpdatedResponse() {
      User user = createUser("updater");
      Authentication auth = authenticatedUser(user.getUsername());
      Offer offer = createOffer(user, 7L, "Google", Instant.parse("2026-03-01T00:00:00Z"));
      OfferRequest request = validRequest("Meta", "Software Engineer");

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(offerRepository.findByIdAndUser(7L, user)).thenReturn(Optional.of(offer));
      when(offerRepository.save(any(Offer.class))).thenAnswer(inv -> inv.getArgument(0));

      OfferResponse response = offerService.updateOffer(auth, 7L, request);

      assertThat(response.company()).isEqualTo("Meta");
      assertThat(response.title()).isEqualTo("Software Engineer");
    }

    @Test
    @DisplayName("returns not found when updating an offer owned by another user")
    void returnsNotFoundWhenUpdatingAnOfferOwnedByAnotherUser() {
      User user = createUser("other");
      Authentication auth = authenticatedUser(user.getUsername());

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(offerRepository.findByIdAndUser(999L, user)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> offerService.updateOffer(auth, 999L, validRequest("X", "Y")))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));

      verify(offerRepository, never()).save(any());
    }
  }

  @Nested
  @DisplayName("deleteOffer")
  class DeleteOfferTests {

    @Test
    @DisplayName("deletes an offer owned by the current user")
    void deletesAnOfferOwnedByTheCurrentUser() {
      User user = createUser("owner");
      Authentication auth = authenticatedUser(user.getUsername());
      Offer offer = createOffer(user, 3L, "Apple", Instant.parse("2026-03-01T00:00:00Z"));

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(offerRepository.findByIdAndUser(3L, user)).thenReturn(Optional.of(offer));

      offerService.deleteOffer(auth, 3L);

      verify(offerRepository).delete(offer);
    }

    @Test
    @DisplayName("returns not found when deleting an offer owned by another user")
    void returnsNotFoundWhenDeletingAnOfferOwnedByAnotherUser() {
      User user = createUser("other");
      Authentication auth = authenticatedUser(user.getUsername());

      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(offerRepository.findByIdAndUser(404L, user)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> offerService.deleteOffer(auth, 404L))
          .isInstanceOfSatisfying(
              ResponseStatusException.class,
              ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));

      verify(offerRepository, never()).delete(any());
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

  private static Offer createOffer(User user, Long id, String company, Instant updatedAt) {
    Offer offer = new Offer();
    offer.setUser(user);
    offer.setCompany(company);
    offer.setTitle("SWE Intern");
    offer.setEmploymentType(EmploymentType.internship);
    offer.setCompensationType(CompensationType.hourly);
    offer.setPayAmount(45.0f);
    offer.setUpdatedAt(updatedAt);
    ReflectionTestUtils.setField(offer, "id", id);
    ReflectionTestUtils.setField(offer, "createdAt", Instant.parse("2026-01-01T00:00:00Z"));
    return offer;
  }

  private static OfferRequest validRequest(String company, String title) {
    return new OfferRequest(
        company,
        title,
        EmploymentType.internship,
        CompensationType.hourly,
        45.0f,
        40,
        null,
        null,
        null,
        "Mountain View, CA",
        5,
        "Great team",
        false);
  }
}
