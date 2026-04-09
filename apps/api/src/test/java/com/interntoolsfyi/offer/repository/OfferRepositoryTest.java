package com.interntoolsfyi.offer.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.interntoolsfyi.offer.model.CompensationType;
import com.interntoolsfyi.offer.model.EmploymentType;
import com.interntoolsfyi.offer.model.Offer;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import com.interntoolsfyi.user.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class OfferRepositoryTest {

  @Autowired private OfferRepository offerRepository;
  @Autowired private UserRepository userRepository;

  @Nested
  @DisplayName("findByUserOrderByUpdatedAtDesc")
  class FindByUserOrderByUpdatedAtDescTests {

    @Test
    @DisplayName("returns only the given users offers ordered newest updatedAt first")
    void returnsOnlyGivenUsersOffersOrderedByUpdatedAtDesc() {
      User owner = userRepository.saveAndFlush(createUser("offer-owner", "offer-owner@example.com"));
      User other = userRepository.saveAndFlush(createUser("offer-other", "offer-other@example.com"));

      Offer older = saveOffer(owner, "Older offer", Instant.parse("2026-01-01T00:00:00Z"));
      Offer newer = saveOffer(owner, "Newer offer", Instant.parse("2026-03-01T00:00:00Z"));
      saveOffer(other, "Other user offer", Instant.parse("2026-05-01T00:00:00Z"));

      List<Offer> result = offerRepository.findByUserOrderByUpdatedAtDesc(owner);

      assertThat(result).extracting(Offer::getId)
          .containsExactly(newer.getId(), older.getId());
    }

    @Test
    @DisplayName("returns empty list when user has no offers")
    void returnsEmptyListForUserWithNoOffers() {
      User emptyUser = userRepository.saveAndFlush(createUser("no-offers-user", "no-offers@example.com"));

      assertThat(offerRepository.findByUserOrderByUpdatedAtDesc(emptyUser)).isEmpty();
    }
  }

  @Nested
  @DisplayName("findByIdAndUser")
  class FindByIdAndUserTests {

    @Test
    @DisplayName("returns the offer when it belongs to the given user")
    void returnsOfferForOwner() {
      User owner = userRepository.saveAndFlush(createUser("offer-owner2", "offer-owner2@example.com"));
      Offer offer = saveOffer(owner, "My offer", Instant.parse("2026-02-01T00:00:00Z"));

      assertThat(offerRepository.findByIdAndUser(offer.getId(), owner)).isPresent();
    }

    @Test
    @DisplayName("returns empty when the offer belongs to a different user")
    void returnsEmptyForNonOwner() {
      User owner = userRepository.saveAndFlush(createUser("offer-owner3", "offer-owner3@example.com"));
      User other = userRepository.saveAndFlush(createUser("offer-other3", "offer-other3@example.com"));
      Offer offer = saveOffer(owner, "Private offer", Instant.parse("2026-02-01T00:00:00Z"));

      assertThat(offerRepository.findByIdAndUser(offer.getId(), other)).isEmpty();
    }

    @Test
    @DisplayName("returns empty for a non-existent id")
    void returnsEmptyForNonExistentId() {
      User owner = userRepository.saveAndFlush(createUser("offer-owner4", "offer-owner4@example.com"));

      assertThat(offerRepository.findByIdAndUser(Long.MAX_VALUE, owner)).isEmpty();
    }
  }

  private Offer saveOffer(User user, String company, Instant updatedAt) {
    Offer offer = new Offer();
    offer.setUser(user);
    offer.setCompany(company);
    offer.setTitle("Software Engineer Intern");
    offer.setEmploymentType(EmploymentType.internship);
    offer.setCompensationType(CompensationType.hourly);
    offer.setPayAmount(35.0f);
    offer.setUpdatedAt(updatedAt);
    return offerRepository.saveAndFlush(offer);
  }

  private static User createUser(String username, String email) {
    return new User(username, email, "hashed-password", Role.STUDENT, "Test", "User");
  }
}
