package com.interntoolsfyi.offer.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.interntoolsfyi.offer.dto.PostOfferItemRequest;
import com.interntoolsfyi.offer.model.CompensationType;
import com.interntoolsfyi.offer.model.Offer;
import com.interntoolsfyi.user.model.Role;
import com.interntoolsfyi.user.model.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class PostInlineOfferFactoryTest {

  private static User author() {
    User u = new User("a", "a@x.com", "h", Role.STUDENT, "A", "B");
    ReflectionTestUtils.setField(u, "id", 1L);
    return u;
  }

  @Nested
  @DisplayName("createInlineOffer")
  class CreateInlineOffer {

    @Test
    @DisplayName("throws when company is empty after trim")
    void throwsWhenCompanyIsEmptyAfterTrim() {
      assertThatThrownBy(
              () ->
                  PostInlineOfferFactory.createInlineOffer(
                      author(), new PostOfferItemRequest(null, "  ", "Role", null)))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("company");
    }

    @Test
    @DisplayName("creates offer with trimmed company and role")
    void createsOfferWithTrimmedCompanyAndRole() {
      Offer o =
          PostInlineOfferFactory.createInlineOffer(
              author(), new PostOfferItemRequest(null, "  Acme  ", "  Eng  ", null));
      assertThat(o.getCompany()).isEqualTo("Acme");
      assertThat(o.getTitle()).isEqualTo("Eng");
    }
  }

  @Nested
  @DisplayName("applyCompensationFromText")
  class ApplyCompensationFromText {

    @Test
    @DisplayName("no-op for null or blank")
    void noOpForNullOrBlank() {
      Offer o = new Offer();
      PostInlineOfferFactory.applyCompensationFromText(null, o);
      assertThat(o.getNotes()).isNull();
      PostInlineOfferFactory.applyCompensationFromText("   ", o);
      assertThat(o.getNotes()).isNull();
    }

    @Test
    @DisplayName("parses hourly when text contains /hr")
    void parsesHourlyWhenTextContainsHr() {
      Offer o = new Offer();
      PostInlineOfferFactory.applyCompensationFromText("$45 /hr", o);
      assertThat(o.getCompensationType()).isEqualTo(CompensationType.hourly);
      assertThat(o.getPayAmount()).isEqualTo(45f);
    }

    @Test
    @DisplayName("parses yearly into monthly pay when text contains /yr")
    void parsesYearlyIntoMonthlyPayWhenTextContainsYr() {
      Offer o = new Offer();
      PostInlineOfferFactory.applyCompensationFromText("120000 /yr", o);
      assertThat(o.getCompensationType()).isEqualTo(CompensationType.monthly);
      assertThat(o.getPayAmount()).isEqualTo(120000f / 12f);
    }

    @Test
    @DisplayName("parses yearly when text contains /year")
    void parsesYearlyWhenTextContainsYear() {
      Offer o = new Offer();
      PostInlineOfferFactory.applyCompensationFromText("$60000/year bonus", o);
      assertThat(o.getCompensationType()).isEqualTo(CompensationType.monthly);
      assertThat(o.getPayAmount()).isEqualTo(60000f / 12f);
    }

    @Test
    @DisplayName("treats plain positive number as monthly")
    void treatsPlainPositiveNumberAsMonthly() {
      Offer o = new Offer();
      PostInlineOfferFactory.applyCompensationFromText("8500", o);
      assertThat(o.getCompensationType()).isEqualTo(CompensationType.monthly);
      assertThat(o.getPayAmount()).isEqualTo(8500f);
    }

    @Test
    @DisplayName("stores non-numeric text in notes")
    void storesNonNumericTextInNotes() {
      Offer o = new Offer();
      PostInlineOfferFactory.applyCompensationFromText("DOE + equity", o);
      assertThat(o.getNotes()).isEqualTo("DOE + equity");
    }

    @Test
    @DisplayName("stores text in notes when digits parse to zero")
    void storesTextInNotesWhenDigitsParseToZero() {
      Offer o = new Offer();
      PostInlineOfferFactory.applyCompensationFromText("---", o);
      assertThat(o.getNotes()).isEqualTo("---");
    }
  }
}
